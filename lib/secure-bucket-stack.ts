import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureBucket } from './secure-bucket';

export interface SecureBucketStackProps extends StackProps {
  projectId: string;
  environment: string;
  githubRepo?: string;
  enableVersioning?: boolean;
  enableEncryption?: boolean;
}

export class SecureBucketStack extends Stack {
  public readonly secureBucket: SecureBucket;

  constructor(scope: Construct, id: string, props: SecureBucketStackProps) {
    super(scope, id, props);

    // Create the secure bucket construct
    this.secureBucket = new SecureBucket(this, 'SecureBucket', {
      projectId: props.projectId,
      environment: props.environment,
      githubRepo: props.githubRepo,
      enableVersioning: props.enableVersioning ?? true,
      enableEncryption: props.enableEncryption ?? true,
    });
  }
}
