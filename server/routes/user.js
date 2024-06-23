const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const dotenv = require('dotenv').config()

// user registration
router.post('/register', async (req, res) => {
  const { username, password, email, name } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = new User({ username, password: hashedPassword, email, name });
    await user.save();
    return res.status(201).send('registration successful');
  } catch (error) {
    return res.status(400).send('registration error');
  }
});

// user login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) {
    return res.status(400).send('user not found');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).send('invalid password');
  }

  // generate jwt token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  return res.status(200).json({ token });
});

module.exports = router;