const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
    friendId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    }
});

const Friend = mongoose.model('Friend', friendSchema);

module.exports = Friend;