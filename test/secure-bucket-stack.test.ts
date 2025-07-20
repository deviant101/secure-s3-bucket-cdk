import { Template } from 'aws-cdk-lib/assertions';
import { App } from 'aws-cdk-lib';
import { SecureBucketStack } from '../lib/secure-bucket-stack';

describe('SecureBucket Stack Integration', () => {
  let app: App;

  beforeEach(() => {
    app = new App({
      context: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
  });

  test('creates complete stack for development environment', () => {
    // GIVEN
    const stack = new SecureBucketStack(app, 'TestStack', {
      projectId: 'integration-test',
      environment: 'dev',
      githubRepo: 'testorg/testrepo',
      enableVersioning: true,
      enableEncryption: true,
    });

    // WHEN
    const template = Template.fromStack(stack);

    // THEN
    // Should have all required resources (note: CDK may create additional IAM resources)
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::S3::BucketPolicy', 1);
    template.resourceCountIs('AWS::KMS::Key', 1);
    template.resourceCountIs('AWS::KMS::Alias', 1);
    // Note: IAM resources count may vary due to CDK internal policies

    // Should have proper naming
    template.hasResource('AWS::S3::Bucket', {
      Properties: {
        BucketName: 'integration-test-secure-bucket-dev',
      },
    });
  });

  test('creates minimal stack without optional features', () => {
    // GIVEN
    const stack = new SecureBucketStack(app, 'MinimalStack', {
      projectId: 'minimal-test',
      environment: 'dev',
      enableVersioning: false,
      enableEncryption: false,
    });

    // WHEN
    const template = Template.fromStack(stack);

    // THEN
    // Should have basic resources only
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::S3::BucketPolicy', 1);
    template.resourceCountIs('AWS::KMS::Key', 0); // No KMS key
    // Note: Even without githubRepo, CDK may create some IAM resources for bucket access
  });

  test('production stack has correct naming and configuration', () => {
    // GIVEN
    const stack = new SecureBucketStack(app, 'ProdStack', {
      projectId: 'prod-test',
      environment: 'prod',
      githubRepo: 'company/production-repo',
      enableVersioning: true,
      enableEncryption: true,
    });

    // WHEN
    const template = Template.fromStack(stack);

    // THEN
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'prod-test-secure-bucket-prod',
    });

    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'prod-test-github-oidc-role-prod',
    });

    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/prod-test-bucket-key-prod',
    });
  });

  test('stack outputs are properly exported', () => {
    // GIVEN
    const stack = new SecureBucketStack(app, 'OutputStack', {
      projectId: 'output-test',
      environment: 'dev',
      githubRepo: 'testorg/testrepo',
      enableVersioning: true,
      enableEncryption: true,
    });

    // WHEN
    const template = Template.fromStack(stack);

    // THEN
    // Check that outputs exist (exact naming depends on CDK construct ID structure)
    const outputs = template.findOutputs('*');
    expect(Object.keys(outputs)).toHaveLength(3); // Should have 3 outputs
    
    // Verify we have outputs for bucket, role, and KMS key
    const outputKeys = Object.keys(outputs);
    expect(outputKeys.some(key => key.includes('BucketName'))).toBeTruthy();
    expect(outputKeys.some(key => key.includes('OIDCRoleArn'))).toBeTruthy();
    expect(outputKeys.some(key => key.includes('KMSKeyArn'))).toBeTruthy();
  });
});
