const User = require('../models/user');

module.exports.renderRegister = (req, res, next) => {
    res.render('users/register');
}

module.exports.registerUser = async(req, res, next) => {
    try {
        const { firstName, lastName, password, username, profilePicture, email } = req.body;
        const user = new User({ firstName, lastName, username, profilePicture, email });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            res.redirect('/');
        })
    } catch (e) {
        res.redirect('/register');
    }
}

module.exports.renderLogin = (req, res, next) => {
    res.render('users/login');
}

module.exports.loginUser = (req, res, next) => {
    const redirectUrl = req.session.redirectTo || '/';
    delete req.session.redirectTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res) => {
    req.logout();
    res.redirect('/');
}
