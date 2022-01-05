const express = require('express');
const router = express.Router();
const users = require('../controllers/userController');
const passport = require('passport');

router.route('/register')
    .get(users.renderRegister)
    .post(users.registerUser);

router.route('/login')
    .get(users.renderLogin)
    .post(passport.authenticate('local', {
        failureRedirect: '/users/login',
        failureFlash: true
    }), users.loginUser);

router.route('/logout')
    .get(users.logout);

module.exports = router;