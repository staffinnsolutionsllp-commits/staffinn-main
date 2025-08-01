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

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.userId} (${socket.user.role})`);
    
    // Store user connection
    activeConnections.set(socket.user.userId, socket);
    
    // Send unread notifications count on connection
    sendUnreadNotificationsCount(socket);
    
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

module.exports = {
  initializeSocketServer,
  sendNotificationToUser,
  activeConnections
};