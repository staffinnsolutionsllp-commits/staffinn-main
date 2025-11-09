/**
 * User Notification Routes
 * Routes for users to manage their notifications
 */
const express = require('express');
const router = express.Router();
const { getUserNotifications, getNotificationCount, markNotificationAsRead } = require('../controllers/adminNotificationController');
const auth = require('../middleware/auth');

// User routes (require user authentication)
router.get('/', auth.authenticateUser, getUserNotifications);
router.get('/count', auth.authenticateUser, getNotificationCount);
router.put('/:notificationId/read', auth.authenticateUser, markNotificationAsRead);

module.exports = router;