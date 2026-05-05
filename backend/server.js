require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

// Twilio Setup
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER;
const adminNumbers = process.env.ADMIN_WHATSAPP_NUMBERS ? process.env.ADMIN_WHATSAPP_NUMBERS.split(',') : [];

let client;
if (accountSid && authToken && accountSid !== 'your_twilio_account_sid_here') {
    client = twilio(accountSid, authToken);
}

app.post('/api/create-post', async (req, res) => {
    const post = req.body;

    // Send WhatsApp alert to all admins
    if (client && adminNumbers.length > 0) {
        const message = `
📢 New Travel Listing Pending

Company: ${post.company || 'Unknown Company'}
Package: ${post.title || 'Unknown Package'}
Price: Rs ${Number(post.price || 0).toLocaleString()}

👉 Please review in admin panel
`;
        try {
            const promises = adminNumbers.map(num => {
                const formattedNum = num.trim().startsWith('whatsapp:') ? num.trim() : `whatsapp:${num.trim()}`;
                return client.messages.create({
                    from: twilioWhatsApp,
                    to: formattedNum,
                    body: message.trim()
                });
            });

            await Promise.all(promises);
            console.log('WhatsApp alerts sent successfully to admins.');
        } catch (error) {
            console.error('Failed to send WhatsApp alerts:', error);
            // We don't fail the request if WhatsApp fails, just log it.
        }
    } else {
        console.log('Twilio client not initialized or no admin numbers provided. Skipping WhatsApp alert.');
        console.log('Mock Alert for:', post.title);
    }

    // In a real production setup, you would save to a database here.
    // For this architecture, the frontend DataService handles the LocalStorage/Google Apps Script saving.
    res.json({ success: true, message: 'Post submitted and alerts processed.' });
});

app.listen(port, () => {
    console.log(`Travel backend listening at http://localhost:${port}`);
    if (!client) {
        console.log('⚠️ Twilio is NOT configured. Please update .env with real credentials.');
    }
});
