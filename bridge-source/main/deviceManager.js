const { execFile } = require('child_process');
const path = require('path');
const util = require('util');
const axios = require('axios');
const execFilePromise = util.promisify(execFile);

class DeviceManager {
  constructor() {
    this.connected = false;
    this.deviceIP = null;
    this.devicePort = null;
    this.deviceId = null;
    this.serialNumber = null;
  }

  async getDeviceSerialNumber() {
    try {
      const response = await axios.get('http://localhost:3002/status', { timeout: 5000 });
      if (response.data && response.data.serialNumber) {
        return response.data.serialNumber;
      }
    } catch (error) {
      console.log('⚠️  Could not get device serial number:', error.message);
    }
    return null;
  }

  async generateDeviceId() {
    const serial = await this.getDeviceSerialNumber();
    if (serial) {
      this.serialNumber = serial;
      this.deviceId = `DEVICE-${serial.substring(0, 12).toUpperCase()}`;
      console.log(`✅ Device ID from serial: ${this.deviceId}`);
    } else {
      const os = require('os');
      const crypto = require('crypto');
      const networkInterfaces = os.networkInterfaces();
      let macAddress = '';
      
      for (const name of Object.keys(networkInterfaces)) {
        for (const net of networkInterfaces[name]) {
          if (net.mac && net.mac !== '00:00:00:00:00:00') {
            macAddress = net.mac;
            break;
          }
        }
        if (macAddress) break;
      }
      
      const hash = crypto.createHash('md5').update(macAddress + os.hostname()).digest('hex');
      this.deviceId = `DEVICE-${hash.substring(0, 8).toUpperCase()}`;
      console.log(`⚠️  Using fallback device ID: ${this.deviceId}`);
    }
    return this.deviceId;
  }

  async getDeviceId() {
    if (!this.deviceId) {
      await this.generateDeviceId();
    }
    return this.deviceId;
  }

  async detectDevice() {
    // Scan common IP ranges for MORX BioFace devices
    const commonIPs = [
      '192.168.1.224',
      '192.168.0.224', 
      '192.168.1.24',
      '192.168.0.24',
      '192.168.1.100',
      '192.168.1.201'
    ];
    
    console.log('🔍 Scanning network for devices...');
    
    for (const ip of commonIPs) {
      try {
        console.log(`Testing ${ip}:5005...`);
        const result = await this.testConnection(ip, 5005);
        if (result) {
          console.log(`✅ Device found at ${ip}:5005`);
          return { ip, port: 5005 };
        }
      } catch (error) {
        continue;
      }
    }
    
    throw new Error('Device not found on network. Make sure device and PC are on same network.');
  }

  async testConnection(ip, port) {
    const net = require('net');
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(3000); // Increased timeout
      
      socket.on('connect', () => {
        console.log(`✅ Connected to ${ip}:${port}`);
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        console.log(`⏱️ Timeout connecting to ${ip}:${port}`);
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', (err) => {
        console.log(`❌ Error connecting to ${ip}:${port}: ${err.message}`);
        resolve(false);
      });
      
      socket.connect(port, ip);
    });
  }

  async connect(ip, port) {
    try {
      // Save IP/port to config file so C# bridge service uses them
      const fs = require('fs');
      const configPath = require('path').join(__dirname, '../../NewBridgeService/device_config.txt');
      fs.writeFileSync(configPath, ip + '\n' + port);

      const axios = require('axios');
      
      // Always disconnect first to clear stale connections
      try { await axios.get('http://localhost:3002/disconnect', { timeout: 5000 }); } catch (e) {}
      await new Promise(r => setTimeout(r, 1000));

      const response = await axios.get('http://localhost:3002/connect', { timeout: 15000 });

      if (response.data.success) {
        this.connected = true;
        this.deviceIP = ip;
        this.devicePort = port;
        // Generate device ID from serial after connection
        await this.generateDeviceId();
        return true;
      }

      // C# returned success:false — real connection failed
      const msg = response.data.message || 'Connection failed';
      throw new Error(msg);
    } catch (error) {
      this.connected = false;
      throw new Error('Failed to connect: ' + error.message);
    }
  }

    async fetchAttendance() {
    // Auto-reconnect handled by C# bridge — always attempt fetch

    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:3002/attendance/new', { timeout: 10000 });
      
      if (response.data.success) {
        console.log(`📥 Fetched ${response.data.data.length} records`);
        return response.data.data.map(record => {
          // Debug: Log raw record data
          console.log('🔍 Raw record from device:', JSON.stringify(record));
          
          // Try multiple field names for employee ID
          const employeeId = record.userId || record.employeeId || record.userID || record.EnrollNumber || record.PIN || 'UNKNOWN';
          console.log(`📋 Parsed: employeeId=${employeeId}, timestamp=${record.timestamp}`);
          
          return {
            employeeId: employeeId,
            timestamp: record.timestamp,
            type: record.type || 'IN',
            verifyMode: record.verifyMode,
            deviceId: record.deviceId
          };
        });
      }
      return [];
    } catch (error) {
      console.error('Fetch error:', error.message);
      return [];
    }
  }

  isConnected() {
    return this.connected;
  }

  disconnect() {
    this.connected = false;
  }
}

module.exports = DeviceManager;

