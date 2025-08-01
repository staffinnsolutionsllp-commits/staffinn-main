/**
 * Hiring Routes
 * Handles hiring-related API endpoints
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  hireStaff,
  getHiringHistory,
  rateHiring,
  getHiringStats,
  getHiringRecord
} = require('../controllers/hiringController');

// All hiring routes require authentication
router.use(authenticate);

// POST /api/hiring/hire - Create a new hiring record
router.post('/hire', hireStaff);

// GET /api/hiring/history - Get hiring history for current user
router.get('/history', getHiringHistory);

// GET /api/hiring/stats - Get hiring statistics for current user
router.get('/stats', getHiringStats);

// GET /api/hiring/:hiringId - Get specific hiring record
router.get('/:hiringId', getHiringRecord);

// PUT /api/hiring/:hiringId/rate - Rate a hiring record
router.put('/:hiringId/rate', rateHiring);

module.exports = router;