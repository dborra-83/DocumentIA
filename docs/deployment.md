# Deployment Guide

This guide covers deploying the Document Analysis system to AWS.

## Prerequisites

1. **AWS Account**: Active AWS account with appropriate permissions
2. **AWS CLI**: Installed and configured with credentials
3. **Node.js**: Version 18 or higher
4. **Python**: Version 3.12 or higher
5. **AWS CDK**: Installed globally (`npm install -g aws-cdk`)
6. **Git**: For version control

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/dborra-83/DocumentIA.git
cd DocumentIA
```

### 2. Configure AWS Credentials

```bash
aws configure
```

Enter your AWS Access Key ID, Secret Access Key, and default region.

### 3. Install Dependencies

```bash
# Infrastructure dependencies
cd infrastructure
npm install

# Backend dependencies
cd ../backend
pip install -r requirements.txt

# Frontend dependencies
cd ../frontend
npm install
```

## Environment Configuration

### 1. Update CDK Context

Edit `infrastructure/cdk.json` and update the environment configurations:

```json
{
  "context": {
    "environments": {
      "dev": {
        "account": "123456789012",
        "region": "us-east-1"
      },
      "staging": {
        "account": "123456789012",
        "region": "us-east-1"
      },
      "prod": {
        "account": "123456789012",
        "region": "us-east-1"
      }
    }
  }
}
```

Replace `123456789012` with your AWS account ID, or leave empty to use the default account from AWS CLI.

### 2. Bootstrap CDK (First Time Only)

```bash
cd infrastructure
cdk bootstrap aws://ACCOUNT-ID/REGION
```

This creates the necessary S3 bucket and IAM roles for CDK deployments.

## Deployment

### Deploy to Development Environment

```bash
cd infrastructure
cdk deploy --all --context environment=dev
```

This will:
1. Synthesize CloudFormation templates
2. Show a preview of changes
3. Ask for confirmation
4. Deploy all stacks

### Deploy to Staging Environment

```bash
cd infrastructure
cdk deploy --all --context environment=staging
```

### Deploy to Production Environment

```bash
cd infrastructure
cdk deploy --all --context environment=prod --require-approval broadening
```

The `--require-approval broadening` flag requires manual approval for security-sensitive changes.

## Post-Deployment Steps

### 1. Note the Outputs

After deployment, CDK will output important values:
- Stack name
- API Gateway endpoint
- Cognito User Pool ID
- Cognito Client ID
- CloudFront distribution domain
- S3 bucket names

Save these values for frontend configuration.

### 2. Configure Frontend

Create `frontend/.env`:

```env
VITE_API_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_COGNITO_REGION=us-east-1
VITE_CLOUDFRONT_DOMAIN=d1234567890abc.cloudfront.net
```

### 3. Build and Deploy Frontend

```bash
cd frontend
npm run build

# Deploy to S3 (replace with your bucket name from CDK outputs)
aws s3 sync dist/ s3://document-analysis-web-ACCOUNT-ID-dev/
```

### 4. Invalidate CloudFront Cache

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR-DISTRIBUTION-ID \
  --paths "/*"
```

## Verification

### 1. Test API Endpoints

```bash
# Health check
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/health
```

### 2. Test Frontend

Open the CloudFront URL in a browser and verify:
- Login page loads
- Registration works
- Authentication flow works

### 3. Test Document Processing

1. Register a new user
2. Upload a test document
3. Verify processing completes
4. Check results display correctly

## Monitoring

### CloudWatch Dashboard

Access the CloudWatch dashboard:
1. Go to AWS Console → CloudWatch
2. Select "Dashboards"
3. Open "DocumentAnalysisDashboard-{environment}"

### CloudWatch Logs

View Lambda function logs:
1. Go to AWS Console → CloudWatch
2. Select "Log groups"
3. Find logs for each Lambda function

### CloudWatch Alarms

Check alarm status:
1. Go to AWS Console → CloudWatch
2. Select "Alarms"
3. Review any triggered alarms

## Rollback

If deployment fails or issues arise:

```bash
# Rollback to previous version
cdk deploy --all --context environment=dev --rollback

# Or destroy and redeploy
cdk destroy --all --context environment=dev
cdk deploy --all --context environment=dev
```

## Updating the Stack

### 1. Make Changes

Edit CDK code in `infrastructure/lib/`

### 2. Test Locally

```bash
cd infrastructure
npm run build
npm test
```

### 3. Preview Changes

```bash
cdk diff --context environment=dev
```

### 4. Deploy Changes

```bash
cdk deploy --all --context environment=dev
```

## Troubleshooting

### CDK Bootstrap Issues

If bootstrap fails:
```bash
cdk bootstrap --force
```

### Permission Errors

Ensure your IAM user/role has:
- CloudFormation full access
- S3 full access
- Lambda full access
- DynamoDB full access
- API Gateway full access
- Cognito full access
- IAM role creation permissions

### Stack Deletion Issues

If stack deletion fails:
1. Empty S3 buckets manually
2. Delete DynamoDB tables manually
3. Retry deletion

### Lambda Deployment Issues

If Lambda functions fail to deploy:
1. Check function code for syntax errors
2. Verify dependencies are included
3. Check Lambda execution role permissions

## Cost Estimation

Estimated monthly costs for typical usage:

**Development Environment**:
- Lambda: $5-10
- DynamoDB: $5-10
- S3: $1-5
- Bedrock: $10-50 (depends on usage)
- API Gateway: $1-5
- CloudFront: $1-5
- **Total**: ~$25-85/month

**Production Environment**:
- Scales with usage
- Set up billing alarms to monitor costs

## Security Best Practices

1. **Use separate AWS accounts** for dev, staging, and prod
2. **Enable MFA** for Cognito users
3. **Rotate credentials** regularly
4. **Enable CloudTrail** for audit logging
5. **Review IAM policies** for least privilege
6. **Enable S3 bucket versioning** for critical data
7. **Use AWS Secrets Manager** for sensitive configuration

## Backup and Recovery

### Automated Backups

- DynamoDB: Point-in-time recovery enabled
- S3: Versioning enabled for critical buckets

### Manual Backups

```bash
# Export DynamoDB table
aws dynamodb export-table-to-point-in-time \
  --table-arn arn:aws:dynamodb:REGION:ACCOUNT:table/TABLE-NAME \
  --s3-bucket backup-bucket \
  --s3-prefix dynamodb-backups/

# Sync S3 buckets
aws s3 sync s3://source-bucket s3://backup-bucket
```

## Support

For deployment issues:
- Check CloudFormation events in AWS Console
- Review CloudWatch logs
- Contact AWS Support if needed
- Open GitHub issue for code-related problems
