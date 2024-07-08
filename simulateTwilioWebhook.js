const axios = require('axios');
require('dotenv').config({ path: '.env.admin' });

const apiEndpoint = process.env.API_ENDPOINT;
const voicemailUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

const simulateTwilioWebhook = async () => {
  try {
    const response = await axios.post(apiEndpoint, {
      RecordingUrl: voicemailUrl
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Response from Lambda:', response.data);
  } catch (error) {
    console.error('Error simulating Twilio webhook:', error.response ? error.response.data : error.message);
  }
};

simulateTwilioWebhook();
