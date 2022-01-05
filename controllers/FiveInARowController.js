const { FiveInARow, Board, Cell } = require('../models/FiveInARow');
const MAX_CELL_INDEX = 6;
const MAX_ROUNDS = 2;

module.exports.createGame = async (req, res) => {
    const { password } = req.body;
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
                cell.save();
                board.cells.push(cell._id);
            }
        }
        board.save();
        game.boards.push(board._id);
    }
    game.save();
    res.render('games/FiveInARow', { game: game });
};

module.exports.joinGame = async (req, res) => {
    const { roomId, password } = req.body;
    const game = await FiveInARow.findOne({ roomId: roomId, password: password });
    if (game && game.status !== 'finished') {
        if (game.players.length < MAX_PLAYERS) {
            game.players.push(req.user._id);
            game.currentDefender = req.user._id;
            game.noOfMoves.push(0);
            if (game.players.length === MAX_PLAYERS) {
                game.status = 'playing';
            }
            game.save();
        }
        else {
            if (!game.players.contains(req.user._id)) {
                res.flash('error', 'Game is full');
                return res.redirect('/');
            }
        }
    }
    res.render('games/FiveInARow', { game: game });
};

module.exports.getPlayersList = async (roomId) => {
    const game = await FiveInARow.findOne({ roomId: roomId }).populate('players');
    return game.players;
}

module.exports.isYourTurn = async (roomId, playerId) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    if ((game.currentAttacker._id.equals(playerId) && currentTurn === 'attacker')
        || game.currentDefender._id.equals(playerId) && currentTurn === 'defender') {
        return true;
    }
    return false;
}

module.exports.notOccupied = async (roomId, x, y) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    const board = await Board.findById(game.boards[game.currentRound]);
    const cell = await Cell.findById(board.cells[x * (MAX_CELL_INDEX + 1) + y]);
    return cell.value === null;
}

const colorCell = async (roomId, x, y) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    const board = await Board.findById(game.boards[game.currentRound]);
    const cell = await Cell.findById(board.cells[x * (MAX_CELL_INDEX + 1) + y]);
    if (game.currentturn === 'attacker') {
        cell.value = 'red';
        game.currentTurn = 'defender';
    }
    else {
        cell.value = 'blue';
        game.currentTurn = 'attacker';
    }
    cell.save();
    game.noOfMoves[game.currentRound]++;
    game.save();
    return cell.value;
}

const clearReadyAll = async (roomId) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    game.playersReady.forEach(player => player = false);
};

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
    const game = await FiveInARow.findOne({ roomId: roomId });
    const board = await Board.findById(game.boards[game.currentRound]);
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
                game.countFour[game.currentRound]++;
                game.save();
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
    } else if(game.madeFiveInARow[0]) {
        game.winner = game.players[0];
        game.looser = game.players[1];
    } else if (game.madeFiveInARow[1]) {
        game.winner = game.players[1];
        game.looser = game.players[0];
    }
    else {
        if(game.noOfMoves[0] < game.noOfMoves[1]) {
            game.winner = game.players[1];
            game.looser = game.players[0];
        } else if(game.noOfMoves[0] > game.noOfMoves[1]) {
            game.winner = game.players[0];
            game.looser = game.players[1];
        } else {
            game.winner = null;
            game.looser = null;
        }
    }
    game.save();
}

module.exports.makeTurn = async (roomId, x, y) => {
    const color = await this.colorCell(roomId, x, y);
    let roundOver = false;
    let gameOver = false;
    if (game.currentTurn === 'defender' && await this.isWinningTurn(roomId, x, y)) {
        game.madeFiveInARow[game.currentRound] = true;
        roundOver = true;
        this.clearReadyAll(roomId);
        const game = await FiveInARow.findOne({ roomId: roomId });
        game.currentRound++;
        if (game.currentRound === game.maxRounds) {
            gameOver = true;
            game.status = 'finished';
            this.calculateWinner(roomId);
        }
        else {
            const temp = game.currentAttacker;
            game.currentAttacker = game.currentDefender;
            game.currentDefender = temp;
        }
        game.save();
    }
    return {color, roundOver, gameOver};
}

module.exports.getBoard = async (roomId) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    const board = await Board.findById(game.boards[game.currentRound]).populate('cells');
    return board;
}
 
module.exports.setReady = async (roomId, playerId) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    for (let i = 0; i < game.players.length; i++) {
        if (game.players[i]._id.equals(playerId)) {
            if (!game.playersReady[i]) {
                game.playersReady[i] = true;
                game.save();
            } 
            break;
        }
    }
}

module.exports.clearReady = async (roomId, playerId) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    for (let i = 0; i < game.players.length; i++) {
        if (game.players[i]._id.equals(playerId)) {
            if (game.playersReady[i]) {
                game.playersReady[i] = false;
                game.save();
            }
            break;
        }
    }
}

module.exports.areAllReady = async (roomId) => {
    const game = await FiveInARow.findOne({ roomId: roomId });
    for (let i = 0; i < game.playersReady.length; i++) {
        if (!game.playersReady[i]) {
            return false;
        }
    }
    return true;
}

module.exports.getFinishedGame = async (roomId) => {
    const game = await FiveInARow.findOne({ roomId: roomId }).populate('winner').populate('looser');
    return game;
}

