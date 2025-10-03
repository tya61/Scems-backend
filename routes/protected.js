// routes/protected.js
const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authenticateJWT');

// Protected Profile Route
router.get('/profile', authenticateJWT, (req, res) => {
  res.status(200).json({
    message: 'This is your profile data',
    user: req.user
  });
});

module.exports = router;
