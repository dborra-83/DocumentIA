import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * Props for API Gateway Construct
 */
export interface ApiGatewayConstructProps {
  userPool: cognito.IUserPool;
  documentUploadHandler: lambda.IFunction;
  historyManager: lambda.IFunction;
  metricsAggregator: lambda.IFunction;
  exportHandler: lambda.IFunction;
  documentDeleteHandler: lambda.IFunction;
  adminConfigHandler: lambda.IFunction;
  environment: string;
}

/**
 * Construct for creating API Gateway REST API with Cognito authorizer
 * 
 * Requirements: 1.5, 9.5, 2.5, 7.1, 6.1, 8.1
 */
export class ApiGatewayConstruct extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly authorizer: apigateway.CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    // Create REST API
    // Requirements: 1.5, 9.5
    this.api = new apigateway.RestApi(this, 'DocumentAnalysisApi', {
      restApiName: `DocumentAnalysis-API-${props.environment}`,
      description: 'API for Document Analysis with Bedrock',
      
      // Deploy options
      deployOptions: {
        stageName: props.environment,
        throttlingRateLimit: 100, // requests per second
        throttlingBurstLimit: 200, // burst capacity
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true, // Enable X-Ray tracing
      },

      // CORS configuration for frontend
      // Requirement: 9.5
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // TODO: Restrict to CloudFront domain in production
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: true,
        maxAge: cdk.Duration.hours(1),
      },

      // CloudWatch role for logging
      cloudWatchRole: true,

      // API key not required (using Cognito)
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
    });

    // Create Cognito User Pool Authorizer
    // Requirement: 1.5
    this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [props.userPool],
      authorizerName: 'CognitoUserPoolAuthorizer',
      identitySource: 'method.request.header.Authorization',
      resultsCacheTtl: cdk.Duration.minutes(5), // Cache authorization results for 5 minutes
    });

    // Create request validators
    const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
      restApi: this.api,
      requestValidatorName: 'RequestBodyAndParametersValidator',
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    const paramsValidator = new apigateway.RequestValidator(this, 'ParamsValidator', {
      restApi: this.api,
      requestValidatorName: 'ParametersOnlyValidator',
      validateRequestBody: false,
      validateRequestParameters: true,
    });

    // Common method options with Cognito authorization
    const authorizedMethodOptions: apigateway.MethodOptions = {
      authorizer: this.authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    // ========================================
    // API Endpoints
    // ========================================

    // POST /upload - Generate presigned URL for document upload
    // Requirement: 2.5
    const uploadResource = this.api.root.addResource('upload');
    uploadResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(props.documentUploadHandler, {
        proxy: true,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
        ],
      }),
      {
        ...authorizedMethodOptions,
        requestValidator,
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '400',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '401',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
        ],
      }
    );

    // GET /documents - Get user's document history
    // Requirement: 7.1
    const documentsResource = this.api.root.addResource('documents');
    documentsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(props.historyManager, {
        proxy: true,
      }),
      {
        ...authorizedMethodOptions,
        requestValidator: paramsValidator,
        requestParameters: {
          'method.request.querystring.page': false,
          'method.request.querystring.pageSize': false,
          'method.request.querystring.vertical': false,
          'method.request.querystring.dateFrom': false,
          'method.request.querystring.dateTo': false,
          'method.request.querystring.search': false,
        },
      }
    );

    // GET /documents/{documentId} - Get specific document with analysis
    // Requirement: 7.4
    const documentByIdResource = documentsResource.addResource('{documentId}');
    documentByIdResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(props.historyManager, {
        proxy: true,
      }),
      {
        ...authorizedMethodOptions,
        requestValidator: paramsValidator,
        requestParameters: {
          'method.request.path.documentId': true,
        },
      }
    );

    // DELETE /documents/{documentId} - Delete document and analysis
    documentByIdResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(props.documentDeleteHandler, {
        proxy: true,
        integrationResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': "'*'",
            },
          },
        ],
      }),
      {
        ...authorizedMethodOptions,
        requestValidator: paramsValidator,
        requestParameters: {
          'method.request.path.documentId': true,
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '404',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '401',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true,
            },
          },
        ],
      }
    );

    // GET /metrics - Get user metrics
    // Requirement: 6.1
    const metricsResource = this.api.root.addResource('metrics');
    metricsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(props.metricsAggregator, {
        proxy: true,
      }),
      {
        ...authorizedMethodOptions,
      }
    );

    // POST /export/{documentId} - Generate export in specified format
    // Requirement: 8.1
    const exportResource = this.api.root.addResource('export');
    const exportByIdResource = exportResource.addResource('{documentId}');
    exportByIdResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(props.exportHandler, {
        proxy: true,
      }),
      {
        ...authorizedMethodOptions,
        requestValidator,
        requestParameters: {
          'method.request.path.documentId': true,
        },
      }
    );

    // GET/PUT /admin/config - Manage Bedrock model configuration (admin only)
    const adminResource = this.api.root.addResource('admin');
    const adminConfigResource = adminResource.addResource('config');
    const adminConfigIntegration = new apigateway.LambdaIntegration(props.adminConfigHandler, { proxy: true });
    adminConfigResource.addMethod('GET', adminConfigIntegration, { ...authorizedMethodOptions });
    adminConfigResource.addMethod('PUT', adminConfigIntegration, { ...authorizedMethodOptions });

    // GET /health - Health check endpoint (no authorization required)
    const healthResource = this.api.root.addResource('health');
    healthResource.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': JSON.stringify({
                status: 'healthy',
                timestamp: '$context.requestTime',
                environment: props.environment,
              }),
            },
          },
        ],
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
          },
        ],
      }
    );

    // Add usage plan for rate limiting (optional but recommended)
    const usagePlan = this.api.addUsagePlan('UsagePlan', {
      name: `DocumentAnalysis-UsagePlan-${props.environment}`,
      description: 'Usage plan for Document Analysis API',
      throttle: {
        rateLimit: 100, // requests per second
        burstLimit: 200, // burst capacity
      },
      quota: {
        limit: 10000, // requests per month
        period: apigateway.Period.MONTH,
      },
    });

    // Associate usage plan with API stage
    usagePlan.addApiStage({
      stage: this.api.deploymentStage,
    });

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
      exportName: `${cdk.Stack.of(this).stackName}-ApiUrl`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'API Gateway ID',
      exportName: `${cdk.Stack.of(this).stackName}-ApiId`,
    });

    new cdk.CfnOutput(this, 'ApiStage', {
      value: this.api.deploymentStage.stageName,
      description: 'API Gateway Stage',
    });

    // Add tags
    cdk.Tags.of(this.api).add('Component', 'API');
    cdk.Tags.of(this.api).add('Environment', props.environment);
  }
}
