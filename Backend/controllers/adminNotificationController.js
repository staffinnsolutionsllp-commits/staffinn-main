/**
 * Admin Notification Controller
 * Handles notification management for Master Admin Panel
 */
const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');
const userModel = require('../models/userModel');

/**
 * Send notification to users
 * @route POST /api/v1/admin/notifications/send
 */
const sendNotification = async (req, res) => {
  try {
    const { title, message, targetAudience } = req.body;
    
    if (!title || !message || !targetAudience) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, and target audience are required'
      });
    }

    // Get target users based on audience
    let targetUsers = [];
    
    if (targetAudience === 'all') {
      targetUsers = await userModel.getAllUsers();
    } else {
      targetUsers = await userModel.getUsersByRole(targetAudience);
    }

    if (!targetUsers || targetUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No users found for the selected audience'
      });
    }

    // Create notification for each target user
    const notifications = [];
    const notificationId = uuidv4();
    const timestamp = new Date().toISOString();

    for (const user of targetUsers) {
      const userNotificationId = `${notificationId}_${user.userId}`;
      
      const notification = {
        notificationsId: userNotificationId,
        userId: user.userId,
        title,
        message,
        targetAudience,
        isRead: false,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      notifications.push(notification);
    }

    // Save all notifications to DynamoDB
    const savePromises = notifications.map(notification => 
      dynamoService.putItem('staffinn-notifications', notification)
    );

    await Promise.all(savePromises);

    // Emit real-time notification via Socket.IO
    const io = req.app.get('io');
    if (io) {
      notifications.forEach(notification => {
        io.to(`user_${notification.userId}`).emit('new_notification', {
          id: notification.notificationsId,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt
        });
      });
    }

    res.status(201).json({
      success: true,
      message: `Notification sent to ${notifications.length} users`,
      data: {
        notificationId,
        targetCount: notifications.length,
        targetAudience
      }
    });

  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send notification'
    });
  }
};

/**
 * Get user notifications
 * @route GET /api/v1/notifications
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Query notifications for this user
    const params = {
      TableName: 'staffinn-notifications',
      FilterExpression: 'userId = :userId AND isRead = :isRead',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isRead': false
      }
    };

    const notifications = await dynamoService.scanItems('staffinn-notifications', {
      FilterExpression: 'userId = :userId AND isRead = :isRead',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isRead': false
      }
    });
    
    // Sort by creation date (newest first)
    notifications.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      success: true,
      data: notifications,
      count: notifications.length
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
 * @route PUT /api/v1/notifications/:notificationId/read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    // Get the notification first to verify ownership
    const notification = await dynamoService.getItem('staffinn-notifications', {
      notificationsId: notificationId
    });

    if (!notification || notification.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Update notification as read
    await dynamoService.updateItem(
      'staffinn-notifications',
      { notificationsId: notificationId },
      {
        UpdateExpression: 'SET isRead = :isRead, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':isRead': true,
          ':updatedAt': new Date().toISOString()
        }
      }
    );

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
 * Get notification count for user
 * @route GET /api/v1/notifications/count
 */
const getNotificationCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const params = {
      TableName: 'staffinn-notifications',
      FilterExpression: 'userId = :userId AND isRead = :isRead',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isRead': false
      },
      Select: 'COUNT'
    };

    const notifications = await dynamoService.scanItems('staffinn-notifications', {
      FilterExpression: 'userId = :userId AND isRead = :isRead',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isRead': false
      }
    });

    res.status(200).json({
      success: true,
      count: notifications.length
    });

  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get notification count'
    });
  }
};

module.exports = {
  sendNotification,
  getUserNotifications,
  markNotificationAsRead,
  getNotificationCount
};