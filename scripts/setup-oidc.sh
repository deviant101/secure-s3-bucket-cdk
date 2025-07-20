#!/bin/bash

# Setup script for GitHub OIDC provider in AWS
# Run this script once per AWS account to set up GitHub Actions OIDC authentication

set -e

echo "🔧 Setting up GitHub OIDC provider for AWS CDK deployments"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is logged into AWS
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 AWS Account ID: $ACCOUNT_ID"

# Check if OIDC provider already exists
if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "arn:aws:iam::$ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com" &> /dev/null; then
    echo "✅ GitHub OIDC provider already exists"
else
    echo "🔧 Creating GitHub OIDC provider..."
    aws iam create-open-id-connect-provider \
        --url https://token.actions.githubusercontent.com \
        --client-id-list sts.amazonaws.com \
        --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
    echo "✅ GitHub OIDC provider created successfully"
fi

echo ""
echo "🎯 Next steps:"
echo "1. Update your GitHub repository secrets with:"
echo "   - AWS_ACCOUNT_ID: $ACCOUNT_ID"
echo "   - AWS_ROLE_ARN_DEV: <role-arn-from-dev-deployment>"
echo "   - AWS_ROLE_ARN_PROD: <role-arn-from-prod-deployment>"
echo ""
echo "2. Deploy the CDK stack to create the OIDC roles:"
echo "   npm run deploy:dev"
echo ""
echo "3. Update GitHub secrets with the actual role ARNs from the stack outputs"
echo ""
echo "✅ OIDC provider setup complete!"
