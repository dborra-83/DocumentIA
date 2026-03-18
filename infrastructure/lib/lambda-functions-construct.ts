import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * Props for Lambda Functions Construct
 */
export interface LambdaFunctionsConstructProps {
  documentsBucket: s3.IBucket;
  resultsBucket: s3.IBucket;
  documentsTable: dynamodb.ITable;
  resultsTable: dynamodb.ITable;
  metricsTable: dynamodb.ITable;
  documentUploadHandlerRole: iam.IRole;
  bedrockProcessorRole: iam.IRole;
  historyManagerRole: iam.IRole;
  metricsAggregatorRole: iam.IRole;
  exportHandlerRole: iam.IRole;
  errorHandlerRole: iam.IRole;
  documentDeleteHandlerRole: iam.IRole;
  adminConfigHandlerRole: iam.IRole;
  environment: string;
  bedrockModelId?: string;
  bedrockRegion?: string;
}

/**
 * Construct for creating Lambda functions for document processing
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2, 5.3, 5.7, 15.2, 15.9
 */
export class LambdaFunctionsConstruct extends Construct {
  public readonly documentUploadHandlerFunction: lambda.Function;
  public readonly bedrockProcessorFunction: lambda.Function;
  public readonly historyManagerFunction: lambda.Function;
  public readonly metricsAggregatorFunction: lambda.Function;
  public readonly exportHandlerFunction: lambda.Function;
  public readonly errorHandlerFunction: lambda.Function;
  public readonly stepFunctionsTriggerFunction: lambda.Function;
  public readonly documentDeleteHandlerFunction: lambda.Function;
  public readonly adminConfigHandlerFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaFunctionsConstructProps) {
    super(scope, id);

    const bedrockModelId = props.bedrockModelId || 'anthropic.claude-3-sonnet-20240229-v1:0';
    const bedrockRegion = props.bedrockRegion || cdk.Stack.of(this).region;

    // Create shared Lambda layer for common dependencies
    // Layer structure: python/ directory with modules and dependencies
    const sharedLayer = new lambda.LayerVersion(this, 'SharedLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/shared')),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
      description: 'Shared utilities for document processing (text_extractor, vertical_templates)',
    });

    // DocumentUploadHandler Lambda Function
    // Requirements: 2.5, 2.6
    this.documentUploadHandlerFunction = new lambda.Function(this, 'DocumentUploadHandler', {
      functionName: `DocumentUploadHandler-${props.environment}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/document-upload')),
      role: props.documentUploadHandlerRole,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      layers: [sharedLayer], // Add shared layer for file_validator
      environment: {
        DOCUMENTS_BUCKET_NAME: props.documentsBucket.bucketName,
        DOCUMENTS_TABLE_NAME: props.documentsTable.tableName,
        PRESIGNED_URL_EXPIRATION: '900', // 15 minutes
      },
      description: 'Generates presigned URLs for document uploads and creates document records',
    });

    cdk.Tags.of(this.documentUploadHandlerFunction).add('Function', 'DocumentUploadHandler');
    cdk.Tags.of(this.documentUploadHandlerFunction).add('Component', 'Backend');

    // BedrockProcessor Lambda Function
    // Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.2, 5.3, 5.7
    this.bedrockProcessorFunction = new lambda.Function(this, 'BedrockProcessor', {
      functionName: `BedrockProcessor-${props.environment}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/bedrock-processor')),
      role: props.bedrockProcessorRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      layers: [sharedLayer],
      environment: {
        DOCUMENTS_BUCKET_NAME: props.documentsBucket.bucketName,
        RESULTS_BUCKET_NAME: props.resultsBucket.bucketName,
        DOCUMENTS_TABLE_NAME: props.documentsTable.tableName,
        RESULTS_TABLE_NAME: props.resultsTable.tableName,
        BEDROCK_MODEL_ID: bedrockModelId,
        BEDROCK_REGION: bedrockRegion,
        SSM_MODEL_PARAMETER: '/documentai/bedrock-model-id',
      },
      description: 'Processes documents with Amazon Bedrock - extracts text and generates analysis',
    });

    // Add tags
    cdk.Tags.of(this.bedrockProcessorFunction).add('Function', 'BedrockProcessor');
    cdk.Tags.of(this.bedrockProcessorFunction).add('Component', 'Backend');

    // HistoryManager Lambda Function
    // Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 7.7
    this.historyManagerFunction = new lambda.Function(this, 'HistoryManager', {
      functionName: `HistoryManager-${props.environment}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/history-manager')),
      role: props.historyManagerRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        DOCUMENTS_TABLE_NAME: props.documentsTable.tableName,
        RESULTS_TABLE_NAME: props.resultsTable.tableName,
      },
      description: 'Queries and returns document history with filtering and pagination',
    });

    cdk.Tags.of(this.historyManagerFunction).add('Function', 'HistoryManager');
    cdk.Tags.of(this.historyManagerFunction).add('Component', 'Backend');

    // MetricsAggregator Lambda Function
    // Requirements: 6.1, 6.2, 6.3, 6.7
    this.metricsAggregatorFunction = new lambda.Function(this, 'MetricsAggregator', {
      functionName: `MetricsAggregator-${props.environment}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/metrics-aggregator')),
      role: props.metricsAggregatorRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        DOCUMENTS_TABLE_NAME: props.documentsTable.tableName,
        METRICS_TABLE_NAME: props.metricsTable.tableName,
      },
      description: 'Calculates and aggregates user metrics from document processing data',
    });

    cdk.Tags.of(this.metricsAggregatorFunction).add('Function', 'MetricsAggregator');
    cdk.Tags.of(this.metricsAggregatorFunction).add('Component', 'Backend');

    // ExportHandler Lambda Function
    // Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 8.8
    this.exportHandlerFunction = new lambda.Function(this, 'ExportHandler', {
      functionName: `ExportHandler-${props.environment}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/export-handler')),
      role: props.exportHandlerRole,
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      environment: {
        DOCUMENTS_TABLE_NAME: props.documentsTable.tableName,
        RESULTS_TABLE_NAME: props.resultsTable.tableName,
        RESULTS_BUCKET_NAME: props.resultsBucket.bucketName,
        PRESIGNED_URL_EXPIRATION: '900', // 15 minutes
      },
      description: 'Generates exports in multiple formats (PDF, JSON, Excel, Word)',
    });

    cdk.Tags.of(this.exportHandlerFunction).add('Function', 'ExportHandler');
    cdk.Tags.of(this.exportHandlerFunction).add('Component', 'Backend');

    // DocumentDeleteHandler Lambda Function
    // Deletes documents and associated data from S3 and DynamoDB
    this.documentDeleteHandlerFunction = new lambda.Function(this, 'DocumentDeleteHandler', {
      functionName: `DocumentDeleteHandler-${props.environment}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/document-delete')),
      role: props.documentDeleteHandlerRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        DOCUMENTS_BUCKET_NAME: props.documentsBucket.bucketName,
        RESULTS_BUCKET_NAME: props.resultsBucket.bucketName,
        DOCUMENTS_TABLE_NAME: props.documentsTable.tableName,
        RESULTS_TABLE_NAME: props.resultsTable.tableName,
      },
      description: 'Deletes documents and associated analysis results',
    });

    cdk.Tags.of(this.documentDeleteHandlerFunction).add('Function', 'DocumentDeleteHandler');
    cdk.Tags.of(this.documentDeleteHandlerFunction).add('Component', 'Backend');

    // ErrorHandler Lambda Function
    // Requirements: 15.2, 15.9
    this.errorHandlerFunction = new lambda.Function(this, 'ErrorHandler', {
      functionName: `ErrorHandler-${props.environment}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/error-handler')),
      role: props.errorHandlerRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        DOCUMENTS_TABLE_NAME: props.documentsTable.tableName,
      },
      description: 'Handles errors from document processing workflow',
    });

    cdk.Tags.of(this.errorHandlerFunction).add('Function', 'ErrorHandler');
    cdk.Tags.of(this.errorHandlerFunction).add('Component', 'Backend');

    // StepFunctionsTrigger Lambda Function
    // Requirements: 4.1
    // Note: This function needs a role that will be created separately
    const stepFunctionsTriggerRole = new iam.Role(this, 'StepFunctionsTriggerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for StepFunctionsTrigger Lambda',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB read permission to retrieve document metadata
    props.documentsTable.grantReadData(stepFunctionsTriggerRole);

    this.stepFunctionsTriggerFunction = new lambda.Function(this, 'StepFunctionsTrigger', {
      functionName: `StepFunctionsTrigger-${props.environment}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/step-functions-trigger')),
      role: stepFunctionsTriggerRole,
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      environment: {
        DOCUMENTS_TABLE_NAME: props.documentsTable.tableName,
        // STATE_MACHINE_ARN will be set after state machine is created
      },
      description: 'Triggered by S3 uploads to start Step Functions execution',
    });

    cdk.Tags.of(this.stepFunctionsTriggerFunction).add('Function', 'StepFunctionsTrigger');
    cdk.Tags.of(this.stepFunctionsTriggerFunction).add('Component', 'Backend');

    // AdminConfigHandler Lambda Function
    this.adminConfigHandlerFunction = new lambda.Function(this, 'AdminConfigHandler', {
      functionName: `AdminConfigHandler-${props.environment}`,
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/admin-config-handler')),
      role: props.adminConfigHandlerRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        SSM_MODEL_PARAMETER: '/documentai/bedrock-model-id',
        BEDROCK_LAMBDA_NAME: `BedrockProcessor-${props.environment}`,
      },
      description: 'Manages Bedrock model configuration for admin users',
    });

    cdk.Tags.of(this.adminConfigHandlerFunction).add('Function', 'AdminConfigHandler');
    cdk.Tags.of(this.adminConfigHandlerFunction).add('Component', 'Backend');

    // Output Lambda function ARNs
    new cdk.CfnOutput(cdk.Stack.of(this), 'DocumentUploadHandlerFunctionArn', {
      value: this.documentUploadHandlerFunction.functionArn,
      description: 'ARN of DocumentUploadHandler Lambda Function',
    });

    new cdk.CfnOutput(cdk.Stack.of(this), 'BedrockProcessorFunctionArn', {
      value: this.bedrockProcessorFunction.functionArn,
      description: 'ARN of BedrockProcessor Lambda Function',
    });

    new cdk.CfnOutput(cdk.Stack.of(this), 'HistoryManagerFunctionArn', {
      value: this.historyManagerFunction.functionArn,
      description: 'ARN of HistoryManager Lambda Function',
    });

    new cdk.CfnOutput(cdk.Stack.of(this), 'MetricsAggregatorFunctionArn', {
      value: this.metricsAggregatorFunction.functionArn,
      description: 'ARN of MetricsAggregator Lambda Function',
    });

    new cdk.CfnOutput(cdk.Stack.of(this), 'ExportHandlerFunctionArn', {
      value: this.exportHandlerFunction.functionArn,
      description: 'ARN of ExportHandler Lambda Function',
    });

    new cdk.CfnOutput(cdk.Stack.of(this), 'DocumentDeleteHandlerFunctionArn', {
      value: this.documentDeleteHandlerFunction.functionArn,
      description: 'ARN of DocumentDeleteHandler Lambda Function',
    });

    new cdk.CfnOutput(cdk.Stack.of(this), 'ErrorHandlerFunctionArn', {
      value: this.errorHandlerFunction.functionArn,
      description: 'ARN of ErrorHandler Lambda Function',
    });

    new cdk.CfnOutput(cdk.Stack.of(this), 'StepFunctionsTriggerFunctionArn', {
      value: this.stepFunctionsTriggerFunction.functionArn,
      description: 'ARN of StepFunctionsTrigger Lambda Function',
    });
  }

  /**
   * Update the StepFunctionsTrigger function with the state machine ARN
   */
  public setStateMachineArn(stateMachineArn: string): void {
    this.stepFunctionsTriggerFunction.addEnvironment('STATE_MACHINE_ARN', stateMachineArn);
  }
}
