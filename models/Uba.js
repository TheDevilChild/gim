const mongoose = require('mongoose');

const bidArrayElementSchema = new mongoose.Schema({
    bidValue: {
        type: Number,
        required: true,
        min: 1,
        max: 30
    },
    bidUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const BidArrayElement = mongoose.model('BidArrayElement', bidArrayElementSchema);

const bidArraySchema = new mongoose.Schema({
    bidArray: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'BidArrayElement'
    }
});

const BidArray = mongoose.model('BidArray', bidArraySchema);

const scoreOfRoundSchema = new mongoose.Schema({
    score: {
        type: [Number],
        required: true
    },
    round: {
        type: Number,
        required: true
    }
});
const ScoreOfRound = mongoose.model('ScoreOfRound', scoreOfRoundSchema);

const avgScoreOfRoundSchema = new mongoose.Schema({
    avgScore: {
        type: [Number],
        required: true
    },
    round: {
        type: Number,
        required: true
    }
});

const AvgScoreOfRound = mongoose.model('AvgScoreOfRound', avgScoreOfRoundSchema);

const ubaSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    players: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        required: true
    },
    noOfPlayers: {
        type: Number,
        default: 3
    },
    currentRound: {
        type: Number,
        default: 0
    },
    noOfRounds: {
        type: Number,
        default: 3
    },
    currentTurn: {
        type: Number,
        default: 0
    },
    playersReady: {
        type: [Boolean],
        default: []
    },
    winningOrder: {
        type: [Number],
        default: []
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['waiting', 'playing', 'finished'],
        default: 'waiting'
    },
    playersToBid: {
        type: [Boolean],
        default: []
    },
    finalScore: {
        type: [Number],
        default: []
    },
    bids: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'BidArray',
        default: []
    },
    scores: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'ScoreOfRound',
        default: []
    },
    avgScores: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'AvgScoreOfRound',
        default: []
    }
});

const Uba = mongoose.model('Uba', ubaSchema);

module.exports = { BidArrayElement, BidArray, Uba, ScoreOfRound, AvgScoreOfRound };