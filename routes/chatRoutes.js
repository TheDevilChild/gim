const express = require('express');
const router = express.Router();
const catchErrors = require('../lib/async-error');
const { isLoggedIn } = require('../lib/auth');
const { renderChatPage } = require('../controllers/chatController');

router.route('/')
    .get(isLoggedIn, catchErrors(renderChatPage));

module.exports = router;