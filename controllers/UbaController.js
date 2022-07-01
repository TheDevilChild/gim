const { BidArrayElement, BidArray, Uba, ScoreOfRound, AvgScoreOfRound } = require('../models/Uba');
const { v4: uuidv4 } = require('uuid');
const { ConnectionStates } = require('mongoose');

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
    for (let i = 0; i < game.noOfPlayers; i++) {
        game.finalScore.push(0);
        game.playersToBid.push(true);
        game.playersReady.push(false);
    }
    for (let i = 0; i < game.noOfRounds; i++) {
        const scoreOfRound = new ScoreOfRound({
            round: i
        });
        const avgScoreOfRound = new AvgScoreOfRound({
            round: i
        });
        for (let j = 0; j < game.noOfPlayers; j++) {
            scoreOfRound.score.push(0);
            avgScoreOfRound.avgScore.push(0);
        }
        await scoreOfRound.save();
        await avgScoreOfRound.save();
        game.scores.push(scoreOfRound._id);
        game.avgScores.push(avgScoreOfRound._id);
    }
    for (let i = 0; i < game.noOfRounds; i++) {
        const bidArray = new BidArray();
        for (let j = 1; j < 31; j++) {
            const bidArrayElement = new BidArrayElement({
                bidValue: j,
                bidUsers: []
            });
            await bidArrayElement.save();
            bidArray.bidArray.push(bidArrayElement._id);
        }
        await bidArray.save();
        game.bids.push(bidArray._id);
    }
    await game.save();
    res.render('Uba', { title: 'Uba', showNavbar: true, showFooter: true, roomId, isCreator: true });

};

const joinGame = async (req, res) => {
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
    const game = await Uba.findOne({ roomId: roomId });
    for (let i = 0; i < game.players.length; i++) {
        if (game.players[i].equals(playerId)) {
            if (!game.playersReady[i]) {
                game.playersReady[i] = true;
                await game.save();
            }
            break;
        }
    }
}

const clearReady = async (roomId, playerId) => {
    try {
        const game = await Uba.findOne({ roomId: roomId });
        game.playersReady[game.players.indexOf(playerId)] = false;
        await game.save();
    }
    catch (e) {
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
        console.log(e);
    }
}

const clearReadyAll = async (roomId) => {
    const game = await Uba.findOne({ roomId: roomId });
    for (let i = 0; i < game.playersReady.length; i++) {
        game.playersReady[i] = false;
    }
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
    const game = await Uba.findOne({ roomId: roomId });
    const bidArray = await BidArray.findById(game.bids[game.currentRound]);
    const avgScoreOfRound = await AvgScoreOfRound.findById(game.avgScores[game.currentRound]);
    let roundOver = false, gameOver = false;
    let roundEndInfo = null;
    const playerIndex = game.players.indexOf(playerId);
    try {
        for (let i = 0; i < bidValues.length; i++) {
            const bidArrayElement = await BidArrayElement.findById(bidArray.bidArray[bidValues[i] - 1]);
            bidArrayElement.bidUsers.push(playerId);
            avgScoreOfRound.avgScore[playerIndex] += parseInt(bidValues[i]);
            await bidArrayElement.save();
        }
    } catch (e) {
        console.log(e);
    }
    try {
        avgScoreOfRound.avgScore[playerIndex] = (avgScoreOfRound.avgScore[playerIndex] / bidValues.length);
        await avgScoreOfRound.save();
    } catch (e) {
        console.log(e);
    }
    try {
        game.playersToBid[playerIndex] = false;
        if (game.playersToBid.every(element => element === false)) {
            for (let i = 0; i < game.playersToBid.length; i++) {
                game.playersToBid[i] = true;
            }
            roundOver = true;
            game.currentRound++;
            game.playersToBid.forEach(element => element = true);
            await game.save();
            roundEndInfo = await calculateRoundResult(roomId);
            await clearReadyAll(roomId);
        } else {
            await game.save();
        }
        gameOver = await isGameOver(roomId);
    }
    catch (e) {
        console.log(e);
    }
    return { roundOver, gameOver, roundEndInfo };
}

const isGameOver = async(roomId) => {
    const game = await Uba.findOne({ roomId: roomId });
    if (game.currentRound === game.noOfRounds) {
        game.status = 'finished';
        await game.save();
        return  true;
    }   
    return false;
}

const calculateRoundResult = async (roomId) => {
    const game = await Uba.findOne({ roomId: roomId });
    const bidArray = await BidArray.findById(game.bids[game.currentRound - 1]).populate('bidArray');
    const scoreOfRound = await ScoreOfRound.findById(game.scores[game.currentRound - 1]);
    const avgScoreOfRound = await AvgScoreOfRound.findById(game.avgScores[game.currentRound - 1]);

    const utility = bidArray.bidArray.filter(element => element.bidUsers.length > 0);
    utility.sort((a, b) => b.bidValue - a.bidValue);
    const highestBid = utility.reduce((acc, curr) => {
        return acc.bidUsers.length > curr.bidUsers.length ? curr : acc;
    });
    const lowestBid = utility.reduce((acc, curr) => {
        return acc.bidUsers.length >= curr.bidUsers.length ? curr : acc;
    });

    for (let i = 0; i < lowestBid.bidUsers.length; i++) {
        const playerIndex = game.players.indexOf(lowestBid.bidUsers[i]);
        scoreOfRound.score[playerIndex] += 25_000;
    }
    for (let i = 0; i < highestBid.bidUsers.length; i++) {
        const playerIndex = game.players.indexOf(highestBid.bidUsers[i]);
        scoreOfRound.score[playerIndex] += 50_000;
    }
    for (let i = 0; i < scoreOfRound.score.length; i++) {
        if (scoreOfRound.score[i] > 0) {
            scoreOfRound.score[i] -= avgScoreOfRound.avgScore[i] * 1_000;
        }
        game.finalScore[i] += scoreOfRound.score[i];
    }
    await scoreOfRound.save();
    await game.save();
    const playersPlaying = await getPlayersList(roomId);
    return { frequency: utility, lowestBid, highestBid, scoreOfRound, players : playersPlaying, round: game.currentRound}; 
}

const getFinishedGame = async (roomId) => {
    const game = await Uba.findOne({ roomId: roomId }).populate('players');
    const arr = [];
    for (let i = 0; i < game.finalScore.length; i++) {
        arr.push({ player: game.players[i].username, score: game.finalScore[i] });
    }
    arr.sort((a, b) => b.score - a.score);
    return arr;
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
    makeBid,
    calculateRoundResult,
    getFinishedGame,
    getNoOfRounds,
    getReadyCount,
    getCurrentRoundNumber
};