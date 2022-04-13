(() => {
    const socket = io();

    const overlay = document.getElementById('overlay');
    const startRoundBtn = document.getElementById('startRoundBtn');
    const readyContainer = document.getElementById('readyContainer');
    const readyBtn = document.getElementById('readyBtn');
    const readyCount = document.getElementById('readyCount');
    const roundContainer = document.getElementById('roundContainer');
    const roundCount = document.getElementById('roundCount');
    const currentTurn = document.getElementById('currentTurn');
    const messageContent = document.getElementById('messageContent');
    const messageSendBtn = document.getElementsByClassName('chat-box-message-btn')[0];
    const copyIcon = document.getElementById('copyIcon');
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const gameOverMessage = document.getElementById('gameOverMessage');
    
    let lockedBids = 0;
    let userBids = new Array(3);

    socket.on('connect', function () {
        onSocketConnect(socket, gameId = 'Uba');
    })

    socket.on('totalPlayersAndRounds', ({ noOfPlayers, noOfRounds }) => {
        onSocketUpdateTotalPlayersAndRounds(noOfPlayers, noOfRounds);
    });

    socket.on('updateReadyCount', (readyCount) => {
        onSocketUpdateReadyCount(readyCount);
    });

    socket.on('roomFull', () => {
        onSocketRoomFull();
    });

    socket.on('enablePlayButton', () => {
        onSocketEnablePlayButton(startRoundBtn, readyBtn);
    });

    startRoundBtn?.addEventListener('click', () => {
        startBtnOnClick(socket, startRoundBtn, gameId = 'Uba');
    });

    socket.on('startRound', (roundNumber) => {
        onSocketStartRound(overlay, readyContainer, roundContainer, roundCount, startRoundBtn, readyCount,roundNumber);
    });

    socket.on('currentPlayer', (currentPlayer) => {
        updateCurrentTurnPlayer(currentPlayer, currentTurn);
    });

    socket.on('endRound', () => {
        onSocketEndRound(readyContainer, readyBtn, startRoundBtn, roundContainer, overlay);
    });


    // socket.on('gameOver', ({ game }) => {
    //     // Do the necessary things to end the game
    //     console.log(game);
    //     console.log(currentUser);
    //     if (game.winner === null) {
    //         gameOverOverlay.classList.add('draw-overlay');
    //         gameOverMessage.innerHTML = 'Game ended in a draw!';
    //     }
    //     else if (game.winner._id === currentUser._id) {
    //         gameOverOverlay.classList.add('winner-overlay');
    //         gameOverMessage.innerHTML = 'You won the game!';
    //     } else if(game.loser._id === currentUser._id) {
    //         gameOverOverlay.classList.add('loser-overlay');
    //         gameOverMessage.innerHTML = 'You lost the game!';
    //     }
    //     gameOverOverlay.classList.remove('hidden');
    // });

    socket.on('updatePlayersList', (playersList) => {
        renderPlayersList(playersList);
    });

    readyBtn.addEventListener('click', () => {
        readyBtnOnClick(socket, gameId = 'Uba');
    });

    messageContent.addEventListener('keyup', (e) => {
        messageContainerOnEnter(e, messageSendBtn);
    });

    messageSendBtn.addEventListener('click', () => {
        messageSendBtnOnClick(socket);
    });

    socket.on('newMessage', (message) => {
        renderNewMessage(message);
    });

    copyIcon.addEventListener('click', async () => {
        copyTextHelper();
    });
    
    for (let i = 1; i <= 3; i++) {
        const bidBtn = document.getElementById(`bid-btn-${i}`);
        const bidInput = document.getElementById(`bid-input-${i}`);
        bidBtn.addEventListener('click', () => {
            if (bidInput.value !== '') {
                if (bidBtn.dataset.isLocked === 'true') {
                    //Do the necessary class changes for visual feedback
                    bidBtn.dataset.isLocked = false;
                    lockedBids--;
                    userBids[i - 1] = null;

                } else {
                    bidBtn.dataset.isLocked = true;
                    lockedBids++;
                    userBids[i - 1] = bidInput.value;
                    if (lockedBids === 3) {
                        // Enable the submit button if all bids are locked

                    }
                }
            } else {
                //Display something to tell to fill the bid before clicking
            }

        });
    }
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.addEventListener('click', () => {
        if (lockedBids === 3 && !submitBtn.disabled) {
            //Send the bid array to the server
            socket.emit('makeBid', userBids);
        } else {
            //Display something to tell to lock all the bids before clicking
        }
    });
    socket.on('makeBid', () => {
        //This means that we have to wait for others to
        //make their bids so make the necessary changes to the UI
        //to reflect that
    });
    socket.on('endRound', () => {
        //Do the necessary changes to the UI to reflect that
        //the round has ended
    });
    socket.on('gameOver', () => {
        //Do the necessary changes to the UI to reflect that
        //the game has ended
    });
    socket.on('updatePlayersList', (playersList) => {
        //Display all players in the room currently
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

})();