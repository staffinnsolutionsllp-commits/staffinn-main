const express = require('express');
const router = express.Router();
const { authenticateEmployee } = require('../../middleware/employeeAuth');
const {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../../controllers/hrms/notificationController');

// All routes require employee authentication
router.use(authenticateEmployee);

// Get all notifications for logged-in employee
router.get('/', getMyNotifications);

// Get unread notification count
router.get('/unread-count', getUnreadNotificationCount);

// Mark single notification as read
router.put('/:notificationId/read', markNotificationAsRead);

// Mark all notifications as read
router.put('/mark-all-read', markAllNotificationsAsRead);

module.exports = router;
