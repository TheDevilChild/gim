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

const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);

const FiveInARow = require('./controllers/FiveInARowController');
const Uba = require('./controllers/UbaController');

io.on('connnection', (socket) => {
    socket.on('create', async (params) => {
        const { gameId, roomId } = params;
        if (gameId === 'FiveInARow') {
            socket.join(roomId);
            io.to(roomId).emit('updateBoard', FiveInARow.getBoard(roomId));
            io.to(roomId).emit('updatePlayersList', FiveInARow.getPlayersList(roomId));
        } else if (gameId === 'Uba') {
            socket.join(roomId);
            io.to(roomId).emit('updateUsersList', Uba.getPlayersList(roomId));
        }
    })
    socket.on('join', async (params) => {
        const { gameId, roomId } = params;
        if (gameId === 'FiveInARow') {
            socket.join(roomId);
            const playersList = FiveInARow.getPlayersList(roomId);
            io.to(roomId).emit('updateBoard', FiveInARow.getBoard(roomId));
            io.to(roomId).emit('updatePlayersList', playersList);
            if (playersList.length === 2) {
                io.to(roomId).emit('roomFull');
            }
        } else if (gameId === 'Uba') {
            socket.join(roomId);
            const playersList = Uba.getPlayersList(roomId);
            io.to(roomId).emit('updateUsersList', playersList);
            if (playersList.length === await Uba.getNoOfPlayers(roomId)) {
                io.to(roomId).emit('roomFull');
            }
        }
    })
    socket.on('ready', async (params) => {
        const { gameId, roomId, playerId } = params;
        if (gameId === 'FiveInARow') {
            await FiveInARow.setReady(roomId, playerId);
            if (FiveInARow.areAllReady(roomId)) {
                io.to(roomId).emit('enablePlay');
            }
        } else if (gameId === 'Uba') {
            await Uba.setReady(roomId, playerId);
            if (Uba.areAllReady(roomId)) {
                io.to(roomId).emit('enablePlay');
            }
        }
    })

    socket.on('startRound', async (params) => {
        const { gameId, roomId } = params;
        if (gameId === 'FiveInARow' || gameId === 'Uba') {
            io.to(roomId).emit('startRound');
        }
    })

    socket.on('turn', async (params, callback) => {
        const { gameId, roomId, playerId, x, y } = params;
        if (gameId === 'FiveInARow') {
            if (FiveInARow.isYourTurn(roomId, playerId)) {
                if (FiveInARow.notOccupied(roomId, x, y)) {
                    const { color, roundOver, gameOver } = await FiveInARow.makeTurn(roomId, x, y);
                    io.to(roomId).emit('updateTurn', { x, y, color });
                    // io.to(roomId).emit('updateBoard', FiveInARow.getBoard(roomId));
                    if (gameOver) {
                        io.to(roomId).emit('gameOver', { game: FiveInARow.getFinishedGame(roomId) });
                    } else if (roundOver) {
                        // Have to figure out what all to send back when the rounds get over
                        io.to(roomId).emit('endRound');
                    }
                }
            } else {
                callback('Occupied');
            }
        } else {
            callback('Not your turn');
        }
    })
    socket.on('makeBid', async (params, callback) => {
        const { gameId, roomId, playerId, bids } = params;
        if (gameId === 'Uba') {
            const { roundOver, gameOver } = await Uba.makeBid(roomId, playerId, bids);
            if (gameOver) {
                // Have to figure out what all to send back when the game gets over
                io.to(roomId).emit('gameOver', { game: Uba.getFinishedGame(roomId) });
            } else if (roundOver) {
                // Have to figure out what to send back when the rounds get over
                io.to(roomId).emit('endRound');
            } else {
                // Send back to wait for the other player to make a bid
                // Maybe will send back his bids also to be displayed on the sidebar
                socket.emit('makeBid');
            }
        }
    });
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
