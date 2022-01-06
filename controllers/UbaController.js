const { BidArrayElement, BidArray, Uba, ScoreOfRound, AvgScoreOfRound } = require('../models/Uba');
const { v4: uuidv4 } = require('uuid');

module.exports.createGame = async (req, res) => {
    const { password, noOfPlayers, noOfRounds } = req.body;
    const roomId = uuidv4();
    const game = await new Uba({
        roomId: roomId,
        password: password,
        players: [req.user._id],
        noOfPlayers: noOfPlayers,
        noOfRounds: noOfRounds
    });
    for (let i = 0; i < noOfPlayers; i++) {
        Uba.finalScore.push(0);
        Uba.playersToBid.push(true);
    }
    for (let i = 0; i < noOfRounds; i++) {
        const scoreOfRound = new ScoreOfRound({
            round: i
        });
        const avgScoreOfRound = new AvgScoreOfRound({
            round: i
        });

        for (let j = 0; j < noOfPlayers; j++) {
            scoreOfRound.avgScore.push(0);
            avgScoreOfRound.avgScore.push(0);
        }
        scoreOfRound.save();
        avgScoreOfRound.save();
        game.scores.push(scoreOfRound._id);
        game.avgScores.push(avgScoreOfRound._id);
    }
    for (let i = 0; i < noOfRounds; i++) {
        const bidArray = new BidArray();
        for (let j = 0; j < 31; j++) {
            const bidArrayElement = new BidArrayElement({
                bidValue: j,
                bidUsers: []
            });
            bidArrayElement.save();
            BidArray.bidArray.push(bidArrayElement._id);
        }
        bidArray.save();
        game.bids.push(bidArray._id);
    }
    game.save();
    res.render('games/Uba', { game: game });
};

module.exports.joinGame = async (req, res) => {
    const { roomId, password } = req.body;
    const game = await Uba.findOne({ roomId: roomId, password: password });
    if (game && game.status !== 'finished' && !game.players.contains(req.user._id)) {
        if (game.players.length < game.noOfPlayers) {
            game.players.push(req.user._id);
            if (game.players.length === game.noOfPlayers) {
                game.status = 'playing';
            }
            game.save();
        }
        else {
            res.flash('error', 'Game is full');
            return res.redirect('/');
        }
    }
    res.render('games/Uba', { game: game });
}

module.exports.getPlayersList = async (roomId) => {
    const game = await Uba.findOne({ roomId: roomId }).populate('players');
    return game.players;
}

module.exports.getBidArray = async (roomId, round) => {
    const game = await Uba.findOne({ roomId: roomId }).populate('bids');
    return game.bids[round];
}

module.exports.getScoreOfRound = async (roomId, round) => {
    const game = await Uba.findOne({ roomId: roomId }).populate('scores');
    return game.scores[round];
}

module.exports.getAvgScoreOfRound = async (roomId, round) => {
    const game = await Uba.findOne({ roomId: roomId }).populate('avgScores');
    return game.avgScores[round];
}

module.exports.getFinalScore = async (roomId) => {
    const game = await Uba.findOne({ roomId: roomId }).populate('finalScore');
    return game.finalScore;
}

module.getNoOfPlayers = async (roomId) => {
    const game = await Uba.findOne({ roomId: roomId });
    return game.noOfPlayers;
}

module.exports.setReady = async (roomId, playerId) => {
    const game = await Uba.findById(roomId);
    game.playersReady[game.players.indexOf(playerId)] = true;
    game.save();
}

module.exports.clearReady = async (roomId, playerId) => {
    const game = await Uba.findById(roomId);
    game.playersReady[game.players.indexOf(playerId)] = false;
    game.save();
}

module.exports.areAllReady = async (roomId) => {
    const game = await Uba.findById(roomId);
    const ready = game.playersReady.every(element => element === true);
    return ready;
}

const clearReadyAll = async (roomId) => {
    const game = await Uba.findById(roomId);
    game.playersReady.forEach(element => {
        element = false;
    });
    game.save();
}

module.exports.makeBid = async (roomId, playerId, bidValues) => {
    const game = await Uba.findOne({ roomId: roomId }).populate('bids');
    const bidArray = await BidArray.findById(game.bids[game.currentRound]);
    const avgScoreOfRound = await AvgScoreOfRound.findById(game.avgScores[game.currentRound]);
    let roundOver = false, gameOver = false;
    const playerIndex = game.players.indexOf(playerId);
    for (let i = 0; i < bidValues.length; i++) {
        const bidArrayElement = await BidArrayElement.findById(bidArray.bidArray[bidValues[i]]);
        bidArrayElement.bidUsers.push(playerId);
        avgScoreOfRound[playerIndex] += bidValues[i];
        bidArrayElement.save();
    }
    avgScoreOfRound[playerIndex] = (avgScoreOfRound[playerIndex] / bidValues.length);
    avgScoreOfRound.save();
    game.playersToBid[playerIndex] = false;
    if (game.playersToBid.every(element => element === false)) {
        roundOver = true;
        game.currentRound++;
        game.playersToBid.forEach(element => element = true);
        clearReadyAll(roomId);
    }
    if (game.currentRound === game.noOfRounds) {
        game.status = 'finished';
        gameOver = true;
    }
    game.save();
    return { roundOver, gameOver };
}

module.exports.calculateRoundResult = async (roomId) => {
    const game = await Uba.findOne({ roomId: roomId });
    const bidArray = await BidArray.findById(game.bids[game.currentRound - 1]).populate('bidArray');
    const scoreOfRound = await ScoreOfRound.findById(game.scores[game.currentRound - 1]);
    const avgScoreOfRound = await AvgScoreOfRound.findById(game.avgScores[game.currentRound - 1]);

    const utility = bidArray.bidArray.filter(element => element.bidUsers.length > 0);

    utility.sort((a, b) => b.bidValue - a.bidValue);

    const lowestBid = utility.reduce((acc, curr) => {
        return acc.persons.length > curr.persons.length ? curr : acc;
    });
    const highestBid = utility.reduce((acc, curr) => {
        return acc.persons.length >= curr.persons.length ? curr : acc;
    });

    for (let i = 0; i < lowestBid.bidUsers.length; i++) {
        const playerIndex = game.players.indexOf(lowestBid.bidUsers[i]);
        scoreOfRound.avgScore[playerIndex] += 25_000;
    }
    for (let i = 0; i < highestBid.bidUsers.length; i++) {
        const playerIndex = game.players.indexOf(highestBid.bidUsers[i]);
        scoreOfRound.avgScore[playerIndex] += 50_000;
    }
    for (let i = 0; i < scoreOfRound.length; i++) {
        if (scoreOfRound[i] > 0) {
            scoreOfRound[i] -= avgScoreOfRound[i] * 1_000;
        }
        game.finalScore[i] += scoreOfRound[i];
    }
    scoreOfRound.save();
    game.save();
}

module.exports.getFinishedGame = async (roomId) => {
    const game = await Uba.findById(roomId);
    return game;
}