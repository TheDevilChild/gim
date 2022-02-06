module.exports.renderChatPage = async (req, res) => {
    res.render('chat',{title:'Chat',showNavbar:true,showFooter:true});
}