#!/usr/bin/env node
import 'source-map-support/register';
import { App, Environment } from 'aws-cdk-lib';
import { SecureBucketStack } from '../lib/secure-bucket-stack';

const app = new App();

// Get configuration from context
const projectId = app.node.tryGetContext('projectId') || 'demo-project';
const environment = app.node.tryGetContext('environment') || 'dev';
const githubRepo = app.node.tryGetContext('githubRepo') || 'myorg/myrepo';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';

// Environment configuration
const env: Environment = {
  account,
  region,
};

// Create different stacks for different environments
if (environment === 'prod') {
  new SecureBucketStack(app, `${projectId}-secure-bucket-prod`, {
    env,
    projectId,
    environment: 'prod',
    githubRepo,
    enableVersioning: true,
    enableEncryption: true,
    description: `Production secure bucket stack for ${projectId}`,
    tags: {
      Environment: 'prod',
      Project: projectId,
      ManagedBy: 'CDK',
    },
  });
} else {
  new SecureBucketStack(app, `${projectId}-secure-bucket-dev`, {
    env,
    projectId,
    environment: 'dev',
    githubRepo,
    enableVersioning: true,
    enableEncryption: true,
    description: `Development secure bucket stack for ${projectId}`,
    tags: {
      Environment: 'dev',
      Project: projectId,
      ManagedBy: 'CDK',
    },
  });
}
