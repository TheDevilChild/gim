module.exports.renderHome = (req, res) => {
    res.render('home',{title:'Home',showNavbar:true,showFooter:true});
}

module.exports.renderGamesListPage = (req, res) => {
    res.render('gameslist',{title:'Games',showNavbar:true,showFooter:true});
}

module.exports.renderFiveInARow = (req, res) => {
    res.render('FiveInARow',{title:'5 in a row',showNavbar:true,showFooter:true});
}

module.exports.renderUserPage = (req, res) => {
    res.render('user',{title:'User',showNavbar:true,showFooter:true});
}