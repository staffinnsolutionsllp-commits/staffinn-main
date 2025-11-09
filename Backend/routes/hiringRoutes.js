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
  getHiringRecord,
  hireInstituteStudent,
  getRecruiterHiringHistory,
  getInstituteHiringHistory
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

// POST /api/hiring/institute-student - Hire or reject institute student
router.post('/institute-student', hireInstituteStudent);

// GET /api/hiring/recruiter-history - Get recruiter hiring history
router.get('/recruiter-history', getRecruiterHiringHistory);

// GET /api/hiring/institute/:instituteId/history - Get institute hiring history
router.get('/institute/:instituteId/history', getInstituteHiringHistory);

module.exports = router;