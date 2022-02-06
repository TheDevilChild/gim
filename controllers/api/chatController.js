const Friend = require('../../models/friend');
const Message = require('../../models/message');
module.exports.getChat = async (req, res) => {
    try {
        const { id } = req.params;
        const friend = await Friend.findById(id)
            .populate({
                path: 'chat',
                model: 'Chat',
                populate: [{
                    path: 'members',
                    model: 'User'
                }, {
                    path: 'messages',
                    model: 'Message',
                    populate: {
                        path: 'sender',
                        model: 'User'
                    }
                }]
            }).catch(err => {
                console.log(err);
                res.status(500).json({ err });
            })
        const chat = friend.chat;
        res.json({ chat });
    } catch (err) {
        res.json({ err });
    }
}