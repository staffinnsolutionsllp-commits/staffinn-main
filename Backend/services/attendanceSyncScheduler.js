// This scheduler only runs in development (localhost) where the Bridge app
// is on the same machine. In production, the Bridge app pushes directly to
// the API via POST /api/v1/hrms/attendance/bridge-attendance.

const isProduction = process.env.NODE_ENV === 'production';

class AttendanceSyncScheduler {
  constructor() {
    this.isRunning = false;
    this.syncInterval = null;
    this.bridgeUrl = process.env.BRIDGE_SERVICE_URL || 'http://localhost:3002';
    this.hrmsUrl = `http://localhost:${process.env.PORT || 4001}`;
  }

  start(intervalMinutes = 0.5) {
    if (isProduction) {
      console.log('ℹ️  Attendance pull-scheduler disabled in production (Bridge pushes directly to API)');
      return;
    }

    if (this.isRunning) {
      console.log('🔄 Sync scheduler already running');
      return;
    }

    console.log(`🚀 Starting attendance sync scheduler (every ${intervalMinutes} minutes)`);
    this.isRunning = true;

    this.performSync();

    this.syncInterval = setInterval(() => {
      this.performSync();
    }, intervalMinutes * 60 * 1000);
  }

  async performSync() {
    try {
      const axios = require('axios');
      console.log('🔄 Starting attendance sync...');

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

const syncScheduler = new AttendanceSyncScheduler();
syncScheduler.start(0.5);

module.exports = syncScheduler;
