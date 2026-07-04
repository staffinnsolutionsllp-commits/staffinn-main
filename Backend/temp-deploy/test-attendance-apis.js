#!/usr/bin/env node

/**
 * Complete API Testing Script for Attendance System
 * Tests all endpoints and provides detailed analysis
 */

const https = require('https');
const http = require('http');

const RECRUITER_ID = '7e0dd1ad-e456-444f-8992-5a66af451238';
const TARGET_DATE = '2026-05-15';
const API_BASE_URL = process.env.API_URL || 'https://api.staffinn.com';

// You need to provide a valid HRMS token
const HRMS_TOKEN = process.env.HRMS_TOKEN || 'YOUR_TOKEN_HERE';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = lib.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testAPIs() {
  console.log('='.repeat(80));
  console.log('🌐 API TESTING - ATTENDANCE SYSTEM');
  console.log('='.repeat(80));
  console.log(`📋 Recruiter ID: ${RECRUITER_ID}`);
  console.log(`📅 Target Date: ${TARGET_DATE}`);
  console.log(`🔗 API Base URL: ${API_BASE_URL}`);
  console.log('='.repeat(80));
  console.log('');

  // TEST 1: Health Check
  console.log('📊 TEST 1: BACKEND HEALTH CHECK');
  console.log('-'.repeat(80));
  
  try {
    const healthUrl = `${API_BASE_URL}/health`;
    console.log(`🔗 Testing: ${healthUrl}`);
    
    const healthResponse = await makeRequest(healthUrl);
    
    if (healthResponse.status === 200) {
      console.log('✅ Backend is UP and running');
      console.log(`   Status: ${healthResponse.data.status}`);
      console.log(`   Uptime: ${healthResponse.data.uptime} seconds`);
    } else {
      console.log(`❌ Backend health check failed: ${healthResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Backend is DOWN or unreachable`);
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  // TEST 2: Get Attendance Stats
  console.log('📊 TEST 2: GET ATTENDANCE STATS');
  console.log('-'.repeat(80));
  
  try {
    const statsUrl = `${API_BASE_URL}/api/v1/hrms/attendance/stats`;
    console.log(`🔗 Testing: ${statsUrl}`);
    
    const statsResponse = await makeRequest(statsUrl, {
      headers: {
        'Authorization': `Bearer ${HRMS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Response Status: ${statsResponse.status}`);
    
    if (statsResponse.status === 200 && statsResponse.data.success) {
      console.log('✅ Stats API working');
      console.log(`   Total Employees: ${statsResponse.data.data.totalEmployees}`);
      console.log(`   Present Today: ${statsResponse.data.data.presentToday}`);
      console.log(`   Absent Today: ${statsResponse.data.data.absentToday}`);
      console.log(`   Late Arrivals: ${statsResponse.data.data.lateArrivals}`);
      console.log(`   Attendance Rate: ${statsResponse.data.data.attendanceRate}%`);
      console.log(`   Avg Hours: ${statsResponse.data.data.avgHours}h`);
    } else if (statsResponse.status === 401) {
      console.log('❌ Authentication failed');
      console.log('   Please provide valid HRMS_TOKEN');
    } else {
      console.log(`❌ Stats API failed: ${statsResponse.status}`);
      console.log(`   Response: ${JSON.stringify(statsResponse.data, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Stats API error: ${error.message}`);
  }
  
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  // TEST 3: Get Attendance by Date
  console.log('📊 TEST 3: GET ATTENDANCE BY DATE');
  console.log('-'.repeat(80));
  
  try {
    const dateUrl = `${API_BASE_URL}/api/v1/hrms/attendance/date/${TARGET_DATE}`;
    console.log(`🔗 Testing: ${dateUrl}`);
    
    const dateResponse = await makeRequest(dateUrl, {
      headers: {
        'Authorization': `Bearer ${HRMS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Response Status: ${dateResponse.status}`);
    
    if (dateResponse.status === 200 && dateResponse.data.success) {
      const records = dateResponse.data.data || [];
      console.log(`✅ Attendance API working`);
      console.log(`   Records found for ${TARGET_DATE}: ${records.length}`);
      
      if (records.length > 0) {
        console.log('\n   📋 Attendance Records:');
        records.forEach((record, index) => {
          console.log(`      ${index + 1}. ${record.employeeId}`);
          console.log(`         Check In: ${record.checkIn || 'N/A'}`);
          console.log(`         Check Out: ${record.checkOut || 'N/A'}`);
          console.log(`         Hours: ${record.hours || 0}`);
          console.log(`         Status: ${record.status || 'N/A'}`);
        });
      } else {
        console.log(`   ⚠️  No records found for ${TARGET_DATE}`);
        console.log('   This is why frontend shows empty table!');
      }
    } else if (dateResponse.status === 401) {
      console.log('❌ Authentication failed');
    } else {
      console.log(`❌ Attendance API failed: ${dateResponse.status}`);
      console.log(`   Response: ${JSON.stringify(dateResponse.data, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Attendance API error: ${error.message}`);
  }
  
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  // TEST 4: Get Employee-Device Mappings
  console.log('📊 TEST 4: GET EMPLOYEE-DEVICE MAPPINGS');
  console.log('-'.repeat(80));
  
  try {
    const mappingsUrl = `${API_BASE_URL}/api/v1/hrms/attendance/mappings`;
    console.log(`🔗 Testing: ${mappingsUrl}`);
    
    const mappingsResponse = await makeRequest(mappingsUrl, {
      headers: {
        'Authorization': `Bearer ${HRMS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Response Status: ${mappingsResponse.status}`);
    
    if (mappingsResponse.status === 200 && mappingsResponse.data.success) {
      const mappings = mappingsResponse.data.data || [];
      console.log(`✅ Mappings API working`);
      console.log(`   Total Mappings: ${mappings.length}`);
      
      if (mappings.length > 0) {
        console.log('\n   📋 Mappings:');
        mappings.forEach((map, index) => {
          console.log(`      ${index + 1}. Employee: ${map.employeeId} ↔ Device User: ${map.deviceUserId}`);
        });
      } else {
        console.log('   ⚠️  NO MAPPINGS FOUND!');
        console.log('   ❌ CRITICAL: Bridge cannot identify employees without mappings!');
      }
    } else if (mappingsResponse.status === 404) {
      console.log('❌ Mappings endpoint not found');
      console.log('   This feature might not be deployed yet');
    } else if (mappingsResponse.status === 401) {
      console.log('❌ Authentication failed');
    } else {
      console.log(`❌ Mappings API failed: ${mappingsResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Mappings API error: ${error.message}`);
  }
  
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  // TEST 5: Get Devices
  console.log('📊 TEST 5: GET REGISTERED DEVICES');
  console.log('-'.repeat(80));
  
  try {
    const devicesUrl = `${API_BASE_URL}/api/v1/hrms/attendance/devices`;
    console.log(`🔗 Testing: ${devicesUrl}`);
    
    const devicesResponse = await makeRequest(devicesUrl, {
      headers: {
        'Authorization': `Bearer ${HRMS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Response Status: ${devicesResponse.status}`);
    
    if (devicesResponse.status === 200 && devicesResponse.data.success) {
      const devices = devicesResponse.data.data || [];
      console.log(`✅ Devices API working`);
      console.log(`   Total Devices: ${devices.length}`);
      
      if (devices.length > 0) {
        console.log('\n   📋 Devices:');
        devices.forEach((device, index) => {
          console.log(`      ${index + 1}. ${device.deviceName}`);
          console.log(`         IP: ${device.ipAddress}:${device.port}`);
          console.log(`         Active: ${device.isActive ? 'Yes' : 'No'}`);
          console.log(`         Last Sync: ${device.lastSyncTime || 'Never'}`);
        });
      } else {
        console.log('   ℹ️  No devices registered');
      }
    } else if (devicesResponse.status === 404) {
      console.log('❌ Devices endpoint not found');
    } else if (devicesResponse.status === 401) {
      console.log('❌ Authentication failed');
    } else {
      console.log(`❌ Devices API failed: ${devicesResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Devices API error: ${error.message}`);
  }
  
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  // TEST 6: Device Status (Heartbeat)
  console.log('📊 TEST 6: CHECK DEVICE STATUS');
  console.log('-'.repeat(80));
  
  try {
    const statusUrl = `${API_BASE_URL}/api/v1/hrms/attendance/device-status`;
    console.log(`🔗 Testing: ${statusUrl}`);
    
    const statusResponse = await makeRequest(statusUrl, {
      headers: {
        'Authorization': `Bearer ${HRMS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 Response Status: ${statusResponse.status}`);
    
    if (statusResponse.status === 200 && statusResponse.data.success) {
      const status = statusResponse.data.data;
      console.log(`✅ Device Status API working`);
      console.log(`   Connected: ${status.connected ? 'Yes' : 'No'}`);
      console.log(`   Last Seen: ${status.lastSeen || 'Never'}`);
      
      if (!status.connected) {
        console.log('   ⚠️  Bridge is OFFLINE!');
        console.log('   This is why attendance is not syncing.');
      }
    } else if (statusResponse.status === 401) {
      console.log('❌ Authentication failed');
    } else {
      console.log(`❌ Device Status API failed: ${statusResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Device Status API error: ${error.message}`);
  }
  
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  // FINAL SUMMARY
  console.log('📊 FINAL API TESTING SUMMARY');
  console.log('='.repeat(80));
  console.log('');
  console.log('🎯 KEY FINDINGS:');
  console.log('');
  console.log('To see detailed results, run this script with:');
  console.log('   HRMS_TOKEN=your_actual_token node test-attendance-apis.js');
  console.log('');
  console.log('Get HRMS token from:');
  console.log('   1. Login to HRMS');
  console.log('   2. Open Browser DevTools (F12)');
  console.log('   3. Go to Application → Local Storage');
  console.log('   4. Find: hrms_token_[recruiterId]');
  console.log('   5. Copy the token value');
  console.log('');
  console.log('='.repeat(80));
}

// Run the tests
if (require.main === module) {
  testAPIs()
    .then(() => {
      console.log('\n✅ API testing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ API testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testAPIs };
