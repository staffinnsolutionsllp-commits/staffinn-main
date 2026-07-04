import { io } from 'socket.io-client';

class ProgressSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    try {
      // Only connect if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        return; // Don't connect if not logged in
      }

      if (!this.socket) {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';
        const socketUrl = API_URL.includes('localhost') ? API_URL.replace('/api/v1', '') : API_URL.replace('/api/v1', '');
        
        console.log('🔌 Connecting to socket server:', socketUrl);
        
        this.socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true,
          auth: { token }
        });

        this.socket.on('connect', () => {
          this.isConnected = true;
          console.log('✅ Progress socket connected:', this.socket.id);
        });

        this.socket.on('disconnect', () => {
          this.isConnected = false;
          console.log('❌ Progress socket disconnected');
        });

        this.socket.on('connect_error', (error) => {
          this.isConnected = false;
          console.error('❌ Progress socket error:', error.message);
        });
      }
    } catch (error) {
      console.error('❌ Progress socket setup error:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  emitProgressUpdate(courseId, progressData) {
    if (this.isSocketConnected()) {
      try {
        this.socket.emit('progress-update', {
          courseId,
          ...progressData
        });
        console.log('📤 Progress update emitted:', courseId);
      } catch (error) {
        console.error('❌ Progress emit error:', error);
      }
    }
  }

  onProgressUpdate(callback) {
    if (this.socket) {
      this.socket.on('progress-updated', (data) => {
        console.log('📡 Progress update received:', data);
        callback(data);
      });
    }
  }

  offProgressUpdate(callback) {
    if (this.socket) {
      this.socket.off('progress-updated', callback);
    }
  }
}

const progressSocketService = new ProgressSocketService();
export default progressSocketService;