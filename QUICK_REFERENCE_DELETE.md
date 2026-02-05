# Quick Reference - Document Delete Feature

## How to Delete Documents

### From the UI
1. Go to http://localhost:3000/history
2. Find the document you want to delete
3. Click the red **"Eliminar"** (or **"Delete"**) button
4. Confirm the deletion in the dialog
5. The document will be removed from the list

### What Gets Deleted
When you delete a document, the system removes:
- ✅ Document record from DynamoDB Documents table
- ✅ Analysis results from DynamoDB Results table
- ✅ Original file from S3 documents bucket
- ✅ Analysis JSON from S3 results bucket

### Security
- You can only delete your own documents
- Requires authentication (Cognito)
- Ownership is verified before deletion

## Troubleshooting Pending Documents

### Check for Stuck Documents
```powershell
.\check-pending-documents.ps1
```

This will show:
- Count of documents by status
- List of pending documents with time elapsed
- S3 file verification

### Reprocess a Stuck Document
```powershell
.\reprocess-document.ps1 -DocumentId <document-id>
```

This will:
- Manually invoke the Bedrock processor Lambda
- Retry the analysis
- Update the document status

## API Endpoint

### Delete Document
```bash
DELETE https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/documents/{documentId}
```

**Headers**:
- `Authorization: Bearer <cognito-token>`

**Response** (Success):
```json
{
  "message": "Document deleted successfully",
  "documentId": "uuid"
}
```

**Response** (Error):
```json
{
  "error": "Error message"
}
```

## AWS Resources

### Lambda Function
- **Name**: `DocumentDelete-dev`
- **Runtime**: Python 3.12
- **Timeout**: 30 seconds
- **Memory**: 256 MB

### IAM Role
- **Name**: `DocumentAnalysis-DocumentDeleteRole-dev`
- **Permissions**:
  - DynamoDB: GetItem, DeleteItem
  - S3: DeleteObject, ListBucket
  - CloudWatch Logs: CreateLogGroup, CreateLogStream, PutLogEvents

### API Gateway
- **Method**: DELETE
- **Path**: `/documents/{documentId}`
- **Authorizer**: Cognito User Pool
- **Integration**: Lambda Proxy

## Deployment

### Deploy/Update Lambda
```powershell
.\deploy-document-delete.ps1
```

This script:
1. Creates deployment package (ZIP)
2. Creates or updates Lambda function
3. Configures API Gateway endpoint
4. Sets up permissions
5. Deploys API to dev stage

## Testing

### Test from Browser
1. Open http://localhost:3000/history
2. Open browser DevTools (F12)
3. Go to Console tab
4. Delete a document
5. Check console for success message

### Test with curl
```bash
# Get your token from browser localStorage
# Then run:
curl -X DELETE \
  https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/documents/{documentId} \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Verify in AWS Console

**DynamoDB**:
1. Go to DynamoDB console
2. Check `DocumentAnalysis-Documents-dev` table
3. Check `DocumentAnalysis-Results-dev` table
4. Verify document is deleted

**S3**:
1. Go to S3 console
2. Check `document-analysis-documents-520754296204-dev` bucket
3. Check `document-analysis-results-520754296204-dev` bucket
4. Verify files are deleted

## Common Issues

### "Document not found"
- Document may have already been deleted
- Check DynamoDB to verify

### "Unauthorized"
- Token may be expired
- Log out and log back in
- Check Cognito authentication

### "Error deleting document"
- Check Lambda logs in CloudWatch
- Verify IAM permissions
- Check S3 bucket permissions

## Files

### Backend
- `backend/document-delete/handler.py` - Lambda function code
- `backend/document-delete/requirements.txt` - Dependencies (empty)

### Frontend
- `frontend/src/pages/HistoryPage.tsx` - UI with delete button

### Scripts
- `deploy-document-delete.ps1` - Deployment script
- `check-pending-documents.ps1` - Diagnostic tool
- `reprocess-document.ps1` - Reprocessing tool

### Documentation
- `DELETE_FUNCTIONALITY_COMPLETE.md` - Complete documentation
- `QUICK_REFERENCE_DELETE.md` - This file
