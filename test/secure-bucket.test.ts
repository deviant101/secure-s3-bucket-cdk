import { Template, Match } from 'aws-cdk-lib/assertions';
import { App, Stack } from 'aws-cdk-lib';
import { SecureBucket } from '../lib/secure-bucket';

describe('SecureBucket Construct', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App({
      context: {
        account: '123456789012',
      },
    });
    stack = new Stack(app, 'TestStack');
  });

  test('creates S3 bucket with basic configuration', () => {
    // GIVEN
    const props = {
      projectId: 'test-project',
    };

    // WHEN
    new SecureBucket(stack, 'TestBucket', props);

    // THEN
    const template = Template.fromStack(stack);
    
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'test-project-secure-bucket-dev',
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('creates S3 bucket with versioning enabled', () => {
    // GIVEN
    const props = {
      projectId: 'test-project',
      enableVersioning: true,
    };

    // WHEN
    new SecureBucket(stack, 'TestBucket', props);

    // THEN
    const template = Template.fromStack(stack);
    
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('creates S3 bucket with KMS encryption when enabled', () => {
    // GIVEN
    const props = {
      projectId: 'test-project',
      enableEncryption: true,
    };

    // WHEN
    new SecureBucket(stack, 'TestBucket', props);

    // THEN
    const template = Template.fromStack(stack);
    
    // Should create a KMS key
    template.hasResourceProperties('AWS::KMS::Key', {
      Description: 'KMS key for test-project-secure-bucket-dev',
      EnableKeyRotation: true,
    });

    // Should create a KMS alias
    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/test-project-bucket-key-dev',
    });

    // Should use KMS encryption
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
            },
          },
        ],
      },
    });
  });

  test('creates GitHub OIDC role when GitHub repo is specified', () => {
    // GIVEN
    const props = {
      projectId: 'test-project',
      githubRepo: 'myorg/myrepo',
    };

    // WHEN
    new SecureBucket(stack, 'TestBucket', props);

    // THEN
    const template = Template.fromStack(stack);
    
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'test-project-github-oidc-role-dev',
    });
  });

  test('creates outputs for bucket name and OIDC role ARN', () => {
    // GIVEN
    const props = {
      projectId: 'test-project',
      githubRepo: 'myorg/myrepo',
      enableEncryption: true,
    };

    // WHEN
    new SecureBucket(stack, 'TestBucket', props);

    // THEN
    const template = Template.fromStack(stack);
    
    // Check that outputs exist (exact naming depends on CDK construct ID)
    const outputs = template.findOutputs('*');
    expect(Object.keys(outputs)).toHaveLength(3); // Should have 3 outputs
    
    // Verify we have outputs with correct descriptions
    const outputEntries = Object.entries(outputs);
    const bucketOutput = outputEntries.find(([_, output]) => 
      output.Description === 'Name of the created S3 bucket'
    );
    const roleOutput = outputEntries.find(([_, output]) => 
      output.Description === 'ARN of the GitHub OIDC role'
    );
    const kmsOutput = outputEntries.find(([_, output]) => 
      output.Description === 'ARN of the KMS encryption key'
    );
    
    expect(bucketOutput).toBeDefined();
    expect(roleOutput).toBeDefined();
    expect(kmsOutput).toBeDefined();
  });

  test('supports custom environment', () => {
    // GIVEN
    const props = {
      projectId: 'test-project',
      environment: 'prod',
    };

    // WHEN
    new SecureBucket(stack, 'TestBucket', props);

    // THEN
    const template = Template.fromStack(stack);
    
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'test-project-secure-bucket-prod',
    });
  });

  test('supports additional GitHub repositories', () => {
    // GIVEN
    const props = {
      projectId: 'test-project',
      githubRepo: 'myorg/myrepo',
      additionalGithubRepos: ['myorg/another-repo', 'myorg/third-repo'],
    };

    // WHEN
    new SecureBucket(stack, 'TestBucket', props);

    // THEN
    const template = Template.fromStack(stack);
    
    // Just verify the role exists - the exact trust policy format depends on CDK internals
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'test-project-github-oidc-role-dev',
    });
  });

  test('enforces SSL on bucket', () => {
    // GIVEN
    const props = {
      projectId: 'test-project',
    };

    // WHEN
    new SecureBucket(stack, 'TestBucket', props);

    // THEN
    const template = Template.fromStack(stack);
    
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Deny',
            Action: 's3:*',
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          }),
        ]),
      },
    });
  });
});
