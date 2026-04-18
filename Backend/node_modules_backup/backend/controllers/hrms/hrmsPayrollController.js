const { dynamoClient, isUsingMockDB, mockDB, HRMS_EMPLOYEES_TABLE, HRMS_ATTENDANCE_TABLE, HRMS_LEAVES_TABLE, HRMS_PAYROLL_TABLE } = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

// Run payroll for a specific month
const runPayroll = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }

    const { month } = req.body; // Format: YYYY-MM
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json(errorResponse('Valid month required (format: YYYY-MM)'));
    }

    console.log(`🚀 Running payroll for ${month}, recruiterId: ${recruiterId}`);

    // Get all active employees
    let employees;
    if (isUsingMockDB()) {
      const allEmployees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
      employees = allEmployees.filter(e => e.recruiterId === recruiterId && !e.isDeleted);
    } else {
      const scanCommand = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        FilterExpression: 'recruiterId = :recruiterId AND (attribute_not_exists(isDeleted) OR isDeleted = :false)',
        ExpressionAttributeValues: {
          ':recruiterId': recruiterId,
          ':false': false
        }
      });
      const result = await dynamoClient.send(scanCommand);
      employees = result.Items || [];
    }

    if (employees.length === 0) {
      return res.status(400).json(errorResponse('No active employees found'));
    }

    console.log(`📊 Processing payroll for ${employees.length} employees`);

    const payrollRecords = [];
    let totalGrossSalary = 0;
    let totalDeductions = 0;
    let totalNetSalary = 0;

    // Calculate payroll for each employee
    for (const employee of employees) {
      const payrollData = await calculateEmployeePayroll(employee, month, recruiterId, req.user?.email || 'system');
      payrollRecords.push(payrollData);
      
      totalGrossSalary += payrollData.totalEarnings;
      totalDeductions += payrollData.totalDeductions;
      totalNetSalary += payrollData.netSalary;
    }

    // Save all payroll records
    for (const record of payrollRecords) {
      if (isUsingMockDB()) {
        mockDB().put(HRMS_PAYROLL_TABLE, record);
      } else {
        const putCommand = new PutCommand({
          TableName: HRMS_PAYROLL_TABLE,
          Item: record
        });
        await dynamoClient.send(putCommand);
      }
    }

    console.log(`✅ Payroll completed: ${payrollRecords.length} records created`);

    res.json(successResponse({
      month,
      totalEmployees: payrollRecords.length,
      totalGrossSalary: parseFloat(totalGrossSalary.toFixed(2)),
      totalDeductions: parseFloat(totalDeductions.toFixed(2)),
      totalNetSalary: parseFloat(totalNetSalary.toFixed(2)),
      records: payrollRecords
    }, 'Payroll processed successfully'));

  } catch (error) {
    console.error('Run payroll error:', error);
    handleError(error, res);
  }
};

// Calculate payroll for a single employee
const calculateEmployeePayroll = async (employee, month, recruiterId, userEmail) => {
  const [year, monthNum] = month.split('-');
  const startDate = `${year}-${monthNum}-01`;
  const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0]; // Last day of month

  // Get attendance data
  const attendanceData = await getEmployeeAttendance(employee.employeeId, startDate, endDate);
  
  // Get leave data
  const leaveData = await getEmployeeLeaves(employee.employeeId, startDate, endDate);

  // Calculate working days in month
  const totalWorkingDays = getWorkingDaysInMonth(year, monthNum);

  // Basic salary calculation
  const basicSalary = parseFloat(employee.basicSalary || employee.basicPay || 0);
  const salaryType = employee.salaryType || 'Monthly';
  
  let calculatedBasicSalary = basicSalary;
  
  // Calculate per day salary
  const perDaySalary = basicSalary / totalWorkingDays;

  // Calculate attendance-based deductions
  const unpaidAbsences = attendanceData.daysAbsent - leaveData.paidLeaves;
  const lwpDeduction = Math.max(0, unpaidAbsences + leaveData.unpaidLeaves) * perDaySalary;

  // Earnings calculation
  const allowances = employee.allowances || [];
  let totalAllowances = 0;
  const allowanceBreakdown = allowances.map(a => {
    const amount = parseFloat(a.amount || 0);
    totalAllowances += amount;
    return {
      name: a.name,
      amount,
      type: a.type,
      taxable: a.taxable
    };
  });

  const bonus = parseFloat(employee.bonus || 0);
  const overtime = attendanceData.overtimeHours * parseFloat(employee.overtimeRate || 0);

  const totalEarnings = calculatedBasicSalary + totalAllowances + bonus + overtime;

  // Deductions calculation
  const deductions = employee.deductions || [];
  let totalStatutoryDeductions = 0;
  const deductionBreakdown = [];

  // Add configured deductions
  deductions.forEach(d => {
    const amount = parseFloat(d.amount || 0);
    totalStatutoryDeductions += amount;
    deductionBreakdown.push({
      name: d.name,
      amount,
      type: d.type || 'Fixed'
    });
  });

  // Add LWP deduction
  if (lwpDeduction > 0) {
    deductionBreakdown.push({
      name: 'Leave Without Pay',
      amount: parseFloat(lwpDeduction.toFixed(2)),
      type: 'Calculated'
    });
  }

  const totalDeductions = totalStatutoryDeductions + lwpDeduction;
  const netSalary = totalEarnings - totalDeductions;

  // Create payroll record
  const payrollRecordId = `PRE-${month}-${employee.employeeId}`;
  
  return {
    payrollRecordId,
    month,
    recruiterId,
    employeeId: employee.employeeId,
    employeeName: employee.fullName,
    department: employee.department,
    designation: employee.designation,
    
    // Salary structure
    basicSalary: parseFloat(basicSalary.toFixed(2)),
    salaryType,
    
    // Attendance
    totalWorkingDays,
    daysPresent: attendanceData.daysPresent,
    daysAbsent: attendanceData.daysAbsent,
    halfDays: attendanceData.halfDays,
    paidLeaves: leaveData.paidLeaves,
    unpaidLeaves: leaveData.unpaidLeaves,
    overtimeHours: attendanceData.overtimeHours,
    
    // Earnings
    allowances: allowanceBreakdown,
    bonus: parseFloat(bonus.toFixed(2)),
    overtime: parseFloat(overtime.toFixed(2)),
    totalEarnings: parseFloat(totalEarnings.toFixed(2)),
    
    // Deductions
    deductions: deductionBreakdown,
    totalDeductions: parseFloat(totalDeductions.toFixed(2)),
    
    // Net salary
    netSalary: parseFloat(netSalary.toFixed(2)),
    
    // Status
    paymentStatus: 'pending',
    paymentDate: null,
    
    createdAt: getCurrentTimestamp(),
    createdBy: userEmail
  };
};

// Get employee attendance for date range
const getEmployeeAttendance = async (employeeId, startDate, endDate) => {
  let attendanceRecords;
  
  if (isUsingMockDB()) {
    const allAttendance = mockDB().scan(HRMS_ATTENDANCE_TABLE);
    attendanceRecords = allAttendance.filter(a => 
      a.employeeId === employeeId && 
      a.date >= startDate && 
      a.date <= endDate
    );
  } else {
    const scanCommand = new ScanCommand({
      TableName: HRMS_ATTENDANCE_TABLE,
      FilterExpression: 'employeeId = :employeeId AND #date BETWEEN :startDate AND :endDate',
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: {
        ':employeeId': employeeId,
        ':startDate': startDate,
        ':endDate': endDate
      }
    });
    const result = await dynamoClient.send(scanCommand);
    attendanceRecords = result.Items || [];
  }

  const daysPresent = attendanceRecords.length;
  const totalWorkingDays = getWorkingDaysInMonth(startDate.split('-')[0], startDate.split('-')[1]);
  const daysAbsent = totalWorkingDays - daysPresent;
  const halfDays = attendanceRecords.filter(a => a.status === 'half-day').length;
  const overtimeHours = attendanceRecords.reduce((sum, a) => {
    const hours = parseFloat(a.hours || 0);
    return sum + Math.max(0, hours - 8); // Overtime after 8 hours
  }, 0);

  return {
    daysPresent,
    daysAbsent,
    halfDays,
    overtimeHours: parseFloat(overtimeHours.toFixed(2))
  };
};

// Get employee leaves for date range
const getEmployeeLeaves = async (employeeId, startDate, endDate) => {
  let leaveRecords;
  
  if (isUsingMockDB()) {
    const allLeaves = mockDB().scan(HRMS_LEAVES_TABLE);
    leaveRecords = allLeaves.filter(l => 
      l.entityType === 'LEAVE' &&
      l.employeeId === employeeId && 
      l.status === 'Approved' &&
      l.startDate <= endDate &&
      l.endDate >= startDate
    );
  } else {
    const scanCommand = new ScanCommand({
      TableName: HRMS_LEAVES_TABLE,
      FilterExpression: 'entityType = :type AND employeeId = :employeeId AND #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':type': 'LEAVE',
        ':employeeId': employeeId,
        ':status': 'Approved'
      }
    });
    const result = await dynamoClient.send(scanCommand);
    leaveRecords = (result.Items || []).filter(l => 
      l.startDate <= endDate && l.endDate >= startDate
    );
  }

  let paidLeaves = 0;
  let unpaidLeaves = 0;

  leaveRecords.forEach(leave => {
    const days = parseFloat(leave.days || 0);
    if (leave.leaveType === 'Leave Without Pay' || leave.leaveType === 'LWP') {
      unpaidLeaves += days;
    } else {
      paidLeaves += days;
    }
  });

  return { paidLeaves, unpaidLeaves };
};

// Get working days in month (excluding Sundays)
const getWorkingDaysInMonth = (year, month) => {
  const date = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  let workingDays = 0;

  for (let day = 1; day <= lastDay; day++) {
    date.setDate(day);
    if (date.getDay() !== 0) { // Exclude Sundays
      workingDays++;
    }
  }

  return workingDays;
};

// Get payroll records for a month
const getPayrollByMonth = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }

    const { month } = req.params;

    let payrollRecords;
    if (isUsingMockDB()) {
      const allRecords = mockDB().scan(HRMS_PAYROLL_TABLE);
      payrollRecords = allRecords.filter(r => r.recruiterId === recruiterId && r.month === month);
    } else {
      const queryCommand = new QueryCommand({
        TableName: HRMS_PAYROLL_TABLE,
        IndexName: 'recruiterId-month-index',
        KeyConditionExpression: 'recruiterId = :recruiterId AND #month = :month',
        ExpressionAttributeNames: { '#month': 'month' },
        ExpressionAttributeValues: {
          ':recruiterId': recruiterId,
          ':month': month
        }
      });
      const result = await dynamoClient.send(queryCommand);
      payrollRecords = result.Items || [];
    }

    res.json(successResponse(payrollRecords, 'Payroll records retrieved successfully'));

  } catch (error) {
    console.error('Get payroll by month error:', error);
    handleError(error, res);
  }
};

// Get payroll history for an employee
const getEmployeePayrollHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    let payrollRecords;
    if (isUsingMockDB()) {
      const allRecords = mockDB().scan(HRMS_PAYROLL_TABLE);
      payrollRecords = allRecords.filter(r => r.employeeId === employeeId);
    } else {
      const queryCommand = new QueryCommand({
        TableName: HRMS_PAYROLL_TABLE,
        IndexName: 'employeeId-month-index',
        KeyConditionExpression: 'employeeId = :employeeId',
        ExpressionAttributeValues: {
          ':employeeId': employeeId
        },
        ScanIndexForward: false // Sort by month descending
      });
      const result = await dynamoClient.send(queryCommand);
      payrollRecords = result.Items || [];
    }

    res.json(successResponse(payrollRecords, 'Employee payroll history retrieved successfully'));

  } catch (error) {
    console.error('Get employee payroll history error:', error);
    handleError(error, res);
  }
};

// Get single payroll record
const getPayrollRecord = async (req, res) => {
  try {
    const { payrollRecordId, month } = req.params;

    let payrollRecord;
    if (isUsingMockDB()) {
      const allRecords = mockDB().scan(HRMS_PAYROLL_TABLE);
      payrollRecord = allRecords.find(r => r.payrollRecordId === payrollRecordId && r.month === month);
    } else {
      const getCommand = new GetCommand({
        TableName: HRMS_PAYROLL_TABLE,
        Key: { payrollRecordId, month }
      });
      const result = await dynamoClient.send(getCommand);
      payrollRecord = result.Item;
    }

    if (!payrollRecord) {
      return res.status(404).json(errorResponse('Payroll record not found'));
    }

    res.json(successResponse(payrollRecord, 'Payroll record retrieved successfully'));

  } catch (error) {
    console.error('Get payroll record error:', error);
    handleError(error, res);
  }
};

// Get payroll summary
const getPayrollSummary = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID not found'));
    }

    const { month } = req.query;

    let payrollRecords;
    if (isUsingMockDB()) {
      const allRecords = mockDB().scan(HRMS_PAYROLL_TABLE);
      payrollRecords = allRecords.filter(r => {
        if (r.recruiterId !== recruiterId) return false;
        if (month && r.month !== month) return false;
        return true;
      });
    } else {
      if (month) {
        const queryCommand = new QueryCommand({
          TableName: HRMS_PAYROLL_TABLE,
          IndexName: 'recruiterId-month-index',
          KeyConditionExpression: 'recruiterId = :recruiterId AND #month = :month',
          ExpressionAttributeNames: { '#month': 'month' },
          ExpressionAttributeValues: {
            ':recruiterId': recruiterId,
            ':month': month
          }
        });
        const result = await dynamoClient.send(queryCommand);
        payrollRecords = result.Items || [];
      } else {
        const scanCommand = new ScanCommand({
          TableName: HRMS_PAYROLL_TABLE,
          FilterExpression: 'recruiterId = :recruiterId',
          ExpressionAttributeValues: {
            ':recruiterId': recruiterId
          }
        });
        const result = await dynamoClient.send(scanCommand);
        payrollRecords = result.Items || [];
      }
    }

    const summary = {
      totalRecords: payrollRecords.length,
      totalGrossSalary: payrollRecords.reduce((sum, r) => sum + r.totalEarnings, 0),
      totalDeductions: payrollRecords.reduce((sum, r) => sum + r.totalDeductions, 0),
      totalNetSalary: payrollRecords.reduce((sum, r) => sum + r.netSalary, 0),
      pendingPayments: payrollRecords.filter(r => r.paymentStatus === 'pending').length,
      paidPayments: payrollRecords.filter(r => r.paymentStatus === 'paid').length
    };

    res.json(successResponse(summary, 'Payroll summary retrieved successfully'));

  } catch (error) {
    console.error('Get payroll summary error:', error);
    handleError(error, res);
  }
};

module.exports = {
  runPayroll,
  getPayrollByMonth,
  getEmployeePayrollHistory,
  getPayrollRecord,
  getPayrollSummary
};
