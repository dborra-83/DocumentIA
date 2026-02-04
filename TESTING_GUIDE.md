# Testing Guide - Document Analysis System

## 🎯 Test User Created

A test user has been created in Cognito for testing the system:

**Email:** `admin@documentia.com`  
**Password:** `Admin123!Pass`  
**User Pool ID:** `us-east-1_b5Vp65XQ3`  
**Client ID:** `19j2lqlt7fc5e9ut0k5re692aj`

---

## 🧪 API Testing with Postman/cURL

### 1. Health Check (No Auth Required)

```bash
curl https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "30/Jan/2026:16:27:18 +0000",
  "environment": "dev"
}
```

---

### 2. Get Cognito Token

First, you need to authenticate and get an access token:

```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 19j2lqlt7fc5e9ut0k5re692aj \
  --auth-parameters USERNAME=admin@documentia.com,PASSWORD=Admin123!Pass \
  --query 'AuthenticationResult.IdToken' \
  --output text
```

Save the token output - you'll need it for authenticated requests.

**Alternative using AWS CLI:**
```bash
# Store token in variable (PowerShell)
$TOKEN = aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --client-id 19j2lqlt7fc5e9ut0k5re692aj --auth-parameters USERNAME=admin@documentia.com,PASSWORD=Admin123!Pass --query 'AuthenticationResult.IdToken' --output text
```

---

### 3. Test Document Upload Endpoint

**Request:**
```bash
curl -X POST https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test-document.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024000,
    "vertical": "Healthcare"
  }'
```

**Expected Response:**
```json
{
  "documentId": "uuid-here",
  "uploadUrl": "https://s3-presigned-url...",
  "expiresIn": 900
}
```

---

### 4. Test Get Documents (History)

**Request:**
```bash
curl -X GET "https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/documents?page=1&pageSize=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "documents": [],
  "totalCount": 0,
  "page": 1,
  "pageSize": 20,
  "hasMore": false
}
```

---

### 5. Test Get Document by ID

**Request:**
```bash
curl -X GET "https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/documents/DOCUMENT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### 6. Test Get Metrics

**Request:**
```bash
curl -X GET "https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/metrics" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "totalDocuments": 0,
  "documentsByVertical": {},
  "averageProcessingTime": 0,
  "favoriteVertical": null,
  "timeSeriesData": []
}
```

---

### 7. Test Export Endpoint

**Request:**
```bash
curl -X POST "https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/export/DOCUMENT_ID?format=pdf" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "downloadUrl": "https://s3-presigned-url...",
  "expiresIn": 900,
  "format": "pdf"
}
```

---

## 📝 Complete Document Upload Flow Test

### Step 1: Get Presigned URL

```bash
# Get token
$TOKEN = aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --client-id 19j2lqlt7fc5e9ut0k5re692aj --auth-parameters USERNAME=admin@documentia.com,PASSWORD=Admin123!Pass --query 'AuthenticationResult.IdToken' --output text

# Request upload URL
curl -X POST https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/upload \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "sample.pdf",
    "fileType": "application/pdf",
    "fileSize": 50000,
    "vertical": "Healthcare"
  }'
```

### Step 2: Upload File to S3

Use the presigned URL from Step 1 to upload your file:

```bash
curl -X PUT "PRESIGNED_URL_FROM_STEP_1" \
  -H "Content-Type: application/pdf" \
  --data-binary @path/to/your/sample.pdf
```

### Step 3: Monitor Processing

The Step Functions workflow will automatically start processing the document. You can monitor it in the AWS Console:

1. Go to Step Functions console
2. Find the execution for your document
3. Watch the state transitions

### Step 4: Check Results

Once processing completes, retrieve the results:

```bash
curl -X GET "https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/documents/DOCUMENT_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔍 Monitoring and Debugging

### View Lambda Logs

```bash
# DocumentUploadHandler logs
aws logs tail /aws/lambda/DocumentUploadHandler-dev --follow

# BedrockProcessor logs
aws logs tail /aws/lambda/BedrockProcessor-dev --follow

# HistoryManager logs
aws logs tail /aws/lambda/HistoryManager-dev --follow

# MetricsAggregator logs
aws logs tail /aws/lambda/MetricsAggregator-dev --follow

# ExportHandler logs
aws logs tail /aws/lambda/ExportHandler-dev --follow
```

### View Step Functions Executions

```bash
aws stepfunctions list-executions \
  --state-machine-arn arn:aws:states:us-east-1:520754296204:stateMachine:DocumentProcessing-dev \
  --max-results 10
```

### Check DynamoDB Tables

```bash
# List documents
aws dynamodb scan --table-name DocumentAnalysis-Documents-dev --limit 10

# List results
aws dynamodb scan --table-name DocumentAnalysis-Results-dev --limit 10

# List metrics
aws dynamodb scan --table-name DocumentAnalysis-Metrics-dev --limit 10
```

### Check S3 Buckets

```bash
# List uploaded documents
aws s3 ls s3://document-analysis-documents-520754296204-dev/

# List results
aws s3 ls s3://document-analysis-results-520754296204-dev/
```

---

## 🧪 Testing with Postman

### Import Collection

Create a Postman collection with these requests:

1. **Get Token** - Store in environment variable
2. **Health Check** - Verify API is working
3. **Upload Document** - Get presigned URL
4. **List Documents** - View history
5. **Get Document** - View specific document
6. **Get Metrics** - View user metrics
7. **Export Document** - Generate export

### Environment Variables

Set these in Postman environment:

- `API_URL`: `https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev`
- `USER_POOL_ID`: `us-east-1_b5Vp65XQ3`
- `CLIENT_ID`: `19j2lqlt7fc5e9ut0k5re692aj`
- `USERNAME`: `admin@documentia.com`
- `PASSWORD`: `Admin123!Pass`
- `TOKEN`: (will be set by Get Token request)

---

## 🎯 Test Scenarios

### Scenario 1: Happy Path
1. ✅ Authenticate user
2. ✅ Upload a valid PDF document
3. ✅ Wait for processing to complete
4. ✅ View document in history
5. ✅ View analysis results
6. ✅ Check updated metrics
7. ✅ Export results in PDF format

### Scenario 2: File Validation
1. ✅ Try to upload file > 10MB (should fail)
2. ✅ Try to upload unsupported file type (should fail)
3. ✅ Try to upload PDF with > 100 pages (should fail)

### Scenario 3: Authentication
1. ✅ Try to access protected endpoint without token (should fail with 401)
2. ✅ Try to access with expired token (should fail with 401)
3. ✅ Try to access with invalid token (should fail with 401)

### Scenario 4: Multiple Verticals
1. ✅ Upload document with Healthcare vertical
2. ✅ Upload document with Education vertical
3. ✅ Upload document with Legal vertical
4. ✅ Verify metrics show distribution by vertical

### Scenario 5: Search and Filter
1. ✅ Upload multiple documents
2. ✅ Search by document name
3. ✅ Filter by vertical
4. ✅ Filter by date range
5. ✅ Test pagination

---

## 📊 Performance Testing

### Load Test with Apache Bench

```bash
# Test health endpoint
ab -n 1000 -c 10 https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/health

# Test authenticated endpoint (requires token)
ab -n 100 -c 5 -H "Authorization: Bearer YOUR_TOKEN" \
  https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/documents
```

### Expected Performance
- Health endpoint: < 100ms response time
- Upload endpoint: < 500ms response time
- Document processing: 5-30 seconds (depends on document size)
- History endpoint: < 1000ms response time
- Metrics endpoint: < 1000ms response time

---

## 🐛 Common Issues and Solutions

### Issue: 401 Unauthorized
**Solution:** Token expired or invalid. Get a new token using the authentication command.

### Issue: 403 Forbidden
**Solution:** User doesn't have permission. Verify user is authenticated and owns the resource.

### Issue: 500 Internal Server Error
**Solution:** Check Lambda logs for detailed error messages.

### Issue: Document stuck in "processing" status
**Solution:** Check Step Functions execution in AWS Console for errors.

### Issue: Presigned URL expired
**Solution:** URLs expire after 15 minutes. Request a new one.

---

## ✅ Verification Checklist

- [ ] Health endpoint returns 200 OK
- [ ] Can authenticate and get token
- [ ] Can request upload URL with valid token
- [ ] Can upload file to S3 using presigned URL
- [ ] Step Functions workflow starts automatically
- [ ] Document status updates to "processing"
- [ ] Bedrock processes document successfully
- [ ] Results stored in DynamoDB and S3
- [ ] Document status updates to "completed"
- [ ] Can retrieve document from history
- [ ] Can view analysis results
- [ ] Metrics update correctly
- [ ] Can export results in all formats
- [ ] All Lambda functions have logs in CloudWatch
- [ ] No errors in CloudWatch Logs

---

## 🚀 Next Steps

After verifying the backend works correctly:

1. **Frontend Development** (Tasks 21-30)
   - Set up React application
   - Implement authentication UI
   - Create document upload interface
   - Build dashboard and history pages
   - Add export functionality

2. **CI/CD Pipeline** (Task 31)
   - Set up GitHub Actions
   - Configure automated testing
   - Implement deployment automation

3. **Documentation** (Task 32)
   - Complete user guide
   - Finalize API documentation
   - Create troubleshooting guide

4. **Production Deployment** (Tasks 34-36)
   - Perform E2E testing
   - Load testing
   - Security testing
   - Deploy to production

---

## 📞 Support

For issues or questions:
- Check CloudWatch Logs for detailed error messages
- Review AWS Console for resource status
- Consult the DEPLOYMENT_SUCCESS.md for resource details
- Check QUICK_REFERENCE.md for common commands
