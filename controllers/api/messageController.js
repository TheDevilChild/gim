const Chat = require("../../models/chat");
const Message = require("../../models/message");

module.exports.sendMessage = async (req, res) => {
    try {
        const { sender, content, chatId } = req.body;
        let message = new Message({
            content: content,
            chat: chatId,
            sender: sender
        });
        message = await message.save().catch(err => res.status(400).send(err));
        message = await message.populate('sender').catch(err => res.status(400).send(err));
        await Chat.findByIdAndUpdate(chatId, { $push: { messages: message._id } }).catch(err => res.status(400).send(err));
        res.status(200).json(message);
    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
};