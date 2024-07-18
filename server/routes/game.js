const express = require("express");
const auth = require("../middleware/authMiddleware");
const Chess = require("chess.js").Chess;
const Game = require("../models/Game");
const router = express.Router();

// start game
router.post("/start", auth, async (req, res) => {
  const { w, b } = req.body;

  if (!w || !b) {
    return res.status(400).json({ error: "Invalid players input" });
  }

  const state = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const newGame = new Game({
    w, 
    b,
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
    const game = await Game.findById(gameID).populate('w b');

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

    console.log(game);

    // Check if the current user is one of the players
    if (game.w.toString() !== currentUser && game.b.toString() !== currentUser) {
      return res.status(403).json({ error: "Not a player in this game" });
    }

    // Check if it's the current player's turn
    if ((turn === 'w' && game.w.toString() !== currentUser) || 
        (turn === 'b' && game.b.toString() !== currentUser)) {
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
    game.lastMoveBy = currentUser;

    res.status(200).json(game);
    req.io.to(gameID).emit("moveMade", game);
  } catch (error) {
    console.error("Error processing move:", error);
    return res.status(500).json({ error: "Error processing move" });
  }
});

module.exports = router;