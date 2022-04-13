const gameslist = ['FiveInARow', 'Uba'];
const express = require('express');
const  FiveInARow  = require('../controllers/FiveInARowController');
const Uba = require('../controllers/UbaController');
const {v4: uuidv4} = require('uuid');

module.exports.createGame = async (req, res) => {
    const { gameId } = req.params;
    // const {password } = req.body;
    // const roomId  = uuidv4();
    if (gameslist.includes(gameId)) {
        if (gameId === 'FiveInARow') {
            await FiveInARow.createGame(req,res);
        } else if (gameId === 'Uba') {
            console.log('In UBA');
            await Uba.createGame(req,res);
        }
    }
}

module.exports.joinGame = async (req,res) => {
    const { gameId } = req.params;
    const { roomId, password } = req.body;

    if (gameslist.includes(gameId)) {
        if (gameId === 'FiveInARow') {
            FiveInARow.joinGame(req,res);
        } else if (gameId === 'Uba') {
            Uba.joinGame(req, res);
        }
    }
}

module.exports.renderCreateGamePage = (req, res) => {
    const gameId = req.params.gameId;
    res.render('games/createGame', { gameName: gameId, gameId });
}

module.exports.renderJoinGamePage = (req,res) => {
    const gameId = req.params.gameId; 
    res.render('games/joinGame', { gameName: gameId, gameId });
}
