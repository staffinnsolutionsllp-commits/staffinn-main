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
const instituteRoutes = require('./routes/instituteRoutes');
const instituteManagementRoutes = require('./routes/instituteManagementRoutes');
const contactRoutes = require('./routes/contactRoutes');
const hiringRoutes = require('./routes/hiringRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userNotificationRoutes = require('./routes/userNotificationRoutes');
const adminNotificationRoutes = require('./routes/adminNotificationRoutes');
const newsRoutes = require('./routes/newsRoutes');
const newsAdminRoutes = require('./routes/newsAdminRoutes');
const adminRoutes = require('./routes/adminRoutes');
const issueRoutes = require('./routes/issueRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const progressRoutes = require('./routes/progressRoutes');
const governmentSchemesRoutes = require('./routes/governmentSchemesRoutes');

// Import middleware
const { notFound, errorHandler } = require('./middleware/error');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4001;
const API_VERSION = 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

// Trust proxy for ALB
app.set('trust proxy', true);

// Basic middleware
app.use(cors({
  origin: [
    'http://staffinn-frontend-app.s3-website.ap-south-1.amazonaws.com',
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple placeholder image endpoint to fix console errors
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle" dy=".3em">News Image</text>
  </svg>`;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// Import debug routes
const debugRoutes = require('./debug-routes');

// API routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/jobs`, jobRoutes);
app.use(`${API_PREFIX}/recruiter`, recruiterRoutes);
app.use(`${API_PREFIX}/staff`, staffRoutes);
app.use(`${API_PREFIX}/institute`, instituteRoutes);
app.use(`${API_PREFIX}/institutes`, instituteRoutes); // Add plural route for frontend compatibility
app.use(`${API_PREFIX}/progress`, progressRoutes); // Progress routes
app.use(`${API_PREFIX}/institute-management`, instituteManagementRoutes);
app.use(`${API_PREFIX}/contact`, contactRoutes);
app.use(`${API_PREFIX}/hiring`, hiringRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/applications`, applicationRoutes);
app.use(`${API_PREFIX}/notifications`, userNotificationRoutes);
app.use(`${API_PREFIX}/admin/notifications`, adminNotificationRoutes);
app.use(`${API_PREFIX}/news`, newsRoutes);
app.use(`${API_PREFIX}/news-admin`, newsAdminRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/issues`, issueRoutes);
app.use(`${API_PREFIX}/assignments`, assignmentRoutes);
app.use(`${API_PREFIX}/government-schemes`, governmentSchemesRoutes);
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
        const { dynamoClient, mockDB, isUsingMockDB, USERS_TABLE } = require('./config/dynamodb-wrapper');
        
        if (isUsingMockDB()) {
            const users = mockDB().scan(USERS_TABLE, 10);
            res.json({
                success: true,
                message: 'Mock DynamoDB connection successful',
                database: 'mock',
                usersTable: USERS_TABLE,
                users: users
            });
        } else {
            const { ListTablesCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
            const { unmarshall } = require('@aws-sdk/util-dynamodb');
            
            const command = new ListTablesCommand({});
            const response = await dynamoClient.send(command);
            
            const scanCommand = new ScanCommand({
                TableName: USERS_TABLE,
                Limit: 10
            });
            
            const scanResponse = await dynamoClient.send(scanCommand);
            const users = scanResponse.Items ? scanResponse.Items.map(item => unmarshall(item)) : [];
            
            res.json({
                success: true,
                message: 'DynamoDB connection successful',
                database: 'real',
                tables: response.TableNames,
                region: process.env.AWS_REGION,
                usersTable: USERS_TABLE,
                users: users
            });
        }
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
        const { dynamoClient, mockDB, isUsingMockDB, STAFF_TABLE } = require('./config/dynamodb-wrapper');
        
        if (isUsingMockDB()) {
            const staffProfiles = mockDB().scan(STAFF_TABLE, 10);
            res.json({
                success: true,
                message: 'Staff profiles retrieved successfully (mock)',
                count: staffProfiles.length,
                profiles: staffProfiles
            });
        } else {
            const { ScanCommand } = require('@aws-sdk/client-dynamodb');
            const { unmarshall } = require('@aws-sdk/util-dynamodb');
            
            const scanCommand = new ScanCommand({
                TableName: STAFF_TABLE,
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
        }
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
const { createTablesIfNotExist } = require('./config/dynamodb-wrapper');

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
        
        // Run job migration from users table to jobs table
        try {
            const { migrateJobs } = require('./scripts/migrateJobsToJobsTable');
            await migrateJobs();
        } catch (migrationError) {
            console.log('ℹ️  Job migration completed or no jobs to migrate');
        }
        
        // Run job applications migration
        try {
            const { migrateJobApplications } = require('./scripts/migrateJobApplications');
            await migrateJobApplications();
        } catch (migrationError) {
            console.log('ℹ️  Job applications migration completed or no applications to migrate');
        }
        
        // Reset institute courses cache after table creation
        const instituteCourseModel = require('./models/instituteCourseModel');
        instituteCourseModel.resetCache();
        
        // Initialize default admin
        try {
            const adminModel = require('./models/adminModel');
            await adminModel.initializeDefaultAdmin();
            console.log('✅ Default admin initialized');
        } catch (error) {
            console.log('ℹ️  Admin already exists or initialization failed:', error.message);
        }
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