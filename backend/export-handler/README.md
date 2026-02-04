# ExportHandler Lambda Function

## Overview

The ExportHandler Lambda function generates exports of document analysis results in multiple formats (PDF, JSON, Excel, Word). Exports are uploaded to S3 and a presigned URL is returned for secure download.

## Functionality

### Core Features

1. **JWT Token Validation**: Extracts and validates userId from API Gateway authorizer context
2. **Document Retrieval**: Fetches document metadata and analysis results from DynamoDB
3. **Multi-Format Export Generation**:
   - **PDF**: Formatted layout with sections, tables, and styling
   - **JSON**: Complete data structure with proper formatting
   - **Excel**: Multi-sheet workbook with metadata, summary, key points, and next steps
   - **Word**: Styled document with headings, tables, and lists
4. **S3 Upload**: Stores generated exports in S3 results bucket
5. **Presigned URL Generation**: Creates temporary download URLs (15-minute expiration)

### Export Formats

#### PDF Export
- Professional layout with ReportLab
- Document metadata table
- Executive summary section
- Numbered key points
- Numbered next steps
- Footer with generation timestamp
- Custom color scheme matching brand

#### JSON Export
- Complete document metadata
- Full analysis results
- Export timestamp
- Proper JSON formatting with indentation
- Decimal type handling

#### Excel Export
- **Sheet 1**: Document Metadata (field-value pairs)
- **Sheet 2**: Executive Summary (wrapped text)
- **Sheet 3**: Key Points (numbered list)
- **Sheet 4**: Next Steps (numbered list)
- Professional styling with headers and colors

#### Word Export
- Title page with centered heading
- Document information table
- Executive summary section
- Bulleted key points
- Numbered next steps
- Footer with generation timestamp

## Architecture

```
API Gateway → ExportHandler Lambda → DynamoDB (Documents + Results)
                    ↓
              Generate Export (PDF/JSON/Excel/Word)
                    ↓
              Upload to S3 Results Bucket
                    ↓
              Generate Presigned URL
                    ↓
              Return Download URL
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DOCUMENTS_TABLE_NAME` | Name of the Documents DynamoDB table | `DocumentAnalysis-Documents-dev` |
| `RESULTS_TABLE_NAME` | Name of the AnalysisResults DynamoDB table | `DocumentAnalysis-Results-dev` |
| `RESULTS_BUCKET_NAME` | Name of the S3 results bucket | `document-analysis-results-dev` |
| `PRESIGNED_URL_EXPIRATION` | Presigned URL expiration in seconds | `900` (15 minutes) |

## IAM Permissions Required

- `dynamodb:GetItem` on Documents table
- `dynamodb:GetItem` on AnalysisResults table
- `s3:PutObject` on Results bucket
- `s3:GetObject` on Results bucket (for presigned URL generation)
- `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` for CloudWatch Logs

## API Integration

### Request

**Method**: POST  
**Path**: `/export/{documentId}`  
**Headers**:
- `Authorization`: Bearer token (JWT from Cognito)
- `Content-Type`: application/json

**Path Parameters**:
- `documentId`: ID of the document to export

**Body**:
```json
{
  "format": "pdf"
}
```

**Supported Formats**: `pdf`, `json`, `excel`, `word`

### Response

**Success (200)**:
```json
{
  "downloadUrl": "https://s3.amazonaws.com/bucket/exports/user-123/doc-456/export.pdf?...",
  "expiresIn": 900,
  "format": "pdf",
  "documentId": "doc-456",
  "generatedAt": "2024-01-17T10:30:00.000Z"
}
```

**Error (400 Bad Request)**:
```json
{
  "error": "Bad Request",
  "message": "Invalid format. Must be one of: pdf, json, excel, word"
}
```

**Error (401 Unauthorized)**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**Error (404 Not Found)**:
```json
{
  "error": "Not Found",
  "message": "Document not found or access denied"
}
```

**Error (500 Internal Server Error)**:
```json
{
  "error": "Internal Server Error",
  "message": "Failed to generate export"
}
```

## Data Flow

1. **Authentication**: Validate JWT token and extract userId
2. **Authorization**: Verify user owns the document
3. **Data Retrieval**: Fetch document metadata and analysis from DynamoDB
4. **Export Generation**: Generate file in requested format
5. **S3 Upload**: Upload export to S3 with appropriate content type
6. **URL Generation**: Create presigned URL for secure download
7. **Response**: Return download URL to client

## S3 Storage Structure

```
exports/
  {userId}/
    {documentId}/
      export.pdf
      export.json
      export.xlsx
      export.docx
```

## Export File Specifications

### PDF
- **Library**: ReportLab
- **Page Size**: Letter (8.5" x 11")
- **Fonts**: Helvetica family
- **Colors**: Brand colors (#000024, #008FD0)
- **Sections**: Metadata table, summary, key points, next steps

### JSON
- **Encoding**: UTF-8
- **Indentation**: 2 spaces
- **Decimal Handling**: Converted to float
- **Structure**: Nested object with document and analysis

### Excel
- **Library**: openpyxl
- **Format**: .xlsx (Office Open XML)
- **Sheets**: 4 sheets (Metadata, Summary, Key Points, Next Steps)
- **Styling**: Headers with bold font and colored background
- **Column Widths**: Auto-adjusted for readability

### Word
- **Library**: python-docx
- **Format**: .docx (Office Open XML)
- **Styles**: Built-in styles (Heading 1, List Bullet, List Number)
- **Tables**: Light Grid Accent 1 style
- **Alignment**: Center for title, left for content

## Error Handling

1. **Authentication Errors**: Returns 401 if JWT token is invalid
2. **Authorization Errors**: Returns 404 if user doesn't own document
3. **Validation Errors**: Returns 400 for invalid format or missing parameters
4. **DynamoDB Errors**: Logs error and returns 500
5. **S3 Errors**: Logs error and returns 500
6. **Generation Errors**: Logs error with stack trace and returns 500

## Logging

All operations are logged to CloudWatch Logs:
- User ID validation
- Document retrieval
- Export generation (format and success)
- S3 upload confirmation
- Presigned URL generation
- Errors with stack traces

## Performance Considerations

- **Memory**: 1024 MB for handling large documents and PDF generation
- **Timeout**: 60 seconds for export generation and S3 upload
- **File Size**: Optimized for documents up to 10MB
- **Concurrent Exports**: Stateless design supports concurrent requests
- **S3 Upload**: Direct upload without local file system usage

## Testing

### Manual Testing

```bash
# Test PDF export
curl -X POST https://api.example.com/export/doc-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format": "pdf"}'

# Test JSON export
curl -X POST https://api.example.com/export/doc-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format": "json"}'

# Test Excel export
curl -X POST https://api.example.com/export/doc-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format": "excel"}'

# Test Word export
curl -X POST https://api.example.com/export/doc-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format": "word"}'
```

### Unit Testing

Run unit tests with pytest:
```bash
cd backend/export-handler
pytest test_handler.py -v
```

## Deployment

Deployed via AWS CDK as part of the Lambda Functions construct:

```typescript
const exportHandler = new lambda.Function(this, 'ExportHandler', {
  runtime: lambda.Runtime.PYTHON_3_12,
  handler: 'handler.lambda_handler',
  code: lambda.Code.fromAsset('backend/export-handler'),
  role: iamRoles.exportHandlerRole,
  environment: {
    DOCUMENTS_TABLE_NAME: dynamodbTables.documentsTable.tableName,
    RESULTS_TABLE_NAME: dynamodbTables.analysisResultsTable.tableName,
    RESULTS_BUCKET_NAME: s3Buckets.resultsBucket.bucketName,
    PRESIGNED_URL_EXPIRATION: '900',
  },
  timeout: cdk.Duration.seconds(60),
  memorySize: 1024,
});
```

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 8.1**: Supports export to PDF format with formatted layout
- **Requirement 8.2**: Supports export to JSON format with complete data structure
- **Requirement 8.3**: Supports export to Excel format with structured sheets
- **Requirement 8.4**: Supports export to Word format with styled document
- **Requirement 8.6**: Provides download link via presigned S3 URL
- **Requirement 8.8**: Includes document metadata in all export formats

## Dependencies

- **boto3**: AWS SDK for Python (DynamoDB and S3 operations)
- **reportlab**: PDF generation library
- **openpyxl**: Excel file generation library
- **python-docx**: Word document generation library

## Future Enhancements

1. **Custom Branding**: Add company logo and custom colors to exports
2. **Template Customization**: Allow users to customize export templates
3. **Batch Export**: Support exporting multiple documents at once
4. **Email Delivery**: Option to email exports instead of download
5. **Export History**: Track export history in DynamoDB
6. **Compression**: ZIP multiple formats together
7. **Watermarks**: Add watermarks to PDF exports
8. **Charts**: Include visualizations in Excel and PDF exports
