const express = require("express");
const auth = require("../middleware/authMiddleware");
const { Chess } = require("chess.js");
const Game = require("../models/Game");
const User = require("../models/User");
const router = express.Router();

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

router.post("/start", auth, async (req, res) => {
  const { w, b } = req.body;

  if (!w || !b) {
    return res.status(400).json({ error: "Invalid players input" });
  }

  const newGame = new Game({ w, b, state: INITIAL_FEN, moves: [] });

  try {
    await newGame.save();
    await User.updateMany(
      { _id: { $in: [w, b] } },
      { $push: { games: newGame._id } }
    );

    res.status(201).json(newGame);
    req.io.to(newGame._id.toString()).emit("gameStarted", newGame);
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({ error: "Error creating game" });
  }
});

router.get("/my-games", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate({
      path: 'games',
      populate: { path: 'w b', select: 'username' },
      options: { sort: { createdAt: -1 } }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const gamesWithDetails = user.games.map(game => {
      const chess = new Chess(game.state);
      return {
        ...game.toObject(),
        isUserWhite: game.w._id.toString() === userId,
        opponent: game.w._id.toString() === userId ? game.b.username : game.w.username,
        currentPosition: chess.fen(),
      };
    });

    res.status(200).json(gamesWithDetails);
  } catch (error) {
    console.error("Error fetching user's games:", error);
    res.status(500).json({ error: "Error fetching games" });
  }
});

router.get("/:gameID", async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameID).populate('w b');

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const chess = new Chess(game.state);
    return res.status(200).json({ ...game.toObject(), turn: chess.turn() });
  } catch (error) {
    console.error("Error fetching game:", error);
    return res.status(500).json({ error: "Error fetching game" });
  }
});

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

    if (game.result !== "n") {
      return res.status(403).json({ error: "Game is already over" });
    }

    const chess = new Chess(game.state);
    const turn = chess.turn();
    const currentUser = req.user.id;

    if (!isPlayerTurn(game, currentUser, turn)) {
      return res.status(403).json({ error: "Not your turn" });
    }

    const result = chess.move(move);

    if (!result) {
      return res.status(400).json({ error: "Invalid move" });
    }

    game.moves.push(result.san);
    game.state = chess.fen();
    game.lastMoveBy = currentUser;
    await game.save();

    res.status(200).json(game);
    req.io.to(gameID).emit("moveMade", { game, turn: chess.turn() });
  } catch (error) {
    console.error("Error processing move:", error);
    return res.status(500).json({ error: "Error processing move" });
  }
});

router.post("/:gameID/resign", auth, async (req, res) => {
  const { gameID } = req.params;
  const resigningUserId = req.user.id;

  try {
    const game = await Game.findById(gameID);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (!isPlayerInGame(game, resigningUserId)) {
      return res.status(403).json({ error: "Not a player in this game" });
    }

    game.result = game.w.toString() === resigningUserId ? 'b' : 'w';
    await game.save();

    res.status(200).json(game);
    req.io.to(gameID).emit("gameEnded", { game, reason: "resignation" });
  } catch (error) {
    console.error("Error processing resignation:", error);
    return res.status(500).json({ error: "Error processing resignation" });
  }
});

router.post("/:gameID/offer-draw", auth, async (req, res) => {
  const { gameID } = req.params;
  const offeringUserId = req.user.id;

  try {
    const game = await Game.findById(gameID);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (!isPlayerInGame(game, offeringUserId)) {
      return res.status(403).json({ error: "Not a player in this game" });
    }

    game.drawOffer = offeringUserId;
    await game.save();

    res.status(200).json(game);
    req.io.to(gameID).emit("drawOffered", { game, offeredBy: offeringUserId });
  } catch (error) {
    console.error("Error processing draw offer:", error);
    return res.status(500).json({ error: "Error processing draw offer" });
  }
});

router.post("/:gameID/accept-draw", auth, async (req, res) => {
  const { gameID } = req.params;
  const acceptingUserId = req.user.id;

  try {
    const game = await Game.findById(gameID);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (!isPlayerInGame(game, acceptingUserId)) {
      return res.status(403).json({ error: "Not a player in this game" });
    }

    if (!game.drawOffer || game.drawOffer.toString() === acceptingUserId) {
      return res.status(400).json({ error: "No valid draw offer to accept" });
    }

    game.result = 'd';
    game.drawOffer = null;
    await game.save();

    res.status(200).json(game);
    req.io.to(gameID).emit("gameEnded", { game, reason: "draw" });
  } catch (error) {
    console.error("Error processing draw acceptance:", error);
    return res.status(500).json({ error: "Error processing draw acceptance" });
  }
});

function isPlayerTurn(game, userId, turn) {
  return (turn === 'w' && game.w.toString() === userId) || 
         (turn === 'b' && game.b.toString() === userId);
}

function isPlayerInGame(game, userId) {
  return game.w.toString() === userId || game.b.toString() === userId;
}

module.exports = router;