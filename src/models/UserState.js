const mongoose = require('mongoose');

const userStateSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    email: String,
    sessionToken: String,
    currentState: {
        type: String,
        enum: ['INITIAL', 'WAITING_EMAIL', 'WAITING_PASSWORD', 'WAITING_DESCRIPTION'],
        default: 'INITIAL'
    },
    lastInteraction: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('UserState', userStateSchema);