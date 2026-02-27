const axios = require('axios');

class AttendanceSyncScheduler {
  constructor() {
    this.isRunning = false;
    this.syncInterval = null;
    this.bridgeUrl = 'http://localhost:3002';
    this.hrmsUrl = 'http://localhost:4001';
  }

  start(intervalMinutes = 0.5) { // Changed from 2 minutes to 30 seconds
    if (this.isRunning) {
      console.log('🔄 Sync scheduler already running');
      return;
    }

    console.log(`🚀 Starting attendance sync scheduler (every ${intervalMinutes} minutes)`);
    this.isRunning = true;

    // Run initial sync
    this.performSync();

    // Schedule periodic sync
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, intervalMinutes * 60 * 1000);
  }

  async performSync() {
    try {
      console.log('🔄 Starting attendance sync...');
      
      // Call HRMS bridge-sync endpoint
      const response = await axios.post(`${this.hrmsUrl}/api/v1/hrms/attendance/bridge-sync`);
      
      if (response.data.success) {
        const { totalRecords, processedRecords, errorRecords } = response.data.data;
        console.log(`✅ Sync completed: ${processedRecords}/${totalRecords} records processed, ${errorRecords} errors`);
      } else {
        console.log('❌ Sync failed:', response.data.message);
      }
      
    } catch (error) {
      console.error('❌ Sync error:', error.message);
    }
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Attendance sync scheduler stopped');
  }

  getStatus() {
    return {
      running: this.isRunning,
      bridgeUrl: this.bridgeUrl,
      hrmsUrl: this.hrmsUrl
    };
  }
}

// Create singleton instance
const syncScheduler = new AttendanceSyncScheduler();

// Auto-start when module is loaded
syncScheduler.start(0.5); // Sync every 30 seconds for real-time updates

module.exports = syncScheduler;