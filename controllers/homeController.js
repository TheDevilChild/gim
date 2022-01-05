module.exports.renderHome = (req, res, next) => {
    res.render('home',{title:'Home',showNavbar:true,showFooter:true});
}

module.exports.renderGamesListPage = (req, res, next) => {
    res.render('gameslist',{title:'Games',showNavbar:true,showFooter:true});
}

module.exports.render5InARow = (req, res, next) => {
    res.render('FiveInARow',{title:'5 in a row',showNavbar:true,showFooter:true});
}
