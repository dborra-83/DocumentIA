# IAM Roles Implementation

## Overview

This document describes the IAM roles created for Lambda functions in the Document Analysis system. All roles follow the principle of least privilege, granting only the minimum permissions required for each function to operate.

## Roles Created

### 1. DocumentUploadHandler Role

**Purpose**: Generate presigned S3 URLs and create document metadata records

**Permissions**:
- `s3:PutObject` on documents bucket (for presigned URL generation)
- `dynamodb:PutItem` on Documents table
- CloudWatch Logs (via AWSLambdaBasicExecutionRole)

**Use Case**: When a user initiates a document upload, this Lambda generates a presigned URL that allows direct upload to S3, and creates a pending document record in DynamoDB.

**Security Considerations**:
- Presigned URLs expire after 15 minutes
- Only allows PUT operations, not GET or DELETE
- Document records are scoped to the authenticated user

---

### 2. BedrockProcessor Role

**Purpose**: Process documents using Amazon Bedrock AI

**Permissions**:
- `s3:GetObject` on documents bucket (read uploaded documents)
- `s3:PutObject` on results bucket (store analysis results)
- `dynamodb:GetItem`, `dynamodb:UpdateItem` on Documents table
- `dynamodb:PutItem` on AnalysisResults table
- `bedrock:InvokeModel` on Claude 3 Sonnet model
- CloudWatch Logs (via AWSLambdaBasicExecutionRole)

**Use Case**: Triggered by Step Functions after document upload. Downloads document from S3, extracts text, invokes Bedrock for analysis, and stores results.

**Security Considerations**:
- Read-only access to documents bucket
- Write access limited to results bucket
- Bedrock access restricted to specific model ARN
- All operations logged to CloudWatch

**Bedrock Model ARN Format**:
```
arn:aws:bedrock:{region}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0
```

---

### 3. HistoryManager Role

**Purpose**: Query and retrieve document history for users

**Permissions**:
- `dynamodb:Query`, `dynamodb:GetItem` on Documents table (read-only)
- `dynamodb:GetItem` on AnalysisResults table (read-only)
- CloudWatch Logs (via AWSLambdaBasicExecutionRole)

**Use Case**: Provides API endpoints for users to view their document history, search, and filter documents.

**Security Considerations**:
- Read-only access (no write permissions)
- Queries scoped to authenticated user via userId
- No access to S3 buckets

---

### 4. MetricsAggregator Role

**Purpose**: Calculate and store user metrics

**Permissions**:
- `dynamodb:Query` on Documents table (read user documents)
- `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:UpdateItem` on UserMetrics table
- CloudWatch Logs (via AWSLambdaBasicExecutionRole)

**Use Case**: Aggregates metrics like total documents processed, average processing time, and documents by vertical for dashboard display.

**Security Considerations**:
- Read-only access to Documents table
- Write access only to UserMetrics table
- Metrics scoped to individual users

---

### 5. ExportHandler Role

**Purpose**: Generate document exports in multiple formats (PDF, JSON, Excel, Word)

**Permissions**:
- `dynamodb:GetItem` on Documents table (read document metadata)
- `dynamodb:GetItem` on AnalysisResults table (read analysis data)
- `s3:PutObject` on results bucket (store export files)
- CloudWatch Logs (via AWSLambdaBasicExecutionRole)

**Use Case**: When a user requests an export, this Lambda retrieves the document and analysis data, generates the requested format, uploads to S3, and returns a presigned download URL.

**Security Considerations**:
- Read-only access to DynamoDB tables
- Write access limited to results bucket
- Presigned download URLs expire after 15 minutes
- Export files scoped to user's directory in S3

---

## Least Privilege Implementation

Each role is designed with the minimum permissions required:

1. **Separation of Concerns**: Each Lambda has a dedicated role with specific permissions
2. **No Wildcard Resources**: All permissions specify exact resource ARNs
3. **Read vs Write**: Roles only get write permissions where absolutely necessary
4. **Scoped Access**: DynamoDB queries and S3 operations are scoped to user context
5. **Time-Limited Access**: Presigned URLs have short expiration times

## Cost Allocation Tags

All roles are tagged for cost tracking:
- `Function`: Name of the Lambda function
- `Component`: Backend

These tags enable cost analysis by function in AWS Cost Explorer.

## CloudWatch Logging

All roles include the `AWSLambdaBasicExecutionRole` managed policy, which provides:
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

This enables comprehensive logging for debugging and monitoring.

## Integration with CDK Stack

The IAM roles are created in the `IamRolesConstruct` and passed to Lambda function constructs. Example usage:

```typescript
// In document-analysis-stack.ts
const iamRoles = new IamRolesConstruct(this, 'IamRoles', {
  documentsBucket: s3Buckets.documentsBucket,
  resultsBucket: s3Buckets.resultsBucket,
  documentsTable: dynamoTables.documentsTable,
  resultsTable: dynamoTables.resultsTable,
  metricsTable: dynamoTables.metricsTable,
  bedrockModelArn: 'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
});

// Use roles in Lambda functions
const uploadHandler = new lambda.Function(this, 'DocumentUploadHandler', {
  role: iamRoles.documentUploadHandlerRole,
  // ... other props
});
```

## Security Best Practices

1. **Regular Audits**: Review IAM policies quarterly
2. **Principle of Least Privilege**: Never grant more permissions than needed
3. **Use Managed Policies**: Leverage AWS managed policies where appropriate
4. **Enable CloudTrail**: Log all IAM actions for audit trail
5. **Rotate Credentials**: Lambda uses role-based authentication (no long-term credentials)
6. **Monitor Usage**: Set up CloudWatch alarms for unusual IAM activity

## Compliance

These IAM roles support compliance with:
- **SOC 2**: Least privilege access control
- **HIPAA**: Access logging and encryption (when enabled)
- **GDPR**: Data access controls and audit trails

## Troubleshooting

### Common Issues

**Issue**: Lambda function gets "Access Denied" error
- **Solution**: Check that the role has the required permission for the specific resource
- **Debug**: Review CloudTrail logs for the denied action

**Issue**: Presigned URL generation fails
- **Solution**: Verify the role has `s3:PutObject` permission on the bucket
- **Debug**: Check bucket policies don't conflict with IAM permissions

**Issue**: Bedrock invocation fails
- **Solution**: Ensure the Bedrock model ARN is correct and the role has `bedrock:InvokeModel`
- **Debug**: Verify Bedrock is available in your AWS region

## References

- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Lambda Execution Role](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)
- [Bedrock IAM Permissions](https://docs.aws.amazon.com/bedrock/latest/userguide/security-iam.html)
- [S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
