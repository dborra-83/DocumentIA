# API Gateway Implementation

## Overview

This document describes the implementation of the API Gateway REST API with Cognito User Pool authorizer for the Document Analysis system.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway REST API                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Cognito User Pool Authorizer                   │ │
│  │  - Validates JWT tokens                                │ │
│  │  - Caches results for 5 minutes                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Endpoints:                                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ POST /upload → DocumentUploadHandler                   │ │
│  │ GET  /documents → HistoryManager                       │ │
│  │ GET  /documents/{documentId} → HistoryManager          │ │
│  │ GET  /metrics → MetricsAggregator                      │ │
│  │ POST /export/{documentId} → ExportHandler              │ │
│  │ GET  /health → Mock Integration (no auth)              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Features:                                                   │
│  - CORS enabled for frontend                                │
│  - Request validation                                        │
│  - Throttling (100 req/s, 200 burst)                        │
│  - Usage plan (10,000 req/month)                            │
│  - CloudWatch logging and X-Ray tracing                     │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### POST /upload
**Purpose**: Generate presigned URL for document upload

**Authorization**: Required (Cognito JWT)

**Request Body**:
```json
{
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "fileSize": 1024000,
  "vertical": "healthcare"
}
```

**Response (200)**:
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "documentId": "uuid-123",
  "expiresIn": 900
}
```

**Lambda**: DocumentUploadHandler

---

### GET /documents
**Purpose**: Get user's document history with filtering and pagination

**Authorization**: Required (Cognito JWT)

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20)
- `vertical` (optional): Filter by vertical
- `dateFrom` (optional): Filter by start date (ISO 8601)
- `dateTo` (optional): Filter by end date (ISO 8601)
- `search` (optional): Search by document name

**Response (200)**:
```json
{
  "documents": [
    {
      "documentId": "uuid-123",
      "fileName": "document.pdf",
      "vertical": "healthcare",
      "uploadedAt": "2024-01-17T10:00:00Z",
      "status": "completed"
    }
  ],
  "totalCount": 42,
  "page": 1,
  "pageSize": 20
}
```

**Lambda**: HistoryManager

---

### GET /documents/{documentId}
**Purpose**: Get specific document with analysis results

**Authorization**: Required (Cognito JWT)

**Path Parameters**:
- `documentId` (required): Document ID

**Response (200)**:
```json
{
  "document": {
    "documentId": "uuid-123",
    "fileName": "document.pdf",
    "vertical": "healthcare",
    "uploadedAt": "2024-01-17T10:00:00Z",
    "status": "completed"
  },
  "analysis": {
    "executiveSummary": "...",
    "keyPoints": ["...", "..."],
    "nextSteps": ["...", "..."]
  }
}
```

**Lambda**: HistoryManager

---

### GET /metrics
**Purpose**: Get user metrics and statistics

**Authorization**: Required (Cognito JWT)

**Response (200)**:
```json
{
  "userId": "user-123",
  "metrics": {
    "totalDocuments": 42,
    "documentsByVertical": {
      "healthcare": 15,
      "finance": 12
    },
    "averageProcessingTimeMs": 3542.67,
    "favoriteVertical": "healthcare",
    "documentsByDate": {
      "2024-01-15": 5,
      "2024-01-16": 8
    }
  }
}
```

**Lambda**: MetricsAggregator

---

### POST /export/{documentId}
**Purpose**: Generate export in specified format

**Authorization**: Required (Cognito JWT)

**Path Parameters**:
- `documentId` (required): Document ID

**Request Body**:
```json
{
  "format": "pdf"
}
```

**Supported Formats**: `pdf`, `json`, `excel`, `word`

**Response (200)**:
```json
{
  "downloadUrl": "https://s3.amazonaws.com/...",
  "expiresIn": 900,
  "format": "pdf",
  "documentId": "uuid-123"
}
```

**Lambda**: ExportHandler

---

### GET /health
**Purpose**: Health check endpoint

**Authorization**: Not required

**Response (200)**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-17T10:00:00Z",
  "environment": "dev"
}
```

**Integration**: Mock Integration (no Lambda)

## Security Features

### Cognito User Pool Authorizer

- **Token Validation**: Validates JWT tokens from Cognito User Pool
- **Identity Source**: `Authorization` header
- **Cache TTL**: 5 minutes (reduces Cognito API calls)
- **Automatic**: API Gateway handles token validation automatically

### CORS Configuration

```typescript
{
  allowOrigins: ['*'], // TODO: Restrict to CloudFront domain in production
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-Amz-Date',
    'X-Api-Key',
    'X-Amz-Security-Token'
  ],
  allowCredentials: true,
  maxAge: 3600 // 1 hour
}
```

### Request Validation

- **Body Validation**: Validates request body against schema
- **Parameter Validation**: Validates path and query parameters
- **Automatic Rejection**: Invalid requests rejected before Lambda invocation

## Rate Limiting

### Throttling

- **Rate Limit**: 100 requests per second
- **Burst Limit**: 200 requests (burst capacity)
- **Per-API**: Applied at API level

### Usage Plan

- **Monthly Quota**: 10,000 requests per month
- **Throttling**: Same as API-level throttling
- **Purpose**: Cost control and abuse prevention

## Monitoring and Logging

### CloudWatch Logs

- **Logging Level**: INFO
- **Data Trace**: Enabled (logs request/response data)
- **Execution Logs**: Logs API Gateway execution details

### X-Ray Tracing

- **Enabled**: Yes
- **Purpose**: Distributed tracing across API Gateway and Lambda
- **Benefits**: Performance analysis, bottleneck identification

### CloudWatch Metrics

Automatic metrics published:
- `Count`: Number of API requests
- `4XXError`: Client errors
- `5XXError`: Server errors
- `Latency`: Request latency
- `IntegrationLatency`: Lambda execution time

## Deployment

### CDK Deployment

```bash
cd infrastructure
npm run build
cdk deploy --all
```

### Stage Configuration

- **Stage Name**: Environment name (dev, staging, prod)
- **Auto-Deploy**: Yes
- **Stage Variables**: None (using environment variables in Lambda)

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An error occurred processing your request"
}
```

## Integration with Lambda

### Lambda Proxy Integration

- **Type**: AWS_PROXY
- **Benefits**: 
  - Lambda receives full request context
  - Lambda controls response format
  - Simplified integration

### Request Format

Lambda receives:
```json
{
  "resource": "/documents",
  "path": "/documents",
  "httpMethod": "GET",
  "headers": { ... },
  "queryStringParameters": { ... },
  "pathParameters": { ... },
  "body": "...",
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "user-id",
        "email": "user@example.com"
      }
    }
  }
}
```

### Response Format

Lambda must return:
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "{\"key\":\"value\"}"
}
```

## Testing

### Manual Testing with curl

```bash
# Get JWT token from Cognito
TOKEN="your-jwt-token"

# Test upload endpoint
curl -X POST https://api-id.execute-api.region.amazonaws.com/dev/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.pdf","fileType":"application/pdf","fileSize":1024,"vertical":"healthcare"}'

# Test documents endpoint
curl -X GET "https://api-id.execute-api.region.amazonaws.com/dev/documents?page=1&pageSize=20" \
  -H "Authorization: Bearer $TOKEN"

# Test metrics endpoint
curl -X GET https://api-id.execute-api.region.amazonaws.com/dev/metrics \
  -H "Authorization: Bearer $TOKEN"

# Test health endpoint (no auth)
curl -X GET https://api-id.execute-api.region.amazonaws.com/dev/health
```

### Integration Testing

See `infrastructure/test/api-gateway.test.ts` for automated integration tests.

## Requirements Validation

This implementation satisfies:

- **Requirement 1.5**: JWT token validation on every API request
- **Requirement 9.5**: API Gateway validates JWT tokens before processing
- **Requirement 2.5**: POST /upload endpoint for presigned URL generation
- **Requirement 7.1**: GET /documents endpoint for document history
- **Requirement 6.1**: GET /metrics endpoint for user metrics
- **Requirement 8.1**: POST /export/{documentId} endpoint for exports

## Future Enhancements

1. **API Keys**: Add API keys for programmatic access
2. **Custom Domain**: Configure custom domain with SSL certificate
3. **WAF**: Add AWS WAF for additional security
4. **Request/Response Models**: Define JSON schemas for validation
5. **Caching**: Enable API Gateway caching for GET endpoints
6. **Canary Deployments**: Implement canary deployments for safer releases
7. **API Documentation**: Generate OpenAPI/Swagger documentation
8. **Rate Limiting per User**: Implement per-user rate limiting
