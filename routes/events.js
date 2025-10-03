const express = require('express');
const router = express.Router();
const conn = require('../db');
const authenticateJWT = require('../middleware/authenticateJWT');
const { body, validationResult } = require('express-validator');

// Helper function for error handling
const handleError = (res, err) => {
  console.error(err);
  return res.status(500).json({ message: 'Database error', error: err.message });
};

// Create an event with validation
router.post(
  '/',
  authenticateJWT, // Authentication middleware
  [
    body('name').notEmpty().withMessage('Event name is required'),
    body('description').notEmpty().withMessage('Event description is required'),
    body('date').isDate().withMessage('Valid date is required').custom(value => {
      const today = new Date();
      const eventDate = new Date(value);
      if (eventDate <= today) {
        throw new Error('Event date must be in the future');
      }
      return true;
    }),
    body('venue').notEmpty().withMessage('Event venue is required')
  ],
  (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // If no validation errors, proceed to insert the event
    const { name, description, date, venue } = req.body;

    const sql = 'INSERT INTO events (name, description, date, venue) VALUES (?, ?, ?, ?)';
    conn.query(sql, [name, description, date, venue], (err, result) => {
      if (err) return handleError(res, err);
      res.status(201).json({ message: 'Event created successfully', eventId: result.insertId });
    });
  }
);

// Get all events
router.get('/', authenticateJWT, (req, res) => {
  const sql = 'SELECT * FROM events';
  conn.query(sql, (err, results) => {
    if (err) return handleError(res, err);
    res.status(200).json(results);
  });
});

// Get single event by ID
router.get('/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM events WHERE id = ?';
  conn.query(sql, [id], (err, results) => {
    if (err) return handleError(res, err);
    if (results.length === 0) return res.status(404).json({ message: 'Event not found' });
    res.status(200).json(results[0]);
  });
});

// Update event
router.put('/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { name, description, date, venue } = req.body;

  // Only update the fields that are provided in the request
  const updates = [];
  const values = [];

  if (name) {
    updates.push('name = ?');
    values.push(name);
  }
  if (description) {
    updates.push('description = ?');
    values.push(description);
  }
  if (date) {
    updates.push('date = ?');
    values.push(date);
  }
  if (venue) {
    updates.push('venue = ?');
    values.push(venue);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  values.push(id); // Add the event ID as the last parameter

  const sql = `UPDATE events SET ${updates.join(', ')} WHERE id = ?`;
  conn.query(sql, values, (err, result) => {
    if (err) return handleError(res, err);
    res.status(200).json({ message: 'Event updated successfully' });
  });
});

// Delete event
router.delete('/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM events WHERE id = ?';
  conn.query(sql, [id], (err, result) => {
    if (err) return handleError(res, err);
    res.status(200).json({ message: 'Event deleted successfully' });
  });
});

module.exports = router;
