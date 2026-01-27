# Integration and E2E Tests

This directory contains integration and end-to-end tests for the Document Analysis system.

## Structure

```
tests/
├── integration/       # Integration tests for AWS services
└── e2e/              # End-to-end tests with Playwright/Cypress
```

## Integration Tests

Integration tests verify interactions between components and AWS services:
- Lambda function integration with S3, DynamoDB, Bedrock
- API Gateway integration with Lambda functions
- Step Functions workflow execution
- Cognito authentication flow

### Running Integration Tests

```bash
cd tests
pytest integration/ -v
```

**Note**: Integration tests require AWS credentials and may incur costs.

## End-to-End Tests

E2E tests verify complete user workflows:
- User registration and login
- Document upload and analysis
- Dashboard and metrics display
- Document history and search
- Export functionality

### Running E2E Tests

```bash
cd tests/e2e
npm test
```

## Test Environments

- **Local**: Use LocalStack for AWS service emulation
- **Dev**: Run against development environment
- **Staging**: Run against staging environment before production deployment

## Configuration

Create a `.env` file in the tests directory:

```env
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your-account-id
ENVIRONMENT=dev
API_ENDPOINT=https://your-api-gateway-url
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
```

## Best Practices

1. Clean up test resources after each test
2. Use unique identifiers for test data
3. Mock external dependencies when possible
4. Run integration tests in isolated environments
5. Use test fixtures for common setup

## CI/CD Integration

Integration and E2E tests are run in the CI/CD pipeline:
- Integration tests run on every pull request
- E2E tests run before production deployment
- Failed tests block deployment
