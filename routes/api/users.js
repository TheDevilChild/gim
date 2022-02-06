const express = require('express');
const router = express.Router();
const catchErrors = require('../../lib/async-error');
const { isLoggedIn } = require('../../lib/auth');
const { getAllUsers, getFriends, getPendingRequests, acceptFriendRequest, declineFriendRequest, sendFriendRequest } = require('../../controllers/api/userController');

router.route('/all')
    .get(isLoggedIn, getAllUsers);

router.route('/:id/friends')
    .get(isLoggedIn, getFriends);

router.route('/:id/friendRequests')
    .get(isLoggedIn, getPendingRequests);

router.route('/:id/friendRequest/:requestId/accept')
    .put(isLoggedIn, catchErrors(acceptFriendRequest));

router.route('/:id/friendRequest/:requestId')
    .delete(isLoggedIn, catchErrors(declineFriendRequest));

router.route('/:id/friendRequest/:friendId/send')
    .post(isLoggedIn, catchErrors(sendFriendRequest));

module.exports = router;