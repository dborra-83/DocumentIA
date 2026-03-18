import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * Props for IAM Roles Construct
 */
export interface IamRolesConstructProps {
  documentsBucket: s3.IBucket;
  resultsBucket: s3.IBucket;
  documentsTable: dynamodb.ITable;
  resultsTable: dynamodb.ITable;
  metricsTable: dynamodb.ITable;
  bedrockModelArn: string;
}

/**
 * Construct for creating IAM roles for Lambda functions
 * Implements least privilege principle for all roles
 */
export class IamRolesConstruct extends Construct {
  public readonly documentUploadHandlerRole: iam.Role;
  public readonly bedrockProcessorRole: iam.Role;
  public readonly historyManagerRole: iam.Role;
  public readonly metricsAggregatorRole: iam.Role;
  public readonly exportHandlerRole: iam.Role;
  public readonly errorHandlerRole: iam.Role;
  public readonly documentDeleteHandlerRole: iam.Role;
  public readonly adminConfigHandlerRole: iam.Role;

  constructor(scope: Construct, id: string, props: IamRolesConstructProps) {
    super(scope, id);

    // DocumentUploadHandler Role
    // Permissions: S3 PutObject, DynamoDB PutItem
    this.documentUploadHandlerRole = new iam.Role(this, 'DocumentUploadHandlerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for DocumentUploadHandler Lambda - generates presigned URLs and creates document records',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant S3 PutObject permission for presigned URL generation
    props.documentsBucket.grantPut(this.documentUploadHandlerRole);

    // Grant DynamoDB PutItem permission
    props.documentsTable.grantWriteData(this.documentUploadHandlerRole);

    // Add tags for cost allocation
    cdk.Tags.of(this.documentUploadHandlerRole).add('Function', 'DocumentUploadHandler');
    cdk.Tags.of(this.documentUploadHandlerRole).add('Component', 'Backend');

    // BedrockProcessor Role
    // Permissions: S3 GetObject/PutObject, DynamoDB Read/Write, Bedrock InvokeModel
    this.bedrockProcessorRole = new iam.Role(this, 'BedrockProcessorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for BedrockProcessor Lambda - processes documents with Bedrock AI',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant S3 permissions
    props.documentsBucket.grantRead(this.bedrockProcessorRole);
    props.resultsBucket.grantPut(this.bedrockProcessorRole);

    // Grant DynamoDB permissions
    props.documentsTable.grantReadWriteData(this.bedrockProcessorRole);
    props.resultsTable.grantWriteData(this.bedrockProcessorRole);

    // Grant Bedrock InvokeModel permission for all Anthropic Claude models
    this.bedrockProcessorRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [props.bedrockModelArn],
      })
    );

    // Add CloudWatch Logs permissions for structured logging
    this.bedrockProcessorRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    cdk.Tags.of(this.bedrockProcessorRole).add('Function', 'BedrockProcessor');
    cdk.Tags.of(this.bedrockProcessorRole).add('Component', 'Backend');

    // HistoryManager Role
    // Permissions: DynamoDB Query/GetItem (read-only)
    this.historyManagerRole = new iam.Role(this, 'HistoryManagerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for HistoryManager Lambda - queries document history',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB read permissions
    props.documentsTable.grantReadData(this.historyManagerRole);
    props.resultsTable.grantReadData(this.historyManagerRole);

    cdk.Tags.of(this.historyManagerRole).add('Function', 'HistoryManager');
    cdk.Tags.of(this.historyManagerRole).add('Component', 'Backend');

    // MetricsAggregator Role
    // Permissions: DynamoDB Query/PutItem
    this.metricsAggregatorRole = new iam.Role(this, 'MetricsAggregatorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for MetricsAggregator Lambda - calculates and stores user metrics',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB permissions
    props.documentsTable.grantReadData(this.metricsAggregatorRole);
    props.metricsTable.grantReadWriteData(this.metricsAggregatorRole);

    cdk.Tags.of(this.metricsAggregatorRole).add('Function', 'MetricsAggregator');
    cdk.Tags.of(this.metricsAggregatorRole).add('Component', 'Backend');

    // ExportHandler Role
    // Permissions: DynamoDB GetItem, S3 PutObject
    this.exportHandlerRole = new iam.Role(this, 'ExportHandlerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for ExportHandler Lambda - generates exports in multiple formats',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB read permissions
    props.documentsTable.grantReadData(this.exportHandlerRole);
    props.resultsTable.grantReadData(this.exportHandlerRole);

    // Grant S3 PutObject permission for exports
    props.resultsBucket.grantPut(this.exportHandlerRole);

    cdk.Tags.of(this.exportHandlerRole).add('Function', 'ExportHandler');
    cdk.Tags.of(this.exportHandlerRole).add('Component', 'Backend');

    // DocumentDeleteHandler Role
    // Permissions: DynamoDB DeleteItem, S3 DeleteObject
    this.documentDeleteHandlerRole = new iam.Role(this, 'DocumentDeleteHandlerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for DocumentDeleteHandler Lambda - deletes documents and analysis results',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB read and delete permissions
    props.documentsTable.grantReadWriteData(this.documentDeleteHandlerRole);
    props.resultsTable.grantReadWriteData(this.documentDeleteHandlerRole);

    // Grant S3 DeleteObject permission
    props.documentsBucket.grantDelete(this.documentDeleteHandlerRole);
    props.resultsBucket.grantDelete(this.documentDeleteHandlerRole);

    cdk.Tags.of(this.documentDeleteHandlerRole).add('Function', 'DocumentDeleteHandler');
    cdk.Tags.of(this.documentDeleteHandlerRole).add('Component', 'Backend');

    // ErrorHandler Role
    // Permissions: DynamoDB UpdateItem (to update document status to failed)
    this.errorHandlerRole = new iam.Role(this, 'ErrorHandlerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for ErrorHandler Lambda - handles processing errors',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB write permission to update document status
    props.documentsTable.grantWriteData(this.errorHandlerRole);

    cdk.Tags.of(this.errorHandlerRole).add('Function', 'ErrorHandler');
    cdk.Tags.of(this.errorHandlerRole).add('Component', 'Backend');

    // AdminConfigHandler Role
    // Permissions: SSM GetParameter/PutParameter, Lambda UpdateFunctionConfiguration
    this.adminConfigHandlerRole = new iam.Role(this, 'AdminConfigHandlerRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for AdminConfigHandler Lambda - manages Bedrock model configuration',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    this.adminConfigHandlerRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameter', 'ssm:PutParameter'],
        resources: [`arn:aws:ssm:*:*:parameter/documentai/*`],
      })
    );

    this.adminConfigHandlerRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['lambda:GetFunctionConfiguration', 'lambda:UpdateFunctionConfiguration'],
        resources: [`arn:aws:lambda:*:*:function:BedrockProcessor-*`],
      })
    );

    cdk.Tags.of(this.adminConfigHandlerRole).add('Function', 'AdminConfigHandler');
    cdk.Tags.of(this.adminConfigHandlerRole).add('Component', 'Backend');

    // Also grant BedrockProcessor SSM read permission
    this.bedrockProcessorRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameter'],
        resources: [`arn:aws:ssm:*:*:parameter/documentai/*`],
      })
    );

    // Output role ARNs for reference
    new cdk.CfnOutput(this, 'DocumentUploadHandlerRoleArn', {
      value: this.documentUploadHandlerRole.roleArn,
      description: 'ARN of DocumentUploadHandler IAM Role',
      exportName: `${cdk.Stack.of(this).stackName}-DocumentUploadHandlerRoleArn`,
    });

    new cdk.CfnOutput(this, 'BedrockProcessorRoleArn', {
      value: this.bedrockProcessorRole.roleArn,
      description: 'ARN of BedrockProcessor IAM Role',
      exportName: `${cdk.Stack.of(this).stackName}-BedrockProcessorRoleArn`,
    });

    new cdk.CfnOutput(this, 'HistoryManagerRoleArn', {
      value: this.historyManagerRole.roleArn,
      description: 'ARN of HistoryManager IAM Role',
      exportName: `${cdk.Stack.of(this).stackName}-HistoryManagerRoleArn`,
    });

    new cdk.CfnOutput(this, 'MetricsAggregatorRoleArn', {
      value: this.metricsAggregatorRole.roleArn,
      description: 'ARN of MetricsAggregator IAM Role',
      exportName: `${cdk.Stack.of(this).stackName}-MetricsAggregatorRoleArn`,
    });

    new cdk.CfnOutput(this, 'ExportHandlerRoleArn', {
      value: this.exportHandlerRole.roleArn,
      description: 'ARN of ExportHandler IAM Role',
      exportName: `${cdk.Stack.of(this).stackName}-ExportHandlerRoleArn`,
    });

    new cdk.CfnOutput(this, 'DocumentDeleteHandlerRoleArn', {
      value: this.documentDeleteHandlerRole.roleArn,
      description: 'ARN of DocumentDeleteHandler IAM Role',
      exportName: `${cdk.Stack.of(this).stackName}-DocumentDeleteHandlerRoleArn`,
    });

    new cdk.CfnOutput(this, 'ErrorHandlerRoleArn', {
      value: this.errorHandlerRole.roleArn,
      description: 'ARN of ErrorHandler IAM Role',
      exportName: `${cdk.Stack.of(this).stackName}-ErrorHandlerRoleArn`,
    });
  }
}
