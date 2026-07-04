const { dynamoClient, isUsingMockDB, mockDB, HRMS_ATTENDANCE_TABLE, HRMS_EMPLOYEES_TABLE } = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, formatDate, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

// Table names
const MAPPINGS_TABLE = 'staffinn-hrms-employee-device-mappings';
const DEVICES_TABLE = 'staffinn-hrms-devices';

// Store device heartbeat in memory (in production, use Redis)
const deviceHeartbeats = new Map();

// ── Helper: derive weekly-off day names from workingDays array ──────────────
const ALL_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

/**
 * Given a date string 'YYYY-MM-DD', return the day name (e.g. 'Sunday')
 */
function getDayName(dateStr) {
  // Parse date parts to avoid timezone shift from new Date('YYYY-MM-DD')
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return ALL_DAYS[dt.getDay()];
}

/**
 * Return true if the given date is a weekly off for the employee.
 * workingDays defaults to Mon-Sat if not set.
 */
function isWeeklyOff(employee, dateStr) {
  const workingDays = Array.isArray(employee?.workingDays) && employee.workingDays.length > 0
    ? employee.workingDays
    : ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const dayName = getDayName(dateStr);
  return !workingDays.includes(dayName);
}

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
      
      // Calculate status based on employee shift timing
      const statusData = calculateAttendanceStatus(employee, { checkIn, checkOut });
      const status = statusData.status;
      
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
        isLate: statusData.isLate || false,
        lateByMinutes: statusData.lateByMinutes || 0,
        overtimeHours: statusData.overtimeHours || 0,
        expectedHours: statusData.expectedHours || 0,
        actualHours: statusData.actualHours || 0,
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
    
    // Broadcast real-time update via WebSocket
    try {
      const { emitAttendanceUpdate } = require('../../websocket/websocketServer');
      const recruiterId = req.user?.recruiterId || employee.recruiterId;
      if (recruiterId) {
        emitAttendanceUpdate(recruiterId, attendanceRecord);
        console.log(`📡 WebSocket broadcast sent to recruiter ${recruiterId}`);
      }
    } catch (wsError) {
      console.error('⚠️ WebSocket broadcast failed:', wsError.message);
      // Don't fail the request if WebSocket fails
    }
    
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

    // ── Fetch all employees for this recruiter ────────────────────────────
    let allEmployees = [];
    const empScan = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_EMPLOYEES_TABLE,
      FilterExpression: 'recruiterId = :rid AND (attribute_not_exists(isDeleted) OR isDeleted = :f)',
      ExpressionAttributeValues: { ':rid': recruiterId, ':f': false }
    }));
    allEmployees = empScan.Items || [];

    // Build lookup map: employeeId → employee
    const employeeMap = {};
    for (const emp of allEmployees) {
      employeeMap[emp.employeeId] = emp;
    }

    // ── Fetch attendance records for this date + recruiter ────────────────
    let attendanceRecords = [];
    const attScan = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_ATTENDANCE_TABLE,
      FilterExpression: '#date = :date AND recruiterId = :recruiterId',
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: { ':date': attendanceDate, ':recruiterId': recruiterId }
    }));
    attendanceRecords = attScan.Items || [];

    // Build attendance lookup: employeeId → record
    const attMap = {};
    for (const rec of attendanceRecords) {
      attMap[rec.employeeId] = rec;
    }

    // ── Merge: for every employee compute effective status ────────────────
    const enrichedAttendance = allEmployees.map(employee => {
      const att = attMap[employee.employeeId];
      const weeklyOff = isWeeklyOff(employee, attendanceDate);

      if (att) {
        // Attendance record exists — attach employee info
        return { ...att, employee, weeklyOff };
      }

      // No record — determine virtual status
      const virtualStatus = weeklyOff ? 'week-off' : 'absent';
      return {
        attendanceId:   null,
        employeeId:     employee.employeeId,
        date:           attendanceDate,
        checkIn:        null,
        checkOut:       null,
        hours:          0,
        status:         virtualStatus,
        isLate:         false,
        lateByMinutes:  0,
        overtimeHours:  0,
        expectedHours:  0,
        actualHours:    0,
        source:         'virtual',
        recruiterId,
        employee,
        weeklyOff
      };
    });

    res.json(successResponse(enrichedAttendance, 'Attendance retrieved successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const recruiterId = req.user?.recruiterId;

    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }
    if (!employeeId || typeof employeeId !== 'string' || employeeId.trim() === '') {
      return res.status(400).json(errorResponse('Valid employeeId is required'));
    }

    // Default: last 7 days; allow custom range via query params
    const today = formatDate(new Date());
    const defaultStart = formatDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000));
    const startDate = req.query.startDate || defaultStart;
    const endDate   = req.query.endDate   || today;

    // Basic date validation
    if (startDate > endDate) {
      return res.status(400).json(errorResponse('startDate must be ≤ endDate'));
    }
    // Cap range at 365 days to prevent runaway scans
    const msRange = new Date(endDate) - new Date(startDate);
    if (msRange > 365 * 24 * 60 * 60 * 1000) {
      return res.status(400).json(errorResponse('Date range cannot exceed 365 days'));
    }

    // ── Fetch employee (validate ownership) ──────────────────────────────
    const empResult = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_EMPLOYEES_TABLE,
      FilterExpression: 'employeeId = :eid AND recruiterId = :rid',
      ExpressionAttributeValues: { ':eid': employeeId, ':rid': recruiterId }
    }));
    if (!empResult.Items || empResult.Items.length === 0) {
      return res.status(404).json(errorResponse('Employee not found'));
    }
    const employee = empResult.Items[0];

    // ── Fetch attendance records ──────────────────────────────────────────
    const attResult = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_ATTENDANCE_TABLE,
      FilterExpression: 'employeeId = :eid AND recruiterId = :rid AND #date BETWEEN :s AND :e',
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: {
        ':eid':  employeeId,
        ':rid':  recruiterId,
        ':s':    startDate,
        ':e':    endDate
      }
    }));
    const attendanceRecords = attResult.Items || [];

    // Build lookup: date → record
    const attByDate = {};
    for (const rec of attendanceRecords) {
      attByDate[rec.date] = rec;
    }

    // ── Build one row per calendar day in range ───────────────────────────
    const results = [];
    const current = new Date(startDate);
    const end     = new Date(endDate);

    while (current <= end) {
      const dateStr    = formatDate(current);
      const att        = attByDate[dateStr];
      const weeklyOff  = isWeeklyOff(employee, dateStr);

      if (att) {
        results.push({ ...att, weeklyOff, employee });
      } else {
        // Virtual row: week-off or absent
        results.push({
          attendanceId:  null,
          employeeId,
          date:          dateStr,
          checkIn:       null,
          checkOut:      null,
          hours:         0,
          status:        weeklyOff ? 'week-off' : 'absent',
          isLate:        false,
          lateByMinutes: 0,
          overtimeHours: 0,
          expectedHours: 0,
          actualHours:   0,
          source:        'virtual',
          recruiterId,
          weeklyOff,
          employee
        });
      }
      current.setDate(current.getDate() + 1);
    }

    // Sort newest first
    results.sort((a, b) => b.date.localeCompare(a.date));

    res.json(successResponse({
      employee,
      startDate,
      endDate,
      records: results
    }, 'Employee attendance retrieved successfully'));

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
    const recruiterId = req.user?.recruiterId;
    
    if (!recruiterId) {
      return res.json(successResponse({
        connected: false,
        lastSeen: null,
        error: 'Recruiter ID not found'
      }, 'Device status retrieved'));
    }
    
    // Get companyId from recruiterId
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
    
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
    const docClient = DynamoDBDocumentClient.from(client);
    const COMPANIES_TABLE = 'staffinn-hrms-companies';
    
    // Query companies table using recruiterId GSI
    const queryResult = await docClient.send(new QueryCommand({
      TableName: COMPANIES_TABLE,
      IndexName: 'recruiterId-index',
      KeyConditionExpression: 'recruiterId = :recruiterId',
      ExpressionAttributeValues: {
        ':recruiterId': recruiterId
      },
      Limit: 1
    }));
    
    if (!queryResult.Items || queryResult.Items.length === 0) {
      return res.json(successResponse({
        connected: false,
        lastSeen: null,
        error: 'Company not found for recruiter'
      }, 'Device status retrieved'));
    }
    
    const companyId = queryResult.Items[0].companyId;
    
    // Check if device sent heartbeat in last 30 seconds
    const lastHeartbeat = deviceHeartbeats.get(companyId);
    const isOnline = lastHeartbeat && (Date.now() - lastHeartbeat) < 30000;
    
    res.json(successResponse({
      connected: isOnline,
      lastSeen: lastHeartbeat ? new Date(lastHeartbeat).toISOString() : null,
      companyId: companyId
    }, 'Device status retrieved'));
  } catch (error) {
    console.error('Error getting device status:', error);
    handleError(error, res);
  }
};

// Enhanced status calculation — policy-driven
// Late arrival policy: check against leaveSettings grace period (default 15 min)
// If late AND hours worked < 50% of shift → half-day
// If late AND hours > 50% → 'late' (half-day deduction applied at payroll level)
function calculateAttendanceStatus(employee, attendance, gracePeriodMinutes = 15) {
  const shiftStart = employee.checkInTime || '09:00';
  const shiftEnd   = employee.checkOutTime || '18:00';
  const actualCheckIn  = attendance.checkIn;
  const actualCheckOut = attendance.checkOut;

  const timeToMinutes = (time) => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const shiftStartMin = timeToMinutes(shiftStart);
  const shiftEndMin   = timeToMinutes(shiftEnd);
  const checkInMin    = timeToMinutes(actualCheckIn);
  const expectedHours = (shiftEndMin - shiftStartMin) / 60;

  let actualHours   = 0;
  let overtimeHours = 0;
  let status        = 'present';

  // Calculate actual hours if checkout exists
  if (actualCheckOut) {
    const checkOutMin = timeToMinutes(actualCheckOut);
    actualHours = Math.max(0, (checkOutMin - checkInMin) / 60);

    // Overtime: hours beyond full shift
    if (actualHours > expectedHours) {
      overtimeHours = actualHours - expectedHours;
    }

    // Half-day: worked less than 50% of expected hours
    if (actualHours < expectedHours / 2) {
      status = 'half-day';
    }
  }

  // Late arrival check (configurable grace period)
  const isLate = checkInMin > shiftStartMin + gracePeriodMinutes;
  if (isLate) {
    if (status === 'present') {
      // Policy: late arrival → mark as 'late' (payroll deducts half-day for late records)
      status = 'late';
    }
    // If already 'half-day' (worked < 50%), keep half-day — it's the more severe status
  }

  return {
    status,
    isLate,
    lateByMinutes: isLate ? checkInMin - (shiftStartMin + gracePeriodMinutes) : 0,
    overtimeHours:  parseFloat(overtimeHours.toFixed(2)),
    actualHours:    parseFloat(actualHours.toFixed(2)),
    expectedHours:  parseFloat(expectedHours.toFixed(2))
  };
}

// Employee-Device Mapping Functions
const createMapping = async (req, res) => {
  try {
    const { employeeId, deviceUserId, deviceId } = req.body;
    const recruiterId = req.user?.recruiterId;
    
    if (!employeeId || !deviceUserId) {
      return res.status(400).json(errorResponse('Employee ID and Device User ID are required'));
    }
    
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }
    
    // Check if employee exists
    const getCommand = new GetCommand({
      TableName: HRMS_EMPLOYEES_TABLE,
      Key: { employeeId }
    });
    const empResult = await dynamoClient.send(getCommand);
    
    if (!empResult.Item) {
      return res.status(404).json(errorResponse('Employee not found'));
    }
    
    // Check if mapping already exists
    const scanCommand = new ScanCommand({
      TableName: MAPPINGS_TABLE,
      FilterExpression: 'employeeId = :empId OR deviceUserId = :devUserId',
      ExpressionAttributeValues: {
        ':empId': employeeId,
        ':devUserId': deviceUserId
      }
    });
    const existingResult = await dynamoClient.send(scanCommand);
    
    if (existingResult.Items && existingResult.Items.length > 0) {
      return res.status(400).json(errorResponse('Mapping already exists for this employee or device user ID'));
    }
    
    // Create mapping
    const mappingId = generateId();
    const mapping = {
      mappingId,
      employeeId,
      deviceUserId,
      deviceId: deviceId || null,
      recruiterId,
      createdAt: getCurrentTimestamp()
    };
    
    const putCommand = new PutCommand({
      TableName: MAPPINGS_TABLE,
      Item: mapping
    });
    await dynamoClient.send(putCommand);
    
    console.log('✅ Mapping created:', mapping);
    res.status(201).json(successResponse(mapping, 'Mapping created successfully'));
    
  } catch (error) {
    console.error('Error creating mapping:', error);
    handleError(error, res);
  }
};

const getMappings = async (req, res) => {
  try {
    const { deviceUserId, employeeId } = req.query;
    const recruiterId = req.user?.recruiterId;
    
    if (!recruiterId && !deviceUserId && !employeeId) {
      return res.status(400).json(errorResponse('Recruiter ID, Device User ID, or Employee ID required'));
    }
    
    let filterExpression = '';
    let expressionAttributeValues = {};
    
    if (deviceUserId) {
      filterExpression = 'deviceUserId = :devUserId';
      expressionAttributeValues[':devUserId'] = deviceUserId;
    } else if (employeeId) {
      filterExpression = 'employeeId = :empId';
      expressionAttributeValues[':empId'] = employeeId;
    } else if (recruiterId) {
      filterExpression = 'recruiterId = :recId';
      expressionAttributeValues[':recId'] = recruiterId;
    }
    
    const scanCommand = new ScanCommand({
      TableName: MAPPINGS_TABLE,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues
    });
    
    const result = await dynamoClient.send(scanCommand);
    const mappings = result.Items || [];
    
    // If single deviceUserId query, return just the employeeId
    if (deviceUserId && mappings.length > 0) {
      return res.json(successResponse({ employeeId: mappings[0].employeeId }, 'Mapping found'));
    }
    
    res.json(successResponse(mappings, 'Mappings retrieved successfully'));
    
  } catch (error) {
    console.error('Error getting mappings:', error);
    handleError(error, res);
  }
};

const deleteMapping = async (req, res) => {
  try {
    const { mappingId } = req.params;
    
    const deleteCommand = new DeleteCommand({
      TableName: MAPPINGS_TABLE,
      Key: { mappingId }
    });
    
    await dynamoClient.send(deleteCommand);
    
    res.json(successResponse(null, 'Mapping deleted successfully'));
    
  } catch (error) {
    console.error('Error deleting mapping:', error);
    handleError(error, res);
  }
};

// Device Management Functions
const registerDevice = async (req, res) => {
  try {
    const { deviceName, deviceType, ipAddress, port, location } = req.body;
    const recruiterId = req.user?.recruiterId;
    
    if (!deviceName || !ipAddress) {
      return res.status(400).json(errorResponse('Device name and IP address are required'));
    }
    
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }
    
    const deviceId = generateId();
    const device = {
      deviceId,
      deviceName,
      deviceType: deviceType || 'Biometric Device',
      ipAddress,
      port: port || 5005,
      location: location || '',
      recruiterId,
      isActive: true,
      lastSyncTime: null,
      createdAt: getCurrentTimestamp()
    };
    
    const putCommand = new PutCommand({
      TableName: DEVICES_TABLE,
      Item: device
    });
    await dynamoClient.send(putCommand);
    
    console.log('✅ Device registered:', device);
    res.status(201).json(successResponse(device, 'Device registered successfully'));
    
  } catch (error) {
    console.error('Error registering device:', error);
    handleError(error, res);
  }
};

const getDevices = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }
    
    const scanCommand = new ScanCommand({
      TableName: DEVICES_TABLE,
      FilterExpression: 'recruiterId = :recId',
      ExpressionAttributeValues: {
        ':recId': recruiterId
      }
    });
    
    const result = await dynamoClient.send(scanCommand);
    const devices = result.Items || [];
    
    res.json(successResponse(devices, 'Devices retrieved successfully'));
    
  } catch (error) {
    console.error('Error getting devices:', error);
    handleError(error, res);
  }
};

const updateDeviceSync = async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const updateCommand = new UpdateCommand({
      TableName: DEVICES_TABLE,
      Key: { deviceId },
      UpdateExpression: 'SET lastSyncTime = :time',
      ExpressionAttributeValues: {
        ':time': getCurrentTimestamp()
      },
      ReturnValues: 'ALL_NEW'
    });
    
    const result = await dynamoClient.send(updateCommand);
    
    res.json(successResponse(result.Attributes, 'Device sync time updated'));
    
  } catch (error) {
    console.error('Error updating device sync:', error);
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
  deviceHeartbeats,
  // Mapping functions
  createMapping,
  getMappings,
  deleteMapping,
  // Device functions
  registerDevice,
  getDevices,
  updateDeviceSync,
  // Helpers
  calculateAttendanceStatus,
  isWeeklyOff,
  getDayName
};