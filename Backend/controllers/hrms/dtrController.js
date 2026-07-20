/**
 * Daily Task Report (DTR) Controller
 * Handles CRUD for daily task reports submitted by employees after checkout.
 * 
 * Business Rules:
 * - Employee MUST submit DTR within 30 minutes of checkout
 * - If DTR is not submitted, attendance is marked ABSENT for that day
 * - DTR is linked to assigned tasks
 * - HR/Admin can view all DTR reports for any employee
 * - Real-time notifications are sent to remind employees
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');
const awsConfig = require('../../config/aws');

const client = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client(awsConfig);

const DTR_TABLE = 'staffinn-hrms-daily-task-reports';
const TASK_TABLE = 'HRMS-Task-Management';
const ATTENDANCE_TABLE = 'staffinn-hrms-attendance';
const EMPLOYEES_TABLE = 'staffinn-hrms-employees';
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'staffinn-files';

// Notification service
const notificationService = require('../../services/hrmsNotificationService');

/**
 * Submit a Daily Task Report (Employee)
 * POST /api/v1/employee/dtr
 */
const submitDTR = async (req, res) => {
  try {
    const { employeeId, companyId, email } = req.user;
    const {
      taskId,
      date,
      workDescription,
      hoursSpent,
      completionPercentage,
      status,
      challengesFaced,
      plannedForTomorrow,
      remarks
    } = req.body;

    // Validate required fields
    if (!taskId || !date || !workDescription || hoursSpent === undefined || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: taskId, date, workDescription, hoursSpent, status'
      });
    }

    // Validate hoursSpent
    if (hoursSpent < 0 || hoursSpent > 24) {
      return res.status(400).json({
        success: false,
        message: 'Hours spent must be between 0 and 24'
      });
    }

    // Validate completionPercentage
    if (completionPercentage !== undefined && (completionPercentage < 0 || completionPercentage > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Completion percentage must be between 0 and 100'
      });
    }

    // Validate status
    const validStatuses = ['In Progress', 'Completed', 'Blocked', 'On Hold'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Verify the task exists and belongs to this employee
    const taskResult = await docClient.send(new ScanCommand({
      TableName: TASK_TABLE,
      FilterExpression: 'taskId = :tid AND (employeeId = :eid OR employeeEmail = :email)',
      ExpressionAttributeValues: {
        ':tid': taskId,
        ':eid': employeeId,
        ':email': email
      }
    }));

    if (!taskResult.Items || taskResult.Items.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to you'
      });
    }

    const task = taskResult.Items[0];

    // Check if DTR already submitted for this task on this date
    const existingDTR = await docClient.send(new QueryCommand({
      TableName: DTR_TABLE,
      IndexName: 'taskId-date-index',
      KeyConditionExpression: 'taskId = :tid AND #date = :date',
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: { ':tid': taskId, ':date': date }
    }));

    const existingForEmployee = (existingDTR.Items || []).find(d => d.employeeId === employeeId);
    if (existingForEmployee) {
      return res.status(409).json({
        success: false,
        message: 'DTR already submitted for this task on this date. Use update API instead.',
        data: existingForEmployee
      });
    }

    // Check if submission is late (more than 30 mins after checkout)
    let isLate = false;
    const attendanceId = `${employeeId}_${date}`;
    try {
      const attResult = await docClient.send(new GetCommand({
        TableName: ATTENDANCE_TABLE,
        Key: { attendanceId }
      }));
      if (attResult.Item && attResult.Item.checkOutTime) {
        const checkoutTime = new Date(attResult.Item.checkOutTime).getTime();
        const now = Date.now();
        const diffMinutes = (now - checkoutTime) / (1000 * 60);
        isLate = diffMinutes > 30;
      }
    } catch (err) {
      console.error('Error checking attendance for late DTR:', err.message);
    }

    // Create DTR record
    const reportId = `DTR_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const dtrRecord = {
      reportId,
      employeeId,
      recruiterId: companyId,
      taskId,
      taskTitle: task.title || '',
      date,
      workDescription,
      hoursSpent: parseFloat(hoursSpent),
      completionPercentage: completionPercentage !== undefined ? parseInt(completionPercentage) : null,
      status,
      challengesFaced: challengesFaced || '',
      plannedForTomorrow: plannedForTomorrow || '',
      category: task.taskCategory || task.category || '',
      priority: task.priority || 'Medium',
      attachmentUrl: '',
      attachmentFileName: '',
      remarks: remarks || '',
      submittedAt: now,
      isLate,
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: DTR_TABLE,
      Item: dtrRecord
    }));

    // Update task completion percentage if provided
    if (completionPercentage !== undefined) {
      try {
        await docClient.send(new UpdateCommand({
          TableName: TASK_TABLE,
          Key: { taskId },
          UpdateExpression: 'SET completionPercentage = :cp, updatedAt = :now',
          ExpressionAttributeValues: {
            ':cp': parseInt(completionPercentage),
            ':now': now
          }
        }));
      } catch (err) {
        console.error('Error updating task completion:', err.message);
      }
    }

    console.log(`✅ DTR submitted: ${reportId} by employee ${employeeId} for task ${taskId} on ${date} (late: ${isLate})`);

    res.status(201).json({
      success: true,
      message: isLate
        ? 'DTR submitted successfully (Late submission - submitted after 30 minutes of checkout)'
        : 'DTR submitted successfully',
      data: dtrRecord
    });
  } catch (error) {
    console.error('❌ Submit DTR error:', error);
    res.status(500).json({ success: false, message: 'Server error while submitting DTR' });
  }
};

/**
 * Update an existing DTR (Employee - same day only)
 * PUT /api/v1/employee/dtr/:reportId
 */
const updateDTR = async (req, res) => {
  try {
    const { employeeId } = req.user;
    const { reportId } = req.params;
    const {
      workDescription,
      hoursSpent,
      completionPercentage,
      status,
      challengesFaced,
      plannedForTomorrow,
      remarks
    } = req.body;

    // Get existing DTR
    const getResult = await docClient.send(new ScanCommand({
      TableName: DTR_TABLE,
      FilterExpression: 'reportId = :rid',
      ExpressionAttributeValues: { ':rid': reportId }
    }));

    if (!getResult.Items || getResult.Items.length === 0) {
      return res.status(404).json({ success: false, message: 'DTR report not found' });
    }

    const existing = getResult.Items[0];

    // Verify ownership
    if (existing.employeeId !== employeeId) {
      return res.status(403).json({ success: false, message: 'Unauthorized: This DTR does not belong to you' });
    }

    // Only allow updates on same day
    const today = new Date().toISOString().split('T')[0];
    if (existing.date !== today) {
      return res.status(403).json({ success: false, message: 'Cannot update DTR for past dates' });
    }

    const now = new Date().toISOString();
    const updatedRecord = {
      ...existing,
      workDescription: workDescription || existing.workDescription,
      hoursSpent: hoursSpent !== undefined ? parseFloat(hoursSpent) : existing.hoursSpent,
      completionPercentage: completionPercentage !== undefined ? parseInt(completionPercentage) : existing.completionPercentage,
      status: status || existing.status,
      challengesFaced: challengesFaced !== undefined ? challengesFaced : existing.challengesFaced,
      plannedForTomorrow: plannedForTomorrow !== undefined ? plannedForTomorrow : existing.plannedForTomorrow,
      remarks: remarks !== undefined ? remarks : existing.remarks,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: DTR_TABLE,
      Item: updatedRecord
    }));

    // Update task completion if changed
    if (completionPercentage !== undefined) {
      try {
        await docClient.send(new UpdateCommand({
          TableName: TASK_TABLE,
          Key: { taskId: existing.taskId },
          UpdateExpression: 'SET completionPercentage = :cp, updatedAt = :now',
          ExpressionAttributeValues: { ':cp': parseInt(completionPercentage), ':now': now }
        }));
      } catch (err) {
        console.error('Error updating task completion:', err.message);
      }
    }

    res.json({ success: true, message: 'DTR updated successfully', data: updatedRecord });
  } catch (error) {
    console.error('❌ Update DTR error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating DTR' });
  }
};

/**
 * Get my DTRs for a specific date (Employee)
 * GET /api/v1/employee/dtr?date=YYYY-MM-DD
 */
const getMyDTRs = async (req, res) => {
  try {
    const { employeeId } = req.user;
    const { date, taskId } = req.query;

    let filterExpression = 'employeeId = :eid';
    const expressionValues = { ':eid': employeeId };

    if (date) {
      filterExpression += ' AND #date = :date';
      expressionValues[':date'] = date;
    }
    if (taskId) {
      filterExpression += ' AND taskId = :tid';
      expressionValues[':tid'] = taskId;
    }

    const result = await docClient.send(new ScanCommand({
      TableName: DTR_TABLE,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: date ? { '#date': 'date' } : undefined,
      ExpressionAttributeValues: expressionValues
    }));

    const dtrs = (result.Items || []).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({ success: true, data: dtrs });
  } catch (error) {
    console.error('❌ Get DTRs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get DTR submission status for today (Employee)
 * Returns which tasks have DTR submitted and which are pending
 * GET /api/v1/employee/dtr/status
 */
const getDTRStatus = async (req, res) => {
  try {
    const { employeeId, companyId, email } = req.user;
    const today = new Date().toISOString().split('T')[0];

    // Get all active tasks for this employee
    const taskResult = await docClient.send(new ScanCommand({
      TableName: TASK_TABLE,
      FilterExpression: 'recruiterId = :rid AND (employeeId = :eid OR employeeEmail = :email) AND (#status <> :completed)',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':rid': companyId,
        ':eid': employeeId,
        ':email': email,
        ':completed': 'Completed'
      }
    }));

    const activeTasks = (taskResult.Items || []).filter(t => !t.type || t.type !== 'RATING');

    // Get today's DTRs
    const dtrResult = await docClient.send(new QueryCommand({
      TableName: DTR_TABLE,
      IndexName: 'employeeId-date-index',
      KeyConditionExpression: 'employeeId = :eid AND #date = :date',
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: { ':eid': employeeId, ':date': today }
    }));

    const submittedTaskIds = (dtrResult.Items || []).map(d => d.taskId);

    // Check attendance status
    const attendanceId = `${employeeId}_${today}`;
    let hasCheckedOut = false;
    let checkOutTime = null;
    try {
      const attResult = await docClient.send(new GetCommand({
        TableName: ATTENDANCE_TABLE,
        Key: { attendanceId }
      }));
      if (attResult.Item && attResult.Item.checkOutTime) {
        hasCheckedOut = true;
        checkOutTime = attResult.Item.checkOutTime;
      }
    } catch (err) {
      console.error('Error fetching attendance:', err.message);
    }

    // Calculate time remaining (30 min window after checkout)
    let timeRemainingMinutes = null;
    let isWindowExpired = false;
    if (hasCheckedOut && checkOutTime) {
      const checkoutMs = new Date(checkOutTime).getTime();
      const elapsed = (Date.now() - checkoutMs) / (1000 * 60);
      timeRemainingMinutes = Math.max(0, 30 - elapsed);
      isWindowExpired = elapsed > 30;
    }

    const pendingTasks = activeTasks.filter(t => !submittedTaskIds.includes(t.taskId));
    const submittedTasks = activeTasks.filter(t => submittedTaskIds.includes(t.taskId));

    res.json({
      success: true,
      data: {
        date: today,
        hasCheckedOut,
        checkOutTime,
        timeRemainingMinutes: timeRemainingMinutes !== null ? Math.round(timeRemainingMinutes) : null,
        isWindowExpired,
        totalActiveTasks: activeTasks.length,
        submittedCount: submittedTasks.length,
        pendingCount: pendingTasks.length,
        pendingTasks: pendingTasks.map(t => ({
          taskId: t.taskId,
          title: t.title,
          priority: t.priority,
          deadline: t.deadline,
          category: t.taskCategory || t.category,
          status: t.status
        })),
        submittedTasks: submittedTasks.map(t => ({
          taskId: t.taskId,
          title: t.title
        }))
      }
    });
  } catch (error) {
    console.error('❌ Get DTR status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Upload attachment for DTR (Employee)
 * POST /api/v1/employee/dtr/:reportId/upload
 */
const uploadDTRAttachment = async (req, res) => {
  try {
    const { employeeId } = req.user;
    const { reportId } = req.params;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Verify DTR ownership
    const getResult = await docClient.send(new ScanCommand({
      TableName: DTR_TABLE,
      FilterExpression: 'reportId = :rid AND employeeId = :eid',
      ExpressionAttributeValues: { ':rid': reportId, ':eid': employeeId }
    }));

    if (!getResult.Items || getResult.Items.length === 0) {
      return res.status(404).json({ success: false, message: 'DTR not found or unauthorized' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const s3Key = `hrms/dtr/${employeeId}/${reportId}/${uniqueName}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        uploadedBy: employeeId,
        reportId,
        originalName: Buffer.from(req.file.originalname).toString('base64').substring(0, 200)
      }
    }));

    const region = awsConfig.region || process.env.AWS_REGION || 'ap-south-1';
    const url = `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${s3Key}`;

    // Update DTR with attachment URL
    await docClient.send(new UpdateCommand({
      TableName: DTR_TABLE,
      Key: { reportId },
      UpdateExpression: 'SET attachmentUrl = :url, attachmentFileName = :fname, updatedAt = :now',
      ExpressionAttributeValues: {
        ':url': url,
        ':fname': req.file.originalname,
        ':now': new Date().toISOString()
      }
    }));

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: { url, fileName: req.file.originalname, size: req.file.size }
    });
  } catch (error) {
    console.error('❌ DTR upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

/**
 * Get DTR reports for HR/Admin
 * GET /api/v1/hrms/dtr/reports
 * Query params: employeeId, date, startDate, endDate, taskId
 */
const getDTRReports = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) {
      return res.status(400).json({ success: false, message: 'Recruiter ID not found' });
    }

    const { employeeId, date, startDate, endDate, taskId } = req.query;

    let filterExpression = 'recruiterId = :rid';
    const expressionValues = { ':rid': recruiterId };
    const expressionNames = {};

    if (employeeId) {
      filterExpression += ' AND employeeId = :eid';
      expressionValues[':eid'] = employeeId;
    }
    if (date) {
      filterExpression += ' AND #date = :date';
      expressionValues[':date'] = date;
      expressionNames['#date'] = 'date';
    }
    if (taskId) {
      filterExpression += ' AND taskId = :tid';
      expressionValues[':tid'] = taskId;
    }

    const params = {
      TableName: DTR_TABLE,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionValues
    };
    if (Object.keys(expressionNames).length > 0) {
      params.ExpressionAttributeNames = expressionNames;
    }

    const result = await docClient.send(new ScanCommand(params));
    let reports = result.Items || [];

    // Date range filtering (if startDate/endDate provided)
    if (startDate) {
      reports = reports.filter(r => r.date >= startDate);
    }
    if (endDate) {
      reports = reports.filter(r => r.date <= endDate);
    }

    // Sort by date descending, then by submittedAt descending
    reports.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    res.json({ success: true, data: reports, count: reports.length });
  } catch (error) {
    console.error('❌ Get DTR reports error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get DTR summary/stats for HR/Admin
 * GET /api/v1/hrms/dtr/stats
 * Shows: total reports, on-time %, late %, missing reports, etc.
 */
const getDTRStats = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) {
      return res.status(400).json({ success: false, message: 'Recruiter ID not found' });
    }

    const { date, startDate, endDate } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get all DTRs for this recruiter
    let filterExpression = 'recruiterId = :rid';
    const expressionValues = { ':rid': recruiterId };

    if (date) {
      filterExpression += ' AND #date = :date';
      expressionValues[':date'] = date;
    }

    const params = {
      TableName: DTR_TABLE,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionValues
    };
    if (date) {
      params.ExpressionAttributeNames = { '#date': 'date' };
    }

    const result = await docClient.send(new ScanCommand(params));
    let reports = result.Items || [];

    if (startDate) reports = reports.filter(r => r.date >= startDate);
    if (endDate) reports = reports.filter(r => r.date <= endDate);

    const totalReports = reports.length;
    const onTimeReports = reports.filter(r => !r.isLate).length;
    const lateReports = reports.filter(r => r.isLate).length;

    // Get unique employees who submitted
    const uniqueEmployees = [...new Set(reports.map(r => r.employeeId))];

    // Status breakdown
    const statusBreakdown = {
      'In Progress': reports.filter(r => r.status === 'In Progress').length,
      'Completed': reports.filter(r => r.status === 'Completed').length,
      'Blocked': reports.filter(r => r.status === 'Blocked').length,
      'On Hold': reports.filter(r => r.status === 'On Hold').length
    };

    // Average hours per report
    const avgHours = totalReports > 0
      ? (reports.reduce((sum, r) => sum + (r.hoursSpent || 0), 0) / totalReports).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalReports,
        onTimeReports,
        lateReports,
        onTimePercentage: totalReports > 0 ? ((onTimeReports / totalReports) * 100).toFixed(1) : 0,
        uniqueEmployeesSubmitted: uniqueEmployees.length,
        statusBreakdown,
        averageHoursPerReport: parseFloat(avgHours),
        dateRange: { startDate: startDate || targetDate, endDate: endDate || targetDate }
      }
    });
  } catch (error) {
    console.error('❌ Get DTR stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get employee DTR history for a specific task (HR/Admin)
 * GET /api/v1/hrms/dtr/task/:taskId
 */
const getDTRByTask = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    const { taskId } = req.params;

    const result = await docClient.send(new QueryCommand({
      TableName: DTR_TABLE,
      IndexName: 'taskId-date-index',
      KeyConditionExpression: 'taskId = :tid',
      ExpressionAttributeValues: { ':tid': taskId },
      ScanIndexForward: false
    }));

    const reports = (result.Items || []).filter(r => r.recruiterId === recruiterId);

    res.json({ success: true, data: reports, count: reports.length });
  } catch (error) {
    console.error('❌ Get DTR by task error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get employee-wise DTR summary (HR/Admin)
 * GET /api/v1/hrms/dtr/employee/:employeeId
 */
const getEmployeeDTRHistory = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const result = await docClient.send(new QueryCommand({
      TableName: DTR_TABLE,
      IndexName: 'employeeId-date-index',
      KeyConditionExpression: 'employeeId = :eid',
      ExpressionAttributeValues: { ':eid': employeeId },
      ScanIndexForward: false
    }));

    let reports = (result.Items || []).filter(r => r.recruiterId === recruiterId);

    if (startDate) reports = reports.filter(r => r.date >= startDate);
    if (endDate) reports = reports.filter(r => r.date <= endDate);

    // Summary
    const totalReports = reports.length;
    const onTime = reports.filter(r => !r.isLate).length;
    const late = reports.filter(r => r.isLate).length;
    const totalHours = reports.reduce((sum, r) => sum + (r.hoursSpent || 0), 0);
    const uniqueTasks = [...new Set(reports.map(r => r.taskId))].length;

    res.json({
      success: true,
      data: {
        summary: {
          totalReports,
          onTimeSubmissions: onTime,
          lateSubmissions: late,
          totalHoursLogged: totalHours.toFixed(1),
          uniqueTasksWorkedOn: uniqueTasks,
          complianceRate: totalReports > 0 ? ((onTime / totalReports) * 100).toFixed(1) : 0
        },
        reports
      }
    });
  } catch (error) {
    console.error('❌ Get employee DTR history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Check and mark absent for employees who missed DTR (Scheduled/Cron)
 * This should be called by a scheduled job (e.g., every night at 11:59 PM)
 * POST /api/v1/hrms/dtr/check-compliance
 */
const checkDTRCompliance = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    const { date } = req.body;
    const targetDate = date || new Date().toISOString().split('T')[0];

    console.log(`🔍 Checking DTR compliance for date: ${targetDate}`);

    // Get all employees who checked out today
    const attendanceResult = await docClient.send(new ScanCommand({
      TableName: ATTENDANCE_TABLE,
      FilterExpression: '#date = :date AND attribute_exists(checkOutTime) AND recruiterId = :rid',
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: { ':date': targetDate, ':rid': recruiterId }
    }));

    const checkedOutEmployees = attendanceResult.Items || [];

    // Get all DTRs for today
    const dtrResult = await docClient.send(new ScanCommand({
      TableName: DTR_TABLE,
      FilterExpression: '#date = :date AND recruiterId = :rid',
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: { ':date': targetDate, ':rid': recruiterId }
    }));

    const submittedEmployeeIds = [...new Set((dtrResult.Items || []).map(d => d.employeeId))];

    // Find employees who checked out but didn't submit any DTR
    const nonCompliantEmployees = checkedOutEmployees.filter(
      att => !submittedEmployeeIds.includes(att.employeeId)
    );

    let absentMarked = 0;

    for (const att of nonCompliantEmployees) {
      // Check if 30-min window has passed
      if (att.checkOutTime) {
        const checkoutTime = new Date(att.checkOutTime).getTime();
        const elapsed = (Date.now() - checkoutTime) / (1000 * 60);

        if (elapsed > 30) {
          // Mark attendance as absent
          try {
            await docClient.send(new UpdateCommand({
              TableName: ATTENDANCE_TABLE,
              Key: { attendanceId: att.attendanceId },
              UpdateExpression: 'SET #status = :absent, dtrMissed = :true',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: { ':absent': 'Absent', ':true': true }
            }));
            absentMarked++;

            // Send notification to employee about absent marking
            try {
              await notificationService.createNotification({
                employeeId: att.employeeId,
                recruiterId,
                type: 'ATTENDANCE_ALERT',
                title: 'Attendance Marked Absent - DTR Not Submitted',
                message: `Your attendance for ${targetDate} has been marked as ABSENT because you did not submit your Daily Task Report within 30 minutes of checkout.`,
                priority: 'URGENT'
              });
            } catch (notifErr) {
              console.error('Notification error:', notifErr.message);
            }

            console.log(`⚠️ Marked ABSENT for employee ${att.employeeId} - DTR not submitted`);
          } catch (updateErr) {
            console.error(`Error marking absent for ${att.employeeId}:`, updateErr.message);
          }
        }
      }
    }

    console.log(`✅ DTR compliance check done. ${absentMarked} employees marked absent.`);

    res.json({
      success: true,
      data: {
        date: targetDate,
        totalCheckedOut: checkedOutEmployees.length,
        totalSubmitted: submittedEmployeeIds.length,
        nonCompliant: nonCompliantEmployees.length,
        absentMarked
      }
    });
  } catch (error) {
    console.error('❌ DTR compliance check error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Send DTR reminder notification after checkout (called internally)
 * This is triggered when an employee checks out
 */
const sendDTRReminder = async (employeeId, recruiterId) => {
  try {
    await notificationService.createNotification({
      employeeId,
      recruiterId,
      type: 'ATTENDANCE_ALERT',
      title: 'Daily Task Report Reminder',
      message: 'You have checked out. Please submit your Daily Task Report (DTR) within 30 minutes. Failing to do so will mark your attendance as ABSENT for today.',
      priority: 'URGENT',
      actionUrl: '/dtr'
    });
    console.log(`📢 DTR reminder sent to employee ${employeeId}`);
  } catch (error) {
    console.error('❌ Error sending DTR reminder:', error.message);
  }
};

/**
 * Get missing DTR days for an employee (Employee self-check)
 * GET /api/v1/employee/dtr/missing
 */
const getMyMissingDTRs = async (req, res) => {
  try {
    const { employeeId, companyId } = req.user;
    const { month, year } = req.query;

    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Get attendance records for the month where employee was present
    const result = await docClient.send(new ScanCommand({
      TableName: ATTENDANCE_TABLE,
      FilterExpression: 'employeeId = :eid AND recruiterId = :rid',
      ExpressionAttributeValues: { ':eid': employeeId, ':rid': companyId }
    }));

    const attendanceRecords = (result.Items || []).filter(r => {
      if (!r.date) return false;
      const [y, m] = r.date.split('-').map(Number);
      return y === targetYear && m === targetMonth && r.checkOutTime;
    });

    // Get DTRs for this month
    const dtrResult = await docClient.send(new QueryCommand({
      TableName: DTR_TABLE,
      IndexName: 'employeeId-date-index',
      KeyConditionExpression: 'employeeId = :eid',
      ExpressionAttributeValues: { ':eid': employeeId }
    }));

    const dtrDates = [...new Set((dtrResult.Items || [])
      .filter(d => {
        const [y, m] = d.date.split('-').map(Number);
        return y === targetYear && m === targetMonth;
      })
      .map(d => d.date)
    )];

    // Find days where employee checked out but didn't submit DTR
    const missingDays = attendanceRecords
      .filter(att => !dtrDates.includes(att.date))
      .map(att => ({
        date: att.date,
        checkOutTime: att.checkOutTime,
        markedAbsent: att.dtrMissed || false
      }));

    res.json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        totalWorkingDays: attendanceRecords.length,
        dtrSubmittedDays: dtrDates.length,
        missingDays: missingDays.length,
        details: missingDays
      }
    });
  } catch (error) {
    console.error('❌ Get missing DTRs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  // Employee APIs
  submitDTR,
  updateDTR,
  getMyDTRs,
  getDTRStatus,
  uploadDTRAttachment,
  getMyMissingDTRs,
  // HR/Admin APIs
  getDTRReports,
  getDTRStats,
  getDTRByTask,
  getEmployeeDTRHistory,
  checkDTRCompliance,
  // Internal helper
  sendDTRReminder
};
