const { dynamoClient, isUsingMockDB, mockDB, HRMS_ATTENDANCE_TABLE, HRMS_EMPLOYEES_TABLE } = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, formatDate, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

// Store device heartbeat in memory (in production, use Redis)
const deviceHeartbeats = new Map();

const markAttendance = async (req, res) => {
  try {
    console.log('Mark attendance request:', req.body);
    const { employeeId, checkIn, checkOut, date } = req.body;

    if (!employeeId || !checkIn) {
      console.log('Missing required fields:', { employeeId, checkIn });
      return res.status(400).json(errorResponse('Employee ID and check-in time are required'));
    }

    // Verify employee exists
    let employee;
    if (isUsingMockDB()) {
      employee = mockDB().get(HRMS_EMPLOYEES_TABLE, employeeId);
    } else {
      const getCommand = new GetCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Key: { employeeId }
      });
      const result = await dynamoClient.send(getCommand);
      employee = result.Item;
    }

    if (!employee) {
      console.log('Employee not found:', employeeId);
      return res.status(404).json(errorResponse('Employee not found'));
    }

    const attendanceDate = date || formatDate(new Date());
    console.log('Processing attendance for date:', attendanceDate);
    
    // Check if attendance already exists for this employee and date
    let existingAttendance;
    if (isUsingMockDB()) {
      const allAttendance = mockDB().scan(HRMS_ATTENDANCE_TABLE);
      existingAttendance = allAttendance.find(a => a.employeeId === employeeId && a.date === attendanceDate);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_ATTENDANCE_TABLE,
        FilterExpression: 'employeeId = :employeeId AND #date = :date',
        ExpressionAttributeNames: {
          '#date': 'date'
        },
        ExpressionAttributeValues: {
          ':employeeId': employeeId,
          ':date': attendanceDate
        }
      });
      const result = await dynamoClient.send(scanCommand);
      existingAttendance = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    let attendanceRecord;

    if (existingAttendance) {
      // SMART LOGIC: If record exists and no checkOut, treat this as check-out
      if (!existingAttendance.checkOut && !checkOut) {
        // This is a check-out punch (second punch of the day)
        const checkInTime = new Date(`${attendanceDate} ${existingAttendance.checkIn}`);
        const checkOutTime = new Date(`${attendanceDate} ${checkIn}`);
        const timeDiffMinutes = (checkOutTime - checkInTime) / (1000 * 60);
        
        // Ignore duplicate punches within 1 minute
        if (timeDiffMinutes < 1) {
          console.log(`⚠️ Ignoring duplicate punch within 1 minute for employee ${employeeId}`);
          return res.status(200).json(successResponse(existingAttendance, 'Duplicate punch ignored'));
        }
        
        // Ignore third+ punches (only allow check-in and check-out)
        if (timeDiffMinutes < 0) {
          console.log(`⚠️ Ignoring out-of-order punch for employee ${employeeId}`);
          return res.status(200).json(successResponse(existingAttendance, 'Out-of-order punch ignored'));
        }
        
        // Calculate hours
        const hours = Math.max(0, timeDiffMinutes / 60);
        const validHours = isNaN(hours) || !isFinite(hours) ? 0 : parseFloat(hours.toFixed(2));
        
        const updatedRecord = {
          ...existingAttendance,
          checkOut: checkIn, // Use checkIn time as checkOut
          hours: validHours
        };
        
        if (isUsingMockDB()) {
          mockDB().put(HRMS_ATTENDANCE_TABLE, updatedRecord);
          attendanceRecord = updatedRecord;
        } else {
          const updateCommand = new UpdateCommand({
            TableName: HRMS_ATTENDANCE_TABLE,
            Key: { attendanceId: existingAttendance.attendanceId },
            UpdateExpression: 'SET checkOut = :checkOut, hours = :hours',
            ExpressionAttributeValues: {
              ':checkOut': checkIn,
              ':hours': validHours
            },
            ReturnValues: 'ALL_NEW'
          });
          const result = await dynamoClient.send(updateCommand);
          attendanceRecord = result.Attributes;
        }
        
        console.log(`✅ Check-out recorded for employee ${employeeId}: ${existingAttendance.checkIn} → ${checkIn} (${hours.toFixed(2)} hours)`);
      } else if (existingAttendance.checkOut) {
        // Already has check-out, ignore third+ punch
        console.log(`⚠️ Ignoring third punch for employee ${employeeId} - already checked out`);
        return res.status(200).json(successResponse(existingAttendance, 'Already checked out today'));
      } else {
        // Manual update with explicit checkOut time
        let hours = 0;
        if (checkOut) {
          const checkInTime = new Date(`${attendanceDate} ${checkIn}`);
          const checkOutTime = new Date(`${attendanceDate} ${checkOut}`);
          hours = Math.max(0, (checkOutTime - checkInTime) / (1000 * 60 * 60));
          hours = isNaN(hours) || !isFinite(hours) ? 0 : hours;
        }

        const updatedRecord = {
          ...existingAttendance,
          checkOut: checkOut || '',
          hours
        };

        if (isUsingMockDB()) {
          mockDB().put(HRMS_ATTENDANCE_TABLE, updatedRecord);
          attendanceRecord = updatedRecord;
        } else {
          const updateCommand = new UpdateCommand({
            TableName: HRMS_ATTENDANCE_TABLE,
            Key: { attendanceId: existingAttendance.attendanceId },
            UpdateExpression: 'SET checkOut = :checkOut, hours = :hours',
            ExpressionAttributeValues: {
              ':checkOut': checkOut || '',
              ':hours': hours
            },
            ReturnValues: 'ALL_NEW'
          });
          const result = await dynamoClient.send(updateCommand);
          attendanceRecord = result.Attributes;
        }
      }
    } else {
      // Create new record
      const attendanceId = generateId();
      const status = checkIn > '09:30' ? 'late' : 'present';
      
      let hours = 0;
      if (checkOut) {
        const checkInTime = new Date(`${attendanceDate} ${checkIn}`);
        const checkOutTime = new Date(`${attendanceDate} ${checkOut}`);
        hours = Math.max(0, (checkOutTime - checkInTime) / (1000 * 60 * 60));
        hours = isNaN(hours) || !isFinite(hours) ? 0 : hours;
      }

      attendanceRecord = {
        attendanceId,
        employeeId,
        date: attendanceDate,
        checkIn,
        checkOut: checkOut || '',
        hours,
        status,
        source: req.body.source || 'manual',
        deviceId: req.body.deviceId || null,
        verifyMode: req.body.verifyMode || null,
        recruiterId: req.user?.recruiterId || employee.recruiterId || null,
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
    const { date } = req.params;
    const attendanceDate = date || formatDate(new Date());
    const recruiterId = req.user?.recruiterId;
    
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }

    let attendanceRecords;
    if (isUsingMockDB()) {
      const allAttendance = mockDB().scan(HRMS_ATTENDANCE_TABLE);
      attendanceRecords = allAttendance.filter(a => a.date === attendanceDate && a.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_ATTENDANCE_TABLE,
        FilterExpression: '#date = :date AND recruiterId = :recruiterId',
        ExpressionAttributeNames: {
          '#date': 'date'
        },
        ExpressionAttributeValues: {
          ':date': attendanceDate,
          ':recruiterId': recruiterId
        }
      });
      const result = await dynamoClient.send(scanCommand);
      attendanceRecords = result.Items || [];
    }

    // Get employee details
    const employeeIds = [...new Set(attendanceRecords.map(att => att.employeeId))];
    const employees = {};

    for (const empId of employeeIds) {
      let employee;
      if (isUsingMockDB()) {
        employee = mockDB().get(HRMS_EMPLOYEES_TABLE, empId);
      } else {
        const getCommand = new GetCommand({
          TableName: HRMS_EMPLOYEES_TABLE,
          Key: { employeeId: empId }
        });
        const result = await dynamoClient.send(getCommand);
        employee = result.Item;
      }
      
      if (employee) {
        employees[empId] = employee;
      }
    }

    const enrichedAttendance = attendanceRecords.map(attendance => ({
      ...attendance,
      employee: employees[attendance.employeeId] || null
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
    const today = formatDate(new Date());
    const recruiterId = req.user?.recruiterId;
    
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }
    
    // Get today's attendance for this recruiter only
    let todayAttendance;
    if (isUsingMockDB()) {
      const allAttendance = mockDB().scan(HRMS_ATTENDANCE_TABLE);
      todayAttendance = allAttendance.filter(a => a.date === today && a.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_ATTENDANCE_TABLE,
        FilterExpression: '#date = :date AND recruiterId = :recruiterId',
        ExpressionAttributeNames: {
          '#date': 'date'
        },
        ExpressionAttributeValues: {
          ':date': today,
          ':recruiterId': recruiterId
        }
      });
      const result = await dynamoClient.send(scanCommand);
      todayAttendance = result.Items || [];
    }

    // Get total employees for this recruiter only
    let allEmployees;
    if (isUsingMockDB()) {
      const employees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
      allEmployees = employees.filter(e => e.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        FilterExpression: 'recruiterId = :recruiterId',
        ExpressionAttributeValues: {
          ':recruiterId': recruiterId
        }
      });
      const result = await dynamoClient.send(scanCommand);
      allEmployees = result.Items || [];
    }

    const totalEmployees = allEmployees.length;
    const presentToday = todayAttendance.filter(att => 
      att.status === 'present' || att.status === 'late'
    ).length;
    const lateArrivals = todayAttendance.filter(att => att.status === 'late').length;
    const avgHours = todayAttendance.length > 0 
      ? todayAttendance.reduce((sum, att) => sum + (att.hours || 0), 0) / todayAttendance.length
      : 0;

    const stats = {
      totalEmployees,
      presentToday,
      absentToday: totalEmployees - presentToday,
      lateArrivals,
      attendanceRate: totalEmployees > 0 ? (presentToday / totalEmployees * 100).toFixed(1) : 0,
      avgHours: avgHours.toFixed(1)
    };

    res.json(successResponse(stats, 'Attendance statistics retrieved successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const syncFromBridge = async (req, res) => {
  // Placeholder for bridge sync - not used in production
  res.json({ success: true, message: 'Bridge pushes directly to /bridge-attendance' });
};

const getDeviceStatus = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    
    if (!companyId) {
      return res.json(successResponse({
        connected: false,
        lastSeen: null,
        error: 'Company ID not found'
      }, 'Device status retrieved'));
    }
    
    // Check if device sent heartbeat in last 30 seconds
    const lastHeartbeat = deviceHeartbeats.get(companyId);
    const isOnline = lastHeartbeat && (Date.now() - lastHeartbeat) < 30000;
    
    res.json(successResponse({
      connected: isOnline,
      lastSeen: lastHeartbeat ? new Date(lastHeartbeat).toISOString() : null
    }, 'Device status retrieved'));
  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  markAttendance,
  getAttendanceByDate,
  getEmployeeAttendance,
  getAttendanceStats,
  syncFromBridge,
  getDeviceStatus,
  deviceHeartbeats
};