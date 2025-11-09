/**
 * Backup Mock Data - Safety measure before switching to real DB
 */
const fs = require('fs');
const path = require('path');

const mockDataFile = path.join(__dirname, 'mock-dynamodb-data.json');
const backupFile = path.join(__dirname, `mock-data-backup-${Date.now()}.json`);

if (fs.existsSync(mockDataFile)) {
  fs.copyFileSync(mockDataFile, backupFile);
  console.log(`✅ Mock data backed up to: ${backupFile}`);
} else {
  console.log('ℹ️  No mock data file found to backup');
}