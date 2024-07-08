# Twilio Voicemail Uploader Project

## Project Overview

This project provides a serverless solution to upload voicemails from Twilio to an S3 bucket using AWS Lambda and API Gateway. The setup involves creating specific IAM roles and policies for both admin and developer users to ensure secure and controlled access.

## Prerequisites

This project requires the following tools to be installed:

- [Node.js](https://nodejs.org/) (version 12.x or later)
- [npm](https://www.npmjs.com/get-npm) (usually comes with Node.js)
- [AWS CLI](https://aws.amazon.com/cli/) (version 2)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

You can install these tools using your operating system's package manager. For example, on macOS, you can use Homebrew, and on various Linux distributions, you can use `apt`, `dnf`, or similar package managers.

## Project Setup

### Cloning the Repository

Clone the repository to your local machine:

```bash
git clone https://github.com//twilio-s3-voicemail.git
cd twilio-s3-voicemail
```

### Installing Dependencies

Install the necessary npm packages:

```bash
npm install
```

## AWS Setup

The AWS setup involves creating specific IAM roles and policies for both admin and developer users.

### Admin Setup

An admin user with specific permissions is required to set up the initial infrastructure. Below is an example of the required permissions for the admin user.

Run the setup script with admin permissions:

```bash
./setup_infra.sh
```

This script will:
- Create the `SAMCLIUserPolicy` IAM policy.
- Create the `TwilioVoicemailUploaderDevs` IAM group.
- Attach the `SAMCLIUserPolicy` to the `TwilioVoicemailUploaderDevs` group.
- Create a temporary S3 bucket for packaging Lambda functions.

### Developer Setup

Developers should be added to the `TwilioVoicemailUploaderDevs` group. This group has the `SAMCLIUserPolicy` attached, which grants permissions to manage the project infrastructure via CloudFormation.

## Packaging and Deploying the CloudFormation Stack

1. **Configure AWS CLI for Developer User**:

   Developers should configure the AWS CLI with their credentials:

   ```bash
   aws configure
   ```

2. **Package the Application**:

   ```bash
   aws cloudformation package --template-file template.yaml --s3-bucket $PACKAGE_BUCKET_NAME --output-template-file packaged.yaml
   ```

3. **Deploy the Packaged Application**:

   ```bash
   aws cloudformation deploy --template-file packaged.yaml --stack-name TwilioS3UploaderStack --capabilities CAPABILITY_IAM --parameter-overrides S3BucketName=twilio-voicemail-storage TwilioVoicemailAPI=<your-api-gateway-id>
   ```

## Running the Automated Tests

To run the automated tests for the Lambda function, use the following command:

```bash
npm test
```

This will execute the tests defined in the `tests` folder. The tests use `jest` and `nock` to mock AWS SDK and HTTP requests.

## Lambda Function Behavior

The Lambda function is designed to receive a webhook request from Twilio containing the URL of a recorded voicemail. It then fetches the voicemail audio data from the provided URL and uploads it to an S3 bucket.

### Function Flow

1. **Receive Webhook Event**:
   - The function is triggered by an HTTP POST request containing the voicemail URL in the event body.

2. **Validate Input**:
   - The function checks if the event body contains a valid voicemail URL.

3. **Fetch Voicemail**:
   - The function fetches the voicemail audio data from the provided URL using HTTPS.

4. **Upload to S3**:
   - The function uploads the fetched voicemail audio data to the specified S3 bucket with server-side encryption.

5. **Return Response**:
   - The function returns a success response if the upload is successful, or an error response if it fails.


## Additional Information

### Separate Admin for Project Setup

For setting up the project initially, a separate admin user with specific permissions is required. This admin role is different from the developer role and is used only for the initial setup.

#### Admin Policy Example

Here is an example of the policy used for the admin user:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "iam:*",
                "s3:*",
                "cloudformation:*",
                "apigateway:*",
                "lambda:*"
            ],
            "Resource": "*"
        }
    ]
}
```
