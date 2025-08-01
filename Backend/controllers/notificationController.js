/**
 * Notification Controller
 * Handles notification management
 */
const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');
const { sendNotificationToUser } = require('../config/socket');

const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE || 'staffinn-notifications';

/**
 * Create a new notification
 * @param {string} userId - User ID to notify
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional notification data
 * @param {boolean} sendRealTime - Whether to send notification in real-time
 */
const createNotification = async (userId, type, title, message, data = {}, sendRealTime = true) => {
  try {
    const notification = {
      notificationId: uuidv4(),
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date().toISOString()
    };

    // Save notification to DynamoDB
    await dynamoService.putItem(NOTIFICATIONS_TABLE, notification);
    
    // Send real-time notification if requested
    if (sendRealTime) {
      sendNotificationToUser(userId, notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

/**
 * Get notifications for a user
 * @route GET /api/notifications
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, unreadOnly = false } = req.query;

    // Get all notifications for the user
    const allNotifications = await dynamoService.scanItems(NOTIFICATIONS_TABLE);
    let userNotifications = allNotifications.filter(notification => notification.userId === userId);

    // Filter unread only if requested
    if (unreadOnly === 'true') {
      userNotifications = userNotifications.filter(notification => !notification.read);
    }

    // Sort by creation date (newest first)
    userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit results
    const limitedNotifications = userNotifications.slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      data: limitedNotifications,
      unreadCount: userNotifications.filter(n => !n.read).length
    });

  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get notifications'
    });
  }
};

/**
 * Mark notification as read
 * @route PUT /api/notifications/:notificationId/read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    // Get the notification
    const notification = await dynamoService.getItem(NOTIFICATIONS_TABLE, { notificationId });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if notification belongs to the user
    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update notification as read
    const updatedNotification = {
      ...notification,
      read: true,
      readAt: new Date().toISOString()
    };

    await dynamoService.putItem(NOTIFICATIONS_TABLE, updatedNotification);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read'
    });
  }
};

/**
 * Mark all notifications as read
 * @route PUT /api/notifications/read-all
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all unread notifications for the user
    const allNotifications = await dynamoService.scanItems(NOTIFICATIONS_TABLE);
    const unreadNotifications = allNotifications.filter(
      notification => notification.userId === userId && !notification.read
    );

    // Update all unread notifications
    const updatePromises = unreadNotifications.map(notification => {
      const updatedNotification = {
        ...notification,
        read: true,
        readAt: new Date().toISOString()
      };
      return dynamoService.putItem(NOTIFICATIONS_TABLE, updatedNotification);
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `${unreadNotifications.length} notifications marked as read`
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark all notifications as read'
    });
  }
};

/**
 * Delete notification
 * @route DELETE /api/notifications/:notificationId
 */
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    // Get the notification
    const notification = await dynamoService.getItem(NOTIFICATIONS_TABLE, { notificationId });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if notification belongs to the user
    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete notification
    await dynamoService.deleteItem(NOTIFICATIONS_TABLE, { notificationId });

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notification'
    });
  }
};

/**
 * Send job notification to followers
 * @param {string} recruiterId - Recruiter ID who posted the job
 * @param {object} jobData - Job data
 */
const sendJobNotificationToFollowers = async (recruiterId, jobData) => {
  try {
    // Get recruiter profile to find followers
    const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE || 'staffinn-recruiter-profiles';
    const recruiterProfile = await dynamoService.getItem(RECRUITER_PROFILES_TABLE, { recruiterId });
    
    if (!recruiterProfile || !recruiterProfile.followers || recruiterProfile.followers.length === 0) {
      console.log('No followers found for recruiter:', recruiterId);
      return;
    }

    // Get recruiter name
    const userModel = require('../models/userModel');
    const recruiter = await userModel.findUserById(recruiterId);
    const companyName = recruiterProfile.companyName || recruiter?.name || 'A recruiter';

    console.log(`Sending job notifications to ${recruiterProfile.followers.length} followers for job: ${jobData.title}`);

    // Create notifications for all followers
    const notificationPromises = recruiterProfile.followers.map(followerId => {
      // Create notification with the exact format requested
      const notificationMessage = `${companyName} posted a new job ${jobData.title}`;
      
      // Create notification object
      const notification = {
        notificationId: uuidv4(),
        userId: followerId,
        type: 'new_job',
        title: 'New Job Posted',
        message: notificationMessage,
        data: {
          jobId: jobData.jobId,
          jobTitle: jobData.title,
          recruiterId,
          recruiterName: companyName,
          companyName: companyName
        },
        read: false,
        createdAt: new Date().toISOString()
      };
      
      // Save notification to DynamoDB
      return dynamoService.putItem(NOTIFICATIONS_TABLE, notification)
        .then(() => {
          // Send real-time notification
          const userSocket = require('../config/socket').activeConnections.get(followerId);
          if (userSocket) {
            userSocket.emit('notification', notification);
            console.log(`Real-time notification sent to user ${followerId}`);
          }
          return notification;
        });
    });

    await Promise.all(notificationPromises);
    console.log(`Sent job notifications to ${recruiterProfile.followers.length} followers`);

  } catch (error) {
    console.error('Send job notification to followers error:', error);
    // Don't throw error to avoid breaking job creation
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  sendJobNotificationToFollowers
};