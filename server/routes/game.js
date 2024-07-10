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

  const newGame = new Game({
    players: [
      { user: players[0], color: "w" },
      { user: players[1], color: "b" }
    ],
    state,
    moves: []
  });

  try {
    await newGame.save();
    res.status(201).json(newGame);
    req.io.to(newGame._id.toString()).emit("gameStarted", newGame);
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({ error: "Error creating game" });
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
    const turn = chess.turn(); // 'w' for white, 'b' for black
    const currentUser = req.user.userId; // from auth middleware
    console.log(currentUser)

    // current player's color
    const currentPlayer = game.players.find(player => player.user.toString() === currentUser);

    if (!currentPlayer) {
      return res.status(403).json({ error: "Not a player in this game" });
    }

    if (currentPlayer.color !== turn) {
      return res.status(403).json({ error: "Not your turn" });
    }

    const result = chess.move(move);

    if (result === null) {
      console.error("Invalid move attempted:", move);
      return res.status(400).json({ error: "Invalid move" });
    }

    game.moves.push(result.san);
    game.state = chess.fen();
    await game.save();

    res.status(200).json(game);
    req.io.to(gameID).emit("moveMade", game);
  } catch (error) {
    console.error("Error processing move:", error);
    return res.status(500).json({ error: "Error processing move" });
  }
});

module.exports = router;
