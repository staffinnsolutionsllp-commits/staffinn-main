import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  public connected: boolean = false;

  connect(token: string, recruiterId: string | null) {
    const API_URL = import.meta.env.PROD
      ? 'https://api.staffinn.com'
      : 'http://localhost:4001';

    console.log('🔌 Connecting to WebSocket:', API_URL);

    this.socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      this.connected = true;
      
      // Join recruiter-specific room for attendance updates
      if (recruiterId) {
        this.socket?.emit('join-room', `recruiter-${recruiterId}`);
        console.log(`📡 Joined room: recruiter-${recruiterId}`);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
    });
  }

  onAttendanceUpdate(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('attendance-update', (data) => {
        console.log('📡 Received attendance update:', data);
        callback(data);
      });
    }
  }

  offAttendanceUpdate() {
    if (this.socket) {
      this.socket.off('attendance-update');
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }
}

export const websocketService = new WebSocketService();
