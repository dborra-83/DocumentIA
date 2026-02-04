import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DocumentAnalysisStack } from '../lib/document-analysis-stack';

describe('DocumentAnalysisStack', () => {
  test('Stack creates successfully', () => {
    const app = new cdk.App();
    
    // WHEN
    const stack = new DocumentAnalysisStack(app, 'TestStack', {
      environment: 'test',
    });
    
    // THEN
    const template = Template.fromStack(stack);
    
    // Verify stack exists
    expect(template).toBeDefined();
  });

  test('Stack has correct tags', () => {
    const app = new cdk.App();
    
    // WHEN
    const stack = new DocumentAnalysisStack(app, 'TestStack', {
      environment: 'test',
    });
    
    // THEN
    const template = Template.fromStack(stack);
    
    // Verify tags are applied (tags are applied at stack level)
    expect(stack.tags.tagValues()).toEqual(
      expect.objectContaining({
        Project: 'DocumentAnalysis',
        Environment: 'test',
        ManagedBy: 'CDK',
      })
    );
  });

  test('Stack has required outputs', () => {
    const app = new cdk.App();
    
    // WHEN
    const stack = new DocumentAnalysisStack(app, 'TestStack', {
      environment: 'test',
    });
    
    // THEN
    const template = Template.fromStack(stack);
    
    // Verify outputs exist
    template.hasOutput('StackName', {});
    template.hasOutput('Environment', {});
    template.hasOutput('Region', {});
  });

  describe('S3 Buckets', () => {
    let template: Template;

    beforeEach(() => {
      const app = new cdk.App();
      const stack = new DocumentAnalysisStack(app, 'TestStack', {
        environment: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('Creates documents bucket with encryption', () => {
      // Verify documents bucket exists with AES-256 encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        BucketName: 'document-analysis-documents-123456789012-test',
      });
    });

    test('Documents bucket has lifecycle policy', () => {
      // Verify lifecycle rule for 90-day deletion
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'document-analysis-documents-123456789012-test',
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldDocuments',
              Status: 'Enabled',
              ExpirationInDays: 90,
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 7,
              },
            },
          ],
        },
      });
    });

    test('Documents bucket has CORS configuration', () => {
      // Verify CORS for direct uploads
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'document-analysis-documents-123456789012-test',
        CorsConfiguration: {
          CorsRules: [
            {
              AllowedMethods: ['GET', 'PUT', 'POST'],
              AllowedOrigins: ['*'],
              AllowedHeaders: ['*'],
              ExposedHeaders: ['ETag'],
              MaxAge: 3600,
            },
          ],
        },
      });
    });

    test('Creates results bucket with encryption', () => {
      // Verify results bucket exists with AES-256 encryption
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        BucketName: 'document-analysis-results-123456789012-test',
      });
    });

    test('Results bucket has lifecycle policy', () => {
      // Verify lifecycle rule for 365-day deletion
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'document-analysis-results-123456789012-test',
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'DeleteOldResults',
              Status: 'Enabled',
              ExpirationInDays: 365,
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 7,
              },
            },
          ],
        },
      });
    });

    test('Creates web hosting bucket with static website configuration', () => {
      // Verify web hosting bucket with website configuration
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        BucketName: 'document-analysis-web-123456789012-test',
        WebsiteConfiguration: {
          IndexDocument: 'index.html',
          ErrorDocument: 'index.html',
        },
      });
    });

    test('All buckets block public access', () => {
      // Verify all buckets have public access blocked
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketCount = Object.keys(buckets).length;
      
      // Should have 3 buckets
      expect(bucketCount).toBeGreaterThanOrEqual(3);
      
      // Each bucket should block public access
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        });
      });
    });

    test('Stack has S3 bucket outputs', () => {
      // Verify S3 bucket outputs exist
      template.hasOutput('S3BucketsDocumentsBucketName2A339EB5', {});
      template.hasOutput('S3BucketsDocumentsBucketArn4D1FA0B0', {});
      template.hasOutput('S3BucketsResultsBucketName8F715869', {});
      template.hasOutput('S3BucketsResultsBucketArn130247DA', {});
      template.hasOutput('S3BucketsWebHostingBucketNameB3B7D561', {});
      template.hasOutput('S3BucketsWebHostingBucketArnDE287D88', {});
      template.hasOutput('S3BucketsWebHostingBucketWebsiteUrl1661BB31', {});
    });
  });

  describe('DynamoDB Tables', () => {
    let template: Template;

    beforeEach(() => {
      const app = new cdk.App();
      const stack = new DocumentAnalysisStack(app, 'TestStack', {
        environment: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('Creates Documents table with correct configuration', () => {
      // Verify Documents table exists with correct keys and encryption
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'DocumentAnalysis-Documents-test',
        KeySchema: [
          {
            AttributeName: 'documentId',
            KeyType: 'HASH',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        SSESpecification: {
          SSEEnabled: true,
        },
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
      });
    });

    test('Documents table has UserIdIndex GSI', () => {
      // Verify GSI on userId with uploadedAt sort key
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'DocumentAnalysis-Documents-test',
        GlobalSecondaryIndexes: [
          {
            IndexName: 'UserIdIndex',
            KeySchema: [
              {
                AttributeName: 'userId',
                KeyType: 'HASH',
              },
              {
                AttributeName: 'uploadedAt',
                KeyType: 'RANGE',
              },
            ],
            Projection: {
              ProjectionType: 'ALL',
            },
          },
        ],
      });
    });

    test('Creates AnalysisResults table with correct configuration', () => {
      // Verify AnalysisResults table exists with correct keys and encryption
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'DocumentAnalysis-Results-test',
        KeySchema: [
          {
            AttributeName: 'documentId',
            KeyType: 'HASH',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        SSESpecification: {
          SSEEnabled: true,
        },
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('Creates UserMetrics table with composite key', () => {
      // Verify UserMetrics table exists with composite key (userId + metricDate)
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'DocumentAnalysis-Metrics-test',
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'metricDate',
            KeyType: 'RANGE',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        SSESpecification: {
          SSEEnabled: true,
        },
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('All tables have encryption at rest enabled', () => {
      // Verify all DynamoDB tables have encryption enabled
      const tables = template.findResources('AWS::DynamoDB::Table');
      const tableCount = Object.keys(tables).length;
      
      // Should have 3 tables
      expect(tableCount).toBe(3);
      
      // Each table should have encryption enabled
      Object.values(tables).forEach((table: any) => {
        expect(table.Properties.SSESpecification).toEqual({
          SSEEnabled: true,
        });
      });
    });

    test('All tables use on-demand billing', () => {
      // Verify all DynamoDB tables use PAY_PER_REQUEST billing
      const tables = template.findResources('AWS::DynamoDB::Table');
      
      // Each table should use on-demand billing
      Object.values(tables).forEach((table: any) => {
        expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      });
    });

    test('All tables have DynamoDB Streams enabled', () => {
      // Verify all DynamoDB tables have streams enabled
      const tables = template.findResources('AWS::DynamoDB::Table');
      
      // Each table should have streams enabled
      Object.values(tables).forEach((table: any) => {
        expect(table.Properties.StreamSpecification).toEqual({
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        });
      });
    });

    test('Stack has DynamoDB table outputs', () => {
      // Verify DynamoDB table outputs exist
      template.hasOutput('DynamoDBTablesDocumentsTableName67DC2E5F', {});
      template.hasOutput('DynamoDBTablesDocumentsTableArn7442EE3F', {});
      template.hasOutput('DynamoDBTablesAnalysisResultsTableName75337725', {});
      template.hasOutput('DynamoDBTablesAnalysisResultsTableArnE3F9BDD8', {});
      template.hasOutput('DynamoDBTablesUserMetricsTableName1403850E', {});
      template.hasOutput('DynamoDBTablesUserMetricsTableArn908691DD', {});
    });
  });

  describe('Cognito User Pool', () => {
    let template: Template;

    beforeEach(() => {
      const app = new cdk.App();
      const stack = new DocumentAnalysisStack(app, 'TestStack', {
        environment: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('Creates User Pool with email sign-in', () => {
      // Verify User Pool exists with email sign-in configuration
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UserPoolName: 'DocumentAnalysisUserPool-test',
        UsernameAttributes: ['email'],
        AutoVerifiedAttributes: ['email'],
      });
    });

    test('User Pool has correct password policy', () => {
      // Verify password policy meets requirements (Requirement 9.10)
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Policies: {
          PasswordPolicy: {
            MinimumLength: 8,
            RequireLowercase: true,
            RequireUppercase: true,
            RequireNumbers: true,
            RequireSymbols: true,
            TemporaryPasswordValidityDays: 7,
          },
        },
      });
    });

    test('User Pool has optional MFA with TOTP', () => {
      // Verify MFA configuration
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        MfaConfiguration: 'OPTIONAL',
        EnabledMfas: ['SOFTWARE_TOKEN_MFA'],
      });
    });

    test('User Pool has email recovery', () => {
      // Verify account recovery via email
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AccountRecoverySetting: {
          RecoveryMechanisms: [
            {
              Name: 'verified_email',
              Priority: 1,
            },
          ],
        },
      });
    });

    test('User Pool has custom attributes', () => {
      // Verify custom organization attribute exists in schema
      const userPools = template.findResources('AWS::Cognito::UserPool');
      const userPool = Object.values(userPools)[0] as any;
      const schema = userPool.Properties.Schema;
      
      // Find the custom organization attribute
      const orgAttribute = schema.find((attr: any) => attr.Name === 'organization');
      expect(orgAttribute).toBeDefined();
      expect(orgAttribute.AttributeDataType).toBe('String');
      expect(orgAttribute.Mutable).toBe(true);
      expect(orgAttribute.StringAttributeConstraints).toEqual({
        MaxLength: '256',
        MinLength: '1',
      });
    });

    test('Creates User Pool Client with correct auth flows', () => {
      // Verify User Pool Client exists with correct auth flows
      const clients = template.findResources('AWS::Cognito::UserPoolClient');
      const client = Object.values(clients)[0] as any;
      
      expect(client.Properties.ClientName).toBe('DocumentAnalysisWebClient-test');
      expect(client.Properties.ExplicitAuthFlows).toEqual(
        expect.arrayContaining([
          'ALLOW_USER_PASSWORD_AUTH',
          'ALLOW_USER_SRP_AUTH',
          'ALLOW_REFRESH_TOKEN_AUTH',
        ])
      );
    });

    test('User Pool Client has correct token expiration', () => {
      // Verify token expiration (Requirement 1.4)
      // ID token: 1 hour (60 minutes)
      // Access token: 1 hour (60 minutes)
      // Refresh token: 30 days (43200 minutes)
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        IdTokenValidity: 60,
        AccessTokenValidity: 60,
        RefreshTokenValidity: 43200,
        TokenValidityUnits: {
          IdToken: 'minutes',
          AccessToken: 'minutes',
          RefreshToken: 'minutes',
        },
      });
    });

    test('User Pool Client has token revocation enabled', () => {
      // Verify token revocation is enabled
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        EnableTokenRevocation: true,
      });
    });

    test('User Pool Client prevents user existence errors', () => {
      // Verify security best practice
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        PreventUserExistenceErrors: 'ENABLED',
      });
    });

    test('User Pool Client has OAuth configuration', () => {
      // Verify OAuth 2.0 configuration
      const clients = template.findResources('AWS::Cognito::UserPoolClient');
      const client = Object.values(clients)[0] as any;
      
      expect(client.Properties.AllowedOAuthFlows).toEqual(['code']);
      expect(client.Properties.AllowedOAuthFlowsUserPoolClient).toBe(true);
      expect(client.Properties.AllowedOAuthScopes).toEqual(
        expect.arrayContaining(['email', 'openid', 'profile'])
      );
      expect(client.Properties.CallbackURLs).toEqual(
        expect.arrayContaining([
          'http://localhost:3000/callback',
          'http://localhost:5173/callback',
        ])
      );
      expect(client.Properties.LogoutURLs).toEqual(
        expect.arrayContaining([
          'http://localhost:3000/logout',
          'http://localhost:5173/logout',
        ])
      );
    });

    test('User Pool Client has correct read/write attributes', () => {
      // Verify attribute permissions
      const clients = template.findResources('AWS::Cognito::UserPoolClient');
      const client = Object.values(clients)[0] as any;
      
      expect(client.Properties.ReadAttributes).toEqual(
        expect.arrayContaining([
          'email',
          'email_verified',
          'given_name',
          'family_name',
          'custom:organization',
        ])
      );
      expect(client.Properties.WriteAttributes).toEqual(
        expect.arrayContaining([
          'email',
          'given_name',
          'family_name',
          'custom:organization',
        ])
      );
    });

    test('Stack has Cognito outputs', () => {
      // Verify Cognito outputs exist
      template.hasOutput('CognitoUserPoolUserPoolId3314EEBA', {});
      template.hasOutput('CognitoUserPoolUserPoolArnF17793FF', {});
      template.hasOutput('CognitoUserPoolUserPoolClientId5E4FF581', {});
      template.hasOutput('CognitoUserPoolUserPoolProviderUrlA1B5C92F', {});
    });
  });
});

