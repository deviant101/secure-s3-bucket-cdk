# 🧪 Secure S3 Bucket CDK Construct

A reusable AWS CDK construct that provisions a secure S3 bucket with optional KMS encryption, versioning, and GitHub OIDC integration for CI/CD deployments.

## 🚀 Features

- **Secure S3 Bucket**: Creates an S3 bucket with security best practices
- **Optional KMS Encryption**: Enable customer-managed KMS encryption with automatic key rotation
- **Versioning Support**: Configurable S3 bucket versioning
- **GitHub OIDC Integration**: Automatic GitHub Actions OIDC role creation for secure deployments
- **Multi-Environment Support**: Separate dev and prod environments with manual approval gates
- **Comprehensive Testing**: Full unit test coverage with Jest
- **CI/CD Pipeline**: GitHub Actions workflow with linting, testing, and deployment

## 📁 Project Structure

```
├── lib/
│   ├── secure-bucket.ts        # Reusable CDK construct
│   └── secure-bucket-stack.ts  # CDK stack implementation
├── bin/
│   └── app.ts                  # CDK app entry point
├── test/
│   └── secure-bucket.test.ts   # Unit tests for construct
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD workflow
├── cdk.json                    # CDK configuration
├── package.json                # Node.js dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── jest.config.js              # Jest testing configuration
├── .eslintrc.json              # ESLint configuration
└── .prettierrc.json            # Prettier configuration
```

## 🏗️ Usage

### Basic Usage

```typescript
import { SecureBucket } from './lib/secure-bucket';

new SecureBucket(this, 'MySecureBucket', {
  projectId: 'my-project',
  enableVersioning: true,
  enableEncryption: true,
  githubRepo: 'myorg/myrepo'
});
```

### Advanced Configuration

```typescript
new SecureBucket(this, 'MySecureBucket', {
  projectId: 'my-project',
  environment: 'prod',
  enableVersioning: true,
  enableEncryption: true,
  githubRepo: 'myorg/myrepo',
  additionalGithubRepos: ['myorg/another-repo', 'myorg/third-repo']
});
```

## 🔧 Interface

```typescript
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
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- AWS CLI configured
- AWS CDK CLI (`npm install -g aws-cdk`)

### Installation

```bash
# Clone the repository
git clone https://github.com/deviant101/secure-s3-bucket-cdk.git
cd secure-s3-bucket-cdk

# Install dependencies
npm install

# Build the project
npm run build
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format

# Check formatting
npm run format -- --check
```

### CDK Commands

```bash
# Synthesize CloudFormation templates
npm run synth

# Deploy to development
npm run deploy:dev

# Deploy to production
npm run deploy:prod

# Show diff for current changes
npm run diff
```

## 🔐 GitHub Actions Setup

### Required Secrets

Configure the following secrets in your GitHub repository:

- `AWS_ACCOUNT_ID`: Your AWS account ID
- `AWS_ROLE_ARN_DEV`: ARN of the OIDC role for development deployments
- `AWS_ROLE_ARN_PROD`: ARN of the OIDC role for production deployments

### OIDC Provider Setup

Before running the workflow, ensure you have set up the GitHub OIDC provider in your AWS account:

```bash
# Create OIDC provider (one-time setup)
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### Workflow Features

- **Automatic Triggers**: Runs on push to `main`/`develop` branches and PRs
- **Manual Deployment**: Supports workflow dispatch for manual deployments
- **Multi-Environment**: Separate dev and prod environments
- **Production Gates**: Manual approval required for production deployments
- **Security Validation**: CDK diff validation to prevent unauthorized changes
- **Comprehensive Testing**: Linting, formatting, and unit tests

## 🏛️ Architecture

### Security Features

- **Block Public Access**: All public access blocked by default
- **SSL/TLS Enforcement**: HTTPS-only access via bucket policy
- **KMS Encryption**: Optional customer-managed encryption with key rotation
- **OIDC Authentication**: Secure GitHub Actions authentication without long-lived secrets
- **Least Privilege**: Minimal IAM permissions for deployment roles

### Resource Naming Convention

- **Bucket**: `{projectId}-secure-bucket-{environment}`
- **OIDC Role**: `{projectId}-github-oidc-role-{environment}`
- **KMS Key Alias**: `alias/{projectId}-bucket-key-{environment}`

### Outputs

The construct provides the following CloudFormation outputs:

- **BucketName**: Name of the created S3 bucket
- **OIDCRoleArn**: ARN of the GitHub OIDC role (if created)
- **KMSKeyArn**: ARN of the KMS encryption key (if created)

## 🌍 Environment Configuration

### Development Environment

- Automatic deployment on push to `develop` branch
- Relaxed security policies for development
- Automatic resource cleanup on stack deletion

### Production Environment

- Manual approval required
- Enhanced security validation
- Drift detection and unauthorized change prevention
- Immutable infrastructure approach

## 📊 Monitoring and Logging

The construct automatically enables:

- **CloudTrail Integration**: All S3 API calls logged
- **Access Logging**: S3 access logs (when configured)
- **KMS Key Usage**: CloudWatch metrics for key usage

## 🚨 Troubleshooting

### Common Issues

1. **OIDC Provider Not Found**
   ```
   Error: OIDC provider not found
   ```
   Solution: Create the GitHub OIDC provider in your AWS account (see setup instructions above)

2. **Permission Denied**
   ```
   Error: User is not authorized to perform sts:AssumeRoleWithWebIdentity
   ```
   Solution: Ensure the OIDC role trust policy includes your GitHub repository

3. **Bucket Name Conflicts**
   ```
   Error: Bucket already exists
   ```
   Solution: S3 bucket names are globally unique. Change the `projectId` or add a unique suffix

### Debug Mode

Enable CDK debug mode for verbose output:

```bash
export CDK_DEBUG=true
npm run deploy:dev
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Maintain 100% test coverage
- Use conventional commit messages
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- Create an issue for bug reports or feature requests
- Check existing issues before creating new ones
- Provide detailed information for faster resolution

## 🎯 Roadmap

- [ ] Support for S3 Transfer Acceleration
- [ ] Integration with AWS Config for compliance monitoring
- [ ] Support for cross-region replication
- [ ] CloudWatch dashboards for monitoring
- [ ] Cost optimization recommendations
