import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface DynamoDBTablesConstructProps {
  environment: string;
}

export class DynamoDBTablesConstruct extends Construct {
  public readonly documentsTable: dynamodb.Table;
  public readonly analysisResultsTable: dynamodb.Table;
  public readonly userMetricsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDBTablesConstructProps) {
    super(scope, id);

    const { environment } = props;

    // Documents Table - stores document metadata
    // Requirements: 2.6, 5.2, 6.7, 9.3
    // Partition Key: documentId (String)
    // Global Secondary Index: UserIdIndex on userId
    this.documentsTable = new dynamodb.Table(this, 'DocumentsTable', {
      tableName: `DocumentAnalysis-Documents-${environment}`,
      partitionKey: {
        name: 'documentId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand pricing for variable workloads
      encryption: dynamodb.TableEncryption.AWS_MANAGED, // Encryption at rest (Requirement 9.3)
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: environment === 'prod', // Enable PITR for production
      },
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      
      // Enable TTL for automatic document deletion (optional)
      timeToLiveAttribute: 'ttl',
      
      // Enable streams for potential future use (audit logs, replication)
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Global Secondary Index on userId for querying all documents by user
    // Access Pattern: Get all documents for a user
    this.documentsTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'uploadedAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL, // Include all attributes in the index
    });

    // AnalysisResults Table - stores analysis results from Bedrock
    // Requirements: 2.6, 5.2, 6.7, 9.3
    // Partition Key: documentId (String) - same as Documents table for easy joins
    this.analysisResultsTable = new dynamodb.Table(this, 'AnalysisResultsTable', {
      tableName: `DocumentAnalysis-Results-${environment}`,
      partitionKey: {
        name: 'documentId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand pricing
      encryption: dynamodb.TableEncryption.AWS_MANAGED, // Encryption at rest (Requirement 9.3)
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: environment === 'prod', // Enable PITR for production
      },
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      
      // Enable streams for potential future use
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // UserMetrics Table - stores aggregated user metrics
    // Requirements: 2.6, 5.2, 6.7, 9.3
    // Partition Key: userId (String)
    // Sort Key: metricDate (String, format: YYYY-MM-DD)
    // Composite key allows querying metrics for a user over time
    this.userMetricsTable = new dynamodb.Table(this, 'UserMetricsTable', {
      tableName: `DocumentAnalysis-Metrics-${environment}`,
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'metricDate',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand pricing
      encryption: dynamodb.TableEncryption.AWS_MANAGED, // Encryption at rest (Requirement 9.3)
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: environment === 'prod', // Enable PITR for production
      },
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      
      // Enable streams for potential future use
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'DocumentsTableName', {
      value: this.documentsTable.tableName,
      description: 'Name of the Documents DynamoDB table',
      exportName: `${cdk.Stack.of(this).stackName}-DocumentsTable`,
    });

    new cdk.CfnOutput(this, 'DocumentsTableArn', {
      value: this.documentsTable.tableArn,
      description: 'ARN of the Documents DynamoDB table',
    });

    new cdk.CfnOutput(this, 'AnalysisResultsTableName', {
      value: this.analysisResultsTable.tableName,
      description: 'Name of the AnalysisResults DynamoDB table',
      exportName: `${cdk.Stack.of(this).stackName}-AnalysisResultsTable`,
    });

    new cdk.CfnOutput(this, 'AnalysisResultsTableArn', {
      value: this.analysisResultsTable.tableArn,
      description: 'ARN of the AnalysisResults DynamoDB table',
    });

    new cdk.CfnOutput(this, 'UserMetricsTableName', {
      value: this.userMetricsTable.tableName,
      description: 'Name of the UserMetrics DynamoDB table',
      exportName: `${cdk.Stack.of(this).stackName}-UserMetricsTable`,
    });

    new cdk.CfnOutput(this, 'UserMetricsTableArn', {
      value: this.userMetricsTable.tableArn,
      description: 'ARN of the UserMetrics DynamoDB table',
    });

    // Add tags to all tables
    cdk.Tags.of(this.documentsTable).add('Purpose', 'DocumentMetadata');
    cdk.Tags.of(this.analysisResultsTable).add('Purpose', 'AnalysisResults');
    cdk.Tags.of(this.userMetricsTable).add('Purpose', 'UserMetrics');
  }
}
