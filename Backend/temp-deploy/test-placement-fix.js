// Test script to verify placement data filtering by institute
const express = require('express');
const app = express();

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = { userId: '883c1784-7354-4fab-874b-0c7da5e7bb28' }; // Your institute ID
  next();
};

// Test the placement endpoints
const testPlacementEndpoints = async () => {
  try {
    console.log('Testing placement endpoints with institute filtering...');
    
    // Import the placement controller
    const placementController = require('./controllers/placementController');
    
    // Mock request and response objects
    const mockReq = {
      user: { userId: '883c1784-7354-4fab-874b-0c7da5e7bb28' },
      params: {}
    };
    
    const mockRes = {
      json: (data) => console.log('Response:', JSON.stringify(data, null, 2)),
      status: (code) => ({ json: (data) => console.log(`Status ${code}:`, data) })
    };
    
    console.log('\n1. Testing getTrainingCenters...');
    await placementController.getTrainingCenters(mockReq, mockRes);
    
    console.log('\n2. Testing getSectorWiseAnalytics...');
    await placementController.getSectorWiseAnalytics(mockReq, mockRes);
    
    console.log('\n3. Testing getStudentWiseAnalytics...');
    await placementController.getStudentWiseAnalytics(mockReq, mockRes);
    
    console.log('\nTest completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testPlacementEndpoints();