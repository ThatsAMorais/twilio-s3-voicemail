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
      body: JSON.stringify({ message: 'Invalid input: no body' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    console.error('Error parsing JSON body:', err);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid JSON format' })
    };
  }

  const voicemailUrl = body.RecordingUrl;

  if (!voicemailUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'No voicemail URL provided' })
    };
  }

  try {
    console.log('Fetching voicemail from URL:', voicemailUrl);
    const voicemailData = await fetchVoicemail(voicemailUrl);
    console.log('Voicemail fetched successfully.');

    console.log('Uploading voicemail to S3...');
    const s3Response = await uploadToS3(voicemailData);
    console.log('Voicemail uploaded to S3 successfully.');

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
