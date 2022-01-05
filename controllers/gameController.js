const gameslist = ['5InARow', 'Uba'];
const express = require('express');
const { FiveInARow } = require('../controllers/FiveInARow');
const Uba = require('../models/Uba');
const {v4: uuidv4} = require('uuid');

const createGame = async (req,res) => {
    const { gameId } = req.params;
    const {password } = req.body;
    const roomId  = uuidv4();
    if (gameslist.includes(gameId)) {
        if (gameId === '5InARow') {
            FiveInARow.createGame();
        } else if (gameId === 'Uba') {
            //Uba game
        }
    }
}

const joinGame = async (req,res) => {
    const { gameId } = req.params;
    const { roomId, password } = req.body;

    if (gameslist.includes(gameId)) {
        if (gameId === '5InARow') {
            FiveInARow.joinGame();
        } else if (gameId === 'Uba') {
            //Uba game
        }
    }
}

const renderCreateGamePage = (req,res) => {
    const gameId = req.params.gameId;
    res.render('games/createGame', { gameName: gameId });
}

const renderJoinGamePage = (req,res) => {
    const gameId = req.params.gameId; 
    res.render('games/joinGame', { gameName: gameId });
}

module.exports = { createGame, joinGame, renderCreateGamePage, renderJoinGamePage };