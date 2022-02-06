const createPlayerElement = (player) => {
    return `
        <img src="${player.profilePicture}" alt="" class="player-img">
        <span>${player.username}</span>
    `;
};

const renderPlayersList = (playersList) => {
    const joinedCount = document.getElementById('joinedCount');
    const players = document.getElementById('players');
    players.innerHTML = '';
    playersList.forEach(player => {
        const playerElement = document.createElement('li');
        playerElement.innerHTML = createPlayerElement(player);
        playerElement.classList.add('player-card');
        players.appendChild(playerElement);
    });
    joinedCount.innerText = playersList.length;
};

const readyBtnOnClick = (socket, gameId) => {
    if (readyBtn.dataset.isReady === 'true') {
        socket.emit('unready', { roomId, gameId, playerId: currentUser._id });
        readyBtn.innerText = 'Ready';
        readyBtn.classList.add('game-btn-active');
        readyBtn.classList.remove('game-btn-disabled');
        readyBtn.dataset.isReady = 'false';
    } else {
        socket.emit('ready', { roomId, gameId, playerId: currentUser._id });
        readyBtn.innerText = 'Cancel';
        readyBtn.classList.remove('game-btn-active');
        readyBtn.classList.add('game-btn-disabled');
        readyBtn.dataset.isReady = 'true';
    }
};

const messageContainerOnEnter = (e, messageSendBtn) => {
    if (e.key == 'Enter') {
        messageSendBtn.click();
    }
};

const messageSendBtnOnClick = (socket) => {
    const messageText = messageContent.value;
    if (messageText.trim() != '') {
        socket.emit("newMessage", {
            from: currentUser.username,
            messageText: messageText,
            roomId: roomId
        })
    }
    messageContent.value = '';
};

const createMessageElement = (message, formattedTime) => {
    return `
        <div class="message-title">
            <h4 class="message-sender">${message.from}</h4>
            <span class="message-time">${formattedTime}</span>
        </div>
        <div class="message-body">
            <p>${message.messageText}</p>
        </div>
    `;
};

const renderNewMessage = (message) => {
    const messageContainer = document.getElementById('messages');
    const formattedTime = moment(message.createdAt).format('LT');
    const messageElement = document.createElement('li');
    messageElement.innerHTML = createMessageElement(message, formattedTime);
    messageElement.classList.add('message');
    messageContainer.appendChild(messageElement);
    messageContainer.lastElementChild.scrollIntoView();
};

const copyTextHelper = () => {
    const copyText = document.getElementById('copyText');
    navigator.clipboard.writeText(copyText.innerText).then(() => {
        const tooltipText = document.getElementById('tooltipText');
        tooltipText.innerHTML = 'Copied';
        copyIcon.innerHTML = 'check_circle';
        setTimeout(() => {
            copyIcon.innerHTML = 'content_copy';
            tooltipText.innerHTML = 'Click to Copy';
        }, 1000);
    });
};

const onSocketConnect = (socket, gameId) => {
    if (isCreator) {
        socket.emit('create', { roomId, gameId });
    } else {
        socket.emit('join', { roomId, gameId });
    }
}

const onSocketUpdateTotalPlayersAndRounds = (noOfPlayers, noOfRounds) => {
    const totalPlayerCount = document.getElementsByClassName('totalPlayerCount');
    const totalRoundCount = document.getElementById('totalRoundCount');
    Array.from(totalPlayerCount).forEach(el => {
        el.innerHTML = noOfPlayers;
    });
    totalRoundCount.innerHTML = noOfRounds;
}

const onSocketUpdateReadyCount = (readyCount) => {
    this.readyCount.innerHTML = readyCount;
}

const onSocketRoomFull = () => {
    const joinContainer = document.getElementById('joinContainer');
    const readyContainer = document.getElementById('readyContainer');
    const readyBtn = document.getElementById('readyBtn');
    const startRoundBtn = document.getElementById('startRoundBtn');

    readyContainer.classList.remove('hidden');
    readyBtn.classList.remove('hidden');
    startRoundBtn?.classList.remove('hidden');
    joinContainer.classList.add('hidden');
    //Change the text of Overlay
}

const onSocketEndRound = (readyContainer, readyBtn, startRoundBtn, roundContainer, overlay) => {
    overlay.classList.remove('hidden');
    startRoundBtn?.classList.remove('game-btn-active', 'hidden');
    if (isCreator) {
        startRoundBtn.disabled = true;
    }
    readyBtn.classList.remove('hidden', 'game-btn-disabled');
    readyBtn.classList.add('game-btn-active');
    readyBtn.innerText = 'Ready';
    readyContainer.classList.remove('hidden');
    roundContainer.classList.add('hidden');
};

const onSocketEnablePlayButton = (startRoundBtn, readyBtn) => {
    if (isCreator) {
        startRoundBtn.disabled = false;
    }
    startRoundBtn?.classList.add('game-btn-active');
    readyBtn.classList.add('hidden');
    readyBtn.dataset.isReady = 'false';
}

const onSocketStartRound = (overlay, readyContainer, roundContainer, roundCount, startRoundBtn, readyCount,roundNumber) => {
    overlay.classList.add('hidden');
    startRoundBtn?.classList.add('hidden');
    readyContainer.classList.add('hidden');
    readyCount.innerHTML = 0;
    roundContainer.classList.remove('hidden');
    roundCount.innerHTML = roundNumber;
}

const updateCurrentTurnPlayer = (currentPlayer, currentTurn) => {
    if (currentPlayer._id === currentUser._id) {
        //Might have some sound also that its your turn
        currentTurn.innerHTML = 'Your Turn';
    } else {
        currentTurn.innerHTML = `${currentPlayer.username}'s Turn`;
    }
}

const startBtnOnClick = (socket,startRoundBtn, gameId) => {
    if (!startRoundBtn.disabled)
        socket.emit('startRound', { gameId, roomId });
}

const onSocketUpdateGameHistory = (gameHistory, lastMove, createGameHistoryCard) => {
    const li = document.createElement('li');
    li.innerHTML = createGameHistoryCard(lastMove);
    li.classList.add('game-history-card');
    gameHistory.prepend(li);
}