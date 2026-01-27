import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

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

    // TODO: Add resource stacks here
    // - S3 buckets (documents, results, web hosting)
    // - DynamoDB tables (Documents, AnalysisResults, UserMetrics)
    // - Cognito User Pool
    // - Lambda functions
    // - API Gateway
    // - Step Functions
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
