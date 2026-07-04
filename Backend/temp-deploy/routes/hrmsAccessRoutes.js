/**
 * HRMS Access Routes
 * Routes for generating and validating HRMS access tokens
 */

const express = require('express');
const router = express.Router();
const { generateAccessToken, validateAccessToken } = require('../controllers/hrmsAccessController');
const { authenticate } = require('../middleware/auth');

/**
 * @route POST /api/hrms-access/generate-token
 * @desc Generate HRMS access token for authenticated recruiter
 * @access Private (Recruiter only)
 */
router.post('/generate-token', authenticate, generateAccessToken);

/**
 * @route GET /api/hrms-access/validate-token
 * @desc Validate HRMS access token
 * @access Public (but requires valid token)
 */
router.get('/validate-token', validateAccessToken);

module.exports = router;
