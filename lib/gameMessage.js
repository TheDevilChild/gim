const moment = require('moment');

module.exports.gameMessage = (from, messageText) => {
    return {
        from,
        messageText,
        createdAt: moment().valueOf()
    };
};

