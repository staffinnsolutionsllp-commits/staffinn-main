const { ipcRenderer } = require('electron');

let currentScreen = 'login';

function showScreen(screenName) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`${screenName}Screen`).classList.add('active');
  currentScreen = screenName;
}

// Login Screen
document.getElementById('loginBtn').addEventListener('click', async () => {
  const companyId = document.getElementById('companyId').value;
  const apiKey = document.getElementById('apiKey').value;
  const errorDiv = document.getElementById('loginError');
  
  if (!companyId || !apiKey) {
    errorDiv.textContent = 'Please enter both Company ID and API Key';
    return;
  }
  
  errorDiv.textContent = '';
  document.getElementById('loginBtn').disabled = true;
  document.getElementById('loginBtn').textContent = 'Verifying...';
  
  const result = await ipcRenderer.invoke('authenticate', { companyId, apiKey });
  
  if (result.success) {
    showScreen('device');
  } else {
    errorDiv.textContent = result.error || 'Authentication failed';
  }
  
  document.getElementById('loginBtn').disabled = false;
  document.getElementById('loginBtn').textContent = 'Verify & Continue';
});

// Device Screen
document.getElementById('detectBtn').addEventListener('click', async () => {
  const btn = document.getElementById('detectBtn');
  btn.disabled = true;
  btn.textContent = 'Detecting...';
  
  const result = await ipcRenderer.invoke('detect-device');
  
  if (result.success) {
    document.getElementById('deviceIP').value = result.device.ip;
    document.getElementById('devicePort').value = result.device.port;
    document.getElementById('deviceSuccess').textContent = `Device found! ID: ${result.deviceId}`;
  } else {
    document.getElementById('deviceError').textContent = result.error;
  }
  
  btn.disabled = false;
  btn.textContent = 'Auto-Detect Device';
});

document.getElementById('connectBtn').addEventListener('click', async () => {
  const ip = document.getElementById('deviceIP').value;
  const port = document.getElementById('devicePort').value;
  const errorDiv = document.getElementById('deviceError');
  const successDiv = document.getElementById('deviceSuccess');
  
  if (!ip || !port) {
    errorDiv.textContent = 'Please enter IP and Port';
    return;
  }
  
  errorDiv.textContent = '';
  successDiv.textContent = '';
  
  const btn = document.getElementById('connectBtn');
  btn.disabled = true;
  btn.textContent = 'Connecting...';
  
  const result = await ipcRenderer.invoke('connect-device', { ip, port: parseInt(port) });
  
  if (result.success) {
    // Register device with backend
    const regResult = await ipcRenderer.invoke('register-device');
    if (regResult.success) {
      successDiv.textContent = 'Device registered successfully!';
    }
    
    await ipcRenderer.invoke('start-sync', 5);
    showScreen('dashboard');
    startStatusUpdates();
  } else {
    errorDiv.textContent = result.error;
  }
  
  btn.disabled = false;
  btn.textContent = 'Connect Device';
});

// Dashboard Screen
async function syncNow() {
  const btn = document.getElementById('syncNowBtn');
  btn.disabled = true;
  btn.textContent = 'Syncing...';
  
  try {
    console.log('🔄 Starting manual sync...');
    await ipcRenderer.invoke('sync-now');
    console.log('✅ Sync completed');
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
  
  btn.disabled = false;
  btn.textContent = 'Sync Now';
  
  // Force status update
  await updateStatus();
}

// Make syncNow globally accessible for debugging
window.syncNow = syncNow;

// ============================================
// DEBUGGING API - Use in DevTools Console
// ============================================
window.BridgeDebug = {
  // Fetch raw attendance data from device RIGHT NOW
  async fetchRaw() {
    console.log('🔍 Fetching raw attendance data from device...');
    const result = await ipcRenderer.invoke('debug-fetch-raw');
    if (result.success) {
      console.log(`✅ Received ${result.count} records from device:`);
      console.table(result.data);
      return result.data;
    } else {
      console.error('❌ Failed to fetch:', result.error);
      return null;
    }
  },

  // Test if Bridge service is running
  async testConnection() {
    console.log('🔌 Testing Bridge service connection...');
    const result = await ipcRenderer.invoke('debug-test-connection');
    if (result.success) {
      console.log('✅ Bridge service is running:');
      console.log(result.bridgeStatus);
      return result.bridgeStatus;
    } else {
      console.error('❌ Bridge service error:', result.error);
      return null;
    }
  },

  // Get pending records from local database
  async getPending() {
    console.log('💾 Fetching pending records from local database...');
    const result = await ipcRenderer.invoke('debug-get-pending');
    if (result.success) {
      console.log(`✅ Found ${result.count} pending records:`);
      console.table(result.data);
      return result.data;
    } else {
      console.error('❌ Failed to fetch:', result.error);
      return null;
    }
  },

  // Monitor real-time data (polls every 5 seconds)
  startMonitoring(intervalSeconds = 5) {
    if (this._monitorInterval) {
      console.warn('⚠️ Monitoring already running. Stop it first with BridgeDebug.stopMonitoring()');
      return;
    }
    console.log(`🎯 Starting real-time monitoring (every ${intervalSeconds}s)...`);
    console.log('📊 New attendance data will appear below:');
    console.log('─'.repeat(60));
    
    this._monitorInterval = setInterval(async () => {
      const result = await ipcRenderer.invoke('debug-fetch-raw');
      if (result.success && result.count > 0) {
        console.log(`\n⏰ ${new Date().toLocaleTimeString()} - ${result.count} new records:`);
        result.data.forEach(record => {
          console.log(`  👤 Employee: ${record.employeeId} | Time: ${record.timestamp} | Type: ${record.type}`);
        });
        console.log('─'.repeat(60));
      }
    }, intervalSeconds * 1000);
    
    console.log('✅ Monitoring started. Use BridgeDebug.stopMonitoring() to stop.');
  },

  // Stop monitoring
  stopMonitoring() {
    if (this._monitorInterval) {
      clearInterval(this._monitorInterval);
      this._monitorInterval = null;
      console.log('🛑 Monitoring stopped.');
    } else {
      console.log('ℹ️ No monitoring is running.');
    }
  },

  // Show help
  help() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           StaffInn Bridge - Debug Console API              ║
╚════════════════════════════════════════════════════════════╝

📋 Available Commands:

  BridgeDebug.fetchRaw()
    → Fetch raw attendance data from device RIGHT NOW
    → Shows all new punch records since last fetch

  BridgeDebug.testConnection()
    → Test if Bridge service (port 3002) is running
    → Verifies device connectivity

  BridgeDebug.getPending()
    → Get all pending records from local database
    → Shows records waiting to sync to cloud

  BridgeDebug.startMonitoring(seconds)
    → Start real-time monitoring (default: 5 seconds)
    → Automatically fetches and displays new data
    → Example: BridgeDebug.startMonitoring(3)

  BridgeDebug.stopMonitoring()
    → Stop real-time monitoring

  BridgeDebug.help()
    → Show this help message

💡 Quick Start:
  1. BridgeDebug.testConnection()  // Check if everything is working
  2. BridgeDebug.fetchRaw()        // Get current data
  3. BridgeDebug.startMonitoring() // Watch real-time updates

🎯 Tip: Punch the biometric device and watch data appear in real-time!
    `);
  }
};

// Show welcome message when DevTools is opened
console.log('%c🔧 Bridge Debug API Loaded', 'color: #4CAF50; font-size: 16px; font-weight: bold;');
console.log('%cType BridgeDebug.help() for available commands', 'color: #FF6B35; font-size: 12px;');
console.log('%c─'.repeat(60), 'color: #ccc;');

document.getElementById('syncNowBtn').addEventListener('click', syncNow);

document.getElementById('clearDbBtn').addEventListener('click', async () => {
  if (!confirm('⚠️ WARNING: Yeh saare pending records delete kar dega!\n\nKya aap sure hain?')) {
    return;
  }
  
  const btn = document.getElementById('clearDbBtn');
  btn.disabled = true;
  btn.textContent = 'Clearing...';
  
  try {
    const result = await ipcRenderer.invoke('clear-database');
    if (result.success) {
      alert('✅ Database cleared successfully!\n\nAb sirf naye punches sync honge.');
      await updateStatus();
    } else {
      alert('❌ Error: ' + result.error);
    }
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
  
  btn.disabled = false;
  btn.textContent = '🗑️ Clear Database';
});

document.getElementById('minimizeBtn').addEventListener('click', () => {
  window.close();
});

function startStatusUpdates() {
  updateStatus();
  setInterval(updateStatus, 5000);
}

async function updateStatus() {
  const status = await ipcRenderer.invoke('get-status');
  
  const deviceStatus = document.getElementById('deviceStatus');
  deviceStatus.textContent = status.deviceConnected ? '● Online' : '● Offline';
  deviceStatus.className = status.deviceConnected ? 'status-value status-online' : 'status-value status-offline';
  
  const lastSync = document.getElementById('lastSync');
  if (status.lastSync) {
    const time = new Date(status.lastSync);
    const diff = Math.floor((Date.now() - time) / 1000 / 60);
    lastSync.textContent = diff === 0 ? 'Just now' : `${diff} minutes ago`;
  }
  
  document.getElementById('todayCount').textContent = status.todayCount || 0;
  document.getElementById('pendingCount').textContent = status.pendingCount || 0;
  
  // Update recent activity
  if (status.recentActivity && status.recentActivity.length > 0) {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';
    
    status.recentActivity.slice(0, 10).forEach(record => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      const time = new Date(record.timestamp).toLocaleTimeString();
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
          <span>Employee ${record.employeeId}</span>
          <span>${time}</span>
        </div>
        <div style="font-size: 12px; color: #7f8c8d; margin-top: 4px;">
          ${record.verifyMode} • Device ${record.deviceId}
        </div>
      `;
      activityList.appendChild(item);
    });
  }
}
