const { FiveInARow, Board, Cell, History } = require('../models/FiveInARow');
const { v4: uuidv4 } = require('uuid');
const MAX_CELL_INDEX = 6;
const MAX_ROUNDS = 2;
const MAX_PLAYERS = 2;
const MAX_MOVES_PER_ROUND = (MAX_CELL_INDEX + 1) * (MAX_CELL_INDEX + 1);

const createGame = async (req, res) => {
    const { password } = req.body;
    if (password.trim() === '') {
        req.flash('danger', 'Password is required');
        return res.redirect('/play/FiveInARow/create');
    }
    const roomId = uuidv4();
    const game = await new FiveInARow({
        roomId: roomId,
        password: password,
        players: [req.user._id],
        maxPlayers: MAX_PLAYERS,
        currentAttacker: req.user._id,
        currentDefender: null,
        noOfMoves: [0],
        maxRounds: MAX_ROUNDS,
        currentRound: 0
    });
    for (let k = 0; k < MAX_ROUNDS; k++) {
        const board = new Board();
        for (let i = 0; i < MAX_CELL_INDEX + 1; i++) {
            for (let j = 0; j < MAX_CELL_INDEX + 1; j++) {
                const cell = new Cell({
                    x: i,
                    y: j,
                    value: null
                });
                await cell.save();
                board.cells.push(cell._id);
            }
        }
        await board.save();
        game.boards.push(board._id);
    }
    await game.save();
    res.render('FiveInARow', { title: '5InARow', showNavbar: true, showFooter: true, roomId, isCreator: true });
};

const joinGame = async (req, res) => {
    const { roomId, password } = req.body;
    const game = await FiveInARow.findOne({ roomId: roomId, password: password });
    if (roomId.trim() === '' || password.trim() === '') {
        req.flash('danger', 'Room Id and Password are required');
        return res.redirect('/play/FiveInARow/join');
    }
    if (game && game.status !== 'finished' && !game.players.includes(req.user._id)) {
        if (game.players.length < MAX_PLAYERS) {
            game.players.push(req.user._id);
            game.currentDefender = req.user._id;
            game.noOfMoves.push(0);
            if (game.players.length === MAX_PLAYERS) {
                game.status = 'playing';
            }
            await game.save();
        }
        else {
            res.flash('error', 'Game is full');
            return res.redirect('/');
        }
    }
    res.render('FiveInARow', { title: '5InARow', showNavbar: true, showFooter: true, roomId, isCreator: false });
};

const getPlayersList = async (roomId) => {
    const game = await FiveInARow.find({ roomId: roomId })
        .populate('players');
    return game[0].players;
}

const isYourTurn = async (roomId, playerId) => {
    let game = await FiveInARow.find({ roomId: roomId })
        .populate('currentAttacker').populate('currentDefender');
    if ((game[0].currentAttacker?._id.equals(playerId) && game[0].currentTurn === 'attacker')
        || game[0].currentDefender?._id.equals(playerId) && game[0].currentTurn === 'defender') {
        return true;
    }
    return false;
}

const notOccupied = async (roomId, x, y) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    const board = await Board.findById(game.boards[game.currentRound]);
    const cell = await Cell.findById(board.cells[x * (MAX_CELL_INDEX + 1) + y]);
    return cell.value === null;
}

const colorCell = async (roomId, x, y) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    const board = await Board.findById(game.boards[game.currentRound]);
    const cell = await Cell.findById(board.cells[x * (MAX_CELL_INDEX + 1) + y]);
    const lastMove = new History();
    lastMove.round = game.currentRound;
    lastMove.move = [x, y];
    lastMove.moveNo = game.noOfMoves[game.currentRound] + 1;
    if (game.currentTurn === 'attacker') {
        lastMove.player = game.currentAttacker;
        lastMove.action = 'attacked';
        cell.value = 'red';
        game.currentTurn = 'defender';
    }
    else {
        lastMove.player = game.currentDefender;
        lastMove.action = 'defended';
        cell.value = 'blue';
        game.currentTurn = 'attacker';
    }
    await lastMove.save();
    game.gameHistory.push(lastMove._id);
    await cell.save();
    game.noOfMoves[game.currentRound]++;
    await game.save();
    return cell.value;
}

const getLastMove = async (roomId) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    const lastMove = await History.findById(game.gameHistory[game.gameHistory.length - 1]).populate('player');
    return lastMove;
}

const getReadyCount = async (roomId) => {
    const game = await FiveInARow.find({ roomId: roomId });
    let count = 0;
    game[0].playersReady.forEach(player => {
        if (player) {
            count++;
        }
    });
    return count;
}

const getCurrentPlayer = async (roomId) => {
    const game = await FiveInARow.find({ roomId: roomId }).populate('currentAttacker').populate('currentDefender');
    if (game[0].currentTurn === 'attacker') {
        return game[0].currentAttacker;
    } else {
        return game[0].currentDefender;
    }
}

const checkDirection = async (board, x, y, dx, dy) => {
    let count = 0;
    let currentX = x + dx;
    let currentY = y + dy;
    while (currentX >= 0 && currentX <= MAX_CELL_INDEX && currentY >= 0 && currentY <= MAX_CELL_INDEX) {
        const cell = await Cell.findById(board.cells[currentX * (MAX_CELL_INDEX + 1) + currentY]);
        if (cell.value === null || cell.value === undefined || cell.value === '' || cell.value === 'blue') {
            break;
        }
        else if (cell.value === 'red') {
            count++;
        }
        currentX += dx;
        currentY += dy;
    }
    return count;
}

const isWinningTurn = async (roomId, x, y) => {
    const game = await FiveInARow.find({ roomId: roomId });
    const board = await Board.findById(game[0].boards[game[0].currentRound]);
    for (let dx = -1; dx < 2; dx++) {
        for (let dy = -1; dy < 2; dy++) {
            if (dx === 0 && dy === 0) {
                continue;
            }
            let count = 1;
            count += await checkDirection(board, x, y, dx, dy);
            count += await checkDirection(board, x, y, -dx, -dy);
            if (count >= 5) {
                return true;
            }
            else if (count === 4) {
                game[0].countFours[game[0].currentRound]++;
                await game[0].save();
            }
        }
    }
    return false;
}

const calculateWinner = async (roomId) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    if (game.madeFiveInARow[0] && game.madeFiveInARow[1]) {
        if (game.noOfMoves[0] < game.noOfMoves[1]) {
            game.winner = game.players[0];
            game.looser = game.players[1];
        } else if (game.noOfMoves[0] > game.noOfMoves[1]) {
            game.winner = game.players[1];
            game.looser = game.players[0];
        } else {
            game.winner = null;
            game.looser = null;
        }
    } else if (game.madeFiveInARow[0]) {
        game.winner = game.players[0];
        game.looser = game.players[1];
    } else if (game.madeFiveInARow[1]) {
        game.winner = game.players[1];
        game.looser = game.players[0];
    }
    else {
        if (game.countFours[0] < game.countFours[1]) {
            game.winner = game.players[1];
            game.looser = game.players[0];
        } else if (game.countFours[0] > game.countFours[1]) {
            game.winner = game.players[0];
            game.looser = game.players[1];
        } else {
            game.winner = null;
            game.looser = null;
        }
    }
    await game.save();
}

const makeTurn = async (roomId, x, y) => {
    const color = await colorCell(roomId, x, y);
    const game = await FiveInARow.find({ roomId: roomId });
    let roundOver = false;
    let gameOver = false;
    if (game[0].currentTurn === 'defender') {
        const isWinning = await isWinningTurn(roomId, x, y);
        if (isWinning) {
            game[0].madeFiveInARow[game[0].currentRound] = true;
        }
        if (isWinning || game[0].noOfMoves[game[0].currentRound] === MAX_MOVES_PER_ROUND || (game[0].currentRound === 1 && game[0].noOfMoves[0] === game[0].noOfMoves[1])) {
            roundOver = true;
            game[0].currentRound++;
            game[0].currentTurn = 'attacker';
            if (game[0].currentRound === game[0].maxRounds) {
                gameOver = true;
                game[0].status = 'finished';
                await calculateWinner(roomId);
            }else {
                const temp = game[0].currentAttacker;
                game[0].currentAttacker = game[0].currentDefender;
                game[0].currentDefender = temp;
            }
            await game[0].save();
        }
        
    }
    return { color, roundOver, gameOver };
}



const getBoard = async (roomId) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    const board = await Board.findById(game.boards[game.currentRound]).populate('cells');
    const boardArray = new Array(MAX_CELL_INDEX + 1);
    for (let i = 0; i < boardArray.length; i++) {
        boardArray[i] = new Array(MAX_CELL_INDEX + 1);
        for (let j = 0; j < boardArray[i].length; j++) {
            boardArray[i][j] = board.cells[i * (MAX_CELL_INDEX + 1) + j].value === null ? '' : board.cells[i * (MAX_CELL_INDEX + 1) + j].value;
        }
    }
    return boardArray;
}

const getNoOfPlayers = async (roomId) => {
    const game = await FiveInARow.find({ roomId: roomId });
    return game[0].maxPlayers;
}

const getCurrentRoundNumber = async (roomId) => {
    const game = await FiveInARow.find({ roomId: roomId });
    return game[0].currentRound + 1;
}

const getNoOfRounds = async (roomId) => {
    const game = await FiveInARow.find({ roomId: roomId });
    return game[0].maxRounds;
}

const setReady = async (roomId, playerId) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    for (let i = 0; i < game.players.length; i++) {
        if (game.players[i]._id.equals(playerId)) {
            if (!game.playersReady[i]) {
                game.playersReady[i] = true;
                await game.save();
            }
            break;
        }
    }
}

const clearReady = async (roomId, playerId) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    for (let i = 0; i < game.players.length; i++) {
        if (game.players[i]._id.equals(playerId)) {
            if (game.playersReady[i]) {
                game.playersReady[i] = false;
                await game.save();
            }
            break;
        }
    }
}

const areAllReady = async (roomId) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    for (let i = 0; i < game.playersReady.length; i++) {
        if (!game.playersReady[i]) {
            return false;
        }
    }
    return true;
}

const clearReadyAll = async (roomId) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    for (let i = 0; i < game.playersReady.length; i++) {
        game.playersReady[i] = false;
    }
    await game.save();
}

const getFinishedGame = async (roomId) => {
    const game = await FiveInARow.findOne({ roomId: roomId }).populate('winner').populate('loser');
    return game;
}

module.exports = {
    createGame,
    joinGame,
    getPlayersList,
    isYourTurn,
    notOccupied,
    makeTurn,
    getBoard,
    setReady,
    clearReady,
    areAllReady,
    getFinishedGame,
    getNoOfPlayers,
    getReadyCount,
    clearReadyAll,
    getLastMove,
    getCurrentRoundNumber,
    getNoOfRounds,
    getCurrentPlayer
};