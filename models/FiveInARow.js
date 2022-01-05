const mongoose = require('mongoose');
const MAX_CELL_INDEX = 6;
const MIN_CELL_INDEX = 0;
const MAX_PLAYERS = 2;

const cellSchema = new mongoose.Schema({
    x: {
        type: Number,
        max: MAX_CELL_INDEX,
        min: MIN_CELL_INDEX
    },
    y: {
        type: Number,
        max: MAX_CELL_INDEX,
        min: MIN_CELL_INDEX
    },
    value: {
        type: String,
        default: ''
    }
});
const Cell = mongoose.model('Cell', cellSchema);

const boardSchema = new mongoose.Schema({
    cells: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Cell',
        default: []
    }
});
const Board = mongoose.model('Board', boardSchema);

const fiveInARowSchema = new mongoose.Schema({
    // See if we will need board or boards
    boards: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Board'
    },
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
    maxPlayers: {
        type: Number,
        default: MAX_PLAYERS
    },
    currentAttacker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    currentDefender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    noOfMoves: {
        type: [Number],
        default: [0, 0]
    },
    countFours: {
        type: [Number],
        default: [0, 0]
    },
    madeFiveInARow: {
        type: [Boolean],
        default: [false, false]
    },
    maxRounds: {
        type: Number,
        default: 2
    },
    currentRound: {
        type: Number,
        default: 0
    },
    playersReady: {
        type: [Boolean],
        default: [false, false]
    },
    currentTurn: {
        type: String,
        enum: ['attacker', 'defender'],
        default: 'attacker'
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    loser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['waiting', 'playing', 'finished'],
        default: 'waiting'
    }
});

const FiveInARow = mongoose.model('FiveInARow', fiveInARowSchema);
module.exports = { FiveInARow, Board, Cell };

