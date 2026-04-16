/**
 * Test script to verify API returns data correctly
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:4001/api/v1';

async function testAPI() {
  console.log('\n🧪 Testing Admission Tracking API...\n');
  
  try {
    // You need to get a valid JWT token first
    console.log('⚠️  NOTE: You need to login first and get JWT token');
    console.log('   1. Open browser');
    console.log('   2. Login as jecrc@gmail.com');
    console.log('   3. Open DevTools (F12)');
    console.log('   4. Go to Application tab → Local Storage');
    console.log('   5. Copy the "token" value');
    console.log('   6. Paste it below:\n');
    
    // For now, let's check if API endpoint is accessible
    console.log('📡 Testing API endpoint accessibility...\n');
    
    const testEndpoint = `${API_URL}/institute-course-enrollment/course-enrollment-tracking`;
    console.log(`Endpoint: ${testEndpoint}\n`);
    
    console.log('❌ Cannot test without JWT token');
    console.log('\n💡 MANUAL TEST STEPS:');
    console.log('='.repeat(60));
    console.log('1. Open browser and login as jecrc@gmail.com');
    console.log('2. Press F12 to open DevTools');
    console.log('3. Go to Network tab');
    console.log('4. Go to Admission Tracking page');
    console.log('5. Look for this API call:');
    console.log('   GET /api/v1/institute-course-enrollment/course-enrollment-tracking');
    console.log('\n6. Click on it and check:');
    console.log('   - Status: Should be 200 OK');
    console.log('   - Response tab: Should show data');
    console.log('   - Preview tab: Should show courses array');
    console.log('\n7. If Status is 200 and data exists:');
    console.log('   → Backend is working fine');
    console.log('   → Problem is in FRONTEND rendering');
    console.log('\n8. If Status is 500 or error:');
    console.log('   → Backend has issue');
    console.log('   → Check backend logs');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
