/**
 * WebSocket Server for Real-time Updates
 * Handles MIS status updates and other real-time notifications
 */

const { Server } = require('socket.io');

let io;

const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5173"],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Handle institute joining their room for MIS updates
    socket.on('join-institute-room', (instituteId) => {
      socket.join(`institute-${instituteId}`);
      console.log(`🏢 Institute ${instituteId} joined room for real-time updates`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  return io;
};

// Emit MIS status update to specific institute
const emitMisStatusUpdate = (instituteId, status) => {
  if (io) {
    console.log(`📡 Emitting MIS status update to institute ${instituteId}: ${status}`);
    console.log(`📡 Room name: institute-${instituteId}`);
    console.log(`📡 Connected clients in room:`, io.sockets.adapter.rooms.get(`institute-${instituteId}`)?.size || 0);
    
    io.to(`institute-${instituteId}`).emit('mis-status-update', {
      status,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📡 MIS status update event emitted successfully`);
  } else {
    console.error('❌ WebSocket server (io) is not initialized!');
  }
};

// Emit general notification to all connected clients
const emitNotification = (message, type = 'info') => {
  if (io) {
    io.emit('notification', {
      message,
      type,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  initializeWebSocket,
  emitMisStatusUpdate,
  emitNotification
};