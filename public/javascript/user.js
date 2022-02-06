(async () => {
    let pendingRequests;
    let friendsList;
    const userContainer = document.getElementById('userContainer');

    const getFriends = async () => {
        friendsList = await axios.get(`/api/users/${currentUser._id}/friends`);
        friendsList = friendsList.data;
    }
    const getPendingRequests = async () => {
        pendingRequests = await axios.get(`/api/users/${currentUser._id}/friendRequests`);
        pendingRequests = pendingRequests.data;
    }
    await getFriends();
    await getPendingRequests();
    const renderUsers = async () => {
        const users = await axios.get('/api/users/all');
        users.data.forEach(user => {
            if (user._id != currentUser._id) {
                userContainer.insertAdjacentHTML('beforeend', createUserCard(user));
            }
        });
    }
    const isFriend = (user) => {
        for (let i = 0; i < friendsList?.length; i++) {
            if (friendsList[i].friendId._id === user._id) {
                return true;
            }
        }
        return false;
    }
    const isPendingRequest = (user) => {
        for (let i = 0; i < pendingRequests?.length; i++) {
            if (pendingRequests[i].sender === user._id) {
                return { isPending: true, hasSent: true, requestId: pendingRequests[i]._id };
            } else if (pendingRequests[i].receiver === user._id) {
                return { isPending: true, hasSent: false, requestId: pendingRequests[i]._id };
            }
        }
        return false;
    }

    const getFriendButton = (user) => {
        const { isPending, hasSent, requestId } = isPendingRequest(user);

        if (isPending) {
            if (hasSent) {
                return `<div class="friend-btn-div">
                <button class="friend-btn accept-friend-request" data-id="${requestId}">Accept</button>
                <button class="friend-btn decline-friend-request" data-id="${requestId}">Decline</button>
                </div>`;
            } else {
                return `<div class="friend-btn-div hello">
                            <button class="friend-btn decline-friend-request" data-id="${requestId}">Decline</button>
                        </div>`;
            }
        }
        else if (isFriend(user)) {
            return `<div class="friend-btn-div">
            <button class="friend-btn message-friend" data-id="${user._id}">Message</button>
            </div>`;
        } else {
            return `<div class="friend-btn-div">
                        <button class="friend-btn send-friend-request" data-id="${user._id}">Add Friend</button>
                    </div>`;
        }
    }

    const createUserCard = (user) => {
        const friendBtnDiv = getFriendButton(user);
        return `<div class="user-card">
                    <div class="user-card-img-div">
                        <img src="${user.profilePicture}" alt="${user.username}'s profile picture" class="user-card-img">   
                    </div>
                    <div class="user-card-info-div">
                        <h3 class="user-card-username">${user.username}</h3>
                        <p class="user-card-name">${user.firstName} ${user.lastName}</p>
                        <p class="user-card-email">${user.email}</p>
                    </div>
                    ${friendBtnDiv}
                </div>`;
    }

    const acceptFriendRequest = async (requestId) => {
        return await axios.put(`/api/users/${currentUser._id}/friendRequest/${requestId}/accept`);
    }
    const declineFriendRequest = async (requestId) => {
        return await axios.delete(`/api/users/${currentUser._id}/friendRequest/${requestId}`);
    }
    const sendFriendRequest = async (userId) => {
        return await axios.post(`/api/users/${currentUser._id}/friendRequest/${userId}/send`);
    }

    userContainer.addEventListener('click', async (e) => {
        if (e.target.closest('.accept-friend-request')) {
            console.log('accept');
            const ele = e.target.closest('.accept-friend-request');
            const requestId = ele.dataset.id;
            const id = await acceptFriendRequest(requestId);
            ele.classList.remove('accept-friend-request');
            ele.classList.add('message-friend');
            ele.innerText = 'Message';
            console.log(id);
            ele.dataset.id = id.data.id;       
            console.log(ele.dataset.id);
        } else if (e.target.closest('.decline-friend-request')) {
            console.log('decline');
            const ele = e.target.closest('.decline-friend-request');
            const requestId = ele.dataset.id;
            const id = await declineFriendRequest(requestId);
            ele.classList.remove('decline-friend-request');
            ele.classList.add('send-friend-request');
            ele.innerText = 'Add Friend';
            console.log(id);
            ele.dataset.id = id.data.id;
            console.log(ele.dataset.id);
        } else if (e.target.closest('.send-friend-request')) {
            console.log('send'); 
            const ele = e.target.closest('.send-friend-request');
            const userId = ele.dataset.id;
            const id = await sendFriendRequest(userId);
            ele.classList.remove('send-friend-request');
            ele.classList.add('decline-friend-request');
            ele.innerText = 'Decline';
            console.log(id);
            ele.dataset.id = id.data.id;
            console.log(ele.dataset.id);
        } else if (e.target.closest('.message-friend')) {
            // Dont message abhi theek hai -_-
            const userId = e.target.closest('.message-friend').dataset.id;
            // window.location.href = `/messages/${userId}`;
        }
    })

    await renderUsers();
})();