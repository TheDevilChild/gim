const express = require('express');
const router = express.Router({ mergeParams: true });
const catchErrors = require('../lib/async-error');
const { isLoggedIn } = require('../lib/auth');
const { renderCreateGamePage, renderJoinGamePage, createGame, joinGame } = require('../controllers/gameController');
//need to add this
const { isValidGame } = require('../lib/game');

router.route('/create')
    .get(renderCreateGamePage)
    .post(isLoggedIn, isValidGame, catchErrors(createGame));

router.route('/join')
    .get(renderJoinGamePage)
    .post(isLoggedIn, isValidGame, catchErrors(joinGame));


module.exports = router;