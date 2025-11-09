/**
 * Notification Routes
 * Handles notification-related endpoints
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} = require('../controllers/notificationController');

// Get user notifications
router.get('/', authenticate, getUserNotifications);

// Mark notification as read
router.put('/:notificationId/read', authenticate, markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', authenticate, markAllNotificationsAsRead);

// Delete notification
router.delete('/:notificationId', authenticate, deleteNotification);

module.exports = router;