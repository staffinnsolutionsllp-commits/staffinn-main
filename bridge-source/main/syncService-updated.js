const axios = require('axios');
const Store = require('electron-store');
const io = require('socket.io-client');

class SyncService {
  constructor(deviceManager, database) {
    this.deviceManager = deviceManager;
    this.db = database;
    this.store = new Store();
    this.syncInterval = null;
    this.running = false;
    this.lastSyncTime = null;
    this.socket = null;
    this.mappings = {}; // Cache for employee-device mappings
    this.offlineQueue = []; // Queue for offline records
    this.isOnline = true;
    
    // API URLs
    const baseUrl = this.store.get('apiUrl') || 'https://api.staffinn.com';
    this.apiUrl = `${baseUrl}/api/v1/hrms/attendance/bridge-attendance`;
    this.mappingsUrl = `${baseUrl}/api/v1/hrms/attendance/mappings`;
    this.heartbeatUrl = `${baseUrl}/api/v1/hrms/attendance/heartbeat`;
  }

  async authenticate(companyId, apiKey) {
    this.store.set('companyId', companyId);
    this.store.set('apiKey', apiKey);
    
    try {
      const response = await axios.post('https://api.staffinn.com/api/v1/hrms/company/validate', {
        companyId,
        apiKey
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Load mappings after successful authentication
      await this.loadMappings();
      
      // Connect WebSocket
      this.connectWebSocket();
      
      return response.data;
    } catch (error) {
      console.error('Auth error:', error);
      throw new Error('Authentication failed: ' + (error.response?.data?.message || error.message));
    }
  }

  async loadMappings() {
    try {
      console.log('📥 Loading employee-device mappings...');
      const companyId = this.store.get('companyId');
      const apiKey = this.store.get('apiKey');
      
      const response = await axios.get(this.mappingsUrl, {
        headers: {
          'x-company-id': companyId,
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success && response.data.data) {
        // Create lookup map: deviceUserId -> employeeId
        this.mappings = {};
        response.data.data.forEach(mapping => {
          this.mappings[mapping.deviceUserId] = mapping.employeeId;
        });
        
        console.log(`✅ Loaded ${Object.keys(this.mappings).length} employee mappings`);
        console.log('📋 Mappings:', this.mappings);
      } else {
        console.warn('⚠️ No mappings found. Please configure employee-device mappings in HRMS.');
        this.mappings = {};
      }
    } catch (error) {
      console.error('❌ Failed to load mappings:', error.message);
      this.mappings = {};
    }
  }

  connectWebSocket() {
    try {
      const baseUrl = this.store.get('apiUrl') || 'https://api.staffinn.com';
      const companyId = this.store.get('companyId');
      const apiKey = this.store.get('apiKey');
      
      console.log('🔌 Connecting to WebSocket:', baseUrl);
      
      this.socket = io(baseUrl, {
        auth: {
          companyId,
          apiKey
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10
      });
      
      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.isOnline = true;
        
        // Process offline queue
        this.processOfflineQueue();
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        this.isOnline = false;
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error.message);
        this.isOnline = false;
      });
      
      this.socket.on('mapping-update', async () => {
        console.log('📥 Mapping update received, reloading...');
        await this.loadMappings();
      });
      
    } catch (error) {
      console.error('❌ WebSocket setup failed:', error.message);
    }
  }

  async registerDevice(deviceId) {
    const companyId = this.store.get('companyId');
    const apiKey = this.store.get('apiKey');
    
    try {
      const response = await axios.post(`https://api.staffinn.com/api/v1/hrms/company/${companyId}/devices`, {
        deviceId,
        deviceName: 'Biometric Device',
        deviceType: 'biometric'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Device registration error:', error);
      return { success: false, message: 'Device registration failed but will continue' };
    }
  }

  startAutoSync(intervalMinutes = 5) {
    if (this.running) return;
    
    this.running = true;
    this.syncNow();
    this.sendHeartbeat();
    
    // Real-time sync: every 10 seconds
    this.syncInterval = setInterval(() => {
      this.syncNow();
    }, 10000); // 10 seconds for near real-time
    
    // Send heartbeat every 20 seconds
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 20000);
    
    console.log('✅ Auto-sync started (every 10 seconds)');
  }

  async syncNow() {
    try {
      console.log('🔄 Starting sync...');
      const records = await this.deviceManager.fetchAttendance();
      console.log(`📊 Fetched ${records.length} NEW records from device`);
      
      if (records.length === 0) {
        console.log('ℹ️ No new attendance records');
        this.lastSyncTime = new Date();
        return;
      }

      console.log('💾 Saving records to local database...');
      await this.db.saveRecords(records);
      
      const pendingRecords = await this.db.getPendingRecords();
      console.log(`📤 Total pending: ${pendingRecords.length} records`);
      
      // Process in batches of 20 for faster sync
      const recordsToSync = pendingRecords.slice(0, 20);
      console.log(`📤 Syncing batch of ${recordsToSync.length} records...`);
      
      for (const record of recordsToSync) {
        try {
          // Map deviceUserId to employeeId
          const deviceUserId = record.deviceUserId || record.employeeId;
          const employeeId = this.mappings[deviceUserId];
          
          if (!employeeId) {
            console.warn(`⚠️ No mapping found for device user ID: ${deviceUserId}`);
            console.warn(`⚠️ Please configure mapping in HRMS Device Setup`);
            // Mark as synced to avoid infinite retry
            await this.db.markAsSynced(record.id);
            continue;
          }
          
          console.log(`Syncing: Device User ${deviceUserId} → Employee ${employeeId} at ${record.timestamp}`);
          
          // Update record with mapped employeeId
          record.employeeId = employeeId;
          record.deviceUserId = deviceUserId;
          
          await this.sendToCloud(record);
          await this.db.markAsSynced(record.id);
          console.log('✅ Record synced successfully');
        } catch (error) {
          console.error('❌ Failed to sync record:', error.message);
          
          // Mark as synced if employee not found to avoid infinite retry
          if (error.response?.status === 404) {
            console.log('⚠️ Employee not found, marking as synced to skip');
            await this.db.markAsSynced(record.id);
          } else if (!this.isOnline) {
            // Add to offline queue
            this.offlineQueue.push(record);
            console.log(`📦 Added to offline queue (${this.offlineQueue.length} pending)`);
          }
        }
      }
      
      this.lastSyncTime = new Date();
      console.log('✅ Sync completed');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    }
  }

  async processOfflineQueue() {
    if (this.offlineQueue.length === 0) return;
    
    console.log(`📤 Processing offline queue (${this.offlineQueue.length} records)...`);
    
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    
    for (const record of queue) {
      try {
        await this.sendToCloud(record);
        await this.db.markAsSynced(record.id);
        console.log('✅ Offline record synced');
      } catch (error) {
        console.error('❌ Failed to sync offline record:', error.message);
        // Re-add to queue
        this.offlineQueue.push(record);
      }
    }
    
    console.log(`✅ Offline queue processed. Remaining: ${this.offlineQueue.length}`);
  }

  async sendToCloud(record) {
    const companyId = this.store.get('companyId');
    const apiKey = this.store.get('apiKey');
    
    const timestamp = new Date(record.timestamp);
    
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(timestamp.getTime() + istOffset);
    
    // Format date as YYYY-MM-DD in IST
    const year = istTime.getUTCFullYear();
    const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istTime.getUTCDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    
    // Format time as HH:MM in IST
    const hours = String(istTime.getUTCHours()).padStart(2, '0');
    const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
    const time = `${hours}:${minutes}`;
    
    const payload = {
      employeeId: record.employeeId,
      checkIn: time,
      date: date,
      source: 'biometric',
      deviceId: this.deviceManager.getDeviceId(),
      deviceUserId: record.deviceUserId,
      verifyMode: record.verifyMode || 1
    };
    
    console.log('🔍 Sending to API:', this.apiUrl);
    console.log('📦 Payload:', JSON.stringify(payload));
    console.log('🔑 Headers:', { 'x-company-id': companyId, 'x-api-key': '***' });
    
    try {
      // Direct push to HRMS backend
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          'x-company-id': companyId,
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      console.log('✅ API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API Error Details:');
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Response Data:', error.response?.data);
      console.error('Request URL:', error.config?.url);
      
      // Check if offline
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        this.isOnline = false;
      }
      
      throw error;
    }
  }

  async sendHeartbeat() {
    try {
      const companyId = this.store.get('companyId');
      const apiKey = this.store.get('apiKey');
      
      await axios.post(this.heartbeatUrl, {
        companyId,
        deviceId: this.deviceManager.getDeviceId(),
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      this.isOnline = true;
    } catch (error) {
      // Silently fail - heartbeat is not critical
      console.log('Heartbeat failed:', error.message);
      this.isOnline = false;
    }
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.running = false;
  }

  isRunning() {
    return this.running;
  }

  getLastSyncTime() {
    return this.lastSyncTime;
  }

  getMappings() {
    return this.mappings;
  }

  getOfflineQueueSize() {
    return this.offlineQueue.length;
  }

  isConnected() {
    return this.isOnline && this.socket?.connected;
  }
}

module.exports = SyncService;
