import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface S3BucketsConstructProps {
  environment: string;
}

export class S3BucketsConstruct extends Construct {
  public readonly documentsBucket: s3.Bucket;
  public readonly resultsBucket: s3.Bucket;
  public readonly webHostingBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3BucketsConstructProps) {
    super(scope, id);

    const { environment } = props;
    const accountId = cdk.Stack.of(this).account;

    // Documents Bucket - stores uploaded documents
    // Requirements: 2.6, 5.3, 9.2
    this.documentsBucket = new s3.Bucket(this, 'DocumentsBucket', {
      bucketName: `document-analysis-documents-${accountId}-${environment}`,
      encryption: s3.BucketEncryption.S3_MANAGED, // AES-256 encryption (Requirement 9.2)
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'prod',
      
      // Lifecycle policy - delete documents after 90 days (configurable)
      lifecycleRules: [
        {
          id: 'DeleteOldDocuments',
          enabled: true,
          expiration: cdk.Duration.days(90),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],

      // CORS configuration for direct browser uploads
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'], // Will be restricted to CloudFront domain in production
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3600,
        },
      ],

      // Enable event notifications (will be configured later for Step Functions)
      eventBridgeEnabled: true,
    });

    // Results Bucket - stores analysis results and exports
    // Requirements: 5.3, 9.2
    this.resultsBucket = new s3.Bucket(this, 'ResultsBucket', {
      bucketName: `document-analysis-results-${accountId}-${environment}`,
      encryption: s3.BucketEncryption.S3_MANAGED, // AES-256 encryption (Requirement 9.2)
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'prod',
      
      // Lifecycle policy - delete results after 365 days (configurable)
      lifecycleRules: [
        {
          id: 'DeleteOldResults',
          enabled: true,
          expiration: cdk.Duration.days(365),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],

      // CORS configuration for export downloads
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
          ],
          allowedOrigins: ['*'], // Will be restricted to CloudFront domain in production
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
    });

    // Web Hosting Bucket - hosts React frontend static files
    // Requirements: 5.3, 9.2
    this.webHostingBucket = new s3.Bucket(this, 'WebHostingBucket', {
      bucketName: `document-analysis-web-${accountId}-${environment}`,
      encryption: s3.BucketEncryption.S3_MANAGED, // AES-256 encryption (Requirement 9.2)
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Access via CloudFront OAI only
      versioned: false,
      removalPolicy: environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: environment !== 'prod',
      
      // Static website hosting configuration
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // SPA routing support
    });

    // Bucket policies will be added when integrating with Lambda functions and CloudFront

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'DocumentsBucketName', {
      value: this.documentsBucket.bucketName,
      description: 'Name of the documents S3 bucket',
      exportName: `${cdk.Stack.of(this).stackName}-DocumentsBucket`,
    });

    new cdk.CfnOutput(this, 'DocumentsBucketArn', {
      value: this.documentsBucket.bucketArn,
      description: 'ARN of the documents S3 bucket',
    });

    new cdk.CfnOutput(this, 'ResultsBucketName', {
      value: this.resultsBucket.bucketName,
      description: 'Name of the results S3 bucket',
      exportName: `${cdk.Stack.of(this).stackName}-ResultsBucket`,
    });

    new cdk.CfnOutput(this, 'ResultsBucketArn', {
      value: this.resultsBucket.bucketArn,
      description: 'ARN of the results S3 bucket',
    });

    new cdk.CfnOutput(this, 'WebHostingBucketName', {
      value: this.webHostingBucket.bucketName,
      description: 'Name of the web hosting S3 bucket',
      exportName: `${cdk.Stack.of(this).stackName}-WebHostingBucket`,
    });

    new cdk.CfnOutput(this, 'WebHostingBucketArn', {
      value: this.webHostingBucket.bucketArn,
      description: 'ARN of the web hosting S3 bucket',
    });

    new cdk.CfnOutput(this, 'WebHostingBucketWebsiteUrl', {
      value: this.webHostingBucket.bucketWebsiteUrl,
      description: 'Website URL of the web hosting S3 bucket',
    });

    // Add tags to all buckets
    cdk.Tags.of(this.documentsBucket).add('Purpose', 'DocumentStorage');
    cdk.Tags.of(this.resultsBucket).add('Purpose', 'ResultsStorage');
    cdk.Tags.of(this.webHostingBucket).add('Purpose', 'WebHosting');
  }
}
