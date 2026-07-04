const express = require('express');
const router = express.Router();
const axios = require('axios');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const ATTENDANCE_TABLE = 'staffinn-attendance';
const BRIDGE_SERVICE_URL = 'http://localhost:3002';

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

        const params = {
            TableName: ATTENDANCE_TABLE,
            FilterExpression: '#emp = :empId AND #dt = :date',
            ExpressionAttributeNames: {
                '#emp': 'employeeId',
                '#dt': 'date'
            },
            ExpressionAttributeValues: {
                ':empId': employeeId,
                ':date': date || new Date().toISOString().split('T')[0]
            }
        };

        const result = await docClient.send(new QueryCommand(params));
        res.json({ success: true, data: result.Items });

    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test attendance endpoint for manual entry
router.post('/test-attendance', async (req, res) => {
    try {
        const { employeeId, verifyMode = 'Fingerprint' } = req.body;
        
        if (!employeeId) {
            return res.status(400).json({ success: false, error: 'Employee ID required' });
        }

        const attendanceRecord = {
            id: `${employeeId}_${Date.now()}`,
            employeeId: employeeId,
            verifyMode: verifyMode,
            timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
            date: new Date().toISOString().split('T')[0],
            deviceId: '1',
            createdAt: new Date().toISOString()
        };

        await docClient.send(new PutCommand({
            TableName: ATTENDANCE_TABLE,
            Item: attendanceRecord
        }));

        console.log(`✅ Test attendance saved: ${employeeId}`);
        res.json({ 
            success: true, 
            message: 'Test attendance recorded',
            data: attendanceRecord
        });

    } catch (error) {
        console.error('Test attendance error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
module.exports = router;