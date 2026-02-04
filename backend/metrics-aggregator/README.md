# MetricsAggregator Lambda Function

## Overview

The MetricsAggregator Lambda function calculates and aggregates user metrics from document processing data. It provides insights into user activity, document processing patterns, and usage statistics.

## Functionality

### Core Features

1. **JWT Token Validation**: Extracts and validates userId from API Gateway authorizer context
2. **Document Querying**: Retrieves all documents for a user using the UserIdIndex GSI
3. **Metrics Calculation**: Computes various metrics from document data
4. **Metrics Storage**: Persists aggregated metrics in the UserMetrics DynamoDB table

### Calculated Metrics

- **Total Documents**: Count of all documents uploaded by the user
- **Documents by Vertical**: Breakdown of document count by industry vertical
- **Average Processing Time**: Mean processing time for completed documents (in milliseconds)
- **Favorite Vertical**: Most frequently used vertical
- **Documents by Date**: Time-series data showing document count per day
- **Completed Documents**: Count of successfully processed documents

## Architecture

```
API Gateway → MetricsAggregator Lambda → DynamoDB
                    ↓
              Documents Table (Query via UserIdIndex)
                    ↓
              Calculate Metrics
                    ↓
              UserMetrics Table (Store)
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DOCUMENTS_TABLE_NAME` | Name of the Documents DynamoDB table | `DocumentAnalysis-Documents-dev` |
| `METRICS_TABLE_NAME` | Name of the UserMetrics DynamoDB table | `DocumentAnalysis-Metrics-dev` |

## IAM Permissions Required

- `dynamodb:Query` on Documents table (UserIdIndex GSI)
- `dynamodb:PutItem` on UserMetrics table
- `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` for CloudWatch Logs

## API Integration

### Request

**Method**: GET  
**Path**: `/metrics`  
**Headers**:
- `Authorization`: Bearer token (JWT from Cognito)

**Query Parameters**: None

### Response

**Success (200)**:
```json
{
  "userId": "user-123",
  "metrics": {
    "totalDocuments": 42,
    "documentsByVertical": {
      "healthcare": 15,
      "finance": 12,
      "legal": 10,
      "technology": 5
    },
    "averageProcessingTimeMs": 3542.67,
    "favoriteVertical": "healthcare",
    "documentsByDate": {
      "2024-01-15": 5,
      "2024-01-16": 8,
      "2024-01-17": 12
    },
    "completedDocuments": 40
  },
  "calculatedAt": "2024-01-17T10:30:00.000Z"
}
```

**Error (401 Unauthorized)**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**Error (500 Internal Server Error)**:
```json
{
  "error": "Internal Server Error",
  "message": "Failed to calculate metrics"
}
```

## Data Models

### Documents Table Query

Queries the Documents table using the UserIdIndex GSI:
- **Partition Key**: `userId`
- **Sort Key**: `uploadedAt`
- **Projection**: ALL (includes all document attributes)

### UserMetrics Table Storage

Stores metrics with composite key:
- **Partition Key**: `userId`
- **Sort Key**: `metricDate` (YYYY-MM-DD format)

**Attributes**:
```typescript
{
  userId: string
  metricDate: string  // YYYY-MM-DD
  totalDocuments: number
  documentsByVertical: {
    [vertical: string]: number
  }
  averageProcessingTimeMs: number
  favoriteVertical: string
  completedDocuments: number
  lastUpdated: string  // ISO 8601 timestamp
}
```

## Error Handling

1. **Authentication Errors**: Returns 401 if JWT token is invalid or missing
2. **DynamoDB Errors**: Logs error details and returns 500
3. **Calculation Errors**: Logs error with stack trace and returns 500

## Logging

All operations are logged to CloudWatch Logs with structured logging:
- User ID validation
- Document query results
- Calculated metrics
- Storage operations
- Errors with stack traces

## Performance Considerations

- **Pagination**: Handles large document sets by paginating through DynamoDB query results
- **Efficient Aggregation**: Single-pass calculation of all metrics
- **Caching**: Stores calculated metrics in UserMetrics table for fast retrieval
- **Memory**: Configured with 512 MB memory for handling large datasets
- **Timeout**: 30 seconds timeout for query and calculation operations

## Testing

### Manual Testing

```bash
# Test with curl (replace with actual API Gateway URL and token)
curl -X GET https://api.example.com/metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Unit Testing

Run unit tests with pytest:
```bash
cd backend/metrics-aggregator
pytest test_handler.py -v
```

## Deployment

Deployed via AWS CDK as part of the Lambda Functions construct:

```typescript
const metricsAggregator = new lambda.Function(this, 'MetricsAggregator', {
  runtime: lambda.Runtime.PYTHON_3_12,
  handler: 'handler.lambda_handler',
  code: lambda.Code.fromAsset('backend/metrics-aggregator'),
  role: iamRoles.metricsAggregatorRole,
  environment: {
    DOCUMENTS_TABLE_NAME: dynamodbTables.documentsTable.tableName,
    METRICS_TABLE_NAME: dynamodbTables.userMetricsTable.tableName,
  },
  timeout: cdk.Duration.seconds(30),
  memorySize: 512,
});
```

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 6.1**: Tracks total documents analyzed per user
- **Requirement 6.2**: Tracks documents analyzed per vertical
- **Requirement 6.3**: Calculates average processing time per document
- **Requirement 6.7**: Stores aggregated metrics in UserMetrics DynamoDB table

## Future Enhancements

1. **Scheduled Aggregation**: Add EventBridge rule to pre-calculate metrics daily
2. **Token Tracking**: Include Bedrock token usage in metrics (Requirement 10.8)
3. **Time-Series Analysis**: Add weekly/monthly aggregations
4. **Caching**: Implement Redis/ElastiCache for frequently accessed metrics
5. **Real-time Updates**: Use DynamoDB Streams to update metrics incrementally
