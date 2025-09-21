/**
 * Socket.io Configuration
 * Sets up WebSocket server for real-time notifications
 */
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

// Store active connections
const activeConnections = new Map();

/**
 * Initialize Socket.io server
 * @param {Object} server - HTTP server instance
 */
const initializeSocketServer = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware (optional for news updates)
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (token) {
        // Verify JWT token if provided
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
      } else {
        // Allow anonymous connections for news updates
        socket.user = { userId: 'anonymous', role: 'guest' };
      }
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      // Still allow connection for news updates
      socket.user = { userId: 'anonymous', role: 'guest' };
      next();
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.userId} (${socket.user.role})`);
    
    // Store user connection
    activeConnections.set(socket.user.userId, socket);
    
    // Join user-specific room for notifications
    if (socket.user.userId !== 'anonymous') {
      socket.join(`user_${socket.user.userId}`);
    }
    
    // Send unread notifications count on connection
    sendUnreadNotificationsCount(socket);
    
    // Handle visibility status check on connection
    socket.on('check_visibility', async (data) => {
      try {
        const userId = socket.user.userId;
        const role = socket.user.role;
        
        let isHidden = false;
        
        if (role === 'staff') {
          const staffModel = require('../models/staffModel');
          const profile = await staffModel.getStaffProfile(userId);
          isHidden = profile && profile.profileVisibility === 'private';
        } else if (role === 'recruiter') {
          const userModel = require('../models/userModel');
          const user = await userModel.findUserById(userId);
          isHidden = user && user.isVisible === false;
        }
        
        if (isHidden) {
          socket.emit('visibility_update', {
            isHidden: true,
            message: 'Your profile has been hidden by administrators',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error checking visibility status:', error);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.userId}`);
      activeConnections.delete(socket.user.userId);
    });
  });

  console.log('Socket.io server initialized');
  return io;
};

/**
 * Send unread notifications count to user on connection
 * @param {Object} socket - Socket.io socket
 */
const sendUnreadNotificationsCount = async (socket) => {
  try {
    const userId = socket.user.userId;
    const dynamoService = require('../services/dynamoService');
    const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE || 'staffinn-notifications';
    
    // Get all notifications for the user
    const allNotifications = await dynamoService.scanItems(NOTIFICATIONS_TABLE);
    const userNotifications = allNotifications.filter(notification => notification.userId === userId);
    const unreadCount = userNotifications.filter(n => !n.read).length;
    
    // Send unread count to user
    socket.emit('unread_count', { count: unreadCount });
    console.log(`Sent unread count (${unreadCount}) to user ${userId}`);
  } catch (error) {
    console.error('Error sending unread notifications count:', error);
  }
};

/**
 * Send notification to a specific user
 * @param {string} userId - User ID to send notification to
 * @param {object} notification - Notification data
 */
const sendNotificationToUser = (userId, notification) => {
  try {
    const userSocket = activeConnections.get(userId);
    
    if (userSocket) {
      userSocket.emit('notification', notification);
      console.log(`Notification sent to user ${userId}`);
      return true;
    } else {
      console.log(`User ${userId} not connected, notification not sent in real-time`);
      return false;
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

/**
 * Send visibility status update to a specific user
 * @param {string} userId - User ID to send update to
 * @param {object} visibilityData - Visibility status data
 */
const sendVisibilityUpdate = (userId, visibilityData) => {
  try {
    const userSocket = activeConnections.get(userId);
    
    if (userSocket) {
      userSocket.emit('visibility_update', visibilityData);
      console.log(`Visibility update sent to user ${userId}:`, visibilityData);
      return true;
    } else {
      console.log(`User ${userId} not connected, visibility update not sent in real-time`);
      return false;
    }
  } catch (error) {
    console.error('Error sending visibility update:', error);
    return false;
  }
};

/**
 * Check visibility status for all connected users
 */
const checkAllUsersVisibility = async () => {
  try {
    for (const [userId, socket] of activeConnections) {
      const role = socket.user?.role;
      
      if (!role) continue;
      
      let isHidden = false;
      
      if (role === 'staff') {
        const staffModel = require('../models/staffModel');
        const profile = await staffModel.getStaffProfile(userId);
        isHidden = profile && profile.profileVisibility === 'private';
      } else if (role === 'recruiter') {
        const userModel = require('../models/userModel');
        const user = await userModel.findUserById(userId);
        isHidden = user && user.isVisible === false;
      }
      
      if (isHidden) {
        socket.emit('visibility_update', {
          isHidden: true,
          message: 'Your profile has been hidden by administrators',
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error checking all users visibility:', error);
  }
};

module.exports = {
  initializeSocketServer,
  sendNotificationToUser,
  sendVisibilityUpdate,
  checkAllUsersVisibility,
  activeConnections
};