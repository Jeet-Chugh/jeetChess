const express = require('express');
const Chess = require('chess.js').Chess
const Game = require('../models/Game');
const router = express.Router();

// start game
router.post('/start', async (req, res) => {
  const { players } = req.body;
  const chess = new Chess();
  const state = chess.fen()

  const newGame = new Game({players: players, state: state, moves: [] })
  try {
    await newGame.save();
    return res.status(201).json(newGame)
  } catch (error) {
    return res.status(400).send('Error creating game')
  }
});

// get game
router.get('/get', async (req, res) => {
  const { gameID } = req.body;
  const game = Game.findById(gameID);
  if (!game) {
    return res.status(400).send('Game not found')
  }
  return res.status(200).json(game)
});

// on move
router.post('/move', async (req, res) => {
  const { gameID, move } = req.body;
  
  const game = Game.findById(gameID)
  if (!game) {
    return res.status(400).send('Couldn\'t find game')
  }

  const chess = new Chess(game.state);
  if (chess.move(move)) {
    game.moves.push(move)
    game.state = chess.fen()
    await game.save()
    return res.status(200).json(game)
  } else {
    return res.status(400).send('invalid move')
  }
});

module.exports = router;