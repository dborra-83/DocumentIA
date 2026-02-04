# DocumentUploadHandler Lambda Function

## Overview

The DocumentUploadHandler Lambda function generates presigned S3 URLs for direct document uploads and creates document metadata records in DynamoDB. This function is invoked by API Gateway when users initiate a document upload.

## Requirements

Implements requirements:
- **2.5**: Generate presigned URLs for direct S3 uploads
- **2.6**: Store document metadata in DynamoDB

## Functionality

### Main Features

1. **JWT Token Validation**: Extracts and validates user ID from API Gateway authorizer claims
2. **File Metadata Validation**: Validates file name, type, size, and business vertical
3. **Presigned URL Generation**: Creates time-limited S3 upload URLs (15-minute expiration)
4. **Document Record Creation**: Stores document metadata in DynamoDB with 'pending' status
5. **Error Handling**: Comprehensive error handling with descriptive error messages

### Supported File Types

- PDF (`.pdf`)
- Microsoft Word (`.docx`)
- Plain Text (`.txt`)

### File Size Limits

- Maximum file size: 10MB (10,485,760 bytes)

### Supported Business Verticals

- Healthcare
- Education
- Retail
- Legal
- Finance
- Manufacturing
- HR (Human Resources)
- Technology

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DOCUMENTS_BUCKET_NAME` | S3 bucket name for document storage | Required |
| `DOCUMENTS_TABLE_NAME` | DynamoDB table name for document metadata | Required |
| `PRESIGNED_URL_EXPIRATION` | Presigned URL expiration time in seconds | 900 (15 minutes) |

## API Request Format

### Request Body

```json
{
  "fileName": "document.pdf",
  "fileType": "pdf",
  "fileSize": 5242880,
  "vertical": "healthcare"
}
```

### Request Headers

- `Authorization`: JWT token from Cognito (handled by API Gateway authorizer)

## API Response Format

### Success Response (200)

```json
{
  "uploadUrl": "https://s3.amazonaws.com/bucket/key?signature=...",
  "documentId": "550e8400-e29b-41d4-a716-446655440000",
  "expiresIn": 900
}
```

### Error Responses

#### 401 Unauthorized

```json
{
  "error": "Unauthorized: Invalid or missing authentication token"
}
```

#### 400 Bad Request

```json
{
  "error": "File type must be one of: pdf, docx, txt"
}
```

```json
{
  "error": "File size exceeds maximum allowed size of 10MB (provided: 11.50MB)"
}
```

```json
{
  "error": "Vertical must be one of: healthcare, education, retail, legal, finance, manufacturing, hr, technology"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Failed to generate presigned URL"
}
```

```json
{
  "error": "Failed to create document record"
}
```

## DynamoDB Document Record Structure

```python
{
  'documentId': str,        # UUID v4
  'userId': str,            # From JWT claims
  'fileName': str,          # Original file name
  'fileSize': int,          # File size in bytes
  'fileType': str,          # 'pdf', 'docx', or 'txt'
  'vertical': str,          # Business vertical (lowercase)
  's3Key': str,             # S3 object key: documents/{userId}/{documentId}.{fileType}
  'status': str,            # 'pending' (initial status)
  'uploadedAt': str,        # ISO 8601 timestamp with timezone
}
```

## S3 Object Key Format

Documents are stored in S3 with the following key structure:

```
documents/{userId}/{documentId}.{fileType}
```

Example: `documents/user-123/550e8400-e29b-41d4-a716-446655440000.pdf`

## Testing

### Run Unit Tests

```bash
cd backend/document-upload
python -m pytest test_handler.py -v
```

### Test Coverage

The test suite includes:
- JWT token extraction from various claim formats
- File metadata validation (type, size, name, vertical)
- Presigned URL generation (success and failure cases)
- DynamoDB record creation (success and failure cases)
- Complete Lambda handler flow (success and error scenarios)

## Dependencies

- `boto3>=1.28.0`: AWS SDK for Python
- `botocore>=1.31.0`: Low-level AWS service access

## IAM Permissions Required

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::${DOCUMENTS_BUCKET_NAME}/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem"
      ],
      "Resource": "arn:aws:dynamodb:${AWS_REGION}:${AWS_ACCOUNT_ID}:table/${DOCUMENTS_TABLE_NAME}"
    }
  ]
}
```

## Logging

The function logs the following events:
- User ID extraction
- Document ID generation
- Presigned URL generation
- DynamoDB record creation
- Validation errors
- All exceptions with stack traces

Log format: JSON structured logs with correlation IDs for tracing.

## Error Handling

The function implements comprehensive error handling:
1. **Authentication Errors**: Returns 401 for missing or invalid JWT tokens
2. **Validation Errors**: Returns 400 with descriptive error messages
3. **AWS Service Errors**: Returns 500 for S3 or DynamoDB failures
4. **Unexpected Errors**: Returns 500 with generic error message (details logged)

## Security Considerations

1. **JWT Validation**: User ID is extracted from validated JWT tokens (validation performed by API Gateway authorizer)
2. **Input Sanitization**: All user inputs are validated before processing
3. **Presigned URL Expiration**: URLs expire after 15 minutes to limit exposure
4. **CORS Headers**: Configured for specific frontend domain (currently set to '*' for development)
5. **Least Privilege IAM**: Function has minimal required permissions

## Future Enhancements

- [ ] Add support for additional file types (e.g., images, spreadsheets)
- [ ] Implement virus scanning integration
- [ ] Add file content validation (e.g., verify PDF structure)
- [ ] Support for larger files using multipart upload
- [ ] Rate limiting per user
- [ ] Custom domain CORS configuration
