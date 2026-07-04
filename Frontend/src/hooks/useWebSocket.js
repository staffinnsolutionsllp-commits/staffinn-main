import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useWebSocket = (serverUrl) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Only initialize socket if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      return; // Don't connect if not logged in
    }

    // Use production URL if not provided
    const socketServerUrl = serverUrl || import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4001';

    // Initialize socket connection
    socketRef.current = io(socketServerUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: { token }
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
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
      socketRef.current.emit('join-institute-room', instituteId);
      console.log('🏢 Joined institute room:', instituteId);
    }
  };

  // Listen for MIS status updates
  const onMisStatusUpdate = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('mis-status-update', (data) => {
        console.log('📡 MIS status update received:', data);
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

  // Listen for campus invite status updates (institute side)
  const onCampusInviteStatusUpdate = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('campus-invite-status-update', (data) => {
        console.log('📡 Campus invite status update received:', data);
        callback(data);
      });
    }
  };

  const offCampusInviteStatusUpdate = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('campus-invite-status-update', callback);
    }
  };

  // Listen for new campus invites (recruiter side)
  const onCampusInviteReceived = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('campus-invite-received', (data) => {
        console.log('📡 New campus invite received:', data);
        callback(data);
      });
    }
  };

  const offCampusInviteReceived = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('campus-invite-received', callback);
    }
  };

  // Join slot-availability room for a specific institute
  // Both institutes and recruiters call this to get real-time slot updates
  const joinAvailabilityRoom = (instituteId) => {
    if (socketRef.current && instituteId) {
      socketRef.current.emit('join-availability-room', instituteId);
      console.log('📅 Joined availability room for institute:', instituteId);
    }
  };

  // Join personal user room for real-time chat messages
  const joinUserRoom = (userId) => {
    if (socketRef.current && userId) {
      socketRef.current.emit('join-user-room', userId);
      console.log('💬 Joined personal user room:', userId);
    }
  };

  // Listen for new chat messages
  const onNewMessage = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('new-message', (data) => {
        console.log('📨 New message received:', data);
        callback(data);
      });
    }
  };

  const offNewMessage = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('new-message', callback);
    }
  };

  // Listen for slot availability updates
  const onSlotAvailabilityUpdate = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('slot-availability-update', (data) => {
        console.log('📡 Slot availability update received:', data);
        callback(data);
      });
    }
  };

  const offSlotAvailabilityUpdate = (callback) => {
    if (socketRef.current) {
      socketRef.current.off('slot-availability-update', callback);
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
    offNotification,
    onCampusInviteStatusUpdate,
    offCampusInviteStatusUpdate,
    onCampusInviteReceived,
    offCampusInviteReceived,
    joinAvailabilityRoom,
    onSlotAvailabilityUpdate,
    offSlotAvailabilityUpdate,
    joinUserRoom,
    onNewMessage,
    offNewMessage
  };
};

export default useWebSocket;