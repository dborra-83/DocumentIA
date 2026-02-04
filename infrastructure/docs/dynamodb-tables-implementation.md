# DynamoDB Tables Implementation

## Overview

This document describes the implementation of DynamoDB tables for the Document Analysis system. The tables store document metadata, analysis results, and user metrics.

## Implementation Details

### Task 2.2: Create DynamoDB Tables Stack

**Requirements**: 2.6, 5.2, 6.7, 9.3

**Files Created**:
- `infrastructure/lib/dynamodb-tables-construct.ts` - DynamoDB tables construct

**Files Modified**:
- `infrastructure/lib/document-analysis-stack.ts` - Added DynamoDB tables to main stack

## Table Definitions

### 1. Documents Table

**Purpose**: Store metadata for uploaded documents

**Table Name**: `DocumentAnalysis-Documents-{environment}`

**Primary Key**:
- Partition Key: `documentId` (String) - Unique identifier for each document

**Global Secondary Indexes**:
- **UserIdIndex**: Enables querying all documents for a specific user
  - Partition Key: `userId` (String)
  - Sort Key: `uploadedAt` (String) - ISO 8601 timestamp
  - Projection: ALL (includes all attributes)

**Attributes** (as defined in design.md):
```typescript
{
  documentId: string          // PK
  userId: string              // GSI PK
  fileName: string
  fileSize: number
  fileType: string            // 'pdf' | 'docx' | 'txt'
  vertical: string            // 'healthcare' | 'education' | 'retail' | etc.
  s3Key: string               // S3 object key
  status: string              // 'pending' | 'processing' | 'completed' | 'failed'
  uploadedAt: string          // ISO 8601 timestamp (GSI SK)
  processedAt?: string        // ISO 8601 timestamp
  processingTimeMs?: number
  errorMessage?: string
  ttl?: number                // Optional TTL for auto-deletion
}
```

**Access Patterns**:
1. Get document by ID: `GetItem` on `documentId`
2. Get all documents for user: `Query` on `UserIdIndex` with `userId`
3. Get documents by status: `Query` on `UserIdIndex` with filter on `status`

**Configuration**:
- Billing Mode: PAY_PER_REQUEST (on-demand)
- Encryption: AWS_MANAGED (encryption at rest)
- Point-in-Time Recovery: Enabled for production
- TTL: Enabled on `ttl` attribute
- Streams: NEW_AND_OLD_IMAGES (for audit logs)

### 2. AnalysisResults Table

**Purpose**: Store analysis results from Amazon Bedrock

**Table Name**: `DocumentAnalysis-Results-{environment}`

**Primary Key**:
- Partition Key: `documentId` (String) - Same as Documents table for easy joins

**Attributes** (as defined in design.md):
```typescript
{
  documentId: string          // PK (same as Documents table)
  userId: string
  vertical: string
  executiveSummary: string
  keyPoints: string[]         // DynamoDB List
  nextSteps: string[]         // DynamoDB List
  analyzedAt: string          // ISO 8601 timestamp
  bedrockModelId: string
  bedrockRequestId: string
  inputTokens: number
  outputTokens: number
  s3ResultKey: string         // Full JSON stored in S3
}
```

**Access Patterns**:
1. Get analysis by document ID: `GetItem` on `documentId`
2. Get analysis for user: Join with Documents table via `userId`

**Configuration**:
- Billing Mode: PAY_PER_REQUEST (on-demand)
- Encryption: AWS_MANAGED (encryption at rest)
- Point-in-Time Recovery: Enabled for production
- Streams: NEW_AND_OLD_IMAGES (for audit logs)

### 3. UserMetrics Table

**Purpose**: Store aggregated user metrics for dashboard

**Table Name**: `DocumentAnalysis-Metrics-{environment}`

**Primary Key**:
- Partition Key: `userId` (String)
- Sort Key: `metricDate` (String) - Format: YYYY-MM-DD

**Composite Key Benefits**:
- Allows querying metrics for a user over time
- Enables date range queries
- Supports daily aggregation

**Attributes** (as defined in design.md):
```typescript
{
  userId: string              // PK
  metricDate: string          // SK (YYYY-MM-DD)
  totalDocuments: number
  documentsByVertical: {      // DynamoDB Map
    healthcare: number
    education: number
    retail: number
    legal: number
    finance: number
    manufacturing: number
    hr: number
    technology: number
  }
  averageProcessingTimeMs: number
  totalInputTokens: number
  totalOutputTokens: number
  lastUpdated: string         // ISO 8601 timestamp
}
```

**Access Patterns**:
1. Get metrics for user on specific date: `GetItem` on `userId` and `metricDate`
2. Get metrics for user over date range: `Query` on `userId` with range on `metricDate`

**Configuration**:
- Billing Mode: PAY_PER_REQUEST (on-demand)
- Encryption: AWS_MANAGED (encryption at rest)
- Point-in-Time Recovery: Enabled for production
- Streams: NEW_AND_OLD_IMAGES (for audit logs)

## Security Features

### Encryption at Rest (Requirement 9.3)

All tables use AWS-managed encryption keys (AWS_MANAGED):
- Data encrypted at rest using AES-256
- Keys managed by AWS KMS
- No additional cost for AWS-managed keys
- Automatic key rotation

### Access Control

IAM policies will be configured in subsequent tasks to:
- Grant Lambda functions least-privilege access
- Restrict access to specific tables and operations
- Enable VPC endpoints for private access (optional)

## Operational Features

### Point-in-Time Recovery (PITR)

- Enabled for production environment
- Allows recovery to any point in the last 35 days
- Protects against accidental deletions or updates

### DynamoDB Streams

- Enabled on all tables with NEW_AND_OLD_IMAGES view type
- Potential use cases:
  - Audit logging
  - Data replication
  - Real-time analytics
  - Event-driven workflows

### Time-to-Live (TTL)

- Enabled on Documents table
- Allows automatic deletion of expired documents
- Reduces storage costs
- Configurable per document via `ttl` attribute

### Billing Mode

- PAY_PER_REQUEST (on-demand) selected for:
  - Variable workload patterns
  - No capacity planning required
  - Automatic scaling
  - Cost-effective for unpredictable traffic

## CloudFormation Outputs

The construct exports the following outputs:

1. **DocumentsTableName**: Name of the Documents table
2. **DocumentsTableArn**: ARN of the Documents table
3. **AnalysisResultsTableName**: Name of the AnalysisResults table
4. **AnalysisResultsTableArn**: ARN of the AnalysisResults table
5. **UserMetricsTableName**: Name of the UserMetrics table
6. **UserMetricsTableArn**: ARN of the UserMetrics table

These outputs can be referenced by other stacks and Lambda functions.

## Tags

All tables are tagged with:
- **Project**: DocumentAnalysis
- **Environment**: dev/staging/prod
- **ManagedBy**: CDK
- **Purpose**: DocumentMetadata/AnalysisResults/UserMetrics

## Deployment

### Prerequisites

- AWS CDK CLI installed
- AWS credentials configured
- Node.js and npm installed

### Deploy to Development

```bash
cd infrastructure
npm install
cdk deploy --context environment=dev
```

### Deploy to Production

```bash
cd infrastructure
cdk deploy --context environment=prod
```

## Testing

### Verify Tables Created

```bash
# List tables
aws dynamodb list-tables

# Describe Documents table
aws dynamodb describe-table --table-name DocumentAnalysis-Documents-dev

# Describe AnalysisResults table
aws dynamodb describe-table --table-name DocumentAnalysis-Results-dev

# Describe UserMetrics table
aws dynamodb describe-table --table-name DocumentAnalysis-Metrics-dev
```

### Test Write Operations

```bash
# Put item in Documents table
aws dynamodb put-item \
  --table-name DocumentAnalysis-Documents-dev \
  --item '{
    "documentId": {"S": "test-doc-123"},
    "userId": {"S": "test-user-456"},
    "fileName": {"S": "test.pdf"},
    "fileSize": {"N": "1024"},
    "fileType": {"S": "pdf"},
    "vertical": {"S": "healthcare"},
    "s3Key": {"S": "documents/test-user-456/test-doc-123.pdf"},
    "status": {"S": "pending"},
    "uploadedAt": {"S": "2024-01-15T10:30:00Z"}
  }'

# Query by userId using GSI
aws dynamodb query \
  --table-name DocumentAnalysis-Documents-dev \
  --index-name UserIdIndex \
  --key-condition-expression "userId = :userId" \
  --expression-attribute-values '{":userId": {"S": "test-user-456"}}'
```

## Cost Estimation

### On-Demand Pricing (us-east-1)

**Write Requests**: $1.25 per million write request units
**Read Requests**: $0.25 per million read request units
**Storage**: $0.25 per GB-month

**Example Monthly Cost** (1000 active users):
- 100,000 documents uploaded: ~$0.13
- 500,000 reads (history, metrics): ~$0.13
- 10 GB storage: ~$2.50
- **Total**: ~$2.76/month

**Note**: Actual costs depend on usage patterns. Monitor with CloudWatch metrics.

## Monitoring

### CloudWatch Metrics

DynamoDB automatically publishes metrics:
- ConsumedReadCapacityUnits
- ConsumedWriteCapacityUnits
- UserErrors
- SystemErrors
- ThrottledRequests

### Alarms (to be configured in Task 18)

- High error rate
- Throttled requests
- High latency

## Next Steps

1. **Task 2.3**: Create Cognito User Pool stack
2. **Task 2.4**: Create IAM roles for Lambda functions
3. **Task 3**: Implement DocumentUploadHandler Lambda function
4. **Task 7**: Implement text extraction module
5. **Task 8**: Implement Bedrock integration

## References

- [AWS CDK DynamoDB Documentation](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb-readme.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [DynamoDB Encryption at Rest](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/EncryptionAtRest.html)
- Design Document: `.kiro/specs/document-analysis-bedrock-aws/design.md`
- Requirements Document: `.kiro/specs/document-analysis-bedrock-aws/requirements.md`
