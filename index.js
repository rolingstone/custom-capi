const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PIXEL_ID = process.env.PIXEL_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const APP_ID = process.env.APP_ID;

function sha256(value) {
  return crypto.createHash('sha256').update(value.toString().trim().toLowerCase()).digest('hex');
}

app.post('/webhook', async (req, res) => {
  console.log('Incoming webhook:', req.body);
  const { email, phone, ...rest } = req.body || {};
  const user_data = {};
  if (email) {
    user_data.em = [sha256(email)];
  }
  if (phone) {
    user_data.ph = [sha256(phone)];
  }
  const event = {
    data: [
      {
        event_name: rest.event_name || 'custom',
        event_time: Math.floor(Date.now() / 1000),
        user_data,
        custom_data: rest.custom_data || {},
        app_id: APP_ID
      }
    ]
  };
  try {
    const response = await fetch(`https://graph.facebook.com/v17.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    const body = await response.json();
    console.log('Meta response:', body);
    if (!response.ok) {
      console.error('Meta API error:', body);
      return res.status(500).json({ error: 'Meta API error', details: body });
    }
    res.json({ success: true, meta: body });
  } catch (err) {
    console.error('Failed to send to Meta:', err);
    res.status(500).json({ error: 'Failed to send to Meta' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
