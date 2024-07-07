const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const https = require('https');

const BUCKET_NAME = process.env.BUCKET_NAME;
const s3Client = new S3Client({ region: 'us-east-1' });

function generateFileName() {
  return `voicemail-${crypto.randomUUID()}.mp3`;
}

exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid input' })
    };
  }

  const body = JSON.parse(event.body);
  const voicemailUrl = body.RecordingUrl;

  if (!voicemailUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'No voicemail URL provided' })
    };
  }

  try {
    const voicemailData = await fetchVoicemail(voicemailUrl);
    const s3Response = await uploadToS3(voicemailData);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Voicemail uploaded successfully',
        s3Response
      })
    };
  } catch (error) {
    console.error('Error uploading voicemail:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to upload voicemail', error: error.message })
    };
  }
};

const fetchVoicemail = async (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = [];
      res.on('data', (chunk) => {
        data.push(chunk);
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(Buffer.concat(data));
        } else {
          reject(new Error(`Failed to fetch voicemail, status code: ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

const uploadToS3 = async (voicemailData) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: generateFileName(),
    Body: voicemailData,
    ServerSideEncryption: 'AES256'
  };

  const command = new PutObjectCommand(params);
  return s3Client.send(command);
};
