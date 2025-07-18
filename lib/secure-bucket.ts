import { Construct } from 'constructs';
import {
  aws_s3 as s3,
  aws_iam as iam,
  aws_kms as kms,
  CfnOutput,
  RemovalPolicy,
  Duration,
} from 'aws-cdk-lib';

export interface SecureBucketProps {
  /**
   * Project identifier used as prefix for bucket name
   */
  projectId: string;

  /**
   * Enable S3 bucket versioning
   * @default false
   */
  enableVersioning?: boolean;

  /**
   * Enable KMS encryption for the bucket
   * @default false
   */
  enableEncryption?: boolean;

  /**
   * GitHub repository in format 'owner/repo' for OIDC role
   * @example 'myorg/myrepo'
   */
  githubRepo?: string;

  /**
   * Additional allowed GitHub repositories for OIDC
   * @default []
   */
  additionalGithubRepos?: string[];

  /**
   * Environment name (e.g., 'dev', 'prod')
   * @default 'dev'
   */
  environment?: string;
}

export class SecureBucket extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly oidcRole?: iam.Role;
  public readonly kmsKey?: kms.Key;

  constructor(scope: Construct, id: string, props: SecureBucketProps) {
    super(scope, id);

    const environment = props.environment || 'dev';
    const bucketName = `${props.projectId}-secure-bucket-${environment}`;

    // Create KMS key if encryption is enabled
    if (props.enableEncryption) {
      this.kmsKey = new kms.Key(this, 'BucketEncryptionKey', {
        description: `KMS key for ${bucketName}`,
        enableKeyRotation: true,
        removalPolicy: RemovalPolicy.DESTROY, // For demo purposes
      });

      this.kmsKey.addAlias(`alias/${props.projectId}-bucket-key-${environment}`);
    }

    // Create S3 bucket
    this.bucket = new s3.Bucket(this, 'SecureBucket', {
      bucketName,
      versioned: props.enableVersioning || false,
      encryption: props.enableEncryption
        ? s3.BucketEncryption.KMS
        : s3.BucketEncryption.S3_MANAGED,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY, // For demo purposes
      autoDeleteObjects: true, // For demo purposes
    });

    // Create GitHub OIDC role if GitHub repo is specified
    if (props.githubRepo) {
      this.oidcRole = this.createGitHubOIDCRole(props);
    }

    // Output the bucket name
    new CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'Name of the created S3 bucket',
      exportName: `${props.projectId}-bucket-name-${environment}`,
    });

    // Output the OIDC role ARN if created
    if (this.oidcRole) {
      new CfnOutput(this, 'OIDCRoleArn', {
        value: this.oidcRole.roleArn,
        description: 'ARN of the GitHub OIDC role',
        exportName: `${props.projectId}-oidc-role-arn-${environment}`,
      });
    }

    // Output KMS key ARN if created
    if (this.kmsKey) {
      new CfnOutput(this, 'KMSKeyArn', {
        value: this.kmsKey.keyArn,
        description: 'ARN of the KMS encryption key',
        exportName: `${props.projectId}-kms-key-arn-${environment}`,
      });
    }
  }

  private createGitHubOIDCRole(props: SecureBucketProps): iam.Role {
    // Get GitHub OIDC provider (assumes it's already created in the account)
    const githubOIDCProvider = iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this,
      'GitHubOIDCProvider',
      `arn:aws:iam::${this.node.tryGetContext('account')}:oidc-provider/token.actions.githubusercontent.com`
    );

    // Create trust policy for GitHub OIDC
    const githubRepos = [props.githubRepo!, ...(props.additionalGithubRepos || [])];

    // Create the OIDC role
    const role = new iam.Role(this, 'GitHubOIDCRole', {
      roleName: `${props.projectId}-github-oidc-role-${props.environment || 'dev'}`,
      assumedBy: new iam.OpenIdConnectPrincipal(githubOIDCProvider).withConditions({
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        StringLike: {
          'token.actions.githubusercontent.com:sub': githubRepos.map(
            (repo) => `repo:${repo}:*`
          ),
        },
      }),
      description: `GitHub OIDC role for ${props.projectId} deployments`,
      maxSessionDuration: Duration.hours(1),
    });

    // Grant permissions to the bucket
    this.bucket.grantReadWrite(role);

    // Grant KMS permissions if encryption is enabled
    if (this.kmsKey) {
      this.kmsKey.grantEncryptDecrypt(role);
    }

    // Add CDK deployment permissions
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess')
    );

    // Add specific permissions for CDK operations
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:CreateRole',
          'iam:DeleteRole',
          'iam:AttachRolePolicy',
          'iam:DetachRolePolicy',
          'iam:PutRolePolicy',
          'iam:DeleteRolePolicy',
          'iam:GetRole',
          'iam:GetRolePolicy',
          'iam:PassRole',
          'iam:TagRole',
          'iam:UntagRole',
          'sts:GetCallerIdentity',
          's3:*',
          'kms:*',
        ],
        resources: ['*'],
      })
    );

    return role;
  }
}
