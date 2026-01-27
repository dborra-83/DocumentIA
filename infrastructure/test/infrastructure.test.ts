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
});

