const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  w: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  b: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  moves: [{ type: String }],
  state: { type: String }, // FEN string
  createdAt: { type: Date, default: Date.now },
  result: { type: String, default: "n" },
  drawOffer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

const Game = mongoose.model('Game', GameSchema);
module.exports = Game;
