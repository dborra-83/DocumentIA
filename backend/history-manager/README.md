# HistoryManager Lambda Function

## Overview

The HistoryManager Lambda function handles document history queries for authenticated users. It provides two main operations:

1. **List Documents**: Retrieve a paginated list of documents with filtering and search capabilities
2. **Get Document by ID**: Retrieve a single document with its analysis results

## Requirements

Implements requirements:
- **7.1**: Retrieve user documents ordered by timestamp descending
- **7.2**: Display documents in paginated table (20 items per page)
- **7.4**: Display full analysis results when clicking on a document
- **7.5**: Support search by document name (case-insensitive)
- **7.6**: Support filtering by vertical
- **7.7**: Support filtering by date range

## API Endpoints

### List Documents
**GET /documents**

Query Parameters:
- `page` (optional): Page number, default 1
- `pageSize` (optional): Items per page, default 20, max 100
- `vertical` (optional): Filter by vertical (healthcare, education, retail, legal, finance, manufacturing, hr, technology)
- `dateFrom` (optional): Filter by start date (ISO 8601 format)
- `dateTo` (optional): Filter by end date (ISO 8601 format)
- `search` (optional): Search by document name (case-insensitive)

Response:
```json
{
  "documents": [
    {
      "documentId": "uuid",
      "fileName": "document.pdf",
      "fileSize": 1024000,
      "fileType": "application/pdf",
      "vertical": "healthcare",
      "status": "completed",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "processingTimeMs": 5000
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 45,
    "hasMore": true
  }
}
```

### Get Document by ID
**GET /documents/{documentId}**

Response:
```json
{
  "documentId": "uuid",
  "fileName": "document.pdf",
  "fileSize": 1024000,
  "fileType": "application/pdf",
  "vertical": "healthcare",
  "status": "completed",
  "uploadedAt": "2024-01-15T10:30:00Z",
  "processingTimeMs": 5000,
  "analysis": {
    "executiveSummary": "...",
    "keyPoints": ["...", "..."],
    "nextSteps": ["...", "..."],
    "analyzedAt": "2024-01-15T10:30:05Z",
    "inputTokens": 1500,
    "outputTokens": 800
  }
}
```

## Environment Variables

- `DOCUMENTS_TABLE_NAME`: Name of the DynamoDB Documents table
- `RESULTS_TABLE_NAME`: Name of the DynamoDB AnalysisResults table

## DynamoDB Schema

### Documents Table
- **Primary Key**: `documentId` (String)
- **GSI**: `UserIdIndex`
  - Partition Key: `userId` (String)
  - Sort Key: `uploadedAt` (String, ISO 8601)

### AnalysisResults Table
- **Primary Key**: `documentId` (String)

## Authentication

The function expects JWT claims to be provided by API Gateway Cognito authorizer in the request context:
```python
request_context['authorizer']['claims']['sub']  # userId
```

## Error Handling

- **401 Unauthorized**: No userId in JWT token
- **403 Forbidden**: User attempting to access another user's document
- **404 Not Found**: Document does not exist
- **400 Bad Request**: Invalid query parameters
- **500 Internal Server Error**: Unexpected errors

## Logging

All operations are logged to CloudWatch Logs with:
- User ID
- Operation type (list/get)
- Query parameters
- Result counts
- Errors with stack traces

## Testing

Run unit tests:
```bash
pytest test_handler.py -v
```

## Deployment

The function is deployed via AWS CDK as part of the LambdaFunctionsConstruct.

Configuration:
- Runtime: Python 3.12
- Memory: 256 MB
- Timeout: 30 seconds
- IAM Role: HistoryManagerRole (read-only access to DynamoDB)
