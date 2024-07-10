const express = require("express");
const auth = require("../middleware/authMiddleware");
const Chess = require("chess.js").Chess;
const Game = require("../models/Game");
const router = express.Router();

// start game
router.post("/start", auth, async (req, res) => {
  const { players } = req.body;

  if (!players || players.length !== 2) {
    return res.status(400).json({ error: "Invalid players input" });
  }

  const chess = new Chess();
  const state = chess.fen();

  const newGame = new Game({ players, state, moves: [] });

  try {
    await newGame.save();
    return res.status(201).json(newGame);
  } catch (error) {
    console.error("Error creating game:", error);
    return res.status(500).json({ error: "Error creating game" });
  }
});

// game lookup
router.get("/:gameID", async (req, res) => {
  try {
    const { gameID } = req.params;
    const game = await Game.findById(gameID);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    return res.status(200).json(game);
  } catch (error) {
    console.error("Error fetching game:", error);
    return res.status(500).json({ error: "Error fetching game" });
  }
});

// make a move
router.post("/move", auth, async (req, res) => {
  const { gameID, move } = req.body;

  if (!gameID || !move) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const game = await Game.findById(gameID);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const chess = new Chess(game.state);
    const result = chess.move(move);

    if (result === null) {
      return res.status(400).json({ error: "Invalid move" });
    }

    game.moves.push(result.san);
    game.state = chess.fen();
    await game.save();

    return res.status(200).json(game);
  } catch (error) {
    console.error("Error processing move:", error);
    return res.status(500).json({ error: "Error processing move" });
  }
});

module.exports = router;
