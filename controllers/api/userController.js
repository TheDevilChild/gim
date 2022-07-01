const User = require('../../models/user');
const FriendRequest = require('../../models/friendRequest');
const Friend = require('../../models/friend');
const Chat = require('../../models/chat');

module.exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (err) {
        res.json({ err });
    }
}

module.exports.getFriends = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('friends')
            .populate({
                path: 'friends',
                populate: {
                    path: 'friendId',
                    model: 'User'
                }
            });
        res.json(user.friends);
    } catch (err) {
        res.json({ err });
    }
}

module.exports.getPendingRequests = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('friendRequests');
        res.json(user.friendRequests);
    } catch (err) {
        res.json({ err });
    }
}

module.exports.acceptFriendRequest = async (req, res) => {
    try {
        //Put a check if none of the sender or receiver is the currentUser
        const { requestId } = req.params;
        const request = await FriendRequest.findByIdAndDelete(requestId);
        const user = await User.findById(request.sender);
        const friend = await User.findById(request.receiver);

        const chat = new Chat();
        chat.members.push(request.sender);
        chat.members.push(request.receiver);
        await chat.save();
        const newFriend = new Friend({
            friendId: request.sender,
            chat: chat._id
        });
        const newFriend2 = new Friend({
            friendId: request.receiver,
            chat: chat._id
        });
        await newFriend.save();
        await newFriend2.save();
        user.friends.push(newFriend2._id);
        friend.friends.push(newFriend._id);
        user.friendRequests.pull(requestId);
        friend.friendRequests.pull(requestId);
        await user.save();
        await friend.save();
        res.json({ id: user._id });
    } catch (err) {
        res.json({ err });
    }
}

module.exports.declineFriendRequest = async (req, res) => {
    try {
        //Put a check if none of the sender or receiver is the currentUser
        const { requestId } = req.params;
        const request = await FriendRequest.findByIdAndDelete(requestId);
        const user = await User.findById(request.sender);
        const friend = await User.findById(request.receiver);
        user.friendRequests.pull(request._id);
        friend.friendRequests.pull(request._id);
        await user.save();
        await friend.save();
        if (request.sender === req.params.id) {
            res.json({ id: request.receiver });
        } else {
            res.json({ id: request.sender });
        }
    } catch (err) {
        res.json({ err });
    }
}

module.exports.sendFriendRequest = async (req, res) => {
    try {
        //Put a check if none of the sender or receiver is the currentUser
        const { id, friendId } = req.params;
        const user = await User.findOne({ _id: id });
        const friend = await User.findOne({ _id: friendId });
        const friendRequest = new FriendRequest({
            sender: id,
            receiver: friendId
        });
        await friendRequest.save();
        user.friendRequests.push(friendRequest._id);
        friend.friendRequests.push(friendRequest._id);
        await user.save();
        await friend.save();
        res.json({ id: friendRequest._id });
    } catch (err) {
        res.json({ err });
    }
}

module.exports.searchUsersQuery = async (req, res) => {
    try {
        const users = await User.find({ $or: [{ username: { $regex: req.query.query, $options: 'i' } }, { firstName: { $regex: req.query.query, $options: 'i' } }, { lastName: { $regex: req.query.query, $options: 'i' } }] });
        res.json(users);
    } catch (err) {
        res.json(err);
    }
}