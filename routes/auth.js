const express = require('express');
const router = express.Router();
const conn = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Import the middleware
const authenticateJWT = require('../middleware/authenticateJWT');

// Load environment variables from .env
dotenv.config();

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Make sure to change this in .env

// REGISTER route
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const userRole = role || 'student';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
    conn.query(sql, [name, email, hashedPassword, userRole], (err, result) => {
      if (err) {
        console.error('Error inserting user:', err);
        return res.status(500).json({ message: 'Database error or user already exists.' });
      }
      res.status(200).json({ message: 'User registered successfully' });
    });
  } catch (err) {
    console.error('Hashing error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// LOGIN route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  conn.execute(sql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token: token // Send the JWT token in the response
    });
  });
});

// Protected route example (requires JWT authentication)
router.get('/protected', authenticateJWT, (req, res) => {
  res.status(200).json({
    message: 'This is a protected route',
    user: req.user // This will include the user data from the JWT token
  });
});

// Example protected route for user profile
router.get('/profile', authenticateJWT, (req, res) => {
  res.status(200).json({
    message: 'This is your profile',
    user: req.user // This will contain the decoded JWT user data
  });
});

module.exports = router;
