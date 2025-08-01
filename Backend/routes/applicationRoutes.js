/**
 * Application Routes
 * Handles application API endpoints
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  applyForJob,
  recordProfileView,
  getDashboardData
} = require('../controllers/applicationController');

// All application routes require authentication
router.use(authenticate);

// POST /api/applications/apply - Apply for a job
router.post('/apply', applyForJob);

// POST /api/applications/profile-view - Record profile view
router.post('/profile-view', recordProfileView);

// GET /api/applications/dashboard - Get dashboard data
router.get('/dashboard', getDashboardData);

module.exports = router;