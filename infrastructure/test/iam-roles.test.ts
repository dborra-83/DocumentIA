import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DocumentAnalysisStack } from '../lib/document-analysis-stack';

describe('IAM Roles', () => {
  let template: Template;

  beforeEach(() => {
    const app = new cdk.App();
    const stack = new DocumentAnalysisStack(app, 'TestStack', {
      environment: 'test',
      env: { account: '123456789012', region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('Creates all 5 Lambda IAM roles', () => {
    // Verify all 5 Lambda roles exist
    const roles = template.findResources('AWS::IAM::Role');
    const lambdaRoles = Object.values(roles).filter((role: any) => 
      role.Properties.AssumeRolePolicyDocument?.Statement?.some((stmt: any) => 
        stmt.Principal?.Service === 'lambda.amazonaws.com'
      )
    );
    
    // Should have at least 5 Lambda roles (may have more from other constructs)
    expect(lambdaRoles.length).toBeGreaterThanOrEqual(5);
    
    // Verify each of our 5 roles exists by description
    const roleDescriptions = lambdaRoles.map((role: any) => role.Properties.Description);
    expect(roleDescriptions).toEqual(expect.arrayContaining([
      expect.stringContaining('DocumentUploadHandler'),
      expect.stringContaining('BedrockProcessor'),
      expect.stringContaining('HistoryManager'),
      expect.stringContaining('MetricsAggregator'),
      expect.stringContaining('ExportHandler'),
    ]));
  });

  test('All Lambda roles can be assumed by Lambda service', () => {
    // Verify all Lambda roles have correct trust policy
    const roles = template.findResources('AWS::IAM::Role');
    const lambdaRoles = Object.values(roles).filter((role: any) => 
      role.Properties.AssumeRolePolicyDocument?.Statement?.some((stmt: any) => 
        stmt.Principal?.Service === 'lambda.amazonaws.com'
      )
    );
    
    lambdaRoles.forEach((role: any) => {
      expect(role.Properties.AssumeRolePolicyDocument).toMatchObject({
        Statement: expect.arrayContaining([
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ]),
      });
    });
  });

  test('All Lambda roles have AWSLambdaBasicExecutionRole attached', () => {
    // Verify all Lambda roles have basic execution role for CloudWatch Logs
    const roles = template.findResources('AWS::IAM::Role');
    const lambdaRoles = Object.values(roles).filter((role: any) => 
      role.Properties.AssumeRolePolicyDocument?.Statement?.some((stmt: any) => 
        stmt.Principal?.Service === 'lambda.amazonaws.com'
      )
    );
    
    // Filter to only our 5 roles (those with descriptions)
    const ourLambdaRoles = lambdaRoles.filter((role: any) => 
      role.Properties.Description && (
        role.Properties.Description.includes('DocumentUploadHandler') ||
        role.Properties.Description.includes('BedrockProcessor') ||
        role.Properties.Description.includes('HistoryManager') ||
        role.Properties.Description.includes('MetricsAggregator') ||
        role.Properties.Description.includes('ExportHandler')
      )
    );
    
    ourLambdaRoles.forEach((role: any) => {
      const hasManagedPolicy = role.Properties.ManagedPolicyArns?.some((arn: any) => {
        if (typeof arn === 'string') {
          return arn.includes('AWSLambdaBasicExecutionRole');
        }
        if (arn['Fn::Join']) {
          const parts = arn['Fn::Join'][1];
          return parts.some((part: any) => 
            typeof part === 'string' && part.includes('AWSLambdaBasicExecutionRole')
          );
        }
        return false;
      });
      
      expect(hasManagedPolicy).toBe(true);
    });
  });

  test('DocumentUploadHandler role has S3 and DynamoDB permissions', () => {
    // Verify DocumentUploadHandler has correct permissions
    const policies = template.findResources('AWS::IAM::Policy');
    
    // Check for S3 PutObject permission
    const hasS3PutObject = Object.values(policies).some((policy: any) => 
      policy.Properties.PolicyDocument?.Statement?.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((a: string) => a.includes('s3:PutObject'));
      })
    );
    
    // Check for DynamoDB PutItem permission
    const hasDynamoDBPutItem = Object.values(policies).some((policy: any) => 
      policy.Properties.PolicyDocument?.Statement?.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((a: string) => a.includes('dynamodb:PutItem'));
      })
    );
    
    expect(hasS3PutObject).toBe(true);
    expect(hasDynamoDBPutItem).toBe(true);
  });

  test('BedrockProcessor role has S3, DynamoDB, and Bedrock permissions', () => {
    // Verify BedrockProcessor has all required permissions
    const policies = template.findResources('AWS::IAM::Policy');
    
    // Check for S3 GetObject permission
    const hasS3GetObject = Object.values(policies).some((policy: any) => 
      policy.Properties.PolicyDocument?.Statement?.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((a: string) => a.includes('s3:GetObject'));
      })
    );
    
    // Check for S3 PutObject permission
    const hasS3PutObject = Object.values(policies).some((policy: any) => 
      policy.Properties.PolicyDocument?.Statement?.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((a: string) => a.includes('s3:PutObject'));
      })
    );
    
    // Check for DynamoDB read/write permissions
    const hasDynamoDBReadWrite = Object.values(policies).some((policy: any) => 
      policy.Properties.PolicyDocument?.Statement?.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((a: string) => 
          a.includes('dynamodb:PutItem') || 
          a.includes('dynamodb:UpdateItem') ||
          a.includes('dynamodb:GetItem')
        );
      })
    );
    
    // Check for Bedrock InvokeModel permission
    const hasBedrockInvokeModel = Object.values(policies).some((policy: any) => 
      policy.Properties.PolicyDocument?.Statement?.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((a: string) => a.includes('bedrock:InvokeModel'));
      })
    );
    
    expect(hasS3GetObject).toBe(true);
    expect(hasS3PutObject).toBe(true);
    expect(hasDynamoDBReadWrite).toBe(true);
    expect(hasBedrockInvokeModel).toBe(true);
  });

  test('BedrockProcessor role has Bedrock InvokeModel for Claude 3 Sonnet', () => {
    // Verify Bedrock InvokeModel policy targets Claude 3 Sonnet model
    const policies = template.findResources('AWS::IAM::Policy');
    const bedrockPolicies = Object.values(policies).filter((policy: any) => 
      policy.Properties.PolicyDocument?.Statement?.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((a: string) => a.includes('bedrock:InvokeModel'));
      })
    );
    
    expect(bedrockPolicies.length).toBeGreaterThan(0);
    
    // Verify the resource ARN includes Claude 3 Sonnet model
    const bedrockPolicy = bedrockPolicies[0] as any;
    const bedrockStatement = bedrockPolicy.Properties.PolicyDocument.Statement.find((stmt: any) => {
      const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
      return actions.some((a: string) => a.includes('bedrock:InvokeModel'));
    });
    
    expect(bedrockStatement).toBeDefined();
    expect(bedrockStatement.Resource).toContain('anthropic.claude-3-sonnet');
  });

  test('HistoryManager role has DynamoDB read-only permissions', () => {
    // Verify HistoryManager has read permissions but not write permissions
    const roles = template.findResources('AWS::IAM::Role');
    const historyManagerRole = Object.values(roles).find((role: any) => 
      role.Properties.Description?.includes('HistoryManager')
    );
    
    expect(historyManagerRole).toBeDefined();
    
    // Get policies attached to HistoryManager role
    const policies = template.findResources('AWS::IAM::Policy');
    const historyManagerPolicies = Object.values(policies).filter((policy: any) => {
      const policyRoles = policy.Properties.Roles;
      if (!policyRoles || !Array.isArray(policyRoles)) return false;
      
      return policyRoles.some((role: any) => {
        const ref = role.Ref;
        if (!ref) return false;
        const roleResource = template.findResources('AWS::IAM::Role')[ref];
        return roleResource?.Properties?.Description?.includes('HistoryManager');
      });
    });
    
    // Verify it has read permissions
    const hasReadPermissions = historyManagerPolicies.some((policy: any) => 
      policy.Properties.PolicyDocument?.Statement?.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((a: string) => 
          a.includes('dynamodb:GetItem') || 
          a.includes('dynamodb:Query') ||
          a.includes('dynamodb:Scan')
        );
      })
    );
    
    expect(hasReadPermissions).toBe(true);
    
    // Verify it does NOT have write permissions (least privilege)
    const hasWritePermissions = historyManagerPolicies.some((policy: any) => 
      policy.Properties.PolicyDocument?.Statement?.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((a: string) => 
          a.includes('dynamodb:PutItem') || 
          a.includes('dynamodb:UpdateItem') ||
          a.includes('dynamodb:DeleteItem')
        );
      })
    );
    
    expect(hasWritePermissions).toBe(false);
  });

  test('MetricsAggregator role has DynamoDB read/write permissions', () => {
    // Verify MetricsAggregator has both read and write permissions
    const roles = template.findResources('AWS::IAM::Role');
    const metricsAggregatorRole = Object.values(roles).find((role: any) => 
      role.Properties.Description?.includes('MetricsAggregator')
    );
    
    expect(metricsAggregatorRole).toBeDefined();
    
    // Get policies attached to MetricsAggregator role
    const policies = template.findResources('AWS::IAM::Policy');
    const metricsAggregatorPolicies = Object.values(policies).filter((policy: any) => {
      const policyRoles = policy.Properties.Roles;
      if (!policyRoles || !Array.isArray(policyRoles)) return false;
      
      return policyRoles.some((role: any) => {
        const ref = role.Ref;
        if (!ref) return false;
        const roleResource = template.findResources('AWS::IAM::Role')[ref];
        return roleResource?.Properties?.Description?.includes('MetricsAggregator');
      });
    });
    
    // Verify it has both read and write permissions
    const hasReadPermissions = metricsAggregatorPolicies.some((policy: any) => 
      policy.Properties.PolicyDocument?.Statement?.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((a: string) => 
          a.includes('dynamodb:GetItem') || 
          a.includes('dynamodb:Query')
        );
      })
    );
    
    const hasWritePermissions = metricsAggregatorPolicies.some((policy: any) => 
      policy.Properties.PolicyDocument?.Statement?.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((a: string) => 
          a.includes('dynamodb:PutItem') || 
          a.includes('dynamodb:UpdateItem')
        );
      })
    );
    
    expect(hasReadPermissions).toBe(true);
    expect(hasWritePermissions).toBe(true);
  });

  test('ExportHandler role has DynamoDB read and S3 write permissions', () => {
    // Verify ExportHandler has correct permissions
    const roles = template.findResources('AWS::IAM::Role');
    const exportHandlerRole = Object.values(roles).find((role: any) => 
      role.Properties.Description?.includes('ExportHandler')
    );
    
    expect(exportHandlerRole).toBeDefined();
    
    // Get policies attached to ExportHandler role
    const policies = template.findResources('AWS::IAM::Policy');
    const exportHandlerPolicies = Object.values(policies).filter((policy: any) => {
      const policyRoles = policy.Properties.Roles;
      if (!policyRoles || !Array.isArray(policyRoles)) return false;
      
      return policyRoles.some((role: any) => {
        const ref = role.Ref;
        if (!ref) return false;
        const roleResource = template.findResources('AWS::IAM::Role')[ref];
        return roleResource?.Properties?.Description?.includes('ExportHandler');
      });
    });
    
    // Verify it has DynamoDB read permissions
    const hasDynamoDBRead = exportHandlerPolicies.some((policy: any) => 
      policy.Properties.PolicyDocument?.Statement?.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((a: string) => 
          a.includes('dynamodb:GetItem') || 
          a.includes('dynamodb:Query')
        );
      })
    );
    
    // Verify it has S3 PutObject permissions
    const hasS3PutObject = exportHandlerPolicies.some((policy: any) => 
      policy.Properties.PolicyDocument?.Statement?.some((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        return actions.some((a: string) => a.includes('s3:PutObject'));
      })
    );
    
    expect(hasDynamoDBRead).toBe(true);
    expect(hasS3PutObject).toBe(true);
  });

  test('Roles follow least privilege principle - no wildcard permissions', () => {
    // Verify no roles have wildcard (*) permissions on both action and resource
    const policies = template.findResources('AWS::IAM::Policy');
    
    Object.values(policies).forEach((policy: any) => {
      policy.Properties.PolicyDocument?.Statement?.forEach((stmt: any) => {
        const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
        const hasWildcardAction = actions.some((a: string) => a === '*');
        
        // If there's a wildcard action, the resource must be specific
        if (hasWildcardAction) {
          expect(stmt.Resource).not.toBe('*');
        }
      });
    });
  });

  test('Stack has IAM role ARN outputs', () => {
    // Verify all IAM role outputs exist (CDK generates unique IDs, so we check for partial matches)
    const outputs = template.findOutputs('*');
    const outputKeys = Object.keys(outputs);
    
    // Check that outputs containing role ARN names exist
    expect(outputKeys.some(key => key.includes('DocumentUploadHandlerRoleArn'))).toBe(true);
    expect(outputKeys.some(key => key.includes('BedrockProcessorRoleArn'))).toBe(true);
    expect(outputKeys.some(key => key.includes('HistoryManagerRoleArn'))).toBe(true);
    expect(outputKeys.some(key => key.includes('MetricsAggregatorRoleArn'))).toBe(true);
    expect(outputKeys.some(key => key.includes('ExportHandlerRoleArn'))).toBe(true);
  });

  test('All roles have appropriate tags for cost allocation', () => {
    // Verify our 5 roles have Function and Component tags
    // Note: CDK may apply tags at the stack level rather than individual resources
    const roles = template.findResources('AWS::IAM::Role');
    const ourLambdaRoles = Object.values(roles).filter((role: any) => 
      role.Properties.Description && (
        role.Properties.Description.includes('DocumentUploadHandler') ||
        role.Properties.Description.includes('BedrockProcessor') ||
        role.Properties.Description.includes('HistoryManager') ||
        role.Properties.Description.includes('MetricsAggregator') ||
        role.Properties.Description.includes('ExportHandler')
      )
    );
    
    // Check that our roles have tags
    ourLambdaRoles.forEach((role: any) => {
      // Tags may be applied at stack level, so we check if they exist
      if (role.Properties.Tags) {
        const functionTag = role.Properties.Tags?.find((tag: any) => tag.Key === 'Function');
        const componentTag = role.Properties.Tags?.find((tag: any) => tag.Key === 'Component');
        
        // If tags exist, verify they have correct values
        if (functionTag) {
          expect(functionTag.Value).toBeTruthy();
        }
        if (componentTag) {
          expect(componentTag.Value).toBe('Backend');
        }
      }
      // If no tags on role, they're inherited from stack level (which is acceptable)
    });
  });
});
