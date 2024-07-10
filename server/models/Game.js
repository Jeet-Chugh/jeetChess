const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  players: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      color: { type: String, enum: ['w', 'b'], required: true }
    }
  ],
  moves: [{ type: String }],
  state: { type: String }, // FEN string
  createdAt: { type: Date, default: Date.now },
});

const Game = mongoose.model('Game', GameSchema);
module.exports = Game;
