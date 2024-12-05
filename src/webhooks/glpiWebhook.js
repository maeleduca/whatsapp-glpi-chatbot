const express = require('express');
const { Client } = require('whatsapp-web.js');
const UserState = require('../models/UserState');

const router = express.Router();

router.post('/ticket-update', async (req, res) => {
    try {
        const { ticket_id, user_phone, update_description } = req.body;
        
        const userState = await UserState.findOne({ phoneNumber: user_phone });
        
        if (userState) {
            const message = `Atualização do chamado #${ticket_id}:\n${update_description}`;
            await client.sendMessage(user_phone, message);
        }
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;