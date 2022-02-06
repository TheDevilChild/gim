const express = require('express');
const router = express.Router();
const catchErrors = require('../../lib/async-error');
const { isLoggedIn } = require('../../lib/auth');
const { sendMessage } = require('../../controllers/api/messageController');

router.route('/')
    .post(isLoggedIn, catchErrors(sendMessage));

module.exports = router;