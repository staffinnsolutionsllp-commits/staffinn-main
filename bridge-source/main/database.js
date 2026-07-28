const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class AttendanceDatabase {
  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'attendance.db');
    this.db = null;
    this.init();
  }

  async init() {
    const SQL = await initSqlJs();
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }
    this.db.run(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeId TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        punchType TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        retryCount INTEGER DEFAULT 0,
        deviceRecordId TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employeeId, timestamp, deviceRecordId)
      )
    `);
    // Add retryCount column if not exists (migration for old DBs)
    try { this.db.run('ALTER TABLE attendance ADD COLUMN retryCount INTEGER DEFAULT 0'); } catch(e) { /* already exists */ }
    this.save();
  }

  save() {
    try {
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, data);
    } catch(e) { console.error('[DB] Save error:', e.message); }
  }

  async saveRecords(records) {
    const stmt = this.db.prepare('INSERT OR IGNORE INTO attendance (employeeId, timestamp, punchType, deviceRecordId) VALUES (?, ?, ?, ?)');
    let savedCount = 0;
    for (const record of records) {
      const employeeId = record.employeeId || record.userId || 'UNKNOWN';
      const timestamp = record.timestamp || new Date().toISOString();
      const punchType = record.punchType || record.type || record.verifyMode || 'IN';
      const deviceRecordId = employeeId + '-' + timestamp;
      try {
        stmt.run([employeeId, timestamp, punchType, deviceRecordId]);
        savedCount++;
      } catch(e) { /* duplicate, skip */ }
    }
    stmt.free();
    this.save();
    return savedCount;
  }

  async getPendingRecords() {
    const result = this.db.exec('SELECT * FROM attendance WHERE synced = 0 AND retryCount < 5 ORDER BY timestamp ASC');
    if (result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => obj[col] = row[i]);
      return obj;
    });
  }

  async markAsSynced(id) {
    this.db.run('UPDATE attendance SET synced = 1 WHERE id = ?', [id]);
    this.save();
  }

  async incrementRetry(id) {
    this.db.run('UPDATE attendance SET retryCount = retryCount + 1 WHERE id = ?', [id]);
    this.save();
  }

  async getTodayCount() {
    const today = new Date().toISOString().split('T')[0];
    const result = this.db.exec("SELECT COUNT(*) FROM attendance WHERE timestamp LIKE '" + today + "%'");
    return result.length > 0 ? result[0].values[0][0] : 0;
  }

  async getPendingCount() {
    const result = this.db.exec('SELECT COUNT(*) FROM attendance WHERE synced = 0 AND retryCount < 5');
    return result.length > 0 ? result[0].values[0][0] : 0;
  }

  async clearDatabase() {
    this.db.run('DELETE FROM attendance');
    this.save();
    console.log('[DB] Database cleared');
  }

  close() { this.save(); this.db.close(); }
}
module.exports = AttendanceDatabase;
