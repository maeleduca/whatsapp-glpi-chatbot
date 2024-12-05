const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { handleMessage } = require('./handlers/messageHandler');
const { connectDB } = require('./config/database');
require('dotenv').config();

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

// Generate QR Code for WhatsApp Web
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code generated. Scan with WhatsApp to start the session.');
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

client.on('message', async (message) => {
    await handleMessage(client, message);
});

// Connect to MongoDB and start the client
const startServer = async () => {
    try {
        await connectDB();
        await client.initialize();
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};

startServer();