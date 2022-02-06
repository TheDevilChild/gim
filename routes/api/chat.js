const express = require('express');
const router = express.Router();
const catchErrors = require('../../lib/async-error');
const { isLoggedIn } = require('../../lib/auth');
const { getChat } = require('../../controllers/api/chatController');

router.route('/:id')
    .get(isLoggedIn, catchErrors(getChat));

module.exports = router;