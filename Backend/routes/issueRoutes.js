/**
 * Issue Routes
 * Routes for handling blocked user help requests
 */

const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const auth = require('../middleware/auth');

// Public route for creating issues (blocked users can access)
router.post('/create', issueController.createIssue);

module.exports = router;