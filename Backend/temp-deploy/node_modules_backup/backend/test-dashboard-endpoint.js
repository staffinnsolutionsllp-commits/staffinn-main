/**
 * Simple test to verify dashboard stats endpoint
 * Run this with: node test-dashboard-endpoint.js
 */

const express = require('express');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import the controller
const { getDashboardStats } = require('./controllers/instituteController');

// Create a simple test server
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  // Replace with a real institute ID from your database for testing
  req.user = {
    userId: 'test-institute-id', // Change this to a real institute ID
    role: 'institute'
  };
  next();
};

// Test route
app.get('/test/dashboard/stats', mockAuth, getDashboardStats);

// Start test server
const PORT = 4002;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on http://localhost:${PORT}`);
  console.log(`📊 Test dashboard stats: http://localhost:${PORT}/test/dashboard/stats`);
  console.log('');
  console.log('💡 Make sure to update the userId in mockAuth with a real institute ID');
  console.log('');
});