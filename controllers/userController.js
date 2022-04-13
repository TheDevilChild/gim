const User = require('../models/user');

module.exports.renderRegister = (req, res, next) => {
    res.render('users/register');
}

module.exports.registerUser = async(req, res, next) => {
    try {
        const { firstName, lastName, password, username, email } = req.body;
        const user = new User({ firstName, lastName, username, email });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            res.redirect('/');
        })
    } catch (e) {
        console.log(e);
        res.redirect('/register');
    }
}

module.exports.renderLogin = (req, res, next) => {
    res.render('users/login');
}

module.exports.loginUser = (req, res, next) => {
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res) => {
    req.logout();
    res.redirect('/');
}
