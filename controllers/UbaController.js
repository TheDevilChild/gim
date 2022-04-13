const { BidArrayElement, BidArray, Uba, ScoreOfRound, AvgScoreOfRound } = require('../models/Uba');
const { v4: uuidv4 } = require('uuid');

const createGame = async (req, res) => {
    const { password, noOfPlayers, noOfRounds } = req.body;
    if (password.trim() === '') {
        req.flash('danger', 'Password is required');
        return res.redirect('/play/Uba/create');
    }
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
        await scoreOfRound.save();
        await avgScoreOfRound.save();
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
            await bidArrayElement.save();
            BidArray.bidArray.push(bidArrayElement._id);
        }
        await bidArray.save();
        game.bids.push(bidArray._id);
    }
    console.log('hi');
    await game.save();
    res.render('Uba', { title: 'Uba', showNavbar: true, showFooter: true, roomId, isCreator: true });

};

const joinGame = async (req, res) => {
    console.log('hello');
    const { roomId, password } = req.body;
    const game = await Uba.findOne({ roomId: roomId, password: password });
    if (roomId.trim() === '' || password.trim() === '') {
        req.flash('danger', 'Room Id and Password are required');
        return res.redirect('/play/Uba/join');
    }
    if (game && game.status !== 'finished' && !game.players.includes(req.user._id)) {
        if (game.players.length < game.noOfPlayers) {
            game.players.push(req.user._id);
            if (game.players.length === game.noOfPlayers) {
                game.status = 'playing';
            }
            await game.save();
        }
        else {
            res.flash('error', 'Game is full');
            return res.redirect('/');
        }
    }
    res.render('Uba', { title: 'Uba', showNavbar: true, showFooter: true, roomId, isCreator: false });
}

const getPlayersList = async (roomId) => {
    const game = await Uba.findOne({ roomId: roomId }).populate('players');
    return game.players;
}

const getBidArray = async (roomId, round) => {
    const game = await Uba.findOne({ roomId: roomId }).populate('bids');
    return game.bids[round];
}

const getScoreOfRound = async (roomId, round) => {
    const game = await Uba.findOne({ roomId: roomId }).populate('scores');
    return game.scores[round];
}

const getAvgScoreOfRound = async (roomId, round) => {
    const game = await Uba.findOne({ roomId: roomId }).populate('avgScores');
    return game.avgScores[round];
}

const getFinalScore = async (roomId) => {
    const game = await Uba.findOne({ roomId: roomId }).populate('finalScore');
    return game.finalScore;
}

const getNoOfPlayers = async (roomId) => {
    const game = await Uba.find({ roomId: roomId });
    return game[0].noOfPlayers;
}

const setReady = async (roomId, playerId) => {
    // try {
    //     const game = await Uba.findOne({ roomId: roomId });
    //     game.playersReady[game.players.indexOf(playerId)] = true;
    //     await game.save();
    // } catch (e) {
    //     console.log(e);
    // }

    const game = await Uba.findOne({ roomId: roomId });
    console.log(game.playersReady);
    for (let i = 0; i < game.players.length; i++) {
        if (game.players[i]._id.equals(playerId)) {
            if (!game.playersReady[i]) {
                game.playersReady[i] = true;
                await game.save();
            }
            break;
        }
    }
    console.log(game.playersReady);
}

const clearReady = async (roomId, playerId) => {
    try {
        const game = await Uba.findOne({ roomId: roomId });
        game.playersReady[game.players.indexOf(playerId)] = false;
        await game.save();
    }
    catch (e) {
        console.log(2343);
        console.log(e);
    }
}

const areAllReady = async (roomId) => {
    try {
        const game = await Uba.findOne({ roomId: roomId });
        for (let i = 0; i < game.playersReady.length; i++) {
            if (!game.playersReady[i]) {
                return false;
            }
        }
        return true;
    } catch (e) {
        console.log(23);
        console.log(e);
    }
}

const clearReadyAll = async (roomId) => {
    const game = await Uba.findById(roomId);
    game.playersReady.forEach(element => {
        element = false;
    });
    await game.save();
}

const getReadyCount = async (roomId) => {
    const game = await Uba.find({ roomId: roomId });
    let count = 0;
    game[0].playersReady.forEach(player => {
        if (player) {
            count++;
        }
    });
    return count;
}

const getCurrentRoundNumber = async (roomId) => {
    const game = await Uba.find({ roomId: roomId });
    return game[0].currentRound + 1;
}

const makeBid = async (roomId, playerId, bidValues) => {
    const game = await Uba.findOne({ roomId: roomId }).populate('bids');
    const bidArray = await BidArray.findById(game.bids[game.currentRound]);
    const avgScoreOfRound = await AvgScoreOfRound.findById(game.avgScores[game.currentRound]);
    let roundOver = false, gameOver = false;
    const playerIndex = game.players.indexOf(playerId);
    for (let i = 0; i < bidValues.length; i++) {
        const bidArrayElement = await BidArrayElement.findById(bidArray.bidArray[bidValues[i]]);
        bidArrayElement.bidUsers.push(playerId);
        avgScoreOfRound[playerIndex] += bidValues[i];
        await bidArrayElement.save();
    }
    avgScoreOfRound[playerIndex] = (avgScoreOfRound[playerIndex] / bidValues.length);
    await avgScoreOfRound.save();
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
    await game.save();
    return { roundOver, gameOver };
}

const calculateRoundResult = async (roomId) => {
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
    await scoreOfRound.save();
    await game.save();
}

const getFinishedGame = async (roomId) => {
    const game = await Uba.findById(roomId);
    return game;
}

const getNoOfRounds = async (roomId) => {
    const game = await Uba.find({ roomId: roomId });
    return game[0].noOfRounds;
}

module.exports = {
    createGame,
    joinGame,
    getPlayersList,
    getBidArray,
    getScoreOfRound,
    getAvgScoreOfRound,
    getFinalScore,
    getNoOfPlayers,
    setReady,
    clearReady,
    areAllReady,
    clearReadyAll,
    makeBid,
    calculateRoundResult,
    getFinishedGame,
    getNoOfRounds,
    getReadyCount,
    getCurrentRoundNumber
};