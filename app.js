// Importing Modules
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const ExpressError = require('./lib/expressError');
const session = require('express-session');
const User = require('./models/user');

//Using Modules
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(path.join(__dirname, 'public')));

//Configuring Session and Passport
const sessionConfig = {
    secret: 'thisShouldBeABetterSecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(flash());

//Database Connection
mongoose.connect('mongodb://localhost/gim', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('Database Connected');
});

//Flash and currentUser
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


//Routes

// /register --> GET: register form
// /register --> POST: register
// /login --> GET: login form
// /login --> POST: login
// /logout --> GET: logout
// / --> GET: Home Page
// /games --> GET: List of Games
// /play/:gameId/create --> GET: Render Create Game Form
// /play/:gameId/create --> POST: Create Game
// /play/:gameId/join --> GET: Render Join Game Form
// /play/:gameId/join --> POST: Join Game

//Home Routes
const homeRoutes = require('./routes/homeRoutes');
app.use('/', homeRoutes);

//Game Routes
const gamesRoutes = require('./routes/gameRoutes')
app.use('/play/:gameId/', gamesRoutes);

//User Routes
const userRoutes = require('./routes/userRoutes');
app.use('/', userRoutes);

const chatRoutes = require('./routes/chatRoutes');
app.use('/chat', chatRoutes);

const usersApiRoute = require('./routes/api/users');
app.use('/api/users', usersApiRoute);

const chatApiRoute = require('./routes/api/chat');
app.use('/api/chat', chatApiRoute);

const messageApiRoute = require('./routes/api/message');
app.use('/api/message', messageApiRoute);

const http = require('http');
const socketio = require('socket.io');
const server = http.createServer(app);
const io = socketio(server);

const FiveInARow = require('./controllers/FiveInARowController');
const Uba = require('./controllers/UbaController');
const { gameMessage } = require('./lib/gameMessage');


io.on('connection', (socket) => {

    socket.on('newMessage', ({ from, messageText, roomId }) => {
        io.to(roomId).emit('newMessage', gameMessage(from, messageText));
    })

    socket.on('create', async (params) => {
        const { gameId, roomId } = params;
        const noOfPlayers = await eval(gameId).getNoOfPlayers(roomId);
        const noOfRounds = await eval(gameId).getNoOfRounds(roomId);
        socket.join(roomId);
        io.to(roomId).emit('updatePlayersList', await eval(gameId).getPlayersList(roomId));
        socket.emit('totalPlayersAndRounds',{noOfPlayers, noOfRounds});
        socket.emit('currentPlayer', await eval(gameId).getCurrentPlayer(roomId));
        if (gameId === 'FiveInARow') {
            io.to(roomId).emit('updateBoard', await FiveInARow.getBoard(roomId));
        } else if (gameId === 'Uba') {
            
        }
    })

    socket.on('join', async (params) => {
        const { gameId, roomId } = params;
        const noOfPlayers = await eval(gameId).getNoOfPlayers(roomId);
        const noOfRounds = await eval(gameId).getNoOfRounds(roomId);
        socket.join(roomId);
        socket.emit('totalPlayersAndRounds',{noOfPlayers, noOfRounds});
        socket.emit('currentPlayer', await eval(gameId).getCurrentPlayer(roomId));
        const playersList = await eval(gameId).getPlayersList(roomId);
        io.to(roomId).emit('updatePlayersList', playersList);
        if (playersList.length === await eval(gameId).getNoOfPlayers(roomId)) {
            io.to(roomId).emit('roomFull');
        }
        if (gameId === 'FiveInARow') {
            io.to(roomId).emit('updateBoard', await FiveInARow.getBoard(roomId)); 
        }
    })

    socket.on('ready', async (params) => {
        const { gameId, roomId, playerId } = params;
        await eval(gameId).setReady(roomId, playerId);
        io.to(roomId).emit('updateReadyCount',await eval(gameId).getReadyCount(roomId));
        if (await eval(gameId).areAllReady(roomId)) {
            io.to(roomId).emit('enablePlayButton');
        }
    })

    socket.on('unready', async (params) => {
        const { gameId, roomId, playerId } = params;
        await eval(gameId).clearReady(roomId, playerId);
        io.to(roomId).emit('updateReadyCount',await eval(gameId).getReadyCount(roomId));
    })

    socket.on('startRound', async (params) => {
        const { gameId, roomId } = params;
        io.to(roomId).emit('startRound',await eval(gameId).getCurrentRoundNumber(roomId));
    })

    socket.on('turn', async (params, callback) => {
        const { x, y, gameId, roomId, playerId } = params;
        if (gameId === 'FiveInARow') {
            if (await FiveInARow.isYourTurn(roomId, playerId)) {
                if (await FiveInARow.notOccupied(roomId, x, y)) {
                    const { color, roundOver, gameOver } = await FiveInARow.makeTurn(roomId, x, y);
                    io.to(roomId).emit('updateTurn', { x, y, color });
                    io.to(roomId).emit('updateGameHistory', await FiveInARow.getLastMove(roomId));
                    io.to(roomId).emit('currentPlayer',await eval(gameId).getCurrentPlayer(roomId));
                    if (gameOver) {
                        console.log('game over');
                        io.to(roomId).emit('gameOver', { game: await FiveInARow.getFinishedGame(roomId) });
                    } else if (roundOver) {
                        // Have to figure out what all to send back when the rounds get over
                        await FiveInARow.clearReadyAll(roomId);
                        io.to(roomId).emit('endRound');
                        io.to(roomId).emit('updateBoard', await FiveInARow.getBoard(roomId));
                    }
                    callback('success');
                } else {
                    callback('Occupied');
                }
            } else {
                callback('Not your turn');
            }
        }
    })
    
    // socket.on('makeBid', async (params, callback) => {
    //     const { gameId, roomId, playerId, bids } = params;
    //     if (gameId === 'Uba') {
    //         const { roundOver, gameOver } = await Uba.makeBid(roomId, playerId, bids);
    //         if (gameOver) {
    //             // Have to figure out what all to send back when the game gets over
    //             io.to(roomId).emit('gameOver', { game: Uba.getFinishedGame(roomId) });
    //         } else if (roundOver) {
    //             // Have to figure out what to send back when the rounds get over
    //             io.to(roomId).emit('endRound');
    //         } else {
    //             // Send back to wait for the other player to make a bid
    //             // Maybe will send back his bids also to be displayed on the sidebar
    //             socket.emit('makeBid');
    //         }
    //     }
    // });
})


//Error Handling
server.on('error', (err) => {
    console.error(err);
})

server.listen(3000, () => {
    console.log('server is ready');
})

//Throwing 404 is none of the above routes hit
app.all('*', (req, res, next) => {
    next(new ExpressError('Page not Found', 404));
})

//Error route
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh no, Something went wrong';
    res.status(statusCode).render('error', { err });
})
