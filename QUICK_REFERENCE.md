# Quick Reference - Document Analysis System

## 🔑 Essential Information

### API Endpoint
```
https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/
```

### Cognito Authentication
- **User Pool ID:** `us-east-1_b5Vp65XQ3`
- **Client ID:** `19j2lqlt7fc5e9ut0k5re692aj`
- **Region:** `us-east-1`

### S3 Buckets
- **Documents:** `document-analysis-documents-520754296204-dev`
- **Results:** `document-analysis-results-520754296204-dev`
- **Web:** `document-analysis-web-520754296204-dev`

### DynamoDB Tables
- **Documents:** `DocumentAnalysis-Documents-dev`
- **Results:** `DocumentAnalysis-Results-dev`
- **Metrics:** `DocumentAnalysis-Metrics-dev`

---

## 🧪 Quick Test Commands

### Test Health Endpoint
```bash
curl https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev/health
```

### Create Test User
```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_b5Vp65XQ3 \
  --username test@example.com \
  --user-attributes Name=email,Value=test@example.com Name=email_verified,Value=true \
  --temporary-password "TempPass123!" \
  --message-action SUPPRESS
```

### Set Permanent Password
```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_b5Vp65XQ3 \
  --username test@example.com \
  --password "YourPassword123!" \
  --permanent
```

### View Lambda Logs
```bash
aws logs tail /aws/lambda/DocumentUploadHandler-dev --follow
```

### List Step Functions Executions
```bash
aws stepfunctions list-executions \
  --state-machine-arn arn:aws:states:us-east-1:520754296204:stateMachine:DocumentProcessing-dev \
  --max-results 10
```

---

## 📱 Frontend Configuration

Update your frontend `.env` file:

```env
REACT_APP_API_URL=https://jo17j8ghzf.execute-api.us-east-1.amazonaws.com/dev
REACT_APP_USER_POOL_ID=us-east-1_b5Vp65XQ3
REACT_APP_USER_POOL_CLIENT_ID=19j2lqlt7fc5e9ut0k5re692aj
REACT_APP_REGION=us-east-1
```

---

## 🔄 Management Commands

### Redeploy Stack
```bash
cd infrastructure
cdk deploy --all --context environment=dev
```

### View Stack Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name DocumentAnalysis-dev \
  --query "Stacks[0].Outputs"
```

### Destroy Stack
```bash
cd infrastructure
cdk destroy --all --context environment=dev
```

---

## 📊 Monitoring URLs

### AWS Console Links
- **CloudFormation:** https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks
- **API Gateway:** https://console.aws.amazon.com/apigateway/home?region=us-east-1
- **Lambda:** https://console.aws.amazon.com/lambda/home?region=us-east-1
- **DynamoDB:** https://console.aws.amazon.com/dynamodb/home?region=us-east-1
- **S3:** https://console.aws.amazon.com/s3/home?region=us-east-1
- **Cognito:** https://console.aws.amazon.com/cognito/home?region=us-east-1
- **Step Functions:** https://console.aws.amazon.com/states/home?region=us-east-1
- **CloudWatch Logs:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups

---

## 🎯 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| POST | `/upload` | Yes | Upload document |
| GET | `/documents` | Yes | List documents |
| GET | `/documents/{id}` | Yes | Get document |
| GET | `/metrics` | Yes | Get metrics |
| POST | `/export/{id}` | Yes | Export results |

---

## 💡 Tips

1. **First Time Setup:** Create a test user and set a permanent password
2. **Testing:** Use the health endpoint to verify API is working
3. **Debugging:** Check CloudWatch Logs for Lambda function errors
4. **Monitoring:** Use Step Functions console to track document processing
5. **Costs:** Monitor AWS Cost Explorer to track spending

---

## 📞 Support Resources

- **CDK Documentation:** https://docs.aws.amazon.com/cdk/
- **Bedrock Documentation:** https://docs.aws.amazon.com/bedrock/
- **API Gateway Documentation:** https://docs.aws.amazon.com/apigateway/
- **Cognito Documentation:** https://docs.aws.amazon.com/cognito/
