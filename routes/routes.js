const express = require('express');
const { loginUser, signupUser } = require('../db/auth'); // Import functions from auth.js
const router = express.Router();

// Login Route
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  loginUser(email, password, res);
});

// Signup Route
router.post('/signup', (req, res) => {
  const { email, password, role_id } = req.body;
  if (!email || !password || !role_id) {
    return res.status(400).json({ message: 'Email, password, and role_id are required' });
  }
  signupUser(email, password, role_id, res);
});

module.exports = router;
