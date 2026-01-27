#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DocumentAnalysisStack } from '../lib/document-analysis-stack';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'dev';
const environments = app.node.tryGetContext('environments');

if (!environments || !environments[environment]) {
  throw new Error(`Environment '${environment}' not found in cdk.json context`);
}

const envConfig = environments[environment];

// Create the main stack
new DocumentAnalysisStack(app, `DocumentAnalysis-${environment}`, {
  env: {
    account: envConfig.account || process.env.CDK_DEFAULT_ACCOUNT,
    region: envConfig.region || process.env.CDK_DEFAULT_REGION,
  },
  environment: environment,
  description: `Document Analysis with Bedrock - ${environment} environment`,
  tags: {
    Project: 'DocumentAnalysis',
    Environment: environment,
    ManagedBy: 'CDK',
  },
});

app.synth();
