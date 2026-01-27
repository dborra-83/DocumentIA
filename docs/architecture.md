# Architecture Documentation

## Overview

The Document Analysis system is a serverless application built entirely on AWS. It uses Amazon Bedrock with Claude 3 Sonnet to analyze documents and provide intelligent insights based on industry-specific templates.

## High-Level Architecture

```
User → CloudFront → S3 (Frontend)
                 → API Gateway → Lambda Functions → Bedrock
                                                 → DynamoDB
                                                 → S3 (Documents/Results)
```

## Components

### Frontend Layer
- **Technology**: React 18+ with TypeScript
- **Hosting**: S3 static website
- **Distribution**: CloudFront CDN
- **Authentication**: Cognito User Pool

### API Layer
- **Service**: API Gateway REST API
- **Authorization**: Cognito User Pool Authorizer
- **Endpoints**: /upload, /documents, /metrics, /export

### Processing Layer
- **Compute**: AWS Lambda (Python 3.12)
- **Orchestration**: Step Functions
- **AI**: Amazon Bedrock (Claude 3 Sonnet)

### Data Layer
- **Structured Data**: DynamoDB tables
  - Documents table
  - AnalysisResults table
  - UserMetrics table
- **Unstructured Data**: S3 buckets
  - Documents bucket
  - Results bucket
  - Web hosting bucket

### Monitoring Layer
- **Logs**: CloudWatch Logs
- **Metrics**: CloudWatch Metrics
- **Alarms**: CloudWatch Alarms
- **Dashboard**: CloudWatch Dashboard

## Data Flow

### Document Upload Flow
1. User selects file and vertical in frontend
2. Frontend requests presigned URL from API
3. DocumentUploadHandler Lambda generates URL and creates DynamoDB record
4. Frontend uploads file directly to S3 using presigned URL
5. S3 event triggers Step Functions workflow

### Document Processing Flow
1. Step Functions invokes BedrockProcessor Lambda
2. Lambda downloads document from S3
3. Lambda extracts text based on file type
4. Lambda constructs prompt with vertical template
5. Lambda invokes Bedrock API
6. Lambda parses response and stores results in DynamoDB and S3
7. Lambda updates document status to 'completed'

### Results Retrieval Flow
1. User navigates to history or dashboard
2. Frontend requests data from API
3. HistoryManager or MetricsAggregator Lambda queries DynamoDB
4. Lambda returns paginated results
5. Frontend displays results

## Security

### Authentication & Authorization
- Cognito User Pool for user management
- JWT tokens for API authentication
- IAM roles with least privilege for Lambda functions

### Data Protection
- All data encrypted at rest (S3, DynamoDB)
- All communications use HTTPS with TLS 1.2+
- Presigned URLs with short expiration (15 minutes)

### Input Validation
- Client-side validation in frontend
- Server-side validation in Lambda functions
- Input sanitization to prevent injection attacks

## Scalability

### Auto-Scaling Components
- Lambda functions scale automatically
- DynamoDB uses on-demand billing
- CloudFront scales globally
- API Gateway scales automatically

### Performance Optimization
- CloudFront caching for static assets
- DynamoDB GSI for efficient queries
- Lambda function memory optimization
- Bedrock prompt optimization

## Cost Optimization

- S3 lifecycle policies for old documents
- DynamoDB on-demand billing
- Lambda memory right-sizing
- CloudFront caching reduces API calls

## Disaster Recovery

- Multi-AZ deployment for all services
- S3 versioning for critical data
- DynamoDB point-in-time recovery
- CloudFormation for infrastructure recreation

## Monitoring & Observability

- CloudWatch Logs for all Lambda executions
- Custom metrics for processing time and Bedrock latency
- Alarms for error rates and resource limits
- Dashboard for unified system view

## Future Enhancements

- Multi-region deployment
- Real-time notifications via SNS
- Advanced analytics with QuickSight
- Batch processing for multiple documents
- Custom model fine-tuning
