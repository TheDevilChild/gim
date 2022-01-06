(() => {
    const socket = io();
    let lockedBids = 0;
    let isCreator = false;
    let userBids = new Array(3);

    socket.on('connect', function () {
        if (isCreator) {
            socket.emit('create', { roomId, gameId: 'Uba' });
        } else {
            socket.emit('join', { roomId, gameId: 'Uba' });
        }
    })

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