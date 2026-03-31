const { dynamoClient, isUsingMockDB, mockDB, HRMS_ATTENDANCE_TABLE, HRMS_EMPLOYEES_TABLE } = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, formatDate, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');
const axios = require('axios');

// Bridge service configuration
const BRIDGE_SERVICE_URL = 'http://localhost:3002';

const syncFromBridge = async (req, res) => {
  try {
    console.log('🔄 Starting bridge sync...');
    
    // Fetch data from bridge service
    const response = await axios.get(`${BRIDGE_SERVICE_URL}/attendance/new`);
    const bridgeData = response.data;
    
    if (!bridgeData.success || !bridgeData.data) {
      return res.status(400).json(errorResponse('No data received from bridge'));
    }
    
    console.log(`📊 Received ${bridgeData.count} records from bridge`);
    let processedCount = 0;
    let errorCount = 0;
    
    for (const record of bridgeData.data) {
      try {
        // Convert bridge data to HRMS format
        const timestamp = new Date(record.timestamp);
        const date = timestamp.toISOString().split('T')[0];
        const time = timestamp.toTimeString().slice(0, 5);
        
        // Check if employee exists
        let employee;
        if (isUsingMockDB()) {
          employee = mockDB().get(HRMS_EMPLOYEES_TABLE, record.employeeId);
        } else {
          const getCommand = new GetCommand({
            TableName: HRMS_EMPLOYEES_TABLE,
            Key: { employeeId: record.employeeId }
          });
          const result = await dynamoClient.send(getCommand);
          employee = result.Item;
        }
        
        if (!employee) {
          console.log(`⚠️ Employee ${record.employeeId} not found, skipping...`);
          errorCount++;
          continue;
        }
        
        // Check if attendance already exists for same date
        let existingAttendance;
        if (isUsingMockDB()) {
          const allAttendance = mockDB().scan(HRMS_ATTENDANCE_TABLE);
          existingAttendance = allAttendance.find(a => 
            a.employeeId === record.employeeId && 
            a.date === date
          );
        } else {
          const scanCommand = new ScanCommand({
            TableName: HRMS_ATTENDANCE_TABLE,
            FilterExpression: 'employeeId = :employeeId AND #date = :date',
            ExpressionAttributeNames: { '#date': 'date' },
            ExpressionAttributeValues: {
              ':employeeId': record.employeeId,
              ':date': date
            }
          });
          const result = await dynamoClient.send(scanCommand);
          existingAttendance = result.Items && result.Items.length > 0 ? result.Items[0] : null;
        }
        
        if (existingAttendance && !existingAttendance.checkOut) {
          // Second punch = Check-out time
          // Only update if new time is AFTER check-in time
          const checkInTime = new Date(`${date} ${existingAttendance.checkIn}`);
          const newPunchTime = new Date(`${date} ${time}`);
          
          if (newPunchTime > checkInTime) {
            const hours = Math.max(0, (newPunchTime - checkInTime) / (1000 * 60 * 60));
            
            const updatedRecord = {
              ...existingAttendance,
              checkOut: time,
              hours: parseFloat(hours.toFixed(2))
            };
            
            if (isUsingMockDB()) {
              mockDB().put(HRMS_ATTENDANCE_TABLE, updatedRecord);
            } else {
              const updateCommand = new UpdateCommand({
                TableName: HRMS_ATTENDANCE_TABLE,
                Key: { attendanceId: existingAttendance.attendanceId },
                UpdateExpression: 'SET checkOut = :checkOut, hours = :hours',
                ExpressionAttributeValues: {
                  ':checkOut': time,
                  ':hours': parseFloat(hours.toFixed(2))
                }
              });
              await dynamoClient.send(updateCommand);
            }
            
            processedCount++;
            console.log(`✅ Updated check-out for employee ${record.employeeId}: ${existingAttendance.checkIn} → ${time} (${hours.toFixed(2)} hours)`);
          } else {
            console.log(`⚠️ Ignoring earlier time ${time} for employee ${record.employeeId} (check-in: ${existingAttendance.checkIn})`);
          }
          continue;
        }
        
        if (existingAttendance && existingAttendance.checkOut) {
          console.log(`🔄 Record already complete for ${record.employeeId} on ${date}, skipping...`);
          continue;
        }
        
        // Create attendance record
        const attendanceId = generateId();
        
        // Get employee's configured check-in time for status calculation
        const configuredCheckIn = employee.checkInTime || '09:00';
        const status = time > configuredCheckIn ? 'late' : 'present';
        
        const attendanceRecord = {
          attendanceId,
          employeeId: record.employeeId,
          recruiterId: employee.recruiterId, // Add recruiterId for multi-tenant isolation
          date,
          checkIn: time,
          checkOut: '',
          hours: 0,
          status,
          source: 'biometric',
          deviceId: record.deviceId,
          verifyMode: record.verifyMode,
          createdAt: getCurrentTimestamp()
        };
        
        if (isUsingMockDB()) {
          mockDB().put(HRMS_ATTENDANCE_TABLE, attendanceRecord);
        } else {
          const putCommand = new PutCommand({
            TableName: HRMS_ATTENDANCE_TABLE,
            Item: attendanceRecord
          });
          await dynamoClient.send(putCommand);
        }
        
        processedCount++;
        console.log(`✅ Processed attendance for employee ${record.employeeId} at ${time}`);
        
      } catch (recordError) {
        console.error(`❌ Error processing record for employee ${record.employeeId}:`, recordError);
        errorCount++;
      }
    }
    
    console.log(`🎉 Bridge sync completed: ${processedCount} processed, ${errorCount} errors`);
    
    res.json(successResponse({
      totalRecords: bridgeData.count,
      processedRecords: processedCount,
      errorRecords: errorCount
    }, 'Bridge sync completed successfully'));
    
  } catch (error) {
    console.error('❌ Bridge sync failed:', error);
    handleError(error, res);
  }
};

const markAttendance = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    
    console.log('Mark attendance request:', req.body);
    console.log('User context:', { recruiterId, headers: req.headers });
    
    const { employeeId, checkIn, checkOut, date } = req.body;

    if (!employeeId || !checkIn) {
      console.log('Missing required fields:', { employeeId, checkIn });
      return res.status(400).json(errorResponse('Employee ID and check-in time are required'));
    }

    // For bridge requests, find employee first to get recruiterId
    let employee;
    if (!recruiterId) {
      // Bridge request - find employee by employeeId only
      console.log('🔍 Bridge request detected, searching employee by ID only:', employeeId);
      
      if (isUsingMockDB()) {
        employee = mockDB().get(HRMS_EMPLOYEES_TABLE, employeeId);
      } else {
        const scanCommand = new ScanCommand({
          TableName: HRMS_EMPLOYEES_TABLE,
          FilterExpression: 'employeeId = :employeeId',
          ExpressionAttributeValues: {
            ':employeeId': employeeId
          }
        });
        const result = await dynamoClient.send(scanCommand);
        employee = result.Items && result.Items.length > 0 ? result.Items[0] : null;
      }
      
      if (!employee) {
        console.log('❌ Employee not found:', employeeId);
        return res.status(404).json({ 
          success: false, 
          message: 'Employee not found',
          statusCode: 400
        });
      }
      
      // Use employee's recruiterId for the attendance record
      req.user = { recruiterId: employee.recruiterId };
      console.log('✅ Found employee, using recruiterId:', employee.recruiterId);
    } else {
      // Regular authenticated request - filter by both employeeId AND recruiterId
      if (isUsingMockDB()) {
        const allEmployees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
        employee = allEmployees.find(e => e.employeeId === employeeId && e.recruiterId === recruiterId);
      } else {
        const scanCommand = new ScanCommand({
          TableName: HRMS_EMPLOYEES_TABLE,
          FilterExpression: 'employeeId = :employeeId AND recruiterId = :recruiterId',
          ExpressionAttributeValues: {
            ':employeeId': employeeId,
            ':recruiterId': recruiterId
          }
        });
        const result = await dynamoClient.send(scanCommand);
        employee = result.Items && result.Items.length > 0 ? result.Items[0] : null;
      }

      if (!employee) {
        console.log('Employee not found or not authorized:', employeeId);
        return res.status(404).json(errorResponse('Employee not found'));
      }
    }

    const attendanceDate = date || formatDate(new Date());
    console.log('Processing attendance for date:', attendanceDate);
    
    // Check if attendance already exists for this employee and date
    // SECURITY: Filter by recruiterId to ensure multi-tenant isolation
    let existingAttendance;
    if (isUsingMockDB()) {
      const allAttendance = mockDB().scan(HRMS_ATTENDANCE_TABLE);
      existingAttendance = allAttendance.find(a => 
        a.employeeId === employeeId && 
        a.date === attendanceDate &&
        (!a.recruiterId || a.recruiterId === recruiterId) // Backward compatible: support old records without recruiterId
      );
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_ATTENDANCE_TABLE,
        FilterExpression: 'employeeId = :employeeId AND #date = :date AND (attribute_not_exists(recruiterId) OR recruiterId = :recruiterId)',
        ExpressionAttributeNames: {
          '#date': 'date'
        },
        ExpressionAttributeValues: {
          ':employeeId': employeeId,
          ':date': attendanceDate,
          ':recruiterId': recruiterId
        }
      });
      const result = await dynamoClient.send(scanCommand);
      existingAttendance = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }
    
    // Additional security check: Verify attendance belongs to authorized employee
    if (existingAttendance && existingAttendance.employeeId !== employeeId) {
      console.error('⚠️ Security: Attendance-Employee mismatch detected');
      existingAttendance = null;
    }

    let attendanceRecord;

    if (existingAttendance) {
      // Update existing record - ALLOW MANUAL OVERRIDE
      let hours = 0;
      if (checkOut) {
        const checkInTime = new Date(`${attendanceDate} ${checkIn}`);
        const checkOutTime = new Date(`${attendanceDate} ${checkOut}`);
        hours = Math.max(0, (checkOutTime - checkInTime) / (1000 * 60 * 60));
      }

      // Get employee's configured check-in time for status calculation
      const configuredCheckIn = employee.checkInTime || '09:00';
      const status = checkIn > configuredCheckIn ? 'late' : 'present';
      
      const updatedRecord = {
        ...existingAttendance,
        checkIn, // Allow manual override of check-in
        checkOut: checkOut || existingAttendance.checkOut || '',
        hours,
        status, // Update status based on new check-in time
        source: 'manual', // Mark as manually edited
        recruiterId: recruiterId // Ensure recruiterId is set for old records
      };

      if (isUsingMockDB()) {
        mockDB().put(HRMS_ATTENDANCE_TABLE, updatedRecord);
        attendanceRecord = updatedRecord;
      } else {
        const updateCommand = new UpdateCommand({
          TableName: HRMS_ATTENDANCE_TABLE,
          Key: { attendanceId: existingAttendance.attendanceId },
          UpdateExpression: 'SET checkIn = :checkIn, checkOut = :checkOut, hours = :hours, #status = :status, #source = :source, recruiterId = :recruiterId',
          ExpressionAttributeNames: {
            '#status': 'status',
            '#source': 'source'
          },
          ExpressionAttributeValues: {
            ':checkIn': checkIn,
            ':checkOut': checkOut || existingAttendance.checkOut || '',
            ':hours': hours,
            ':status': status,
            ':source': 'manual',
            ':recruiterId': recruiterId
          },
          ReturnValues: 'ALL_NEW'
        });
        const result = await dynamoClient.send(updateCommand);
        attendanceRecord = result.Attributes;
      }
      
      console.log(`✅ Manual override: Updated attendance for employee ${employeeId}`);
    } else {
      // Create new record
      const attendanceId = generateId();
      
      // Get employee's configured check-in time
      const configuredCheckIn = employee.checkInTime || '09:00';
      const status = checkIn > configuredCheckIn ? 'late' : 'present';
      
      let hours = 0;
      if (checkOut) {
        const checkInTime = new Date(`${attendanceDate} ${checkIn}`);
        const checkOutTime = new Date(`${attendanceDate} ${checkOut}`);
        hours = Math.max(0, (checkOutTime - checkInTime) / (1000 * 60 * 60));
      }

      attendanceRecord = {
        attendanceId,
        employeeId,
        recruiterId, // Add recruiterId for multi-tenant isolation
        date: attendanceDate,
        checkIn,
        checkOut: checkOut || '',
        hours,
        status,
        source: 'manual',
        createdAt: getCurrentTimestamp()
      };

      if (isUsingMockDB()) {
        mockDB().put(HRMS_ATTENDANCE_TABLE, attendanceRecord);
      } else {
        const putCommand = new PutCommand({
          TableName: HRMS_ATTENDANCE_TABLE,
          Item: attendanceRecord
        });
        await dynamoClient.send(putCommand);
      }
    }

    console.log('Attendance marked successfully:', attendanceRecord);
    res.status(201).json(successResponse(attendanceRecord, 'Attendance marked successfully'));

  } catch (error) {
    console.error('Error marking attendance:', error);
    handleError(error, res);
  }
};

const getAttendanceByDate = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }

    const { date } = req.params;
    const attendanceDate = date || formatDate(new Date());

    let attendanceRecords;
    if (isUsingMockDB()) {
      const allAttendance = mockDB().scan(HRMS_ATTENDANCE_TABLE);
      attendanceRecords = allAttendance.filter(a => a.date === attendanceDate);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_ATTENDANCE_TABLE,
        FilterExpression: '#date = :date',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: { ':date': attendanceDate }
      });
      const result = await dynamoClient.send(scanCommand);
      attendanceRecords = result.Items || [];
    }

    const employeeIds = [...new Set(attendanceRecords.map(att => att.employeeId))];
    const employees = {};

    for (const empId of employeeIds) {
      let employee;
      if (isUsingMockDB()) {
        employee = mockDB().get(HRMS_EMPLOYEES_TABLE, empId);
        if (employee && employee.recruiterId === recruiterId) {
          employees[empId] = employee;
        }
      } else {
        const getCommand = new GetCommand({
          TableName: HRMS_EMPLOYEES_TABLE,
          Key: { employeeId: empId }
        });
        const result = await dynamoClient.send(getCommand);
        if (result.Item && result.Item.recruiterId === recruiterId) {
          employees[empId] = result.Item;
        }
      }
    }

    const enrichedAttendance = attendanceRecords
      .filter(att => employees[att.employeeId])
      .map(attendance => ({
        ...attendance,
        employee: employees[attendance.employeeId]
      }));

    res.json(successResponse(enrichedAttendance, 'Attendance retrieved successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    let attendanceRecords;
    if (isUsingMockDB()) {
      const allAttendance = mockDB().scan(HRMS_ATTENDANCE_TABLE);
      attendanceRecords = allAttendance.filter(a => {
        if (a.employeeId !== employeeId) return false;
        if (startDate && endDate) {
          return a.date >= startDate && a.date <= endDate;
        }
        return true;
      });
    } else {
      let filterExpression = 'employeeId = :employeeId';
      const expressionAttributeValues = { ':employeeId': employeeId };

      if (startDate && endDate) {
        filterExpression += ' AND #date BETWEEN :startDate AND :endDate';
        expressionAttributeValues[':startDate'] = startDate;
        expressionAttributeValues[':endDate'] = endDate;
      }

      const scanCommand = new ScanCommand({
        TableName: HRMS_ATTENDANCE_TABLE,
        FilterExpression: filterExpression,
        ExpressionAttributeNames: {
          '#date': 'date'
        },
        ExpressionAttributeValues: expressionAttributeValues
      });
      const result = await dynamoClient.send(scanCommand);
      attendanceRecords = result.Items || [];
    }

    res.json(successResponse(attendanceRecords, 'Employee attendance retrieved successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const getAttendanceStats = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }

    const requestedDate = req.query.date || formatDate(new Date());
    console.log(`📊 Calculating stats for recruiterId: ${recruiterId}, date: ${requestedDate}`);
    
    let dateAttendance;
    if (isUsingMockDB()) {
      const allAttendance = mockDB().scan(HRMS_ATTENDANCE_TABLE);
      dateAttendance = allAttendance.filter(a => a.date === requestedDate);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_ATTENDANCE_TABLE,
        FilterExpression: '#date = :date',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: { ':date': requestedDate }
      });
      const result = await dynamoClient.send(scanCommand);
      dateAttendance = result.Items || [];
    }

    let allEmployees;
    if (isUsingMockDB()) {
      const employees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
      allEmployees = employees.filter(e => e.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        FilterExpression: 'recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      allEmployees = result.Items || [];
    }

    const employeeIds = new Set(allEmployees.map(e => e.employeeId));
    const filteredAttendance = dateAttendance.filter(att => employeeIds.has(att.employeeId));

    const totalEmployees = allEmployees.length;
    const presentToday = filteredAttendance.length;
    
    // Calculate late arrivals based on each employee's configured check-in time
    let lateArrivals = 0;
    for (const att of filteredAttendance) {
      if (att.checkIn) {
        const emp = allEmployees.find(e => e.employeeId === att.employeeId);
        const configuredCheckIn = emp?.checkInTime || '09:00';
        if (att.checkIn > configuredCheckIn || att.status === 'late') {
          lateArrivals++;
        }
      }
    }
    
    const completedAttendance = filteredAttendance.filter(att => att.checkIn && att.checkOut && att.hours > 0);
    const avgHours = completedAttendance.length > 0 
      ? completedAttendance.reduce((sum, att) => sum + (att.hours || 0), 0) / completedAttendance.length
      : 0;
    
    const attendanceRate = totalEmployees > 0 ? (presentToday / totalEmployees * 100) : 0;

    const stats = {
      totalEmployees,
      presentToday,
      absentToday: Math.max(0, totalEmployees - presentToday),
      lateArrivals,
      attendanceRate: parseFloat(attendanceRate.toFixed(1)),
      avgHours: parseFloat(avgHours.toFixed(1)),
      selectedDate: requestedDate,
      completedRecords: completedAttendance.length,
      totalDateRecords: filteredAttendance.length
    };

    console.log(`📊 Stats for recruiter ${recruiterId}: ${presentToday}/${totalEmployees} present`);
    res.json(successResponse(stats, 'Attendance statistics retrieved successfully'));

  } catch (error) {
    console.error('❌ Error calculating attendance stats:', error);
    handleError(error, res);
  }
};

// Store device heartbeat in memory (in production, use Redis)
const deviceHeartbeats = new Map();

const getDeviceStatus = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    console.log('🔍 Checking device status for company:', companyId);
    console.log('👤 User object:', { userId: req.user?.userId, email: req.user?.email, companyId: req.user?.companyId });
    console.log('📋 All heartbeats:', Array.from(deviceHeartbeats.entries()));
    
    if (!companyId) {
      console.log('⚠️ No companyId found in user object');
      return res.json(successResponse({
        connected: false,
        lastSeen: null,
        error: 'Company ID not found. Please complete company setup.'
      }, 'Device status retrieved'));
    }
    
    // Check if device sent heartbeat in last 30 seconds
    const lastHeartbeat = deviceHeartbeats.get(companyId);
    const isOnline = lastHeartbeat && (Date.now() - lastHeartbeat) < 30000;
    
    console.log(`✅ Device status: ${isOnline ? 'Online' : 'Offline'}, lastHeartbeat: ${lastHeartbeat}`);
    
    res.json(successResponse({
      connected: isOnline,
      lastSeen: lastHeartbeat ? new Date(lastHeartbeat).toISOString() : null
    }, 'Device status retrieved'));
  } catch (error) {
    console.error('❌ Error in getDeviceStatus:', error);
    handleError(error, res);
  }
};

module.exports = {
  markAttendance,
  getAttendanceByDate,
  getEmployeeAttendance,
  getAttendanceStats,
  getDeviceStatus,
  syncFromBridge,
  deviceHeartbeats
};