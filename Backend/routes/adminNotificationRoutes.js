/**
 * Admin Notification Routes
 * Routes for notification management in Master Admin Panel
 */
const express = require('express');
const router = express.Router();
const { sendNotification } = require('../controllers/adminNotificationController');
const auth = require('../middleware/auth');

// Admin routes (require admin authentication)
router.post('/send', auth.authenticateAdmin, sendNotification);

module.exports = router;