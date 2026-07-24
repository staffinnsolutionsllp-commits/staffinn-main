'use strict';
const axios = require('axios');
const Store = require('electron-store');
const API_BASE = 'https://api.staffinn.com/api/v1/hrms/attendance';
const BATCH_SIZE = 50;
const SYNC_INTERVAL_MS = 60000;
const HEARTBEAT_INTERVAL_MS = 30000;
const API_TIMEOUT = 15000;

class SyncService {
  constructor(deviceManager, database) {
    this.deviceManager = deviceManager;
    this.db = database;
    this.store = new Store();
    this.syncInterval = null;
    this.heartbeatInterval = null;
    this.running = false;
    this.syncing = false;
    this.lastSyncTime = null;
    this.consecutiveFailures = 0;
    this.apiUrl = API_BASE + '/bridge-attendance';
  }

  async authenticate(companyId, apiKey) {
    this.store.set('companyId', companyId);
    this.store.set('apiKey', apiKey);
    try {
      var response = await axios.post('https://api.staffinn.com/api/v1/hrms/company/validate', { companyId, apiKey }, { headers: { 'Content-Type': 'application/json' }, timeout: API_TIMEOUT });
      try { await axios.post('http://localhost:3002/set-company', JSON.stringify({ companyId }), { headers: { 'Content-Type': 'application/json' }, timeout: 3000 }); console.log('[Sync] Company set:', companyId); } catch (e) {}
      return response.data;
    } catch (error) { throw new Error('Authentication failed: ' + (error.response?.data?.message || error.message)); }
  }

  async registerDevice(deviceId) {
    var companyId = this.store.get('companyId');
    try { var r = await axios.post('https://api.staffinn.com/api/v1/hrms/company/' + companyId + '/devices', { deviceId, deviceName: 'Biometric Device', deviceType: 'biometric' }, { headers: { 'Content-Type': 'application/json' }, timeout: API_TIMEOUT }); return r.data; } catch (e) { return { success: false }; }
  }

  startAutoSync(interval) {
    if (this.running) return;
    this.running = true;
    this.syncNow();
    this.syncInterval = setInterval(() => this.syncNow(), SYNC_INTERVAL_MS);
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), HEARTBEAT_INTERVAL_MS);
    console.log('[Sync] Auto-sync started (every 60s)');
  }

  stopSync() {
    if (this.syncInterval) { clearInterval(this.syncInterval); this.syncInterval = null; }
    if (this.heartbeatInterval) { clearInterval(this.heartbeatInterval); this.heartbeatInterval = null; }
    this.running = false; this.syncing = false;
  }

  async syncNow() {
    if (this.syncing) { console.log('[Sync] Already syncing, skipping'); return; }
    this.syncing = true;
    try {
      console.log('[Sync] Starting sync...');
      // ALWAYS fetch from device — C# bridge handles auto-reconnect internally
      // Do NOT check isConnected() — that flag is unreliable
      var records = [];
      try {
        records = await this.deviceManager.fetchAttendance();
        console.log('[Sync] Fetched ' + records.length + ' records from device');
      } catch (fetchErr) {
        console.log('[Sync] Device fetch failed (will retry next cycle):', fetchErr.message);
      }
      if (records.length > 0) await this.db.saveRecords(records);

      var pending = await this.db.getPendingRecords();
      if (pending.length === 0) { this.lastSyncTime = new Date(); console.log('[Sync] No pending records'); return; }
      console.log('[Sync] Sending ' + pending.length + ' pending...');
      var batch = pending.slice(0, BATCH_SIZE);
      var successCount = 0;
      for (var i = 0; i < batch.length; i++) {
        var result = await this._sendSingleRecord(batch[i]);
        if (result.success) { await this.db.markAsSynced(batch[i].id); successCount++; }
        else if (result.permanent) { await this.db.markAsSynced(batch[i].id); console.log('[Sync] Skipped: ' + batch[i].employeeId + ' (' + result.reason + ')'); }
        else { console.log('[Sync] Will retry: ' + batch[i].employeeId); }
      }
      if (successCount > 0) { try { await axios.get('http://localhost:3002/confirm-sync', { timeout: 3000 }); } catch (e) {} }
      this.lastSyncTime = new Date();
      this.consecutiveFailures = 0;
      console.log('[Sync] Done: ' + successCount + '/' + batch.length + ' sent');
    } catch (error) {
      this.consecutiveFailures++;
      console.error('[Sync] Failed:', error.message);
    } finally { this.syncing = false; }
  }

  async _sendSingleRecord(record) {
    var companyId = this.store.get('companyId') || 'COMP-2170E167';
    var apiKey = this.store.get('apiKey') || 'sk_live_8219f8dc3ab3ab63b38578b38d33b0ef3a05756831b9c388c67f1b0e3e507001';
    if (!companyId || !apiKey) return { success: false, permanent: false, reason: 'No auth' };
    var ts = new Date(record.timestamp);
    var ist = new Date(ts.getTime() + 5.5 * 60 * 60 * 1000);
    var date = ist.getUTCFullYear() + '-' + String(ist.getUTCMonth() + 1).padStart(2, '0') + '-' + String(ist.getUTCDate()).padStart(2, '0');
    var time = String(ist.getUTCHours()).padStart(2, '0') + ':' + String(ist.getUTCMinutes()).padStart(2, '0');
    var deviceId = await this.deviceManager.getDeviceId();
    var payload = { employeeId: record.employeeId, checkIn: time, date: date, source: 'biometric', deviceId: deviceId, verifyMode: record.verifyMode || '1' };
    try {
      var response = await axios.post(this.apiUrl, payload, { headers: { 'x-company-id': companyId, 'x-api-key': apiKey, 'Content-Type': 'application/json' }, timeout: API_TIMEOUT });
      if (response.data.success) return { success: true };
      return { success: false, permanent: true, reason: response.data.message || 'Rejected' };
    } catch (error) {
      if (error.response) {
        var s = error.response.status;
        if (s === 404) return { success: false, permanent: true, reason: 'Employee not found' };
        if (s >= 400 && s < 500) return { success: false, permanent: true, reason: 'HTTP ' + s };
      }
      return { success: false, permanent: false, reason: error.message };
    }
  }

  async sendHeartbeat() {
    try {
      var companyId = this.store.get('companyId') || 'COMP-2170E167'; var apiKey = this.store.get('apiKey') || 'sk_live_8219f8dc3ab3ab63b38578b38d33b0ef3a05756831b9c388c67f1b0e3e507001'; var deviceId = await this.deviceManager.getDeviceId();
      await axios.post(API_BASE + '/heartbeat', { companyId, deviceId, timestamp: new Date().toISOString() }, { headers: { 'x-company-id': companyId, 'x-api-key': apiKey, 'Content-Type': 'application/json' }, timeout: 5000 });
    } catch (e) {}
  }

  isRunning() { return this.running; }
  getLastSyncTime() { return this.lastSyncTime; }
}
module.exports = SyncService;