/**
 * Test script to verify dashboard stats functionality
 */

const instituteController = require('./controllers/instituteController');

// Mock request and response objects
const mockReq = {
  user: {
    userId: 'test-institute-id-123' // Replace with actual institute ID for testing
  }
};

const mockRes = {
  status: (code) => ({
    json: (data) => {
      console.log(`Response Status: ${code}`);
      console.log('Response Data:', JSON.stringify(data, null, 2));
      return mockRes;
    }
  })
};

// Test the getDashboardStats function
async function testDashboardStats() {
  console.log('🧪 Testing getDashboardStats function...\n');
  
  try {
    await instituteController.getDashboardStats(mockReq, mockRes);
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testDashboardStats();