const axios = require('axios');
const Store = require('electron-store');

class SyncService {
  constructor(deviceManager, database) {
    this.deviceManager = deviceManager;
    this.db = database;
    this.store = new Store();
    this.syncInterval = null;
    this.running = false;
    this.lastSyncTime = null;
    this.apiUrl = 'https://api.staffinn.com/api/v1/hrms/attendance/bridge-attendance';
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
      return response.data;
    } catch (error) {
      console.error('Auth error:', error);
      throw new Error('Authentication failed: ' + (error.response?.data?.message || error.message));
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
      // Don't throw error, just log it - device can still work without registration
      return { success: false, message: 'Device registration failed but will continue' };
    }
  }

  startAutoSync(intervalMinutes = 5) {
    if (this.running) return;
    
    this.running = true;
    this.syncNow();
    this.sendHeartbeat();
    
    // Optimized sync: every 15 seconds for real-time without race conditions
    this.syncInterval = setInterval(() => {
      this.syncNow();
    }, 15000); // 15 seconds
    
    // Send heartbeat every 20 seconds
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 20000);
    
    console.log('✅ Auto-sync started (every 15 seconds)');
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
          console.log(`Syncing: Employee ${record.employeeId} at ${record.timestamp}`);
          await this.sendToCloud(record);
          await this.db.markAsSynced(record.id);
          console.log('✅ Record synced successfully');
        } catch (error) {
          console.error('❌ Failed to sync record:', error.message);
          // Mark as synced if employee not found to avoid infinite retry
          if (error.response?.status === 404) {
            console.log('⚠️ Employee not found, marking as synced to skip');
            await this.db.markAsSynced(record.id);
          }
        }
      }
      
      this.lastSyncTime = new Date();
      console.log('✅ Sync completed');
    } catch (error) {
      console.error('❌ Sync failed:', error);
    }
  }

  async sendToCloud(record) {
    const companyId = this.store.get('companyId');
    const apiKey = this.store.get('apiKey');
    
    const timestamp = new Date(record.timestamp);
    
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
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
      verifyMode: record.verifyMode || 1
    };
    
    console.log('🔍 Sending to API:', this.apiUrl);
    console.log('📦 Payload:', JSON.stringify(payload));
    console.log('🔑 Headers:', { 'x-company-id': companyId, 'x-api-key': apiKey });
    
    try {
      // Direct push to HRMS backend
      const response = await axios.post(`${this.apiUrl}`, payload, {
        headers: {
          'x-company-id': companyId,
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API Error Details:');
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Response Data:', error.response?.data);
      console.error('Request URL:', error.config?.url);
      throw error;
    }
  }

  async sendHeartbeat() {
    try {
      const companyId = this.store.get('companyId');
      const apiKey = this.store.get('apiKey');
      
      await axios.post('https://api.staffinn.com/api/v1/hrms/attendance/heartbeat', {
        companyId,
        deviceId: this.deviceManager.getDeviceId(),
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      // Silently fail - heartbeat is not critical
      console.log('Heartbeat failed:', error.message);
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
    this.running = false;
  }

  isRunning() {
    return this.running;
  }

  getLastSyncTime() {
    return this.lastSyncTime;
  }
}

module.exports = SyncService;
