const getBoard = (canvas, numCells = 7) => {
    const ctx = canvas.getContext('2d');
    const cellWidth = Math.floor(canvas.width / numCells);
    const cellHeight = Math.floor(canvas.height / numCells);
    const fillCell = (x, y, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
    };
    const drawCell = () => {
        ctx.strokeStyle = '#000000';
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        for (let i = 0; i < numCells; i++) {
            ctx.moveTo(i * cellWidth, 0);
            ctx.lineTo(i * cellWidth, canvas.height);
            ctx.moveTo(0, i * cellHeight);
            ctx.lineTo(canvas.width, i * cellHeight);
        }
        ctx.stroke();
    };
    const clear = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    const renderBoard = (board = []) => {
        board.forEach((row, y) => {
            row.forEach((color, x) => {
                color && fillCell(x, y, color);
            })
        })
    }
    const reset = (board) => {
        clear();
        drawCell();
        renderBoard(board);
    }

    const getCellCoordinates = (x, y) => {
        return {
            x: Math.floor(x / cellWidth),
            y: Math.floor(y / cellHeight)
        }
    }
    return { fillCell, reset, getCellCoordinates };
}

const getClickCoordinates = (element, event) => {
    const { top, left } = element.getBoundingClientRect();
    const { clientX, clientY } = event;
    return {
        x: clientX - left,
        y: clientY - top
    };
}



(() => {
    const canvas = document.getElementById('canvas');
    const { fillCell, reset, getCellCoordinates } = getBoard(canvas);
    const socket = io();
    // Have to figure out isCreator value
    const isCreator = false;

    socket.on('connect', function () {
        if (isCreator) {
            socket.emit('create', { roomId, gameId: 'FiveInARow' });
        } else {
            socket.emit('join', { roomId, gameId: 'FiveInARow' });
        }
    })

    socket.on('updateBoard', reset);

    socket.on('updatePlayersList', (playersList) => {
        // Display all players in the room currently
    });

    socket.on('updateTurn', ({ x, y, color }) => {
        fillCell(x, y, color);
    });

    socket.on('roomFull', () => {
        // Now since the desired number of players have joined
        // Enable the ready button for them to start the game
    });

    socket.on('enablePlay', () => {
        // Enable the startRound button which is only
        //available to the player who created the room
        //and this is going to be checked using the 
        //isCreator variable
    })

    socket.on('startRound', () => {
        // Do the necessary things to start the round
    });

    socket.on('endRound', () => {
        // Do the necessary things to end the round
    });

    socket.on('gameOver', () => {
        // Do the necessary things to end the game
    });

    const onClick = (e) => {
        const { x, y } = getClickCoordinates(canvas, e);
        socket.emit('turn', { ...getCellCoordinates(x, y), gameId: 'FiveInARow', roomId: roomId, playerId: playerId });
    }
    canvas.addEventListener('click', onClick);

    // Update this to allow the user to ready as well as unready for the game
    const readyBtn = document.getElementById('readyBtn');
    readyBtn.addEventListener('click', () => {
        socket.emit('ready', { gameId: 'FiveInARow', roomId, playerId });
    });

    const startRoundBtn = document.getElementById('startRoundBtn');
    startRoundBtn.addEventListener('click', () => {
        socket.emit('startRound', { gameId: 'FiveInARow', roomId });
    });


})();