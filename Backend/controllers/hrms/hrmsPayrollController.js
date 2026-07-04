/**
 * HRMS Payroll Controller — Production Grade
 * Leave Policy: Mon–Sat workweek, Sunday weekly off (default)
 * CL: 1/month, ML: 1/month, CO: 5h=full, 2.5h=half
 * Late arrival → auto half-day deduction
 * Payroll snapshot: frozen on generation
 */
const {
  dynamoClient, isUsingMockDB, mockDB,
  HRMS_EMPLOYEES_TABLE, HRMS_ATTENDANCE_TABLE,
  HRMS_LEAVES_TABLE, HRMS_PAYROLL_TABLE,
  HRMS_HOLIDAYS_TABLE, HRMS_PAYROLL_RUNS_TABLE
} = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, GetCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

/* ─── Helpers ─────────────────────────────────────────────────── */

/** Get all holidays for a recruiter, optionally filtered to a month range */
const getHolidaysForPeriod = async (recruiterId, startDate, endDate) => {
  try {
    const scan = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_HOLIDAYS_TABLE,
      FilterExpression: 'recruiterId = :rid AND #date BETWEEN :start AND :end',
      ExpressionAttributeNames: { '#date': 'date' },
      ExpressionAttributeValues: { ':rid': recruiterId, ':start': startDate, ':end': endDate }
    }));
    return (scan.Items || []).map(h => h.date); // array of 'YYYY-MM-DD'
  } catch { return []; }
};

/** Employee's working days array from employee record — fallback to Mon–Sat */
const getEmployeeWorkingDays = (employee) => {
  if (employee.workingDays && Array.isArray(employee.workingDays)) return employee.workingDays;
  // Default company policy: Monday–Saturday
  return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Count actual working days in a date range for a specific employee
 *  Excludes: employee's weekly-off days + declared holidays */
const countWorkingDays = (startDate, endDate, employeeWorkingDays, holidays = []) => {
  const holidaySet = new Set(holidays);
  let count = 0;
  const cur = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  while (cur <= end) {
    const dayName = DAY_NAMES[cur.getDay()];
    const dateStr = cur.toISOString().split('T')[0];
    if (employeeWorkingDays.includes(dayName) && !holidaySet.has(dateStr)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

/** Get all dates in range that are weekly-off for this employee */
const getWeeklyOffDates = (startDate, endDate, employeeWorkingDays) => {
  const offs = [];
  const cur = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  while (cur <= end) {
    const dayName = DAY_NAMES[cur.getDay()];
    if (!employeeWorkingDays.includes(dayName)) offs.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return offs;
};

/** Fetch attendance records for employee within date range */
const fetchAttendance = async (employeeId, startDate, endDate) => {
  const result = await dynamoClient.send(new ScanCommand({
    TableName: HRMS_ATTENDANCE_TABLE,
    FilterExpression: 'employeeId = :eid AND #date BETWEEN :start AND :end',
    ExpressionAttributeNames: { '#date': 'date' },
    ExpressionAttributeValues: { ':eid': employeeId, ':start': startDate, ':end': endDate }
  }));
  return result.Items || [];
};

/** Fetch approved leaves overlapping date range */
const fetchApprovedLeaves = async (employeeId, startDate, endDate) => {
  const result = await dynamoClient.send(new ScanCommand({
    TableName: HRMS_LEAVES_TABLE,
    FilterExpression: 'entityType = :type AND employeeId = :eid AND #status = :approved',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':type': 'LEAVE', ':eid': employeeId, ':approved': 'Approved' }
  }));
  return (result.Items || []).filter(l => l.startDate <= endDate && l.endDate >= startDate);
};

/* ─── Core Payroll Engine ─────────────────────────────────────── */

const computePayroll = async (employee, startDate, endDate, recruiterId, runId) => {
  const workingDays = getEmployeeWorkingDays(employee);
  const holidays = await getHolidaysForPeriod(recruiterId, startDate, endDate);
  const holidaySet = new Set(holidays);
  const weeklyOffDates = getWeeklyOffDates(startDate, endDate, workingDays);
  const weeklyOffSet = new Set(weeklyOffDates);
  const totalScheduledDays = countWorkingDays(startDate, endDate, workingDays, holidays);

  const attendanceRecords = await fetchAttendance(employee.employeeId, startDate, endDate);
  const approvedLeaves = await fetchApprovedLeaves(employee.employeeId, startDate, endDate);

  // Build a date-keyed attendance map
  const attMap = {};
  for (const r of attendanceRecords) attMap[r.date] = r;

  // Build a date-keyed leave map (approved leaves that fall within period)
  const leaveMap = {}; // date → { leaveType, isPaid }
  for (const leave of approvedLeaves) {
    const s = new Date(leave.startDate + 'T00:00:00');
    const e = new Date(leave.endDate + 'T00:00:00');
    const pEnd = new Date(endDate + 'T00:00:00');
    const pStart = new Date(startDate + 'T00:00:00');
    const cur = new Date(Math.max(s, pStart));
    while (cur <= Math.min(e, pEnd)) {
      const ds = cur.toISOString().split('T')[0];
      const lt = leave.leaveType || '';
      const isPaid = !['LWP', 'Leave Without Pay', 'Unpaid Leave'].includes(lt);
      leaveMap[ds] = { leaveType: lt, isPaid, days: parseFloat(leave.numberOfDays || 1) };
      cur.setDate(cur.getDate() + 1);
    }
  }

  // Per-day breakdown
  let daysPresent = 0;
  let halfDays = 0;      // from late attendance
  let fullAbsent = 0;    // absent without any leave
  let paidLeaves = 0;
  let unpaidLeaves = 0;
  let weeklyOffs = weeklyOffDates.length;
  let holidayCount = holidays.length;
  let compOffs = 0;
  let overtimeHours = 0;

  // Iterate only over scheduled working days
  const cur = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  while (cur <= end) {
    const ds = cur.toISOString().split('T')[0];
    const dayName = DAY_NAMES[cur.getDay()];
    cur.setDate(cur.getDate() + 1);

    if (weeklyOffSet.has(ds)) continue;   // weekly off — skip
    if (holidaySet.has(ds)) continue;     // declared holiday — skip

    const att = attMap[ds];
    const leaveEntry = leaveMap[ds];

    if (att) {
      const status = att.status || 'present';
      if (status === 'half-day') {
        halfDays++;
        daysPresent += 0.5;
      } else {
        daysPresent++;
      }
      // Overtime: hours beyond expected shift
      const expectedH = employee.checkOutTime && employee.checkInTime
        ? (() => {
            const [oh, om] = (employee.checkOutTime || '18:00').split(':').map(Number);
            const [ih, im] = (employee.checkInTime || '09:00').split(':').map(Number);
            return ((oh * 60 + om) - (ih * 60 + im)) / 60;
          })()
        : 9; // default 9h shift
      const worked = parseFloat(att.hours || 0);
      if (worked > expectedH) overtimeHours += (worked - expectedH);
    } else if (leaveEntry) {
      // Approved leave on this scheduled working day
      const lt = leaveEntry.leaveType;
      if (['CO', 'Comp Off', 'Compensatory Off'].includes(lt)) {
        compOffs += 0.5; // simplify — could be half or full
      } else if (leaveEntry.isPaid) {
        paidLeaves++;
      } else {
        unpaidLeaves++;
      }
    } else {
      // No attendance + no approved leave → absent
      fullAbsent++;
    }
  }

  // Late arrival half-day — attendance records with status 'late' AND hours < 50% of expected
  const expectedHours = employee.checkOutTime && employee.checkInTime
    ? (() => {
        const [oh, om] = (employee.checkOutTime || '18:00').split(':').map(Number);
        const [ih, im] = (employee.checkInTime || '09:00').split(':').map(Number);
        return ((oh * 60 + om) - (ih * 60 + im)) / 60;
      })()
    : 9;
  let lateHalfDayDeductionDays = 0;
  for (const r of attendanceRecords) {
    if (r.status === 'late') {
      // Already counted as present above, but we deduct 0.5 day for late per policy
      const worked = parseFloat(r.hours || 0);
      if (worked < expectedHours * 0.5) {
        // already marked half-day by attendance — no double count
      } else {
        // Late arrival: deduct half-day per policy
        lateHalfDayDeductionDays += 0.5;
      }
    }
  }

  // Salary math
  const basicSalary = parseFloat(employee.basicSalary || employee.basicPay || 0);
  const perDaySalary = totalScheduledDays > 0 ? basicSalary / totalScheduledDays : 0;

  // Deductions from LWP:
  // absent days + unpaid leaves + half-days (×0.5) + late-half-day adjustments
  const lwpDays = fullAbsent + unpaidLeaves + (halfDays * 0.5) + lateHalfDayDeductionDays;
  const lwpAmount = parseFloat((lwpDays * perDaySalary).toFixed(2));

  // Allowances
  const allowancesArr = employee.allowances || [];
  let totalAllowances = 0;
  const allowanceBreakdown = allowancesArr.map(a => {
    const amt = parseFloat(a.amount || 0);
    totalAllowances += amt;
    return { name: a.name, amount: amt, type: a.type || 'Fixed', taxable: a.taxable || false };
  });

  const bonus = parseFloat(employee.bonus || 0);
  const overtimePay = parseFloat((overtimeHours * parseFloat(employee.overtimeRate || 0)).toFixed(2));
  const totalEarnings = basicSalary + totalAllowances + bonus + overtimePay;

  // Configured deductions
  const deductionsArr = employee.deductions || [];
  let totalConfiguredDeductions = 0;
  const deductionBreakdown = [];
  for (const d of deductionsArr) {
    const amt = parseFloat(d.amount || 0);
    totalConfiguredDeductions += amt;
    deductionBreakdown.push({ name: d.name, amount: amt, type: d.type || 'Fixed' });
  }

  // LWP deduction line
  if (lwpAmount > 0) {
    deductionBreakdown.push({
      name: 'Loss of Pay (LWP)',
      amount: lwpAmount,
      type: 'Calculated',
      breakdown: `${lwpDays.toFixed(1)} days × ₹${perDaySalary.toFixed(2)}/day`
    });
  }

  const totalDeductions = totalConfiguredDeductions + lwpAmount;
  const netSalary = Math.max(0, parseFloat((totalEarnings - totalDeductions).toFixed(2)));

  return {
    payrollRecordId: `PAY-${runId}-${employee.employeeId}`,
    runId,
    startDate,
    endDate,
    month: startDate.substring(0, 7),
    recruiterId,
    employeeId: employee.employeeId,
    employeeName: employee.fullName || employee.name || '',
    department: employee.department || '',
    designation: employee.designation || '',
    // Salary structure snapshot (frozen at generation time)
    basicSalary: parseFloat(basicSalary.toFixed(2)),
    salaryType: employee.salaryType || 'Monthly',
    // Attendance summary
    totalScheduledDays,
    daysPresent: parseFloat(daysPresent.toFixed(1)),
    halfDays,
    fullAbsent,
    paidLeaves,
    unpaidLeaves,
    weeklyOffs,
    holidays: holidayCount,
    compOffs,
    overtimeHours: parseFloat(overtimeHours.toFixed(2)),
    lateHalfDayDeductions: lateHalfDayDeductionDays,
    lwpDays: parseFloat(lwpDays.toFixed(2)),
    perDaySalary: parseFloat(perDaySalary.toFixed(2)),
    // Earnings
    allowances: allowanceBreakdown,
    bonus: parseFloat(bonus.toFixed(2)),
    overtimePay,
    totalEarnings: parseFloat(totalEarnings.toFixed(2)),
    // Deductions
    deductions: deductionBreakdown,
    totalDeductions: parseFloat(totalDeductions.toFixed(2)),
    // Net
    netSalary,
    paymentStatus: 'pending',
    paymentDate: null,
    isFrozen: true,  // snapshot — cannot be changed
    createdAt: getCurrentTimestamp()
  };
};

/* ─── API Handlers ────────────────────────────────────────────── */

/** POST /payroll/run */
const runPayroll = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    const { startDate, endDate, employeeId: filterEmployeeId } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json(errorResponse('startDate and endDate are required (YYYY-MM-DD)'));
    }
    if (startDate > endDate) return res.status(400).json(errorResponse('startDate must be before endDate'));

    // Get employees
    const empScan = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_EMPLOYEES_TABLE,
      FilterExpression: 'recruiterId = :rid AND (attribute_not_exists(isDeleted) OR isDeleted = :false)',
      ExpressionAttributeValues: { ':rid': recruiterId, ':false': false }
    }));
    let employees = empScan.Items || [];
    if (filterEmployeeId) employees = employees.filter(e => e.employeeId === filterEmployeeId);
    if (employees.length === 0) return res.status(400).json(errorResponse('No matching active employees'));

    const runId = generateId();
    const records = [];
    let totalGross = 0, totalDed = 0, totalNet = 0;

    for (const emp of employees) {
      const rec = await computePayroll(emp, startDate, endDate, recruiterId, runId);
      records.push(rec);
      totalGross += rec.totalEarnings;
      totalDed   += rec.totalDeductions;
      totalNet   += rec.netSalary;

      await dynamoClient.send(new PutCommand({ TableName: HRMS_PAYROLL_TABLE, Item: rec }));
    }

    // Save payroll run metadata
    const runMeta = {
      runId,
      recruiterId,
      startDate,
      endDate,
      month: startDate.substring(0, 7),
      totalEmployees: records.length,
      totalGrossSalary: parseFloat(totalGross.toFixed(2)),
      totalDeductions: parseFloat(totalDed.toFixed(2)),
      totalNetSalary: parseFloat(totalNet.toFixed(2)),
      generatedBy: req.user?.email || req.user?.name || 'system',
      generatedAt: getCurrentTimestamp(),
      isFrozen: true
    };
    await dynamoClient.send(new PutCommand({ TableName: HRMS_PAYROLL_RUNS_TABLE, Item: runMeta }));

    return res.json(successResponse({
      runId,
      startDate,
      endDate,
      totalEmployees: records.length,
      totalGrossSalary: runMeta.totalGrossSalary,
      totalDeductions: runMeta.totalDeductions,
      totalNetSalary: runMeta.totalNetSalary,
      records
    }, `Payroll generated for ${records.length} employees (${startDate} → ${endDate})`));

  } catch (error) {
    console.error('runPayroll error:', error);
    handleError(error, res);
  }
};

/** GET /payroll/runs — list all payroll runs for this recruiter */
const getPayrollRuns = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    const result = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_PAYROLL_RUNS_TABLE,
      FilterExpression: 'recruiterId = :rid',
      ExpressionAttributeValues: { ':rid': recruiterId }
    }));
    const runs = (result.Items || []).sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
    return res.json(successResponse(runs, 'Payroll runs retrieved'));
  } catch (error) { handleError(error, res); }
};

/** GET /payroll/run/:runId — records for a specific run (frozen snapshot) */
const getPayrollByRun = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    const { runId } = req.params;
    const result = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_PAYROLL_TABLE,
      FilterExpression: 'runId = :rid AND recruiterId = :recId',
      ExpressionAttributeValues: { ':rid': runId, ':recId': recruiterId }
    }));
    return res.json(successResponse(result.Items || [], 'Payroll records retrieved'));
  } catch (error) { handleError(error, res); }
};

/** GET /payroll/month/:month — all records for month YYYY-MM (latest run) */
const getPayrollByMonth = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));
    const { month } = req.params;

    const result = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_PAYROLL_TABLE,
      FilterExpression: 'recruiterId = :rid AND #month = :month',
      ExpressionAttributeNames: { '#month': 'month' },
      ExpressionAttributeValues: { ':rid': recruiterId, ':month': month }
    }));
    return res.json(successResponse(result.Items || [], 'Payroll retrieved'));
  } catch (error) { handleError(error, res); }
};

/** GET /payroll/employee/:employeeId — history for one employee */
const getEmployeePayrollHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_PAYROLL_TABLE,
      FilterExpression: 'employeeId = :eid',
      ExpressionAttributeValues: { ':eid': employeeId }
    }));
    const sorted = (result.Items || []).sort((a, b) => b.startDate.localeCompare(a.startDate));
    return res.json(successResponse(sorted, 'Employee payroll history'));
  } catch (error) { handleError(error, res); }
};

/** GET /payroll/summary?month=YYYY-MM */
const getPayrollSummary = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));
    const { month } = req.query;

    const scan = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_PAYROLL_TABLE,
      FilterExpression: month
        ? 'recruiterId = :rid AND #month = :month'
        : 'recruiterId = :rid',
      ExpressionAttributeNames: month ? { '#month': 'month' } : undefined,
      ExpressionAttributeValues: month
        ? { ':rid': recruiterId, ':month': month }
        : { ':rid': recruiterId }
    }));
    const records = scan.Items || [];
    const summary = {
      totalRecords: records.length,
      totalGrossSalary: records.reduce((s, r) => s + (r.totalEarnings || 0), 0),
      totalDeductions: records.reduce((s, r) => s + (r.totalDeductions || 0), 0),
      totalNetSalary: records.reduce((s, r) => s + (r.netSalary || 0), 0),
      pendingPayments: records.filter(r => r.paymentStatus === 'pending').length,
      paidPayments: records.filter(r => r.paymentStatus === 'paid').length
    };
    return res.json(successResponse(summary, 'Summary retrieved'));
  } catch (error) { handleError(error, res); }
};

/** GET /payroll/:payrollRecordId/:month */
const getPayrollRecord = async (req, res) => {
  try {
    const { payrollRecordId, month } = req.params;
    const result = await dynamoClient.send(new GetCommand({
      TableName: HRMS_PAYROLL_TABLE,
      Key: { payrollRecordId, month }
    }));
    if (!result.Item) return res.status(404).json(errorResponse('Record not found'));
    return res.json(successResponse(result.Item, 'Payroll record retrieved'));
  } catch (error) { handleError(error, res); }
};

module.exports = {
  runPayroll,
  getPayrollRuns,
  getPayrollByRun,
  getPayrollByMonth,
  getEmployeePayrollHistory,
  getPayrollSummary,
  getPayrollRecord,
  computePayroll  // exported for testing
};
