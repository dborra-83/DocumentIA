# DocumentIA - Document Analysis with Amazon Bedrock

A serverless document analysis system built on AWS that uses Amazon Bedrock with Claude 3 Sonnet to process documents and generate intelligent analysis based on industry-specific templates.

## Overview

This system enables authenticated users to:
- Upload documents (PDF, DOCX, TXT) up to 10MB
- Select from 8 industry verticals (Healthcare, Education, Retail, Legal, Finance, Manufacturing, HR, Technology)
- Receive AI-powered analysis with executive summaries, key points, and next steps
- View usage metrics and document history
- Export results in multiple formats (PDF, JSON, Excel, Word)

## Architecture

The system is built entirely on AWS serverless services:
- **Frontend**: React 18+ with TypeScript, hosted on S3 and distributed via CloudFront
- **API**: API Gateway REST API with Cognito authentication
- **Processing**: Lambda functions (Python 3.12 and Node.js 20.x)
- **AI**: Amazon Bedrock with Claude 3 Sonnet model
- **Storage**: S3 for documents and results, DynamoDB for structured data
- **Orchestration**: Step Functions for document processing workflow
- **Monitoring**: CloudWatch for logs, metrics, and alarms

## Project Structure

```
DocumentIA/
├── infrastructure/          # AWS CDK infrastructure code (TypeScript)
│   ├── bin/                # CDK app entry point
│   ├── lib/                # CDK stack definitions
│   └── test/               # Infrastructure tests
├── backend/                # Lambda function code
│   ├── document-upload/    # DocumentUploadHandler (Python)
│   ├── bedrock-processor/  # BedrockProcessor (Python)
│   ├── history-manager/    # HistoryManager (Python)
│   ├── metrics-aggregator/ # MetricsAggregator (Python)
│   ├── export-handler/     # ExportHandler (Python)
│   └── shared/             # Shared utilities and libraries
├── frontend/               # React application (TypeScript)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── tests/                  # Integration and E2E tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
└── docs/                   # Documentation
```

## Prerequisites

- Node.js 18+ and npm
- Python 3.12+
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (`npm install -g aws-cdk`)
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/dborra-83/DocumentIA.git
cd DocumentIA
```

### 2. Install dependencies

```bash
# Install CDK dependencies
cd infrastructure
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure environment

Create a `.env` file in the `infrastructure` directory:

```bash
AWS_ACCOUNT_ID=your-account-id
AWS_REGION=us-east-1
ENVIRONMENT=dev
```

### 4. Deploy infrastructure

```bash
cd infrastructure
cdk bootstrap  # First time only
cdk deploy --all
```

### 5. Deploy frontend

```bash
cd frontend
npm run build
aws s3 sync build/ s3://your-web-bucket-name/
```

## Development

### Local development

```bash
# Run frontend locally
cd frontend
npm start

# Run backend tests
cd backend
pytest

# Run infrastructure tests
cd infrastructure
npm test
```

### Testing

The project uses a dual testing approach:
- **Unit tests**: Verify specific examples and edge cases
- **Property-based tests**: Verify universal properties across all inputs

```bash
# Run all backend tests
cd backend
pytest -v

# Run all frontend tests
cd frontend
npm test

# Run integration tests
cd tests
pytest integration/
```

## Deployment

### Environments

The system supports three environments:
- **dev**: Development environment for testing
- **staging**: Pre-production environment
- **prod**: Production environment

### Deploy to specific environment

```bash
cd infrastructure
cdk deploy --all --context environment=prod
```

## Monitoring

- **CloudWatch Logs**: All Lambda function logs
- **CloudWatch Metrics**: Custom metrics for processing time, Bedrock latency
- **CloudWatch Alarms**: Alerts for error rates, API errors, storage limits
- **CloudWatch Dashboard**: Unified view of system health

Access the dashboard at: AWS Console → CloudWatch → Dashboards → DocumentAnalysisDashboard

## Cost Optimization

- S3 lifecycle policies delete old documents after 90 days
- DynamoDB uses on-demand billing for variable workloads
- Lambda functions optimized for memory allocation
- CloudFront caching reduces API Gateway costs

## Security

- All data encrypted at rest (S3, DynamoDB)
- All communications use HTTPS with TLS 1.2+
- Cognito handles authentication with JWT tokens
- IAM roles follow least privilege principle
- Input sanitization prevents injection attacks

## Documentation

- [Architecture Design](docs/architecture.md)
- [API Documentation](docs/api.md)
- [User Guide](docs/user-guide.md)
- [Developer Guide](docs/developer-guide.md)
- [Deployment Guide](docs/deployment.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- GitHub Issues: https://github.com/dborra-83/DocumentIA/issues
- Email: support@documentia.com

## Acknowledgments

- Amazon Bedrock and Claude 3 Sonnet for AI capabilities
- AWS CDK for infrastructure as code
- React community for frontend framework
