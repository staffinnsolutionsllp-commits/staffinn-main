const { dynamoClient, isUsingMockDB, mockDB, HRMS_EMPLOYEES_TABLE, HRMS_LEAVES_TABLE } = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');


// ==================== LEAVE STATS ====================
const getLeaveStats = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
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

    let leaves;
    if (isUsingMockDB()) {
      const allLeaves = mockDB().scan(HRMS_LEAVES_TABLE);
      leaves = allLeaves.filter(l => l.entityType === 'LEAVE' && employeeIds.has(l.employeeId));
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type',
        ExpressionAttributeValues: { ':type': 'LEAVE' }
      });
      const result = await dynamoClient.send(scanCommand);
      leaves = (result.Items || []).filter(l => employeeIds.has(l.employeeId));
    }

    const stats = {
      totalRequests: leaves.length,
      approved: leaves.filter(l => l.status === 'Approved').length,
      pending: leaves.filter(l => l.status === 'Pending').length,
      rejected: leaves.filter(l => l.status === 'Rejected').length
    };

    res.json(successResponse(stats, 'Leave stats retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

// ==================== GET LEAVES ====================
const getLeaves = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }

    const { year, department, status } = req.query;

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

    let leaves;
    if (isUsingMockDB()) {
      const allLeaves = mockDB().scan(HRMS_LEAVES_TABLE);
      leaves = allLeaves.filter(l => l.entityType === 'LEAVE' && employeeIds.has(l.employeeId));
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type',
        ExpressionAttributeValues: { ':type': 'LEAVE' }
      });
      const result = await dynamoClient.send(scanCommand);
      leaves = (result.Items || []).filter(l => employeeIds.has(l.employeeId));
    }

    if (department) {
      leaves = leaves.filter(l => l.department === department);
    }
    if (status) {
      leaves = leaves.filter(l => l.status === status);
    }
    if (year) {
      leaves = leaves.filter(l => new Date(l.startDate).getFullYear().toString() === year);
    }

    res.json(successResponse(leaves, 'Leaves retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

// ==================== GET LEAVE BY ID ====================
const getLeaveById = async (req, res) => {
  try {
    const { leaveId } = req.params;

    let leave;
    if (isUsingMockDB()) {
      leave = mockDB().get(HRMS_LEAVES_TABLE, leaveId);
    } else {
      const getCommand = new GetCommand({
        TableName: HRMS_LEAVES_TABLE,
        Key: { leaveId }
      });
      const result = await dynamoClient.send(getCommand);
      leave = result.Item;
    }

    if (!leave) {
      return res.status(404).json(errorResponse('Leave not found'));
    }

    res.json(successResponse(leave, 'Leave retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

// ==================== CREATE LEAVE ====================
const createLeave = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }

    const { employeeId, employeeName, department, leaveType, startDate, endDate, numberOfDays, reason } = req.body;

    if (!employeeId || !leaveType || !startDate || !endDate) {
      return res.status(400).json(errorResponse('Missing required fields'));
    }

    let employee;
    if (isUsingMockDB()) {
      employee = mockDB().get(HRMS_EMPLOYEES_TABLE, employeeId);
      if (employee && employee.recruiterId !== recruiterId) employee = null;
    } else {
      const getCommand = new GetCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        Key: { employeeId }
      });
      const result = await dynamoClient.send(getCommand);
      employee = result.Item;
      if (employee && employee.recruiterId !== recruiterId) employee = null;
    }

    if (!employee) {
      return res.status(404).json(errorResponse('Employee not found or not authorized'));
    }

    const leaveId = generateId();
    const leave = {
      leaveId,
      entityType: 'LEAVE',
      recruiterId,
      employeeId,
      employeeName,
      department,
      leaveType,
      startDate,
      endDate,
      numberOfDays: numberOfDays || 1,
      reason: reason || '',
      status: 'Pending',
      appliedOn: getCurrentTimestamp(),
      approvedBy: null,
      approvedOn: null,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_LEAVES_TABLE, leave);
    } else {
      const putCommand = new PutCommand({
        TableName: HRMS_LEAVES_TABLE,
        Item: leave
      });
      await dynamoClient.send(putCommand);
    }

    res.status(201).json(successResponse(leave, 'Leave created successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

// ==================== UPDATE LEAVE STATUS ====================
const updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { status, approvedBy } = req.body;

    if (!status) {
      return res.status(400).json(errorResponse('Status is required'));
    }

    let leave;
    if (isUsingMockDB()) {
      leave = mockDB().get(HRMS_LEAVES_TABLE, leaveId);
    } else {
      const getCommand = new GetCommand({
        TableName: HRMS_LEAVES_TABLE,
        Key: { leaveId }
      });
      const result = await dynamoClient.send(getCommand);
      leave = result.Item;
    }

    if (!leave) {
      return res.status(404).json(errorResponse('Leave not found'));
    }

    const updatedLeave = {
      ...leave,
      status,
      approvedBy: approvedBy || null,
      approvedOn: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_LEAVES_TABLE, updatedLeave);
    } else {
      const putCommand = new PutCommand({
        TableName: HRMS_LEAVES_TABLE,
        Item: updatedLeave
      });
      await dynamoClient.send(putCommand);
    }

    // If approved, deduct from balance
    if (status === 'Approved') {
      await deductLeaveBalance(leave.employeeId, leave.leaveType, parseFloat(leave.numberOfDays));
    }

    res.json(successResponse(updatedLeave, 'Leave status updated successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

// Helper function to deduct leave balance when leave is approved
const deductLeaveBalance = async (employeeId, leaveType, days) => {
  try {
    let balance;
    if (isUsingMockDB()) {
      const allBalances = mockDB().scan(HRMS_LEAVES_TABLE);
      balance = allBalances.find(b => 
        b.entityType === 'BALANCE' && b.employeeId === employeeId && b.leaveType === leaveType
      );
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type AND employeeId = :empId AND leaveType = :leaveType',
        ExpressionAttributeValues: {
          ':type': 'BALANCE',
          ':empId': employeeId,
          ':leaveType': leaveType
        }
      });
      const result = await dynamoClient.send(scanCommand);
      balance = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (balance) {
      const updatedBalance = {
        ...balance,
        used: (balance.used || 0) + days,
        remaining: (balance.remaining || 0) - days,
        updatedAt: getCurrentTimestamp()
      };

      if (isUsingMockDB()) {
        mockDB().put(HRMS_LEAVES_TABLE, updatedBalance);
      } else {
        const putCommand = new PutCommand({
          TableName: HRMS_LEAVES_TABLE,
          Item: updatedBalance
        });
        await dynamoClient.send(putCommand);
      }

      console.log(`Deducted ${days} days from ${leaveType} balance for employee ${employeeId}`);
    }
  } catch (error) {
    console.error('Error deducting leave balance:', error);
  }
};

// ==================== LEAVE RULES ====================
const getLeaveRules = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }

    let rules;
    if (isUsingMockDB()) {
      const allRules = mockDB().scan(HRMS_LEAVES_TABLE);
      rules = allRules.filter(r => r.entityType === 'RULE' && r.status !== 'Inactive' && r.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type AND #status <> :inactive AND recruiterId = :recruiterId',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':type': 'RULE',
          ':inactive': 'Inactive',
          ':recruiterId': recruiterId
        }
      });
      const result = await dynamoClient.send(scanCommand);
      rules = result.Items || [];
    }

    res.json(successResponse(rules, 'Leave rules retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const createLeaveRule = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    console.log('🔍 createLeaveRule - req.user:', req.user);
    console.log('🔍 Using recruiterId:', recruiterId);
    
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }

    const ruleData = req.body;
    const leaveId = generateId();
    const ruleId = generateId();

    const rule = {
      leaveId,
      ruleId,
      entityType: 'RULE',
      recruiterId,
      ...ruleData,
      status: 'Active',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_LEAVES_TABLE, rule);
    } else {
      const putCommand = new PutCommand({
        TableName: HRMS_LEAVES_TABLE,
        Item: rule
      });
      await dynamoClient.send(putCommand);
    }

    res.status(201).json(successResponse(rule, 'Leave rule created successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const updateLeaveRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const ruleData = req.body;

    let existingRule;
    if (isUsingMockDB()) {
      const allRules = mockDB().scan(HRMS_LEAVES_TABLE);
      existingRule = allRules.find(r => r.ruleId === ruleId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'ruleId = :ruleId',
        ExpressionAttributeValues: { ':ruleId': ruleId }
      });
      const result = await dynamoClient.send(scanCommand);
      existingRule = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (!existingRule) {
      return res.status(404).json(errorResponse('Rule not found'));
    }

    const updatedRule = {
      ...existingRule,
      ...ruleData,
      updatedAt: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_LEAVES_TABLE, updatedRule);
    } else {
      const putCommand = new PutCommand({
        TableName: HRMS_LEAVES_TABLE,
        Item: updatedRule
      });
      await dynamoClient.send(putCommand);
    }

    res.json(successResponse(updatedRule, 'Leave rule updated successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const deactivateLeaveRule = async (req, res) => {
  try {
    const { ruleId } = req.params;

    let existingRule;
    if (isUsingMockDB()) {
      const allRules = mockDB().scan(HRMS_LEAVES_TABLE);
      existingRule = allRules.find(r => r.ruleId === ruleId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'ruleId = :ruleId',
        ExpressionAttributeValues: { ':ruleId': ruleId }
      });
      const result = await dynamoClient.send(scanCommand);
      existingRule = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (!existingRule) {
      return res.status(404).json(errorResponse('Rule not found'));
    }

    if (isUsingMockDB()) {
      const updatedRule = { ...existingRule, status: 'Inactive', updatedAt: getCurrentTimestamp() };
      mockDB().put(HRMS_LEAVES_TABLE, updatedRule);
    } else {
      const updateCommand = new UpdateCommand({
        TableName: HRMS_LEAVES_TABLE,
        Key: { leaveId: existingRule.leaveId },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'Inactive',
          ':updatedAt': getCurrentTimestamp()
        }
      });
      await dynamoClient.send(updateCommand);
    }

    res.json(successResponse(null, 'Leave rule deactivated successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

// ==================== LEAVE BALANCES ====================
const getLeaveBalances = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }

    const { department } = req.query;

    let rules;
    if (isUsingMockDB()) {
      const allRules = mockDB().scan(HRMS_LEAVES_TABLE);
      rules = allRules.filter(r => r.entityType === 'RULE' && r.status === 'Active' && r.recruiterId === recruiterId);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type AND #status = :status AND recruiterId = :recruiterId',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':type': 'RULE', ':status': 'Active', ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(scanCommand);
      rules = result.Items || [];
    }

    const activeLeaveTypes = rules.map(r => r.leaveName);

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

    let balances;
    if (isUsingMockDB()) {
      const allBalances = mockDB().scan(HRMS_LEAVES_TABLE);
      balances = allBalances.filter(b => b.entityType === 'BALANCE' && activeLeaveTypes.includes(b.leaveType) && employeeIds.has(b.employeeId));
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type',
        ExpressionAttributeValues: { ':type': 'BALANCE' }
      });
      const result = await dynamoClient.send(scanCommand);
      balances = (result.Items || []).filter(b => activeLeaveTypes.includes(b.leaveType) && employeeIds.has(b.employeeId));
    }

    if (department) {
      balances = balances.filter(b => b.department === department);
    }

    res.json(successResponse(balances, 'Leave balances retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const adjustLeaveBalance = async (req, res) => {
  try {
    const { employeeId, leaveType, adjustmentType, days, reason } = req.body;

    if (!employeeId || !leaveType || !adjustmentType || !days) {
      return res.status(400).json(errorResponse('Missing required fields'));
    }

    let existingBalance;
    if (isUsingMockDB()) {
      const allBalances = mockDB().scan(HRMS_LEAVES_TABLE);
      existingBalance = allBalances.find(b => 
        b.entityType === 'BALANCE' && b.employeeId === employeeId && b.leaveType === leaveType
      );
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type AND employeeId = :empId AND leaveType = :leaveType',
        ExpressionAttributeValues: {
          ':type': 'BALANCE',
          ':empId': employeeId,
          ':leaveType': leaveType
        }
      });
      const result = await dynamoClient.send(scanCommand);
      existingBalance = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (!existingBalance) {
      return res.status(404).json(errorResponse('Balance not found'));
    }

    const adjustment = adjustmentType === 'Add' ? parseFloat(days) : -parseFloat(days);
    const updatedBalance = {
      ...existingBalance,
      totalAllocated: (existingBalance.totalAllocated || 0) + adjustment,
      remaining: (existingBalance.remaining || 0) + adjustment,
      updatedAt: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_LEAVES_TABLE, updatedBalance);
    } else {
      const putCommand = new PutCommand({
        TableName: HRMS_LEAVES_TABLE,
        Item: updatedBalance
      });
      await dynamoClient.send(putCommand);
    }

    // Log adjustment
    const logId = generateId();
    const adjustmentLog = {
      leaveId: logId,
      entityType: 'ADJUSTMENT_LOG',
      employeeId,
      leaveType,
      adjustmentType,
      days: parseFloat(days),
      reason,
      adjustedBy: req.user?.userId || 'system',
      createdAt: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_LEAVES_TABLE, adjustmentLog);
    } else {
      const putCommand = new PutCommand({
        TableName: HRMS_LEAVES_TABLE,
        Item: adjustmentLog
      });
      await dynamoClient.send(putCommand);
    }

    res.json(successResponse(updatedBalance, 'Leave balance adjusted successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const createLeaveBalance = async (req, res) => {
  try {
    const { employeeId, employeeName, department, leaveType, totalAllocated, used, remaining, carryForward, lwp } = req.body;

    const leaveId = generateId();
    const balance = {
      leaveId,
      entityType: 'BALANCE',
      employeeId,
      employeeName,
      department,
      leaveType,
      totalAllocated: totalAllocated || 0,
      used: used || 0,
      remaining: remaining || totalAllocated || 0,
      carryForward: carryForward || 0,
      lwp: lwp || 0,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_LEAVES_TABLE, balance);
    } else {
      const putCommand = new PutCommand({
        TableName: HRMS_LEAVES_TABLE,
        Item: balance
      });
      await dynamoClient.send(putCommand);
    }

    res.status(201).json(successResponse(balance, 'Leave balance created successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const deleteLeaveBalancesByType = async (req, res) => {
  try {
    const { leaveType } = req.query;

    if (!leaveType) {
      return res.status(400).json(errorResponse('Leave type is required'));
    }

    let balances;
    if (isUsingMockDB()) {
      const allBalances = mockDB().scan(HRMS_LEAVES_TABLE);
      balances = allBalances.filter(b => b.entityType === 'BALANCE' && b.leaveType === leaveType);
      balances.forEach(b => mockDB().delete(HRMS_LEAVES_TABLE, b.leaveId));
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type AND leaveType = :leaveType',
        ExpressionAttributeValues: {
          ':type': 'BALANCE',
          ':leaveType': leaveType
        }
      });
      const result = await dynamoClient.send(scanCommand);
      balances = result.Items || [];

      // Delete each balance
      for (const balance of balances) {
        const deleteCommand = new DeleteCommand({
          TableName: HRMS_LEAVES_TABLE,
          Key: { leaveId: balance.leaveId }
        });
        await dynamoClient.send(deleteCommand);
      }
    }

    res.json(successResponse({ deletedCount: balances.length }, `Deleted ${balances.length} leave balances`));
  } catch (error) {
    handleError(error, res);
  }
};

// ==================== LEAVE ANALYTICS ====================
const getLeaveAnalytics = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }

    const { year } = req.query;

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

    let leaves;
    if (isUsingMockDB()) {
      const allLeaves = mockDB().scan(HRMS_LEAVES_TABLE);
      leaves = allLeaves.filter(l => l.entityType === 'LEAVE' && employeeIds.has(l.employeeId));
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type',
        ExpressionAttributeValues: { ':type': 'LEAVE' }
      });
      const result = await dynamoClient.send(scanCommand);
      leaves = (result.Items || []).filter(l => employeeIds.has(l.employeeId));
    }

    if (year) {
      leaves = leaves.filter(l => new Date(l.startDate).getFullYear().toString() === year);
    }

    // Department-wise analysis
    const departmentWise = {};
    leaves.forEach(leave => {
      if (!departmentWise[leave.department]) {
        departmentWise[leave.department] = 0;
      }
      departmentWise[leave.department] += parseFloat(leave.numberOfDays || 0);
    });

    // Monthly trend
    const monthlyTrend = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2024, i).toLocaleString('default', { month: 'long' }),
      leaves: 0
    }));

    leaves.forEach(leave => {
      const month = new Date(leave.startDate).getMonth();
      if (month >= 0 && month < 12) {
        monthlyTrend[month].leaves += parseFloat(leave.numberOfDays || 0);
      }
    });

    // Leave type usage
    const leaveTypeUsage = {};
    leaves.forEach(leave => {
      if (!leaveTypeUsage[leave.leaveType]) {
        leaveTypeUsage[leave.leaveType] = 0;
      }
      leaveTypeUsage[leave.leaveType]++;
    });

    const analytics = {
      departmentWise: Object.entries(departmentWise).map(([department, totalLeaves]) => ({
        department,
        totalLeaves
      })),
      monthlyTrend,
      leaveTypeUsage: Object.entries(leaveTypeUsage).map(([leaveType, count]) => ({
        leaveType,
        count
      })),
      leaveLiability: 250000,
      lwpImpact: 45000
    };

    res.json(successResponse(analytics, 'Leave analytics retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

// ==================== LEAVE SETTINGS ====================
const getLeaveSettings = async (req, res) => {
  try {
    let settings;
    if (isUsingMockDB()) {
      const allSettings = mockDB().scan(HRMS_LEAVES_TABLE);
      settings = allSettings.find(s => s.entityType === 'SETTINGS');
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type',
        ExpressionAttributeValues: { ':type': 'SETTINGS' }
      });
      const result = await dynamoClient.send(scanCommand);
      settings = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (!settings) {
      settings = {
        holidayList: [],
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        weekendDays: ['Saturday', 'Sunday'],
        financialYearStart: '04-01',
        payrollIntegration: 'Yes',
        attendanceSync: 'Yes'
      };
    }

    res.json(successResponse(settings, 'Leave settings retrieved successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const syncLeaveBalances = async (req, res) => {
  try {
    // Get all active employees (not deleted)
    let employees;
    if (isUsingMockDB()) {
      employees = mockDB().scan(HRMS_EMPLOYEES_TABLE).filter(e => e.status === 'active');
    } else {
      const scanCommand = new ScanCommand({ 
        TableName: HRMS_EMPLOYEES_TABLE,
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': 'active' }
      });
      const result = await dynamoClient.send(scanCommand);
      employees = result.Items || [];
    }

    // Get all active leave rules
    let rules;
    if (isUsingMockDB()) {
      const allRules = mockDB().scan(HRMS_LEAVES_TABLE);
      rules = allRules.filter(r => r.entityType === 'RULE' && r.status === 'Active');
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type AND #status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':type': 'RULE', ':status': 'Active' }
      });
      const result = await dynamoClient.send(scanCommand);
      rules = result.Items || [];
    }

    // Get existing balances
    let existingBalances;
    if (isUsingMockDB()) {
      const allBalances = mockDB().scan(HRMS_LEAVES_TABLE);
      existingBalances = allBalances.filter(b => b.entityType === 'BALANCE');
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type',
        ExpressionAttributeValues: { ':type': 'BALANCE' }
      });
      const result = await dynamoClient.send(scanCommand);
      existingBalances = result.Items || [];
    }

    // Clean up orphaned balances (balances for employees that no longer exist)
    const activeEmployeeIds = employees.map(e => e.employeeId);
    const orphanedBalances = existingBalances.filter(b => !activeEmployeeIds.includes(b.employeeId));
    
    let cleaned = 0;
    for (const orphanedBalance of orphanedBalances) {
      if (isUsingMockDB()) {
        mockDB().delete(HRMS_LEAVES_TABLE, orphanedBalance.leaveId);
      } else {
        const deleteCommand = new DeleteCommand({
          TableName: HRMS_LEAVES_TABLE,
          Key: { leaveId: orphanedBalance.leaveId }
        });
        await dynamoClient.send(deleteCommand);
      }
      cleaned++;
    }

    // Update existing balances to remove orphaned ones
    existingBalances = existingBalances.filter(b => activeEmployeeIds.includes(b.employeeId));

    let created = 0;

    // For each employee, check if they have balances for all leave types
    for (const employee of employees) {
      for (const rule of rules) {
        // Check if balance already exists
        const balanceExists = existingBalances.some(
          b => b.employeeId === employee.employeeId && b.leaveType === rule.leaveName
        );

        if (!balanceExists) {
          // Calculate pro-rata leaves
          const allocatedLeaves = calculateProRataLeaves(employee.joinDate, rule);

          const leaveId = generateId();
          const balance = {
            leaveId,
            entityType: 'BALANCE',
            employeeId: employee.employeeId,
            employeeName: employee.name,
            department: employee.department,
            leaveType: rule.leaveName,
            totalAllocated: allocatedLeaves,
            used: 0,
            remaining: allocatedLeaves,
            carryForward: 0,
            lwp: 0,
            createdAt: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp()
          };

          if (isUsingMockDB()) {
            mockDB().put(HRMS_LEAVES_TABLE, balance);
          } else {
            const putCommand = new PutCommand({
              TableName: HRMS_LEAVES_TABLE,
              Item: balance
            });
            await dynamoClient.send(putCommand);
          }

          created++;
        }
      }
    }

    const message = cleaned > 0 
      ? `Synced successfully. Created ${created} new leave balances and cleaned up ${cleaned} orphaned records.`
      : `Synced successfully. Created ${created} new leave balances.`;
    
    res.json(successResponse({ created, cleaned }, message));
  } catch (error) {
    handleError(error, res);
  }
};

const calculateProRataLeaves = (joinDate, rule) => {
  const totalLeavesPerYear = parseInt(rule.totalLeavesPerYear) || 0;
  if (rule.proRataCalculation === 'No') return totalLeavesPerYear;
  const joiningDate = new Date(joinDate);
  const joiningMonth = joiningDate.getMonth();
  const remainingMonths = 12 - joiningMonth;
  return Math.round((remainingMonths / 12) * totalLeavesPerYear);
};

const updateLeaveSettings = async (req, res) => {
  try {
    const settingsData = req.body;

    let existingSettings;
    if (isUsingMockDB()) {
      const allSettings = mockDB().scan(HRMS_LEAVES_TABLE);
      existingSettings = allSettings.find(s => s.entityType === 'SETTINGS');
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type',
        ExpressionAttributeValues: { ':type': 'SETTINGS' }
      });
      const result = await dynamoClient.send(scanCommand);
      existingSettings = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    let settings;
    if (existingSettings) {
      settings = {
        ...existingSettings,
        ...settingsData,
        updatedAt: getCurrentTimestamp()
      };
    } else {
      const leaveId = generateId();
      settings = {
        leaveId,
        entityType: 'SETTINGS',
        ...settingsData,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
      };
    }

    if (isUsingMockDB()) {
      mockDB().put(HRMS_LEAVES_TABLE, settings);
    } else {
      const putCommand = new PutCommand({
        TableName: HRMS_LEAVES_TABLE,
        Item: settings
      });
      await dynamoClient.send(putCommand);
    }

    res.json(successResponse(settings, 'Leave settings updated successfully'));
  } catch (error) {
    handleError(error, res);
  }
};

const processCarryForwardLeaves = async (req, res) => {
  try {
    const { year } = req.body;
    const previousYear = (parseInt(year) - 1).toString();
    
    console.log(`Processing carry forward leaves from ${previousYear} to ${year}`);
    
    // Get all carry forward leave rules
    let carryForwardRules;
    if (isUsingMockDB()) {
      const allRules = mockDB().scan(HRMS_LEAVES_TABLE);
      carryForwardRules = allRules.filter(r => 
        r.entityType === 'RULE' && 
        r.status === 'Active' && 
        r.isCarryForwardLeave === 'Yes'
      );
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type AND #status = :status AND isCarryForwardLeave = :cfLeave',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':type': 'RULE',
          ':status': 'Active',
          ':cfLeave': 'Yes'
        }
      });
      const result = await dynamoClient.send(scanCommand);
      carryForwardRules = result.Items || [];
    }

    if (carryForwardRules.length === 0) {
      return res.json(successResponse({ processed: 0 }, 'No carry forward leave rules found'));
    }

    // Get all employees
    let employees;
    if (isUsingMockDB()) {
      employees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
    } else {
      const scanCommand = new ScanCommand({ TableName: HRMS_EMPLOYEES_TABLE });
      const result = await dynamoClient.send(scanCommand);
      employees = result.Items || [];
    }

    let processedCount = 0;

    // Process each employee
    for (const employee of employees) {
      for (const rule of carryForwardRules) {
        // Get previous year's unused leaves for this leave type
        let previousYearBalance;
        if (isUsingMockDB()) {
          const allBalances = mockDB().scan(HRMS_LEAVES_TABLE);
          previousYearBalance = allBalances.find(b => 
            b.entityType === 'BALANCE' && 
            b.employeeId === employee.employeeId && 
            b.leaveType === rule.leaveName &&
            (b.year === previousYear || new Date(b.createdAt).getFullYear().toString() === previousYear)
          );
        } else {
          const scanCommand = new ScanCommand({
            TableName: HRMS_LEAVES_TABLE,
            FilterExpression: 'entityType = :type AND employeeId = :empId AND leaveType = :leaveType',
            ExpressionAttributeValues: {
              ':type': 'BALANCE',
              ':empId': employee.employeeId,
              ':leaveType': rule.leaveName
            }
          });
          const result = await dynamoClient.send(scanCommand);
          previousYearBalance = (result.Items || []).find(b => 
            b.year === previousYear || new Date(b.createdAt).getFullYear().toString() === previousYear
          );
        }

        if (previousYearBalance && previousYearBalance.remaining > 0) {
          const carryForwardAmount = previousYearBalance.remaining;
          
          const leaveId = generateId();
          const carryForwardBalance = {
            leaveId,
            entityType: 'BALANCE',
            employeeId: employee.employeeId,
            employeeName: employee.fullName || employee.name,
            department: employee.department,
            leaveType: rule.leaveName,
            totalAllocated: carryForwardAmount,
            used: 0,
            remaining: carryForwardAmount,
            carryForward: carryForwardAmount,
            lwp: 0,
            year: year,
            isCarryForward: true,
            sourceYear: previousYear,
            createdAt: getCurrentTimestamp(),
            updatedAt: getCurrentTimestamp()
          };

          if (isUsingMockDB()) {
            mockDB().put(HRMS_LEAVES_TABLE, carryForwardBalance);
          } else {
            const putCommand = new PutCommand({
              TableName: HRMS_LEAVES_TABLE,
              Item: carryForwardBalance
            });
            await dynamoClient.send(putCommand);
          }

          processedCount++;
          console.log(`Created carry forward balance: ${carryForwardAmount} ${rule.leaveName} for ${employee.fullName || employee.name}`);
        }
      }
    }

    res.json(successResponse(
      { processed: processedCount }, 
      `Processed carry forward leaves for ${processedCount} employee-leave combinations`
    ));
  } catch (error) {
    console.error('Error processing carry forward leaves:', error);
    handleError(error, res);
  }
};

const processYearlyLeaveReset = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear().toString();
    const previousYear = (parseInt(currentYear) - 1).toString();
    
    console.log(`Processing yearly leave reset for ${currentYear}`);
    
    // Get all active leave rules
    let allRules;
    if (isUsingMockDB()) {
      const allRulesData = mockDB().scan(HRMS_LEAVES_TABLE);
      allRules = allRulesData.filter(r => r.entityType === 'RULE' && r.status === 'Active');
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_LEAVES_TABLE,
        FilterExpression: 'entityType = :type AND #status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':type': 'RULE',
          ':status': 'Active'
        }
      });
      const result = await dynamoClient.send(scanCommand);
      allRules = result.Items || [];
    }

    // Separate carry forward and regular rules
    const carryForwardRules = allRules.filter(r => r.isCarryForwardLeave === 'Yes');
    const regularRules = allRules.filter(r => r.isCarryForwardLeave !== 'Yes');
    
    // Get all employees
    let employees;
    if (isUsingMockDB()) {
      employees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
    } else {
      const scanCommand = new ScanCommand({ TableName: HRMS_EMPLOYEES_TABLE });
      const result = await dynamoClient.send(scanCommand);
      employees = result.Items || [];
    }

    let processedCount = 0;

    // Process each employee
    for (const employee of employees) {
      // 1. Reset regular leaves (allocate fresh for current year)
      for (const rule of regularRules) {
        const leaveId = generateId();
        const balance = {
          leaveId,
          entityType: 'BALANCE',
          employeeId: employee.employeeId,
          employeeName: employee.fullName || employee.name,
          department: employee.department,
          leaveType: rule.leaveName,
          totalAllocated: parseInt(rule.totalLeavesPerYear),
          used: 0,
          remaining: parseInt(rule.totalLeavesPerYear),
          carryForward: 0,
          lwp: 0,
          year: currentYear,
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp()
        };

        if (isUsingMockDB()) {
          mockDB().put(HRMS_LEAVES_TABLE, balance);
        } else {
          const putCommand = new PutCommand({
            TableName: HRMS_LEAVES_TABLE,
            Item: balance
          });
          await dynamoClient.send(putCommand);
        }
        processedCount++;
      }

      // 2. Process carry forward leaves
      for (const rule of carryForwardRules) {
        // Get previous year's unused leaves
        let previousYearBalance;
        if (isUsingMockDB()) {
          const allBalances = mockDB().scan(HRMS_LEAVES_TABLE);
          previousYearBalance = allBalances.find(b => 
            b.entityType === 'BALANCE' && 
            b.employeeId === employee.employeeId && 
            b.leaveType === rule.leaveName &&
            (b.year === previousYear || new Date(b.createdAt).getFullYear().toString() === previousYear)
          );
        } else {
          const scanCommand = new ScanCommand({
            TableName: HRMS_LEAVES_TABLE,
            FilterExpression: 'entityType = :type AND employeeId = :empId AND leaveType = :leaveType',
            ExpressionAttributeValues: {
              ':type': 'BALANCE',
              ':empId': employee.employeeId,
              ':leaveType': rule.leaveName
            }
          });
          const result = await dynamoClient.send(scanCommand);
          previousYearBalance = (result.Items || []).find(b => 
            b.year === previousYear || new Date(b.createdAt).getFullYear().toString() === previousYear
          );
        }

        // Create carry forward balance for current year
        const carryForwardAmount = previousYearBalance ? previousYearBalance.remaining : 0;
        
        const leaveId = generateId();
        const carryForwardBalance = {
          leaveId,
          entityType: 'BALANCE',
          employeeId: employee.employeeId,
          employeeName: employee.fullName || employee.name,
          department: employee.department,
          leaveType: rule.leaveName,
          totalAllocated: carryForwardAmount,
          used: 0,
          remaining: carryForwardAmount,
          carryForward: carryForwardAmount,
          lwp: 0,
          year: currentYear,
          isCarryForward: true,
          sourceYear: previousYear,
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp()
        };

        if (isUsingMockDB()) {
          mockDB().put(HRMS_LEAVES_TABLE, carryForwardBalance);
        } else {
          const putCommand = new PutCommand({
            TableName: HRMS_LEAVES_TABLE,
            Item: carryForwardBalance
          });
          await dynamoClient.send(putCommand);
        }
        processedCount++;
      }
    }

    res.json(successResponse(
      { processed: processedCount }, 
      `Yearly leave reset completed. Processed ${processedCount} leave allocations for ${currentYear}`
    ));
  } catch (error) {
    console.error('Error processing yearly leave reset:', error);
    handleError(error, res);
  }
};

module.exports = {
  getLeaveStats,
  getLeaves,
  getLeaveById,
  createLeave,
  updateLeaveStatus,
  getLeaveRules,
  createLeaveRule,
  updateLeaveRule,
  deactivateLeaveRule,
  getLeaveBalances,
  adjustLeaveBalance,
  createLeaveBalance,
  deleteLeaveBalancesByType,
  getLeaveAnalytics,
  getLeaveSettings,
  updateLeaveSettings,
  syncLeaveBalances,
  processCarryForwardLeaves,
  processYearlyLeaveReset
};
