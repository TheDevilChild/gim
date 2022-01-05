const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    chatMessages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    chatMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
});

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;