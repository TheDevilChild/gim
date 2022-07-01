const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    profilePicture: {
        type: String,
        default: '/images/profile-photo.jpg'
    },
    games: {
        type: {
            fiveInARow: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'FiveInARow'
            }],
            Uba: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Uba'
            }]
        }
    },
    friends: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Friend'
    },
    friendRequests: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'FriendRequest'
    }
});

UserSchema.plugin(passportLocalMongoose, {usernameQueryFields: ['email']});
const User = mongoose.model('User', UserSchema);

module.exports = User;