const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require("../middleware/authMiddleware");
const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, email });
    await user.save();
    return res.status(201).send('Registration successful');
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern).join(",");
      return res.status(400).send(`${field} already exists`);
    }
    console.error('Registration error:', error);
    return res.status(400).send('Registration error');
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).send('Invalid credentials');
    }

    const accessToken = generateToken({
      username: user.username,
      email: user.email,
      id: user._id
    }, process.env.ACCESS_TOKEN_SECRET, '15m');
    const refreshToken = generateToken({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, '7d');

    return res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).send('Server error');
  }
});

router.get('/by-username/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ _id: user._id, username: user.username });
  } catch (error) {
    console.error('Error fetching user by username:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).send('No refresh token specified');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).send('User not found');
    }
    
    const accessToken = generateToken({
        username: user.username,
        email: user.email,
        id: user._id
    },
    process.env.ACCESS_TOKEN_SECRET, '15m');
    const newRefreshToken = generateToken({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, '7d');
    
    return res.status(200).json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    return res.status(401).send('Invalid refresh token');
  }
});

router.post('/change-username', auth, async (req, res) => {
  try {
    const { newUsername } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send('User not found');
    }

    const existingUser = await User.findOne({ username: newUsername });
    if (existingUser) {
      return res.status(400).send('Username already exists');
    }

    user.username = newUsername;
    await user.save();

    res.status(200).send('Username updated successfully');
  } catch (error) {
    console.error('Error changing username:', error);
    res.status(500).send('Server error');
  }
});

router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).send('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).send('Password changed successfully');
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).send('Server error');
  }
});

router.delete('/delete-account', auth, async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.user.id);
    if (!result) {
      return res.status(404).send('User not found');
    }
    res.status(200).send('Account deleted successfully');
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).send('Server error');
  }
});

function generateToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn });
}

module.exports = router;