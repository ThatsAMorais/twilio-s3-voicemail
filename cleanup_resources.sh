#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <path to .env file>"
  exit 1
fi

# Load environment variables from the specified .env file
set -o allexport
source "$1"
set -o allexport

# Delete the CloudFormation stack
aws cloudformation delete-stack --stack-name TwilioS3VoicemailUploaderStack

# Wait until the stack is deleted
echo "Waiting for CloudFormation stack to be deleted..."
aws cloudformation wait stack-delete-complete --stack-name TwilioS3VoicemailUploaderStack
echo "CloudFormation stack deleted."

# Delete the SAM CLI managed S3 bucket
aws s3 rb s3://$PACKAGE_BUCKET_NAME --force

# Detach and delete the IAM policy
aws iam detach-group-policy --group-name TwilioVoicemailUploaderDevs --policy-arn arn:aws:iam::${AWS_ACCOUNT_ID}:policy/SAMCLIUserPolicy
aws iam delete-policy --policy-arn arn:aws:iam::${AWS_ACCOUNT_ID}:policy/SAMCLIUserPolicy

echo "Cleanup complete."
