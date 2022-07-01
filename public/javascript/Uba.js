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
    const submitBtn = document.getElementById('submit-btn');

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
        onSocketStartRound(overlay, readyContainer, roundContainer, roundCount, startRoundBtn, readyCount, roundNumber);
    });

    socket.on('currentPlayer', (currentPlayer) => {
        updateCurrentTurnPlayer(currentPlayer, currentTurn);
    });

    socket.on('endRound', ({ roundEndInfo, isGameOver }) => {
        if (!isGameOver) {
            onSocketEndRound(readyContainer, readyBtn, startRoundBtn, roundContainer, overlay);
        }
        const { frequency, lowestBid, highestBid, scoreOfRound, players, round } = roundEndInfo;
        frequency.sort((a, b) => a.bidValue - b.bidValue);
        let bids = frequency.map(ele => ele.bidValue);
        let frequencyOfBids = frequency.map(ele => ele.bidUsers.length);
        let highestFreq = frequencyOfBids.reduce((a, b) => Math.max(a, b));
        const modalBtn = document.getElementById(`uba-round-${round}-results-btn`);
        const scoresctx = document.getElementById(`round-${round}-score-ctx`).getContext('2d');
        const bidfreqctx = document.getElementById(`round-${round}-bid-freq-ctx`).getContext('2d');
        modalBtn.disabled = false;
        modalBtn.classList.add('game-btn-active');
        const playersUsername = players.map(ele => ele.username);
        const roundChart = new Chart(scoresctx, {
            type: 'doughnut',
            data: {
                labels: [...playersUsername],
                datasets: [{
                    label: 'Frequency Table',
                    data: [...scoreOfRound.score],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 3
                }]
            },
            options: {
                title: {
                    display: true,
                    text: `Round ${round} Scores`,
                    fontSize: 20
                },
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        fontColor: '#fff',
                        fontSize: 15,
                        boxWidth: 10,
                        padding: 10,
                        usePointStyle: true
                    }
                },
                tooltips: {
                    callbacks: {
                        label: function (tooltipItem, data) {
                            return data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + ' points';
                        }
                    }
                }
            }
        });
        const roundChart2 = new Chart(bidfreqctx, {
            type: 'bar',
            data: {
                labels: [...bids],
                datasets: [{
                    label: 'Frequency Table',
                    data: [...frequencyOfBids],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                // indexAxis: 'y',
                scales: {
                    y: {
                        beginAtZero: true,
                        suggestedMax: highestFreq + 1
                    }
                },
                title: {
                    display: true,
                    text: `Round ${round} Frequency Table`,
                    fontSize: 20
                },
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        fontColor: '#323232',
                        fontSize: 15,
                        boxWidth: 10,
                        padding: 10,
                        usePointStyle: true
                    }
                },
            }
        });
    });
    for (let i = 1; i <= 3; i++) {
        const bidFreqSlab = document.getElementById(`bid-freq-slab-${i}`);
        const scoreSlab = document.getElementById(`score-slab-${i}`);
        const scoreResult = document.getElementById(`round-${i}-score-ctx`);
        const bidFreqResult = document.getElementById(`round-${i}-bid-freq-ctx`);
        bidFreqSlab.addEventListener('click', () => {
            bidFreqSlab.classList.add('switch-slab-active');
            scoreSlab.classList.remove('switch-slab-active');
            bidFreqResult.classList.remove('hidden-opacity');
            scoreResult.classList.add('hidden-opacity');
        });
        scoreSlab.addEventListener('click', () => {
            scoreSlab.classList.add('switch-slab-active');
            bidFreqSlab.classList.remove('switch-slab-active');
            scoreResult.classList.remove('hidden-opacity');
            bidFreqResult.classList.add('hidden-opacity');
        });
    }

    socket.on('gameOver', ({ results }) => {
        // Do the necessary things to end the game
        const finalScoreContainer = document.getElementById('final-score-card-container');
        const finalScoreTable = document.getElementById('final-score-table');
        finalScoreContainer.classList.remove('hidden');
        const modalBtn = document.getElementById('uba-final-results-btn');
        modalBtn.disabled = false;
        modalBtn.classList.add('game-btn-active');
        let currentRank = 1;
        for (let i = 0; i < results.length; i++) {
            if (i != 0) {
                if(results[i].score !== results[i-1].score) {
                    currentRank++;
                }
            }
            let template = results[i].player === currentUser.username ? `
            <tr>
                <td>${currentRank}</td>
                <td>${results[i].player}</td>
                <td>${results[i].score.toFixed(2)}</td>
            </tr>
            ` : ` 
            <tr class = "current-user-score-row">
                <td>${currentRank}</td>
                <td>${results[i].player}</td>
                <td>${results[i].score.toFixed(2)}</td>
            </tr>
             `;
            finalScoreTable.insertAdjacentHTML('beforeend', template);
        };
        modalBtn.click();
    });

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
        const bidContainer = document.getElementById(`bid-container-${i}`);
        const bidImg = document.getElementById(`bid-img-${i}`);
        bidBtn.addEventListener('click', () => {
            if (bidInput.value !== '') {
                if (bidBtn.dataset.isLocked === 'true') {
                    //Do the necessary class changes for visual feedback
                    bidBtn.dataset.isLocked = false;
                    lockedBids--;
                    userBids[i - 1] = null;
                    bidBtn.classList.add('game-btn-active');
                    bidBtn.innerHTML = 'Bid';
                    bidContainer.classList.remove('bid-locked');
                    bidImg.classList.remove('bid-raise');
                } else {
                    bidBtn.dataset.isLocked = true;
                    lockedBids++;
                    userBids[i - 1] = bidInput.value;
                    bidBtn.innerHTML = 'Locked';
                    bidBtn.classList.remove('game-btn-active');
                    bidContainer.classList.add('bid-locked');
                    bidImg.classList.add('bid-raise');
                    if (lockedBids === 3) {
                        // Enable the submit button if all bids are locked
                        submitBtn.disabled = false;
                        submitBtn.classList.add('game-btn-active');
                    }
                }
            } else {
                //Display something to tell to fill the bid before clicking
            }

        });
    }
    submitBtn.addEventListener('click', () => {
        if (lockedBids === 3 && !submitBtn.disabled) {
            //Send the bid array to the server
            overlay.classList.remove('hidden');
            socket.emit('makeBid', { gameId, roomId, playerId: currentUser._id, bids: userBids });
            for (let i = 1; i <= 3; i++) {
                const bidBtn = document.getElementById(`bid-btn-${i}`);
                const bidInput = document.getElementById(`bid-input-${i}`);
                const bidContainer = document.getElementById(`bid-container-${i}`);
                const bidImg = document.getElementById(`bid-img-${i}`);
                bidInput.value = '';
                bidBtn.dataset.isLocked = false;
                lockedBids--;
                userBids[i - 1] = null;
                bidContainer.classList.remove('bid-locked');
                bidImg.classList.remove('bid-raise');
                bidBtn.classList.add('game-btn-active');
                bidBtn.innerHTML = 'Bid';
            }
            submitBtn.disabled = true;
            submitBtn.classList.remove('game-btn-active');
        } else {
            //Display something to tell to lock all the bids before clicking
        }
    });
    // socket.on('makeBid', () => {
    //     //This means that we have to wait for others to
    //     //make their bids so make the necessary changes to the UI
    //     //to reflect that
    // });
    // socket.on('endRound', () => {
    //     //Do the necessary changes to the UI to reflect that
    //     //the round has ended
    // });
    // socket.on('gameOver', () => {
    //     //Do the necessary changes to the UI to reflect that
    //     //the game has ended
    // });
    // socket.on('updatePlayersList', (playersList) => {
    //     //Display all players in the room currently
    // });
    // socket.on('roomFull', () => {
    //     // Now since the desired number of players have joined
    //     // Enable the ready button for them to start the game
    // });

    // socket.on('enablePlay', () => {
    //     // Enable the startRound button which is only
    //     //available to the player who created the room
    //     //and this is going to be checked using the 
    //     //isCreator variable
    // })

    // socket.on('startRound', () => {
    //     // Do the necessary things to start the round
    // });

})();