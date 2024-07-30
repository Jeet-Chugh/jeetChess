const express = require("express");
const auth = require("../middleware/authMiddleware");
const Chess = require("chess.js").Chess;
const Game = require("../models/Game");
const User = require("../models/User");
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
    
    // Add the game to both players' games array
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
    const userId = req.user.userId;
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

// game lookup
router.get("/:gameID", async (req, res) => {
  try {
    const { gameID } = req.params;
    const game = await Game.findById(gameID).populate('w b');

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    return res.status(200).json({...game.toObject(), "turn": new Chess(game.state).turn()});
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

    if (game.result !== "n") {
      return res.status(403).json({ error: "Game is already over" })
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
    req.io.to(gameID).emit("moveMade", {"game": game, "turn": chess.turn()});
  } catch (error) {
    console.error("Error processing move:", error);
    return res.status(500).json({ error: "Error processing move" });
  }
});

router.post("/:gameID/resign", auth, async (req, res) => {
  const { gameID } = req.params;
  const resigningUserId = req.user.userId;

  try {
    const game = await Game.findById(gameID);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (game.w.toString() !== resigningUserId && game.b.toString() !== resigningUserId) {
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
  const offeringUserId = req.user.userId;

  try {
    const game = await Game.findById(gameID);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (game.w.toString() !== offeringUserId && game.b.toString() !== offeringUserId) {
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
  const acceptingUserId = req.user.userId;

  try {
    const game = await Game.findById(gameID);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (game.w.toString() !== acceptingUserId && game.b.toString() !== acceptingUserId) {
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

module.exports = router;