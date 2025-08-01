/**
 * Staffinn Backend Server
 * Main application entry point
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');

// Load environment variables from .env file
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
}

// Log environment variables (excluding sensitive ones)
console.log('Environment variables loaded:');
console.log('- PORT:', process.env.PORT);
console.log('- AWS_REGION:', process.env.AWS_REGION);
console.log('- DYNAMODB_USERS_TABLE:', process.env.DYNAMODB_USERS_TABLE);

// Import routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const staffRoutes = require('./routes/staffRoutes');
const contactRoutes = require('./routes/contactRoutes');
const hiringRoutes = require('./routes/hiringRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Import middleware
const { notFound, errorHandler } = require('./middleware/error');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const API_VERSION = 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import debug routes
const debugRoutes = require('./debug-routes');

// API routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/jobs`, jobRoutes);
app.use(`${API_PREFIX}/recruiter`, recruiterRoutes);
app.use(`${API_PREFIX}/staff`, staffRoutes);
app.use(`${API_PREFIX}/contact`, contactRoutes);
app.use(`${API_PREFIX}/hiring`, hiringRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/applications`, applicationRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use('/debug', debugRoutes);

// Basic routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Staffinn Backend Running! 🚀',
        version: API_VERSION,
        port: PORT,
        timestamp: new Date().toISOString()
    });
});

// Debug route to check DynamoDB connection
app.get('/debug/dynamodb', async (req, res) => {
    try {
        const { dynamoClient } = require('./config/dynamodb');
        const { ListTablesCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
        const { unmarshall } = require('@aws-sdk/util-dynamodb');
        
        const command = new ListTablesCommand({});
        const response = await dynamoClient.send(command);
        
        // Get users from the table
        const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'staffinn-users';
        const scanCommand = new ScanCommand({
            TableName: USERS_TABLE,
            Limit: 10
        });
        
        const scanResponse = await dynamoClient.send(scanCommand);
        const users = scanResponse.Items ? scanResponse.Items.map(item => unmarshall(item)) : [];
        
        res.json({
            success: true,
            message: 'DynamoDB connection successful',
            tables: response.TableNames,
            region: process.env.AWS_REGION,
            usersTable: process.env.DYNAMODB_USERS_TABLE,
            users: users
        });
    } catch (error) {
        console.error('DynamoDB debug error:', error);
        res.status(500).json({
            success: false,
            message: 'DynamoDB connection failed',
            error: error.message
        });
    }
});

app.get('/debug/staff-profiles', async (req, res) => {
    try {
        const { dynamoClient } = require('./config/dynamodb');
        const { ScanCommand } = require('@aws-sdk/client-dynamodb');
        const { unmarshall } = require('@aws-sdk/util-dynamodb');
        
        const scanCommand = new ScanCommand({
            TableName: 'staffinn-staff-profiles',
            Limit: 10
        });
        
        const scanResponse = await dynamoClient.send(scanCommand);
        const staffProfiles = scanResponse.Items ? scanResponse.Items.map(item => unmarshall(item)) : [];
        
        res.json({
            success: true,
            message: 'Staff profiles retrieved successfully',
            count: staffProfiles.length,
            profiles: staffProfiles
        });
    } catch (error) {
        console.error('Staff profiles debug error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get staff profiles',
            error: error.message
        });
    }
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API Working!',
        frontend_connection: 'ready'
    });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Import DynamoDB configuration
const { createTablesIfNotExist } = require('./config/dynamodb');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const { initializeSocketServer } = require('./config/socket');
const io = initializeSocketServer(server);

// Make io available globally
app.set('io', io);

// Start server
server.listen(PORT, async () => {
    console.log('='.repeat(40));
    console.log('🚀 SERVER STARTED SUCCESSFULLY!');
    console.log('='.repeat(40));
    
    // Initialize DynamoDB tables
    try {
        await createTablesIfNotExist();
        console.log('✅ DynamoDB tables initialized');
    } catch (error) {
        console.error('❌ Error initializing DynamoDB tables:', error);
    }
    
    console.log('📍 URL: http://localhost:' + PORT);
    console.log('📚 API: http://localhost:' + PORT + API_PREFIX);
    console.log('⏰ Time: ' + new Date().toLocaleString());
    console.log('='.repeat(40));
    console.log('🔗 Test URLs:');
    console.log('   http://localhost:' + PORT + '/');
    console.log('   http://localhost:' + PORT + '/health');
    console.log('   http://localhost:' + PORT + API_PREFIX + '/auth/register');
    console.log('   http://localhost:' + PORT + API_PREFIX + '/jobs/public');
    console.log('   http://localhost:' + PORT + API_PREFIX + '/recruiter/public/all');
    console.log('   http://localhost:' + PORT + API_PREFIX + '/contact/health');
    console.log('✅ Ready!\n');
});

module.exports = app;