#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <path to .env file>"
  exit 1
fi

# Load environment variables from the specified .env file
set -o allexport
source "$1"
set -o allexport

# Cleanup previous resources
aws cloudformation delete-stack --stack-name TwilioS3VoicemailUploaderStack
aws s3 rb s3://$PACKAGE_BUCKET_NAME --force
aws iam delete-group-policy --group-name TwilioVoicemailUploaderDevs --policy-name SAMCLIUserPolicy
aws iam delete-policy --policy-arn arn:aws:iam::${AWS_ACCOUNT_ID}:policy/SAMCLIUserPolicy
# do not delete the group or else all of the users we might have had previously will require readding

# Create the temporary S3 bucket for packaging
aws s3 mb s3://$PACKAGE_BUCKET_NAME --region $AWS_REGION

# Create SAM CLI User Policy
aws iam create-policy --policy-name SAMCLIUserPolicy --policy-document '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:DeleteObject",
        "s3:PutBucketPolicy",
        "s3:PutBucketTagging",
        "s3:GetBucketLocation",
        "s3:GetBucketPolicy",
        "s3:PutEncryptionConfiguration"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:DeleteFunction",
        "lambda:InvokeFunction"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack",
        "cloudformation:DescribeStacks",
        "cloudformation:CreateChangeSet",
        "cloudformation:ExecuteChangeSet",
        "cloudformation:DescribeChangeSet",
        "cloudformation:DescribeStackEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PassRole"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "apigateway:GET",
        "apigateway:POST",
        "apigateway:PUT",
        "apigateway:DELETE",
        "apigateway:PATCH"
      ],
      "Resource": "*"
    }
  ]
}'

# Create the group
aws iam create-group --group-name TwilioVoicemailUploaderDevs

# Attach the policy to the group
aws iam attach-group-policy --group-name TwilioVoicemailUploaderDevs --policy-arn arn:aws:iam::${AWS_ACCOUNT_ID}:policy/SAMCLIUserPolicy

echo "SAMCLIUserPolicy and TwilioVoicemailUploaderDevs group created and configured."
echo "Temporary S3 bucket $PACKAGE_BUCKET_NAME created for packaging Lambda functions."

# Add the initial SAM build and deploy steps
sam build
sam deploy --stack-name TwilioS3VoicemailUploaderStack --capabilities CAPABILITY_NAMED_IAM
