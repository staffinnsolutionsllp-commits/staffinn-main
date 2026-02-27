const express = require('express');
const router = express.Router();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ATTENDANCE_TABLE = 'staffinn-hrms-attendance';
const EMPLOYEES_TABLE = 'staffinn-hrms-employees';

// Biometric Device Webhook - Device se direct data aayega
router.post('/device-punch', async (req, res) => {
    try {
        console.log('📥 Device webhook received:', req.body);

        const { 
            employeeId,    // Device se employee ID (numeric)
            deviceId,      // Device ID
            timestamp,     // Punch time
            punchType      // IN/OUT
        } = req.body;

        if (!employeeId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Employee ID required' 
            });
        }

        // Step 1: Check if employee exists in HRMS
        const employeeCheck = await docClient.send(new GetCommand({
            TableName: EMPLOYEES_TABLE,
            Key: { employeeId }
        }));

        if (!employeeCheck.Item) {
            console.log(`❌ Employee ${employeeId} not found in HRMS`);
            return res.status(404).json({ 
                success: false, 
                message: `Employee ${employeeId} not registered in HRMS` 
            });
        }

        const employee = employeeCheck.Item;
        const now = new Date();
        const date = timestamp ? new Date(timestamp).toISOString().split('T')[0] : now.toISOString().split('T')[0];
        const time = timestamp ? new Date(timestamp).toISOString() : now.toISOString();

        // Step 2: Check today's attendance
        const todayAttendance = await docClient.send(new QueryCommand({
            TableName: ATTENDANCE_TABLE,
            IndexName: 'employeeId-date-index',
            KeyConditionExpression: 'employeeId = :empId AND #dt = :date',
            ExpressionAttributeNames: { '#dt': 'date' },
            ExpressionAttributeValues: {
                ':empId': employeeId,
                ':date': date
            }
        }));

        let attendanceRecord;

        if (todayAttendance.Items && todayAttendance.Items.length > 0) {
            // Update existing record
            attendanceRecord = todayAttendance.Items[0];
            
            if (punchType === 'OUT' || !attendanceRecord.checkOut) {
                attendanceRecord.checkOut = time;
                attendanceRecord.updatedAt = now.toISOString();
            }
        } else {
            // Create new record
            attendanceRecord = {
                attendanceId: uuidv4(),
                employeeId,
                employeeName: employee.name,
                department: employee.department || 'N/A',
                date,
                checkIn: time,
                checkOut: null,
                status: 'Present',
                deviceId: deviceId || 'MORX-001',
                createdAt: now.toISOString(),
                updatedAt: now.toISOString()
            };
        }

        // Step 3: Save to DynamoDB
        await docClient.send(new PutCommand({
            TableName: ATTENDANCE_TABLE,
            Item: attendanceRecord
        }));

        console.log(`✅ Attendance marked: ${employee.name} (${employeeId}) - ${date} ${time}`);

        res.status(200).json({ 
            success: true, 
            message: 'Attendance recorded successfully',
            data: {
                employeeId,
                employeeName: employee.name,
                date,
                checkIn: attendanceRecord.checkIn,
                checkOut: attendanceRecord.checkOut,
                status: 'Present'
            }
        });

    } catch (error) {
        console.error('❌ Device webhook error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to record attendance',
            error: error.message 
        });
    }
});

// Get attendance records
router.get('/records', async (req, res) => {
    try {
        const { employeeId, date, startDate, endDate } = req.query;

        if (!employeeId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Employee ID required' 
            });
        }

        let params = {
            TableName: ATTENDANCE_TABLE,
            IndexName: 'employeeId-date-index',
            KeyConditionExpression: 'employeeId = :empId',
            ExpressionAttributeValues: {
                ':empId': employeeId
            }
        };

        if (date) {
            params.KeyConditionExpression += ' AND #dt = :date';
            params.ExpressionAttributeNames = { '#dt': 'date' };
            params.ExpressionAttributeValues[':date'] = date;
        }

        const result = await docClient.send(new QueryCommand(params));

        res.json({ 
            success: true, 
            data: result.Items || [] 
        });

    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Biometric webhook endpoint is working!',
        endpoint: '/api/v1/biometric/device-punch',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
