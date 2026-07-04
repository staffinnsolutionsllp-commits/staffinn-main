/**
 * WebSocket Server for Real-time Updates
 * Handles MIS status updates and other real-time notifications
 */

const { Server } = require('socket.io');

let io;

const initializeWebSocket = (server) => {
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : [
        'https://hrms.staffinn.com',
        'https://staffinn.com',
        'https://employee.staffinn.com',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:5177'
      ];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    // Handle recruiter joining their room for attendance updates
    socket.on('join-recruiter-room', (recruiterId) => {
      socket.join(`recruiter-${recruiterId}`);
      console.log(`💼 Recruiter ${recruiterId} joined room for attendance + campus invite updates`);
    });

    // Generic join-room handler for flexibility
    socket.on('join-room', (roomName) => {
      socket.join(roomName);
      console.log(`📡 Client joined room: ${roomName}`);
    });

    // Handle institute joining their room for MIS updates
    socket.on('join-institute-room', (instituteId) => {
      socket.join(`institute-${instituteId}`);
      console.log(`🏢 Institute ${instituteId} joined room for real-time updates`);
    });

    // Handle joining slot-availability room for a specific institute
    // Both institutes and recruiters join this to get real-time slot updates
    socket.on('join-availability-room', (instituteId) => {
      socket.join(`availability-${instituteId}`);
      console.log(`📅 Client joined availability room for institute: ${instituteId}`);
    });

    // Handle employee joining their room for grievance updates
    socket.on('join-employee-room', (employeeId) => {
      socket.join(`employee-${employeeId}`);
      console.log(`👤 Employee ${employeeId} joined room for real-time updates`);
    });

    // Handle user joining their personal room for real-time chat messages
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
      console.log(`💬 User ${userId} joined personal room for real-time chat`);
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

// Emit grievance status update to specific employee
const emitGrievanceUpdate = (employeeId, grievanceData) => {
  if (io) {
    console.log(`📡 Emitting grievance update to employee ${employeeId}`);
    io.to(`employee-${employeeId}`).emit('grievance-status-update', {
      grievance: grievanceData,
      timestamp: new Date().toISOString()
    });
    console.log(`📡 Grievance update emitted successfully`);
  } else {
    console.error('❌ WebSocket server (io) is not initialized!');
  }
};

// Emit notification to specific employee
const emitEmployeeNotification = (employeeId, notificationData) => {
  if (io) {
    console.log(`🔔 Emitting notification to employee ${employeeId}`);
    io.to(`employee-${employeeId}`).emit('employee-notification', {
      notification: notificationData,
      timestamp: new Date().toISOString()
    });
    console.log(`🔔 Notification emitted successfully`);
  } else {
    console.error('❌ WebSocket server (io) is not initialized!');
  }
};

// Emit attendance update to specific recruiter
const emitAttendanceUpdate = (recruiterId, attendanceData) => {
  if (io) {
    console.log(`📡 Emitting attendance update to recruiter ${recruiterId}`);
    console.log(`📡 Room name: recruiter-${recruiterId}`);
    console.log(`📡 Connected clients in room:`, io.sockets.adapter.rooms.get(`recruiter-${recruiterId}`)?.size || 0);
    
    io.to(`recruiter-${recruiterId}`).emit('attendance-update', {
      attendance: attendanceData,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📡 Attendance update event emitted successfully`);
  } else {
    console.error('❌ WebSocket server (io) is not initialized!');
  }
};

// Emit device status update to specific recruiter
const emitDeviceStatusUpdate = (recruiterId, deviceStatus) => {
  if (io) {
    console.log(`📡 Emitting device status to recruiter ${recruiterId}`);
    io.to(`recruiter-${recruiterId}`).emit('device-status-update', {
      status: deviceStatus,
      timestamp: new Date().toISOString()
    });
    console.log(`📡 Device status update emitted successfully`);
  } else {
    console.error('❌ WebSocket server (io) is not initialized!');
  }
};

module.exports = {
  initializeWebSocket,
  emitMisStatusUpdate,
  emitNotification,
  emitGrievanceUpdate,
  emitEmployeeNotification,
  emitAttendanceUpdate,
  emitDeviceStatusUpdate
};