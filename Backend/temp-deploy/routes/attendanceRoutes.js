const express = require('express');
const router = express.Router();
const axios = require('axios');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const ATTENDANCE_TABLE = 'staffinn-hrms-attendance'; // Use existing HRMS table
const BRIDGE_SERVICE_URL = 'http://localhost:3002';

// Legacy routes
router.post('/', authenticate, attendanceController.markAttendance);
router.get('/', authenticate, attendanceController.getAttendance);
router.get('/all', authenticate, attendanceController.getAllAttendance);

// Bridge authentication endpoint
router.post('/bridge/auth', async (req, res) => {
    try {
        const { companyId, apiKey } = req.body;
        
        // Validate credentials (add your validation logic)
        if (companyId && apiKey) {
            res.json({
                success: true,
                message: 'Bridge authenticated successfully',
                companyId: companyId,
                bridgeUrl: 'http://localhost:3001'
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Device status for HRMS dashboard
router.get('/device/status', async (req, res) => {
    try {
        const response = await axios.get(`${BRIDGE_SERVICE_URL}/status`);
        res.json({
            success: true,
            connected: response.data.connected,
            deviceInfo: response.data
        });
    } catch (error) {
        res.json({
            success: false,
            connected: false,
            error: 'Bridge service not available'
        });
    }
});

// New SBXPC Bridge routes
// Sync attendance from SBXPC bridge service
router.post('/sync', async (req, res) => {
    try {
        console.log('🔄 Starting attendance sync...');
        
        // Get new attendance from bridge service
        const response = await axios.get(`${BRIDGE_SERVICE_URL}/attendance/new`);
        
        if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to fetch attendance');
        }

        const attendanceData = response.data.data || [];
        console.log(`📊 Found ${attendanceData.length} new records`);

        let savedCount = 0;
        for (const record of attendanceData) {
            const attendanceRecord = {
                id: `${record.employeeId}_${new Date(record.timestamp).getTime()}`,
                employeeId: record.employeeId,
                verifyMode: record.verifyMode,
                timestamp: record.timestamp,
                date: record.timestamp.split(' ')[0],
                deviceId: record.deviceId.toString(),
                createdAt: new Date().toISOString()
            };

            try {
                await docClient.send(new PutCommand({
                    TableName: ATTENDANCE_TABLE,
                    Item: attendanceRecord,
                    ConditionExpression: 'attribute_not_exists(id)' // Prevent duplicates
                }));
                savedCount++;
                console.log(`✅ Saved: ${record.employeeId} at ${record.timestamp}`);
            } catch (err) {
                if (err.name !== 'ConditionalCheckFailedException') {
                    console.error(`❌ Error saving ${record.employeeId}:`, err.message);
                }
            }
        }

        res.json({ 
            success: true, 
            message: `Synced ${savedCount} new attendance records`,
            total: attendanceData.length,
            saved: savedCount
        });

    } catch (error) {
        console.error('❌ Attendance sync error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get bridge service status
router.get('/bridge-status', async (req, res) => {
    try {
        const response = await axios.get(`${BRIDGE_SERVICE_URL}/status`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Bridge service not available' });
    }
});

// Connect to device
router.post('/connect', async (req, res) => {
    try {
        const response = await axios.get(`${BRIDGE_SERVICE_URL}/connect`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Legacy webhook endpoint (keep for compatibility)
router.post('/webhook', async (req, res) => {
    try {
        const { 
            enrollNumber,
            name,
            verifyMode,
            inOutMode,
            workCode,
            dateTime
        } = req.body;

        const attendanceRecord = {
            id: `${enrollNumber}_${Date.now()}`,
            employeeId: enrollNumber,
            employeeName: name,
            verifyMode: verifyMode,
            inOutMode: inOutMode,
            timestamp: dateTime || new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            deviceId: req.body.deviceId || '1',
            createdAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({
            TableName: ATTENDANCE_TABLE,
            Item: attendanceRecord
        }));

        console.log('Attendance saved:', attendanceRecord);
        res.status(200).json({ success: true, message: 'Attendance recorded' });

    } catch (error) {
        console.error('Attendance webhook error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get attendance records
router.get('/records', async (req, res) => {
    try {
        const { employeeId, date } = req.query;

        if (employeeId && date) {
            // Filter by specific employee and date
            const params = {
                TableName: ATTENDANCE_TABLE,
                FilterExpression: '#emp = :empId AND #dt = :date',
                ExpressionAttributeNames: {
                    '#emp': 'employeeId',
                    '#dt': 'date'
                },
                ExpressionAttributeValues: {
                    ':empId': employeeId,
                    ':date': date
                }
            };
            const result = await docClient.send(new ScanCommand(params));
            res.json({ success: true, data: result.Items });
        } else {
            // Get all records (limited)
            const params = {
                TableName: ATTENDANCE_TABLE,
                Limit: 50
            };
            const result = await docClient.send(new ScanCommand(params));
            res.json({ success: true, data: result.Items || [] });
        }

    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;