/**
 * Contact Routes
 * Handles contact history API endpoints
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createContactRecord,
  getContactHistory
} = require('../controllers/contactController');

// All contact routes require authentication
router.use(authenticate);

// POST /api/contact/record - Create a new contact record
router.post('/record', createContactRecord);

// GET /api/contact/history - Get contact history for current user
router.get('/history', getContactHistory);

module.exports = router;