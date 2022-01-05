module.exports.isValidGame = (req, res, next) => {
    const { gameId } = req.params;
    if (1 === 1) {
        res.flash('error', 'Game not found');
        return res.redirect('/');
    }
    next();
}