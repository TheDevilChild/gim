const getBoard = (canvas, numCells = 7) => {
    const ctx = canvas.getContext('2d');
    const cellWidth = Math.floor(canvas.width / numCells);
    const cellHeight = Math.floor(canvas.height / numCells);
    const fillCell = (x, y, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x * cellWidth + 1, y * cellHeight + 1, cellWidth - 2, cellHeight - 2);
    };
    const drawCell = () => {
        ctx.strokeStyle = '#000';
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        for (let i = 0; i < numCells + 1; i++) {
            ctx.moveTo(i * cellHeight, 0);
            ctx.lineTo(i * cellHeight, cellWidth * numCells);
            ctx.moveTo(0, i * cellWidth);
            ctx.lineTo(cellHeight * numCells, i * cellWidth);
        }
        ctx.stroke();
    };
    const clear = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    const renderBoard = (board = []) => {
        for (let x = 0; x < numCells; x++) {
            let row = board[x];
            for (let y = 0; y < numCells; y++) {
                let color = row[y];
                color && fillCell(x, y, color);
            }
        }

    }
    const reset = (board = []) => {
        clear();
        drawCell();
        renderBoard(board);
    }

    const getCellCoordinates = (x, y) => {
        return {
            cellX: Math.floor(x / cellWidth),
            cellY: Math.floor(y / cellHeight)
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
    const { fillCell, reset, getCellCoordinates } = getBoard(canvas, 7);
    const socket = io();

    const overlay = document.getElementById('overlay');
    const startRoundBtn = document.getElementById('startRoundBtn');
    const readyContainer = document.getElementById('readyContainer');
    const readyBtn = document.getElementById('readyBtn');
    const readyCount = document.getElementById('readyCount');
    const gameHistory = document.getElementById('gameHistory');
    const roundContainer = document.getElementById('roundContainer');
    const roundCount = document.getElementById('roundCount');
    const turnContainer = document.getElementById('turnContainer');
    const currentTurn = document.getElementById('currentTurn');
    const turnCount = document.getElementById('turnCount');
    const messageContent = document.getElementById('messageContent');
    const messageSendBtn = document.getElementsByClassName('chat-box-message-btn')[0];
    const copyIcon = document.getElementById('copyIcon');
    
    socket.on('connect', function () {
        onSocketConnect(socket, gameId = 'FiveInARow');
    })
    
    socket.on('updateBoard', reset);

    socket.on('updateTurn', ({ x, y, color }) => {
        fillCell(x, y, color);
    });

    socket.on('totalPlayersAndRounds', ({ noOfPlayers, noOfRounds }) => {
        onSocketUpdateTotalPlayersAndRounds(noOfPlayers, noOfRounds);
    });

    socket.on('updateReadyCount', (readyCount) => {
        onSocketUpdateReadyCount(readyCount);
    })

    socket.on('roomFull', () => {
        onSocketRoomFull();
    });

    socket.on('enablePlayButton', () => {
        onSocketEnablePlayButton(startRoundBtn, readyBtn);
    })

    const createGameHistoryCard = (lastMove) => {
        return `
            <span> ${lastMove.moveNo}) </span>
            <span class="player">${lastMove.player.username}</span> 
            <span class="action">${lastMove.action}</span>  
            on the tile 
            <span class="coordinates">(${lastMove.move[1] + 1},${lastMove.move[0] + 1})</span>    
        `;
    }

    socket.on('updateGameHistory', (lastMove) => {
        onSocketUpdateGameHistory(gameHistory,lastMove, createGameHistoryCard);
        turnCount.innerHTML = lastMove.moveNo + 1;
    })

    startRoundBtn?.addEventListener('click', () => {
        startBtnOnClick(socket, startRoundBtn, gameId = 'FiveInARow');
    });

    socket.on('startRound', (roundNumber) => {
        onSocketStartRound(overlay, readyContainer, roundContainer, roundCount, startRoundBtn, readyCount,roundNumber);
        turnCount.classList.remove('hidden');
        turnCount.innerHTML = 1;
        turnContainer.classList.remove('hidden');
    });

    socket.on('currentPlayer', (currentPlayer) => {
        updateCurrentTurnPlayer(currentPlayer, currentTurn);
    })

    socket.on('endRound', () => {
        onSocketEndRound(readyContainer, readyBtn, startRoundBtn, roundContainer, overlay);
        turnContainer.classList.add('hidden');
        turnCount.classList.add('hidden');
    });

    socket.on('gameOver', () => {
        // Do the necessary things to end the game
    });

    const onCellClick = (e) => {
        const { x, y } = getClickCoordinates(canvas, e);
        const { cellX, cellY } = getCellCoordinates(x, y);
        socket.emit('turn', { x: cellX, y: cellY, gameId: 'FiveInARow', roomId, playerId: currentUser._id }, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log('no error');
            }
        });
    }
    canvas.addEventListener('click', onCellClick);

    socket.on('updatePlayersList', (playersList) => {
        renderPlayersList(playersList);
    });

    readyBtn.addEventListener('click', () => {
        readyBtnOnClick(socket, gameId = 'FiveInARow');
    });

    messageContent.addEventListener('keyup', (e) => {
        messageContainerOnEnter(e, messageSendBtn);
    })
    messageSendBtn.addEventListener('click', () => {
        messageSendBtnOnClick(socket);
    })
    socket.on('newMessage', (message) => {
        renderNewMessage(message);
    });

    copyIcon.addEventListener('click', async () => {
        copyTextHelper();
    });

})();