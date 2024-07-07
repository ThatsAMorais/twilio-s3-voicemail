const { handler } = require('../index');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const nock = require('nock');

process.env.BUCKET_NAME = 'my-test-bucket';

// Mocking the S3Client and PutObjectCommand
jest.mock('@aws-sdk/client-s3', () => {
  const mockS3Client = {
    send: jest.fn().mockResolvedValue({ Key: 'test-key.mp3' }),
  };

  return {
    S3Client: jest.fn(() => mockS3Client),
    PutObjectCommand: jest.fn(),
  };
});

describe('Lambda Function', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    nock.cleanAll();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should upload voicemail to S3', async () => {
    const recordingUrl = 'https://api.twilio.com/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Recordings/REXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
    nock('https://api.twilio.com')
      .get('/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Recordings/REXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
      .reply(200, Buffer.from('audio content'));

    const event = {
      body: JSON.stringify({ RecordingUrl: recordingUrl, RecordingSid: 'REXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' })
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.message).toBe('Voicemail uploaded successfully');
    expect(responseBody.s3Response.Key).toMatch(/\.mp3$/);
  });

  it('should handle errors gracefully', async () => {
    const recordingUrl = 'https://api.twilio.com/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Recordings/REXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
    nock('https://api.twilio.com')
      .get('/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Recordings/REXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
      .reply(404);

    const event = {
      body: JSON.stringify({ RecordingUrl: recordingUrl })
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    const responseBody = JSON.parse(response.body);
    expect(responseBody.message).toBe('Failed to upload voicemail');
  });
});
