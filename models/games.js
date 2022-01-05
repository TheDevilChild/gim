const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    gameName: {
        type: String,
        required: true
    },
    gameDescription: {
        type: String,
        required: true
    },
    gameImage: {
        type: String,
        required: true
    },
    gameType: {
        type: String,
        required: true
    },
    gamePlayers: {
        type: String,
        required: true
    },
    gameTime: {
        type: String,
        required: true
    },
    gameLocation: {
        type: String,
        required: true
    },
    gameCreator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    gamePlayers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    gameReviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }]
}, { timestamps: true });
