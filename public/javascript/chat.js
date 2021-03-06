(async () => {
  const sendButton = document.getElementById("sendButton");
  const messageInput = document.getElementById("chatInputField");
  const chatList = document.getElementById("friendsList");
  const chatContainer = document.getElementById("chatContainer");
  const messageContainer = document.getElementById("messageContainer");
  const renderChatsList = async () => {
    const friends = await axios.get(`/api/users/${currentUser._id}/friends`);
    friends.data.forEach((friend) => {
      chatList.insertAdjacentHTML("beforeend", createFriendCard(friend));
    });
    const displayedFriend = document.getElementsByClassName('friend-container')[0];
    displayedFriend.click();
  };
  const createFriendCard = (friend) => {
    return `<div class="friend-container user-info chat-list" id="${friend._id}" >
                <div class="friend-avatar-container">
                    <img class="friend-avatar" src="${friend.friendId.profilePicture}" alt="">
                    <div class="is-friend-online offline">
                    </div>
                </div>
                <div class="friend-details-container">
                    <div class="friend-name">
                        <h3> ${friend.friendId.username}</h3>
                    </div>
                    <!-- <div class="friend-last-message">
                        <p>Lorem ipsum dolor sit...</p>
                    </div>  -->
                </div>
                <!-- <div class="friend-last-message-time">
                    <p>12:00</p>
                </div> -->
            </div>`;
  };
  chatList.addEventListener("click", async (e) => {
    if (e.target.closest(".user-info")) {
      const id = e.target.closest(".user-info").id;
      const chat = await axios.get(`/api/chat/${id}`);
      renderChat(chat.data.chat);
    }
  });
  const chatHeaderImg = document.getElementById("chatHeaderImg");
  const chatHeaderName = document.getElementById("chatHeaderName");
  const renderChat = (chat) => {
    const user = chat.members.find((member) => member._id !== currentUser._id);
    sendButton.dataset.chatId = chat._id;
    chatHeaderImg.src = user.profilePicture;
    chatHeaderName.innerText = `${user.firstName} ${user.lastName}`;
    renderMessages(chat.messages);
    messageContainer.scrollTop = messageContainer.scrollHeight;
  };
  const renderMessages = (messages) => {
    messageContainer.innerHTML = "";
    if (messages.length == 0) {
      // Put no message container here
    } else {
      //remove no message container
      messages.forEach((message) => {
        messageContainer.insertAdjacentHTML(
          "beforeend",
          createMessage(message)
        );
      });
    }
  };
  const createMessage = (message) => {
    let sentOrReceived = "";
    if (message.sender._id != currentUser._id) {
      sentOrReceived = "received";
    } else {
      sentOrReceived = "sent";
    }
    return `   <div class="message-title">
                        <h4 class="message-sender">${message.sender.username}</h4>
                        <span class="message-time">${new Date(message.createdAt).toLocaleTimeString(
                          "en-US",
                          { hour: "2-digit", minute: "2-digit" }
                        )} </span>
                    </div>
                    <div class="message-body message-container-${sentOrReceived} message-container">
                        <p>${message.content}</p>
                    </div>`;
  };
  sendButton.addEventListener("click", async () => {
    const messageText = messageInput.value;
    const chatId = sendButton.dataset.chatId;
    if (messageText.trim() != "") {
      const messageData = {
        content: messageText,
        sender: currentUser._id,
        chatId: chatId,
      };
      const message = await axios
        .post("/api/message", messageData)
        .catch((err) => {
          console.log(err);
        });
      messageInput.value = "";
      messageContainer.insertAdjacentHTML(
        "beforeend",
        createMessage(message.data)
      );
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  });
  messageInput.addEventListener("keyup", (e) => {
    if (e.key == "Enter") {
      sendButton.click();
    }
  });
  await renderChatsList();
})();
