import { io } from 'socket.io-client';

class ProgressSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    try {
      if (!this.socket) {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';
        const socketUrl = API_URL.includes('localhost') ? API_URL.replace('/api/v1', '') : API_URL.replace('/api/v1', '');
        
        this.socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true
        });

        this.socket.on('connect', () => {
          console.log('Progress socket connected');
          this.isConnected = true;
        });

        this.socket.on('disconnect', () => {
          console.log('Progress socket disconnected');
          this.isConnected = false;
        });

        this.socket.on('connect_error', (error) => {
          console.error('Progress socket connection error:', error);
          this.isConnected = false;
        });
      }
    } catch (error) {
      console.error('Error connecting to progress socket:', error);
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
      } catch (error) {
        console.error('Error emitting progress update:', error);
      }
    }
  }

  onProgressUpdate(callback) {
    if (this.socket) {
      this.socket.on('progress-updated', callback);
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