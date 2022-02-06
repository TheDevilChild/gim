(async () => {
    const sendButton = document.getElementById('sendButton');
    const messageInput = document.getElementById('chatInputField');
    const chatList = document.getElementById('friendsList');
    const chatContainer = document.getElementById('chatContainer');
    const messageContainer = document.getElementById('messageContainer');
    const renderChatsList = async () => {
        const friends = await axios.get(`/api/users/${currentUser._id}/friends`);
        console.log(friends.data);
        friends.data.forEach(friend => {
            chatList.insertAdjacentHTML('beforeend', createFriendCard(friend));
        })
    }
    const createFriendCard = (friend) => {
        return `<div id="${friend._id}" class="user-info chat-list">
                    <img src="${friend.friendId.profilePicture}" class = "chat-list-img"></img>
                    <span class="chat-list-user">
                        ${friend.friendId.firstName} ${friend.friendId.lastName}
                    </span>
                </div>`
    }
    chatList.addEventListener('click', async (e) => {
        if (e.target.closest('.user-info')) {
            const id = e.target.closest('.user-info').id;
            const chat = await axios.get(`/api/chat/${id}`);
            console.log(chat.data);
            renderChat(chat.data.chat);
        }
    });
    const renderChat = (chat) => {
        const user = chat.members.find(member => member._id !== currentUser._id);
        sendButton.dataset.chatId = chat._id;
        renderMessages(chat.messages);
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
    const renderMessages = (messages) => {
        messageContainer.innerHTML = '';
        if (messages.length == 0) {
            // Put no message container here
        } else {
            //remove no message container
            messages.forEach(message => {
                messageContainer.insertAdjacentHTML('beforeend', createMessage(message));
            })
        }
    };

    const createMessage = (message) => {
        let sentOrReceived = '';
        if (message.sender._id != currentUser._id) {
            sentOrReceived = 'received';
        } else {
            sentOrReceived = 'sent';
        }
        return `<div class="message-container-${sentOrReceived} message-container">
                    <div class="message">
                        ${message.content}
                    </div>
                </div>`;
    }
    sendButton.addEventListener('click', async () => {
        const messageText = messageInput.value;
        const chatId = sendButton.dataset.chatId;
        if (messageText.trim() != '') {
            const messageData = {
                content: messageText,
                sender: currentUser._id,
                chatId: chatId
            }
            const message = await axios.post('/api/message', messageData)
                .catch(err => { console.log(err) });
            messageInput.value = '';
            messageContainer.insertAdjacentHTML('beforeend', createMessage(message.data));
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }
    })
    messageInput.addEventListener('keyup', (e) => {
        if (e.key == 'Enter') {
            sendButton.click();
        }
    });
    
    await renderChatsList();
})();