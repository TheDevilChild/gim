const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }],
    members: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
});

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;