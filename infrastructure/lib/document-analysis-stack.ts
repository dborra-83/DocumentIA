import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { S3BucketsConstruct } from './s3-buckets-construct';
import { DynamoDBTablesConstruct } from './dynamodb-tables-construct';
import { CognitoUserPoolConstruct } from './cognito-user-pool-construct';
import { IamRolesConstruct } from './iam-roles-construct';
import { LambdaFunctionsConstruct } from './lambda-functions-construct';
import { StepFunctionsConstruct } from './step-functions-construct';
import { ApiGatewayConstruct } from './api-gateway-construct';

export interface DocumentAnalysisStackProps extends cdk.StackProps {
  environment: string;
}

export class DocumentAnalysisStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DocumentAnalysisStackProps) {
    super(scope, id, props);

    const { environment } = props;

    // Common tags for all resources
    cdk.Tags.of(this).add('Project', 'DocumentAnalysis');
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // S3 Buckets - Task 2.1
    // Requirements: 2.6, 5.3, 9.2
    const s3Buckets = new S3BucketsConstruct(this, 'S3Buckets', {
      environment,
    });

    // DynamoDB Tables - Task 2.2
    // Requirements: 2.6, 5.2, 6.7, 9.3
    const dynamoDBTables = new DynamoDBTablesConstruct(this, 'DynamoDBTables', {
      environment,
    });

    // Cognito User Pool - Task 2.3
    // Requirements: 1.1, 1.2, 1.4, 9.10
    const cognitoUserPool = new CognitoUserPoolConstruct(this, 'CognitoUserPool', {
      environment,
    });

    // IAM Roles for Lambda Functions - Task 2.4
    // Requirements: 9.4
    const bedrockModelArn = `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`;
    
    const iamRoles = new IamRolesConstruct(this, 'IamRoles', {
      documentsBucket: s3Buckets.documentsBucket,
      resultsBucket: s3Buckets.resultsBucket,
      documentsTable: dynamoDBTables.documentsTable,
      resultsTable: dynamoDBTables.analysisResultsTable,
      metricsTable: dynamoDBTables.userMetricsTable,
      bedrockModelArn,
    });

    // Lambda Functions - Task 10.1, 11.1
    // Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2, 5.3, 5.7, 15.2, 15.9
    const lambdaFunctions = new LambdaFunctionsConstruct(this, 'LambdaFunctions', {
      documentsBucket: s3Buckets.documentsBucket,
      resultsBucket: s3Buckets.resultsBucket,
      documentsTable: dynamoDBTables.documentsTable,
      resultsTable: dynamoDBTables.analysisResultsTable,
      metricsTable: dynamoDBTables.userMetricsTable,
      documentUploadHandlerRole: iamRoles.documentUploadHandlerRole,
      bedrockProcessorRole: iamRoles.bedrockProcessorRole,
      historyManagerRole: iamRoles.historyManagerRole,
      metricsAggregatorRole: iamRoles.metricsAggregatorRole,
      exportHandlerRole: iamRoles.exportHandlerRole,
      errorHandlerRole: iamRoles.errorHandlerRole,
      environment,
    });

    // Step Functions State Machine - Task 11.1
    // Requirements: 4.1, 15.1
    const stepFunctions = new StepFunctionsConstruct(this, 'StepFunctions', {
      bedrockProcessorFunction: lambdaFunctions.bedrockProcessorFunction,
      errorHandlerFunction: lambdaFunctions.errorHandlerFunction,
      stepFunctionsTriggerFunction: lambdaFunctions.stepFunctionsTriggerFunction,
      documentsBucket: s3Buckets.documentsBucket,
      environment,
    });

    // Update the trigger Lambda with the state machine ARN
    lambdaFunctions.setStateMachineArn(stepFunctions.stateMachine.stateMachineArn);

    // API Gateway - Task 16.1, 16.2
    // Requirements: 1.5, 9.5, 2.5, 7.1, 6.1, 8.1
    const apiGateway = new ApiGatewayConstruct(this, 'ApiGateway', {
      userPool: cognitoUserPool.userPool,
      documentUploadHandler: lambdaFunctions.documentUploadHandlerFunction,
      historyManager: lambdaFunctions.historyManagerFunction,
      metricsAggregator: lambdaFunctions.metricsAggregatorFunction,
      exportHandler: lambdaFunctions.exportHandlerFunction,
      environment,
    });

    // TODO: Add remaining resource stacks here
    // - CloudFront distribution
    // - CloudWatch alarms and dashboards

    // Output important values
    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'Stack name',
    });

    new cdk.CfnOutput(this, 'Environment', {
      value: environment,
      description: 'Deployment environment',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
    });
  }
}
