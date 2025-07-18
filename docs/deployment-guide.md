# 🚀 Deployment Guide

This guide walks you through deploying the Secure S3 Bucket CDK construct from scratch.

## 📋 Prerequisites

### Software Requirements

- **Node.js 18+**: [Download from nodejs.org](https://nodejs.org/)
- **AWS CLI**: [Installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **AWS CDK CLI**: Install globally with `npm install -g aws-cdk`
- **Git**: For version control

### AWS Requirements

- AWS Account with appropriate permissions
- AWS CLI configured with credentials
- Sufficient IAM permissions for CDK operations

## 🔧 Initial Setup

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/deviant101/secure-s3-bucket-cdk.git
cd secure-s3-bucket-cdk
npm install
```

### 2. Configure AWS CLI

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region, and Output format
```

### 3. Bootstrap CDK (One-time per account/region)

```bash
npx cdk bootstrap aws://ACCOUNT_ID/REGION
```

### 4. Set Up GitHub OIDC Provider

```bash
./scripts/setup-oidc.sh
```

## 🏗️ Local Development Deployment

### Deploy to Development Environment

```bash
# Build and test
npm run build
npm test

# Deploy to dev
npx cdk deploy \
  --context projectId=my-project \
  --context environment=dev \
  --context githubRepo=myorg/myrepo \
  --context account=123456789012 \
  --context region=us-east-1
```

### Verify Deployment

```bash
# List created resources
aws cloudformation describe-stacks \
  --stack-name my-project-secure-bucket-dev \
  --query 'Stacks[0].Outputs'

# Test S3 bucket
aws s3 ls s3://my-project-secure-bucket-dev/
```

## 🔄 GitHub Actions CI/CD Setup

### 1. Repository Secrets Configuration

In your GitHub repository settings, add these secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `AWS_ACCOUNT_ID` | Your AWS account ID | `123456789012` |
| `AWS_ROLE_ARN_DEV` | Development OIDC role ARN | `arn:aws:iam::123456789012:role/my-project-github-oidc-role-dev` |
| `AWS_ROLE_ARN_PROD` | Production OIDC role ARN | `arn:aws:iam::123456789012:role/my-project-github-oidc-role-prod` |

### 2. Environment Protection Rules

#### Development Environment
- **Required reviewers**: None (automatic deployment)
- **Wait timer**: 0 minutes
- **Deployment branches**: `develop`, `main`

#### Production Environment
- **Required reviewers**: 1-2 senior team members
- **Wait timer**: 5 minutes (optional)
- **Deployment branches**: `main` only

### 3. Branch Protection Rules

Configure branch protection for `main`:
- Require pull request reviews (1-2 reviewers)
- Require status checks to pass before merging
- Require up-to-date branches before merging
- Include administrators in these restrictions

## 🌍 Multi-Environment Deployment Strategy

### Development Environment

**Purpose**: Feature development, testing, and integration

**Trigger**: 
- Push to `develop` branch
- Manual workflow dispatch

**Configuration**:
```bash
npx cdk deploy \
  --context projectId=my-project \
  --context environment=dev \
  --context githubRepo=myorg/myrepo
```

**Features**:
- Automatic deployment
- Relaxed security policies
- Auto-cleanup on stack deletion
- Cost-optimized settings

### Production Environment

**Purpose**: Live production workloads

**Trigger**:
- Push to `main` branch (after dev deployment)
- Manual workflow dispatch with approval

**Configuration**:
```bash
npx cdk deploy \
  --context projectId=my-project \
  --context environment=prod \
  --context githubRepo=myorg/myrepo
```

**Features**:
- Manual approval required
- Enhanced security validation
- Drift detection
- Immutable infrastructure

## 🔍 Monitoring Deployment

### CloudFormation Console

Monitor stack creation progress:
1. Open [AWS CloudFormation Console](https://console.aws.amazon.com/cloudformation/)
2. Find your stack: `my-project-secure-bucket-{env}`
3. Check Events tab for deployment progress
4. Review Outputs tab for resource ARNs

### GitHub Actions

Monitor CI/CD pipeline:
1. Go to repository Actions tab
2. Click on running workflow
3. Expand job steps to see detailed logs
4. Check deployment summaries

### AWS CLI Monitoring

```bash
# Watch stack events
aws cloudformation describe-stack-events \
  --stack-name my-project-secure-bucket-dev \
  --query 'StackEvents[0:10].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId]' \
  --output table

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name my-project-secure-bucket-dev \
  --query 'Stacks[0].Outputs'
```

## 🚨 Troubleshooting Common Issues

### 1. CDK Bootstrap Issues

**Error**: `Policy contains a statement with one or more invalid principals`

**Solution**:
```bash
# Update CDK CLI
npm install -g aws-cdk@latest

# Re-bootstrap with latest version
npx cdk bootstrap aws://ACCOUNT_ID/REGION --force
```

### 2. OIDC Provider Issues

**Error**: `An error occurred (NoSuchEntity) when calling the GetOpenIDConnectProvider operation`

**Solution**:
```bash
# Create OIDC provider manually
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### 3. S3 Bucket Name Conflicts

**Error**: `Bucket name already exists`

**Solution**:
- S3 bucket names are globally unique
- Use a unique `projectId` value
- Add timestamp or random suffix to bucket name

### 4. Permission Issues

**Error**: `User: ... is not authorized to perform: cloudformation:CreateStack`

**Solution**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "kms:*",
        "iam:*"
      ],
      "Resource": "*"
    }
  ]
}
```

### 5. GitHub Actions Authentication

**Error**: `Error: Could not assume role with OIDC`

**Solution**:
1. Verify OIDC provider exists in AWS
2. Check role trust policy includes correct repository
3. Ensure repository has correct secrets configured
4. Verify branch/tag conditions in trust policy

## 📊 Cost Optimization

### Development Environment

- Use `STANDARD_IA` storage class for non-critical data
- Enable lifecycle policies for automatic cleanup
- Use smaller KMS key rotation periods

### Production Environment

- Implement intelligent tiering
- Set up cost alerts via CloudWatch
- Regular cost analysis and optimization

### Estimated Monthly Costs

| Resource | Development | Production |
|----------|-------------|------------|
| S3 Storage (10GB) | $0.23 | $0.23 |
| KMS Key | $1.00 | $1.00 |
| API Requests | $0.01 | $0.05 |
| **Total** | **~$1.24** | **~$1.28** |

*Costs may vary based on usage patterns and region*

## 🔄 Rollback Procedures

### Emergency Rollback

```bash
# Quick rollback to previous version
aws cloudformation cancel-update-stack \
  --stack-name my-project-secure-bucket-prod

# Or rollback to specific version
aws cloudformation continue-update-rollback \
  --stack-name my-project-secure-bucket-prod
```

### Planned Rollback

```bash
# Deploy previous CDK version
git checkout <previous-commit>
npx cdk deploy --context environment=prod
```

## 📈 Scaling and Maintenance

### Regular Maintenance Tasks

1. **Monthly**: Review and rotate access keys
2. **Quarterly**: Update CDK dependencies
3. **Annually**: Review and update security policies

### Scaling Considerations

- **Multi-region**: Deploy stacks in multiple regions
- **Cross-account**: Use CDK Pipelines for cross-account deployment
- **Large teams**: Implement GitOps with multiple environments

## 📞 Support and Escalation

### Support Channels

1. **Internal**: Create GitHub issues in this repository
2. **AWS**: AWS Support cases for infrastructure issues
3. **CDK**: [AWS CDK GitHub repository](https://github.com/aws/aws-cdk)

### Escalation Path

1. **Level 1**: Development team lead
2. **Level 2**: DevOps/Platform team
3. **Level 3**: AWS Solutions Architect

## ✅ Deployment Checklist

### Pre-deployment

- [ ] Code reviewed and approved
- [ ] Tests passing (unit, integration, security)
- [ ] Documentation updated
- [ ] Secrets configured in GitHub
- [ ] Stakeholders notified

### Post-deployment

- [ ] Stack deployment successful
- [ ] Outputs verified
- [ ] Resources accessible
- [ ] Monitoring configured
- [ ] Stakeholders notified of completion

### Production Deployment

- [ ] Development environment tested
- [ ] Security review completed
- [ ] Change management approved
- [ ] Rollback plan documented
- [ ] On-call engineer available

---

**Need help?** Check the [main README](README.md) or create an issue in this repository.
