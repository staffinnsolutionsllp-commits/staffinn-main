import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useWebSocket = (serverUrl = 'http://localhost:4001') => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🔌 WebSocket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('🔌 WebSocket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [serverUrl]);

  // Join institute room for MIS updates
  const joinInstituteRoom = (instituteId) => {
    if (socketRef.current) {
      console.log(`🏢 Attempting to join institute room: ${instituteId}`);
      socketRef.current.emit('join-institute-room', instituteId);
      console.log(`🏢 Join room event emitted for institute: ${instituteId}`);
    } else {
      console.error('❌ Socket not available when trying to join room');
    }
  };

  // Listen for MIS status updates
  const onMisStatusUpdate = (callback) => {
    if (socketRef.current) {
      console.log('📡 Registering MIS status update listener');
      socketRef.current.on('mis-status-update', (data) => {
        console.log('📡 MIS status update received in WebSocket hook:', data);
        callback(data);
      });
    }
  };

  // Remove MIS status update listener
  const offMisStatusUpdate = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('mis-status-update', callback);
    }
  };

  // Listen for general notifications
  const onNotification = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('notification', callback);
    }
  };

  // Remove notification listener
  const offNotification = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('notification', callback);
    }
  };

  return {
    socket: socketRef.current,
    joinInstituteRoom,
    onMisStatusUpdate,
    offMisStatusUpdate,
    onNotification,
    offNotification
  };
};

export default useWebSocket;