const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    created: { type: Date, default: Date.now },
    games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }]
});

const User = mongoose.model('User', UserSchema)
module.exports = User