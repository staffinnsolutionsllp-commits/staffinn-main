const express = require('express');
const router = express.Router();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const ATTENDANCE_TABLE = 'staffinn-hrms-attendance';
const EMPLOYEES_TABLE = 'staffinn-hrms-employees';
const COMPANIES_TABLE = 'staffinn-hrms-companies';
const USERS_TABLE = 'staffinn-hrms-users';

// Biometric Device Webhook - Device se direct data aayega
router.post('/device-punch', async (req, res) => {
    try {
        console.log('📥 Device webhook received:', req.body);

        const { 
            employeeId,    // Device se employee ID (numeric)
            deviceId,      // Device ID
            timestamp,     // Punch time
            punchType,     // IN/OUT
            companyId,     // Company ID from bridge
            apiKey         // API Key from bridge
        } = req.body;

        if (!employeeId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Employee ID required' 
            });
        }

        // Validate company credentials if provided
        let recruiterId = null;
        if (companyId && apiKey) {
            try {
                const companyResult = await docClient.send(new GetCommand({
                    TableName: COMPANIES_TABLE,
                    Key: { companyId }
                }));
                
                if (!companyResult.Item || companyResult.Item.apiKey !== apiKey) {
                    console.log('❌ Invalid company credentials');
                    return res.status(401).json({ success: false, message: 'Invalid company credentials' });
                }
                
                // Get recruiterId from staffinn-hrms-users table using company email
                const usersResult = await docClient.send(new ScanCommand({
                    TableName: USERS_TABLE,
                    FilterExpression: 'email = :email',
                    ExpressionAttributeValues: {
                        ':email': companyResult.Item.adminEmail
                    }
                }));
                
                if (usersResult.Items && usersResult.Items.length > 0) {
                    recruiterId = usersResult.Items[0].recruiterId;
                    console.log('✅ Company validated, recruiterId:', recruiterId);
                }
            } catch (error) {
                console.log('⚠️ Company validation failed:', error.message);
            }
        }

        // Step 1: Check if employee exists in HRMS (search by employeeId)
        const employeeResult = await docClient.send(new ScanCommand({
            TableName: EMPLOYEES_TABLE,
            FilterExpression: 'employeeId = :employeeId',
            ExpressionAttributeValues: {
                ':employeeId': employeeId.toString()
            }
        }));

        if (!employeeResult.Items || employeeResult.Items.length === 0) {
            console.log(`❌ Employee ${employeeId} not found in HRMS`);
            return res.status(404).json({ 
                success: false, 
                message: `Employee ${employeeId} not registered in HRMS` 
            });
        }

        const employee = employeeResult.Items[0];
        
        // Use employee's recruiterId if not found from company
        if (!recruiterId && employee.recruiterId) {
            recruiterId = employee.recruiterId;
            console.log('✅ Using employee recruiterId:', recruiterId);
        }

        const now = new Date();
        const date = timestamp ? new Date(timestamp).toISOString().split('T')[0] : now.toISOString().split('T')[0];
        const time = timestamp ? new Date(timestamp).toTimeString().slice(0, 8) : now.toTimeString().slice(0, 8);

        // Step 2: Check today's attendance for this employee
        const todayAttendanceResult = await docClient.send(new ScanCommand({
            TableName: ATTENDANCE_TABLE,
            FilterExpression: 'employeeId = :empId AND #dt = :date',
            ExpressionAttributeNames: { '#dt': 'date' },
            ExpressionAttributeValues: {
                ':empId': employeeId.toString(),
                ':date': date
            }
        }));

        let attendanceRecord;

        if (todayAttendanceResult.Items && todayAttendanceResult.Items.length > 0) {
            // Update existing record (checkout)
            attendanceRecord = todayAttendanceResult.Items[0];
            
            if (punchType === 'OUT' || !attendanceRecord.checkOut) {
                attendanceRecord.checkOut = time;
                
                // Calculate hours
                const checkInTime = new Date(`${date} ${attendanceRecord.checkIn}`);
                const checkOutTime = new Date(`${date} ${time}`);
                const hours = Math.max(0, (checkOutTime - checkInTime) / (1000 * 60 * 60));
                attendanceRecord.hours = parseFloat(hours.toFixed(2));
            }
        } else {
            // Create new record (checkin)
            const configuredCheckIn = employee.checkInTime || '09:00';
            const status = time > configuredCheckIn ? 'late' : 'present';
            
            attendanceRecord = {
                attendanceId: uuidv4(),
                employeeId: employeeId.toString(),
                recruiterId: recruiterId, // Add recruiterId for filtering
                date,
                checkIn: time,
                checkOut: '',
                hours: 0,
                status: status,
                deviceId: deviceId ? deviceId.toString() : '-1',
                verifyMode: req.body.verifyMode || 'Unknown',
                source: 'biometric',
                createdAt: now.toISOString()
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
                status: attendanceRecord.status
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
        const { employeeId, date } = req.query;

        if (!employeeId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Employee ID required' 
            });
        }

        let filterExpression = 'employeeId = :empId';
        let expressionAttributeValues = { ':empId': employeeId };

        if (date) {
            filterExpression += ' AND #dt = :date';
            expressionAttributeValues[':date'] = date;
        }

        const result = await docClient.send(new ScanCommand({
            TableName: ATTENDANCE_TABLE,
            FilterExpression: filterExpression,
            ExpressionAttributeNames: date ? { '#dt': 'date' } : undefined,
            ExpressionAttributeValues: expressionAttributeValues
        }));

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
