/**
 * HRMS Separation Management Controller — Enterprise Grade
 * Handles: Separation records, No Dues Clearance (NDC), Employee self-service
 * NDC Departments: IT, Admin, Media, Project, Accounts, HR
 */
const {
  dynamoClient, isUsingMockDB, mockDB,
  HRMS_EMPLOYEES_TABLE, HRMS_LEAVES_TABLE, HRMS_ATTENDANCE_TABLE,
  HRMS_PAYROLL_TABLE, HRMS_ORGANIZATION_CHART_TABLE
} = require('../../config/dynamodb-wrapper');
const { PutCommand, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

const HRMS_SEPARATION_TABLE = 'HRMS-seperation-table';   // existing (typo preserved)
const HRMS_NDC_TABLE        = 'staffinn-hrms-no-dues-clearance';

/* ─── Helpers ───────────────────────────────────────────────────────────── */

async function getSeparationRecord(separationId) {
  if (isUsingMockDB()) return mockDB().get(HRMS_SEPARATION_TABLE, separationId);
  const result = await dynamoClient.send(new ScanCommand({
    TableName: HRMS_SEPARATION_TABLE,
    FilterExpression: 'separationId = :sid',
    ExpressionAttributeValues: { ':sid': separationId }
  }));
  return result.Items && result.Items.length > 0 ? result.Items[0] : null;
}

async function saveSeparationRecord(separation) {
  if (isUsingMockDB()) { mockDB().put(HRMS_SEPARATION_TABLE, separation); return; }
  await dynamoClient.send(new PutCommand({ TableName: HRMS_SEPARATION_TABLE, Item: separation }));
}

async function getNDCRecord(ndcId) {
  if (isUsingMockDB()) return mockDB().get(HRMS_NDC_TABLE, ndcId);
  const result = await dynamoClient.send(new ScanCommand({
    TableName: HRMS_NDC_TABLE,
    FilterExpression: 'ndcId = :nid',
    ExpressionAttributeValues: { ':nid': ndcId }
  }));
  return result.Items && result.Items.length > 0 ? result.Items[0] : null;
}

async function getNDCBySeparationId(separationId) {
  if (isUsingMockDB()) return mockDB().scan(HRMS_NDC_TABLE).find(n => n.separationId === separationId) || null;
  const result = await dynamoClient.send(new ScanCommand({
    TableName: HRMS_NDC_TABLE,
    FilterExpression: 'separationId = :sid',
    ExpressionAttributeValues: { ':sid': separationId }
  }));
  return result.Items && result.Items.length > 0 ? result.Items[0] : null;
}

async function saveNDCRecord(ndc) {
  if (isUsingMockDB()) { mockDB().put(HRMS_NDC_TABLE, ndc); return; }
  await dynamoClient.send(new PutCommand({ TableName: HRMS_NDC_TABLE, Item: ndc }));
}

// Fetch employee details from employees table
async function fetchEmployeeData(employeeId) {
  try {
    const result = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_EMPLOYEES_TABLE,
      FilterExpression: 'employeeId = :eid',
      ExpressionAttributeValues: { ':eid': employeeId }
    }));
    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  } catch { return null; }
}

// Fetch leave balance for encashment
async function fetchLeaveBalance(employeeId) {
  try {
    const result = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_LEAVES_TABLE || 'HRMS-Leaves-Table',
      FilterExpression: 'employeeId = :eid AND entityType = :type',
      ExpressionAttributeValues: { ':eid': employeeId, ':type': 'BALANCE' }
    }));
    const items = result.Items || [];
    const total = items.reduce((sum, b) => sum + (parseFloat(b.remaining) || 0), 0);
    return { balances: items, totalRemaining: total };
  } catch { return { balances: [], totalRemaining: 0 }; }
}

// Fetch pending claims for F&F
async function fetchPendingClaims(employeeId, recruiterId) {
  try {
    const result = await dynamoClient.send(new ScanCommand({
      TableName: 'HRMS-Claim-Management',
      FilterExpression: 'entityType = :type AND recruiterId = :rid AND employeeId = :eid AND #st IN (:p, :u)',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':type': 'CLAIM', ':rid': recruiterId, ':eid': employeeId,
        ':p': 'Pending', ':u': 'Under Review'
      }
    }));
    const items = result.Items || [];
    const total = items.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    return { claims: items, totalPending: total };
  } catch { return { claims: [], totalPending: 0 }; }
}

// Fetch last payroll record for salary payable
async function fetchLastPayroll(employeeId, recruiterId) {
  try {
    const result = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_PAYROLL_TABLE || 'staffinn-hrms-payroll',
      FilterExpression: 'employeeId = :eid AND recruiterId = :rid',
      ExpressionAttributeValues: { ':eid': employeeId, ':rid': recruiterId }
    }));
    if (!result.Items || result.Items.length === 0) return null;
    result.Items.sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));
    return result.Items[0];
  } catch { return null; }
}

// Fetch reporting manager name from org chart
async function fetchReportingManager(employeeId, recruiterId) {
  try {
    const nodeResult = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_ORGANIZATION_CHART_TABLE || 'staffinn-hrms-organization-chart',
      FilterExpression: 'employeeId = :eid AND recruiterId = :rid',
      ExpressionAttributeValues: { ':eid': employeeId, ':rid': recruiterId }
    }));
    if (!nodeResult.Items || nodeResult.Items.length === 0) return null;
    const node = nodeResult.Items[0];
    if (!node.parentId) return null;
    const parentResult = await dynamoClient.send(new ScanCommand({
      TableName: HRMS_ORGANIZATION_CHART_TABLE || 'staffinn-hrms-organization-chart',
      FilterExpression: 'nodeId = :nid',
      ExpressionAttributeValues: { ':nid': node.parentId }
    }));
    if (!parentResult.Items || parentResult.Items.length === 0) return null;
    const parentNode = parentResult.Items[0];
    const mgr = await fetchEmployeeData(parentNode.employeeId);
    return mgr ? { employeeId: mgr.employeeId, name: mgr.fullName || mgr.name || '' } : null;
  } catch { return null; }
}

/* ─── Build default NDC structure ──────────────────────────────────────── */
function buildDefaultNDC({ ndcId, separationId, recruiterId, employeeId, employeeName, department, designation, dateOfJoining, lastWorkingDate, exitType, reportingManager }) {
  return {
    ndcId,
    separationId,
    recruiterId,
    employeeId,
    // Employee Details (auto-fetched)
    employeeDetails: {
      employeeName: employeeName || '',
      employeeId,
      department: department || '',
      designation: designation || '',
      dateOfJoining: dateOfJoining || '',
      lastWorkingDate: lastWorkingDate || '',
      reportingManager: reportingManager || '',
      exitType: exitType || 'Resignation'
    },
    // 1. IT Department & Administration
    itClearance: {
      status: 'Pending',    // Pending | Approved | Rejected
      approvedBy: null, approvedByName: null, approvedAt: null,
      remarks: '',
      assets: {
        laptop:       { issued: false, returned: false },
        mouse:        { issued: false, returned: false },
        charger:      { issued: false, returned: false },
        mobileSim:    { issued: false, returned: false },
        otherIT:      { issued: false, returned: false },
        idCard:       { issued: false, returned: false },
        accessCard:   { issued: false, returned: false },
        officeKeys:   { issued: false, returned: false },
        uniform:      { issued: false, returned: false },
        visitorCard:  { issued: false, returned: false },
        otherAssets:  { issued: false, returned: false }
      },
      systemAccess: {
        emailDisabled:         false,
        hrmsAccessDisabled:    false,
        googleWorkspaceDisabled: false,
        softwareLicensesRevoked: false,
        vpnAccessDisabled:     false
      }
    },
    // 3. Media Department
    mediaClearance: {
      status: 'Pending',
      approvedBy: null, approvedByName: null, approvedAt: null,
      remarks: '',
      equipment: {
        camera:      { issued: false, returned: false },
        tripod:      { issued: false, returned: false },
        memoryCard:  { issued: false, returned: false },
        brandingKit: { issued: false, returned: false }
      },
      digitalAssets: {
        creativeFilesSubmitted:      false,
        projectFilesUploaded:        false,
        socialMediaCredentialsHandedOver: false
      }
    },
    // 4. Project Department
    projectClearance: {
      status: 'Pending',
      approvedBy: null, approvedByName: null, approvedAt: null,
      remarks: '',
      projects: [],    // auto-fetched from tasks module
      tasksSummary: {
        totalAssigned: 0, completed: 0, pending: 0, delayed: 0
      },
      documents: {
        clientDocumentsSubmitted: false,
        reportsSubmitted:         false,
        handoverCompleted:        false
      }
    },
    // 5. Accounts Department
    accountsClearance: {
      status: 'Pending',
      approvedBy: null, approvedByName: null, approvedAt: null,
      remarks: '',
      financialSummary: {
        salaryPayable:          0,   // auto from payroll
        expenseClaimsPending:   0,   // auto from claims
        advanceOutstanding:     0,
        loanRecovery:           0,
        assetRecovery:          0,
        fullFinalAmount:        0
      }
    },
    // 6. HR Department
    hrClearance: {
      status: 'Pending',
      approvedBy: null, approvedByName: null, approvedAt: null,
      remarks: '',
      checklist: {
        exitInterviewDone:         false,
        resignationAccepted:       false,
        attendanceUpdated:         false,
        leaveBalanceVerified:      false,
        noticePeriodCompleted:     false,
        experienceLetterGenerated: false,
        relievingLetterGenerated:  false
      },
      leaveBalance: 0    // auto from leave module
    },
    // Employee Declaration
    employeeDeclaration: {
      signed: false,
      signedAt: null,
      text: 'I confirm that I have returned all company assets, completed the required knowledge transfer, and have no company property, documents, or confidential information in my possession.'
    },
    // Final HR Approval
    finalClearance: {
      status: 'Pending',   // Pending | Cleared | Not Cleared
      approvedBy: null, approvedByName: null, approvedAt: null,
      reason: ''
    },
    overallStatus: 'In Progress',  // In Progress | Cleared | Not Cleared
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp()
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   SEPARATION RECORD CRUD
   ═══════════════════════════════════════════════════════════════════════════ */

// POST /hrms/separation/  — HR Admin creates separation record
const createSeparation = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));

    const { employeeId, employeeName, department, designation, exitType, resignationReason,
            lastWorkingDate, noticePeriodDays, resignationDocuments } = req.body;

    if (!employeeId || !resignationReason || !lastWorkingDate) {
      return res.status(400).json(errorResponse('Missing required fields'));
    }

    // Auto-fetch employee data if not provided
    let empName = employeeName, empDept = department, empDesig = designation;
    if (!empName || !empDept) {
      const emp = await fetchEmployeeData(employeeId);
      if (emp) {
        empName  = empName  || emp.fullName || emp.name || '';
        empDept  = empDept  || emp.department || '';
        empDesig = empDesig || emp.designation || '';
      }
    }

    const separationId = generateId();
    const noticeStart  = getCurrentTimestamp();
    const separation   = {
      seperationtable: separationId,   // PK field (typo preserved for existing table)
      separationId,
      recruiterId,
      employeeId,
      employeeName:  empName,
      department:    empDept,
      designation:   empDesig,
      exitType:      exitType || 'Resignation',
      resignationReason,
      lastWorkingDate,
      resignationDate: noticeStart,
      resignationStatus: 'Initiated',   // Initiated → Manager Approved → HR Accepted → In Notice Period → Completed
      initiatedBy: 'hr',
      resignationDocuments: resignationDocuments || [],
      noticePeriod: {
        days:             noticePeriodDays || 30,
        startDate:        noticeStart,
        endDate:          lastWorkingDate,
        remainingDays:    noticePeriodDays || 30,
        earlyRelease:     false,
        absconding:       false,
        handoverCompleted: false
      },
      exitInterview: { status: 'Pending', scheduledDate: null, responses: [], hrRemarks: '' },
      fnfSettlement: { status: 'Pending', finalSalary: 0, leaveEncashment: 0, loanDeductions: 0, noticeShortfall: 0, bonus: 0, totalPayable: 0 },
      exitDocuments: { experienceLetter: null, relievingLetter: null, noDuesCertificate: null, salaryCertificate: null },
      finalRating:   { rating: 0, feedback: '', ratedBy: '', ratedByName: '' },
      ndcGenerated:  false,
      ndcId:         null,
      remarks:       [],
      statusHistory: [{ status: 'Initiated', changedBy: req.user.userId, changedByName: req.user.name, timestamp: getCurrentTimestamp() }],
      createdBy:     req.user.userId,
      createdByName: req.user.name,
      createdAt:     getCurrentTimestamp(),
      updatedAt:     getCurrentTimestamp()
    };

    await saveSeparationRecord(separation);
    res.status(201).json(successResponse(separation, 'Separation record created successfully'));
  } catch (error) { handleError(error, res); }
};

// POST /hrms/separation/employee-initiated  — Employee submits own resignation
const employeeInitiatedResignation = async (req, res) => {
  try {
    const recruiterId = req.user?.companyId || req.user?.recruiterId;
    const employeeId  = req.user?.employeeId;
    if (!recruiterId || !employeeId) return res.status(400).json(errorResponse('Auth data missing'));

    const { resignationReason, lastWorkingDate, noticePeriodDays } = req.body;
    if (!resignationReason || !lastWorkingDate) return res.status(400).json(errorResponse('Missing required fields'));

    // Check no active separation exists
    if (!isUsingMockDB()) {
      const existing = await dynamoClient.send(new ScanCommand({
        TableName: HRMS_SEPARATION_TABLE,
        FilterExpression: 'recruiterId = :rid AND employeeId = :eid AND resignationStatus IN (:i, :ma, :ha, :np)',
        ExpressionAttributeValues: { ':rid': recruiterId, ':eid': employeeId, ':i': 'Initiated', ':ma': 'Manager Approved', ':ha': 'HR Accepted', ':np': 'In Notice Period' }
      }));
      if (existing.Items && existing.Items.length > 0) return res.status(400).json(errorResponse('An active separation record already exists for this employee'));
    }

    const emp = await fetchEmployeeData(employeeId);
    const separationId = generateId();
    const separation   = {
      seperationtable: separationId,
      separationId,
      recruiterId,
      employeeId,
      employeeName:  emp ? (emp.fullName || emp.name || '') : '',
      department:    emp ? (emp.department || '') : '',
      designation:   emp ? (emp.designation || '') : '',
      exitType:      'Resignation',
      resignationReason,
      lastWorkingDate,
      resignationDate: getCurrentTimestamp(),
      resignationStatus: 'Initiated',
      initiatedBy: 'employee',
      resignationDocuments: [],
      noticePeriod: {
        days: noticePeriodDays || 30, startDate: getCurrentTimestamp(),
        endDate: lastWorkingDate, remainingDays: noticePeriodDays || 30,
        earlyRelease: false, absconding: false, handoverCompleted: false
      },
      exitInterview: { status: 'Pending', scheduledDate: null, responses: [], hrRemarks: '' },
      fnfSettlement: { status: 'Pending', finalSalary: 0, leaveEncashment: 0, loanDeductions: 0, noticeShortfall: 0, bonus: 0, totalPayable: 0 },
      exitDocuments: { experienceLetter: null, relievingLetter: null, noDuesCertificate: null, salaryCertificate: null },
      finalRating:   { rating: 0, feedback: '', ratedBy: '', ratedByName: '' },
      ndcGenerated: false, ndcId: null,
      remarks: [],
      statusHistory: [{ status: 'Initiated', changedBy: employeeId, changedByName: emp ? (emp.fullName || '') : '', timestamp: getCurrentTimestamp() }],
      createdBy:     employeeId,
      createdByName: emp ? (emp.fullName || '') : '',
      createdAt:     getCurrentTimestamp(),
      updatedAt:     getCurrentTimestamp()
    };

    await saveSeparationRecord(separation);
    res.status(201).json(successResponse(separation, 'Resignation submitted successfully'));
  } catch (error) { handleError(error, res); }
};

// GET /hrms/separation  — HR Admin list
const getSeparations = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    if (!recruiterId) return res.status(400).json(errorResponse('Recruiter ID not found'));
    const { employeeId, status, department, startDate, endDate } = req.query;
    let separations;
    if (isUsingMockDB()) {
      separations = mockDB().scan(HRMS_SEPARATION_TABLE).filter(s => s.recruiterId === recruiterId);
    } else {
      const result = await dynamoClient.send(new ScanCommand({
        TableName: HRMS_SEPARATION_TABLE,
        FilterExpression: 'recruiterId = :rid',
        ExpressionAttributeValues: { ':rid': recruiterId }
      }));
      separations = result.Items || [];
    }
    if (employeeId) separations = separations.filter(s => s.employeeId === employeeId);
    if (status)     separations = separations.filter(s => s.resignationStatus === status);
    if (department) separations = separations.filter(s => s.department === department);
    if (startDate)  separations = separations.filter(s => new Date(s.createdAt) >= new Date(startDate));
    if (endDate)    separations = separations.filter(s => new Date(s.createdAt) <= new Date(endDate));
    separations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(successResponse(separations, 'Separations retrieved'));
  } catch (error) { handleError(error, res); }
};

// GET /hrms/separation/:separationId
const getSeparationById = async (req, res) => {
  try {
    const { separationId } = req.params;
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    const separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Separation record not found'));
    if (separation.recruiterId !== recruiterId) return res.status(403).json(errorResponse('Forbidden'));
    res.json(successResponse(separation, 'Separation retrieved'));
  } catch (error) { handleError(error, res); }
};

// GET /hrms/separation/stats
const getSeparationStats = async (req, res) => {
  try {
    const recruiterId = req.user?.recruiterId || req.user?.userId;
    let separations;
    if (isUsingMockDB()) {
      separations = mockDB().scan(HRMS_SEPARATION_TABLE).filter(s => s.recruiterId === recruiterId);
    } else {
      const result = await dynamoClient.send(new ScanCommand({
        TableName: HRMS_SEPARATION_TABLE,
        FilterExpression: 'recruiterId = :rid',
        ExpressionAttributeValues: { ':rid': recruiterId }
      }));
      separations = result.Items || [];
    }
    const stats = {
      total:               separations.length,
      active:              separations.filter(s => ['Initiated','Manager Approved','HR Accepted','In Notice Period'].includes(s.resignationStatus)).length,
      inNoticePeriod:      separations.filter(s => s.resignationStatus === 'In Notice Period').length,
      pendingFnF:          separations.filter(s => s.fnfSettlement?.status === 'Pending' || s.fnfSettlement?.status === 'In Process').length,
      pendingExitInterview: separations.filter(s => s.exitInterview?.status === 'Pending').length,
      completed:           separations.filter(s => s.resignationStatus === 'Completed').length,
      ndcPending:          separations.filter(s => s.ndcGenerated && s.resignationStatus !== 'Completed').length
    };
    const deptBreakdown = {};
    separations.forEach(s => { if (s.department) deptBreakdown[s.department] = (deptBreakdown[s.department] || 0) + 1; });
    res.json(successResponse({ stats, departmentBreakdown: deptBreakdown }, 'Stats retrieved'));
  } catch (error) { handleError(error, res); }
};

// PUT /hrms/separation/:separationId/status
const updateResignationStatus = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { status, remark } = req.body;
    if (!status) return res.status(400).json(errorResponse('Status is required'));

    let separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Separation record not found'));

    const statusHistory = [...(separation.statusHistory || [])];
    statusHistory.push({ status, changedBy: req.user.userId, changedByName: req.user.name, timestamp: getCurrentTimestamp(), remark: remark || '' });

    const remarks = [...(separation.remarks || [])];
    if (remark) remarks.push({ text: remark, addedBy: req.user.userId, addedByName: req.user.name, timestamp: getCurrentTimestamp() });

    const updated = { ...separation, resignationStatus: status, remarks, statusHistory, updatedAt: getCurrentTimestamp() };
    await saveSeparationRecord(updated);
    res.json(successResponse(updated, 'Status updated successfully'));
  } catch (error) { handleError(error, res); }
};

// PUT /hrms/separation/:separationId/notice-period
const updateNoticePeriod = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { earlyRelease, absconding, handoverCompleted } = req.body;
    let separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Not found'));
    const updated = {
      ...separation,
      noticePeriod: {
        ...separation.noticePeriod,
        earlyRelease:      earlyRelease      !== undefined ? earlyRelease      : separation.noticePeriod.earlyRelease,
        absconding:        absconding        !== undefined ? absconding        : separation.noticePeriod.absconding,
        handoverCompleted: handoverCompleted !== undefined ? handoverCompleted : separation.noticePeriod.handoverCompleted
      },
      updatedAt: getCurrentTimestamp()
    };
    await saveSeparationRecord(updated);
    res.json(successResponse(updated, 'Notice period updated'));
  } catch (error) { handleError(error, res); }
};

// PUT /hrms/separation/:separationId/exit-interview
const updateExitInterview = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { status, scheduledDate, responses, hrRemarks } = req.body;
    let separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Not found'));
    const updated = {
      ...separation,
      exitInterview: {
        status:        status        || separation.exitInterview.status,
        scheduledDate: scheduledDate || separation.exitInterview.scheduledDate,
        responses:     responses     || separation.exitInterview.responses,
        hrRemarks:     hrRemarks     || separation.exitInterview.hrRemarks,
        completedAt:   status === 'Completed' ? getCurrentTimestamp() : separation.exitInterview.completedAt
      },
      updatedAt: getCurrentTimestamp()
    };
    await saveSeparationRecord(updated);
    res.json(successResponse(updated, 'Exit interview updated'));
  } catch (error) { handleError(error, res); }
};

// PUT /hrms/separation/:separationId/fnf-settlement
const updateFnFSettlement = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { status, finalSalary, leaveEncashment, loanDeductions, noticeShortfall, bonus } = req.body;
    let separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Not found'));
    const fs = finalSalary      !== undefined ? finalSalary      : separation.fnfSettlement.finalSalary;
    const le = leaveEncashment  !== undefined ? leaveEncashment  : separation.fnfSettlement.leaveEncashment;
    const ld = loanDeductions   !== undefined ? loanDeductions   : separation.fnfSettlement.loanDeductions;
    const ns = noticeShortfall  !== undefined ? noticeShortfall  : separation.fnfSettlement.noticeShortfall;
    const bn = bonus            !== undefined ? bonus            : separation.fnfSettlement.bonus;
    const totalPayable = (fs + le + bn) - (ld + ns);
    const updated = {
      ...separation,
      fnfSettlement: { status: status || separation.fnfSettlement.status, finalSalary: fs, leaveEncashment: le, loanDeductions: ld, noticeShortfall: ns, bonus: bn, totalPayable, completedAt: status === 'Completed' ? getCurrentTimestamp() : separation.fnfSettlement.completedAt },
      updatedAt: getCurrentTimestamp()
    };
    await saveSeparationRecord(updated);
    res.json(successResponse(updated, 'F&F settlement updated'));
  } catch (error) { handleError(error, res); }
};

// PUT /hrms/separation/:separationId/exit-documents
const updateExitDocuments = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { experienceLetter, relievingLetter, noDuesCertificate, salaryCertificate } = req.body;
    let separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Not found'));
    const updated = {
      ...separation,
      exitDocuments: {
        experienceLetter: experienceLetter || separation.exitDocuments.experienceLetter,
        relievingLetter:  relievingLetter  || separation.exitDocuments.relievingLetter,
        noDuesCertificate: noDuesCertificate || separation.exitDocuments.noDuesCertificate,
        salaryCertificate: salaryCertificate || separation.exitDocuments.salaryCertificate
      },
      updatedAt: getCurrentTimestamp()
    };
    await saveSeparationRecord(updated);
    res.json(successResponse(updated, 'Exit documents updated'));
  } catch (error) { handleError(error, res); }
};

// PUT /hrms/separation/:separationId/final-rating
const updateFinalRating = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { rating, feedback } = req.body;
    if (!rating) return res.status(400).json(errorResponse('Rating is required'));
    let separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Not found'));
    const updated = {
      ...separation,
      finalRating: { rating, feedback: feedback || '', ratedBy: req.user.userId, ratedByName: req.user.name, ratedAt: getCurrentTimestamp() },
      updatedAt: getCurrentTimestamp()
    };
    await saveSeparationRecord(updated);
    res.json(successResponse(updated, 'Final rating updated'));
  } catch (error) { handleError(error, res); }
};

/* ═══════════════════════════════════════════════════════════════════════════
   NO DUES CLEARANCE (NDC) CONTROLLERS
   ═══════════════════════════════════════════════════════════════════════════ */

// POST /hrms/separation/:separationId/generate-ndc
// Auto-generates NDC form after HR formally accepts separation
const generateNDC = async (req, res) => {
  try {
    const { separationId } = req.params;
    const recruiterId = req.user?.recruiterId || req.user?.userId;

    const separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Separation record not found'));
    if (separation.recruiterId !== recruiterId) return res.status(403).json(errorResponse('Forbidden'));

    // Idempotent — return existing NDC if already generated
    if (separation.ndcGenerated && separation.ndcId) {
      const existingNDC = await getNDCRecord(separation.ndcId);
      if (existingNDC) return res.json(successResponse(existingNDC, 'NDC already exists'));
    }

    // Auto-fetch employee details
    const emp = await fetchEmployeeData(separation.employeeId);
    const manager = await fetchReportingManager(separation.employeeId, recruiterId);
    const leaveData = await fetchLeaveBalance(separation.employeeId);
    const claimsData = await fetchPendingClaims(separation.employeeId, recruiterId);
    const lastPayroll = await fetchLastPayroll(separation.employeeId, recruiterId);

    const ndcId = generateId();
    const ndc = buildDefaultNDC({
      ndcId,
      separationId,
      recruiterId,
      employeeId:      separation.employeeId,
      employeeName:    emp ? (emp.fullName || emp.name || separation.employeeName) : separation.employeeName,
      department:      emp ? (emp.department || separation.department) : separation.department,
      designation:     emp ? (emp.designation || separation.designation || '') : (separation.designation || ''),
      dateOfJoining:   emp ? (emp.dateOfJoining || '') : '',
      lastWorkingDate: separation.lastWorkingDate,
      exitType:        separation.exitType || 'Resignation',
      reportingManager: manager ? manager.name : ''
    });

    // Pre-fill financial data from existing modules
    ndc.accountsClearance.financialSummary.salaryPayable        = lastPayroll ? (lastPayroll.netSalary || 0) : 0;
    ndc.accountsClearance.financialSummary.expenseClaimsPending = claimsData.totalPending;
    ndc.hrClearance.leaveBalance                                = leaveData.totalRemaining;

    // Pre-fill HR checklist if resignation was accepted
    if (['HR Accepted','In Notice Period','Completed'].includes(separation.resignationStatus)) {
      ndc.hrClearance.checklist.resignationAccepted = true;
    }

    await saveNDCRecord(ndc);

    // Update separation record to link NDC
    const updatedSeparation = { ...separation, ndcGenerated: true, ndcId, updatedAt: getCurrentTimestamp() };
    await saveSeparationRecord(updatedSeparation);

    res.status(201).json(successResponse(ndc, 'No Dues Clearance generated successfully'));
  } catch (error) { handleError(error, res); }
};

// GET /hrms/separation/:separationId/ndc
const getNDC = async (req, res) => {
  try {
    const { separationId } = req.params;
    const recruiterId = req.user?.recruiterId || req.user?.userId;

    const separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Separation not found'));
    if (separation.recruiterId !== recruiterId) return res.status(403).json(errorResponse('Forbidden'));

    if (!separation.ndcId) return res.status(404).json(errorResponse('NDC not yet generated for this separation'));

    const ndc = await getNDCRecord(separation.ndcId);
    if (!ndc) return res.status(404).json(errorResponse('NDC record not found'));

    res.json(successResponse(ndc, 'NDC retrieved'));
  } catch (error) { handleError(error, res); }
};

// PUT /hrms/separation/:separationId/ndc/it  — IT dept updates IT clearance
const updateITClearance = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { assets, systemAccess, remarks, status } = req.body;
    const separation = await getSeparationRecord(separationId);
    if (!separation || !separation.ndcId) return res.status(404).json(errorResponse('NDC not found'));
    const ndc = await getNDCRecord(separation.ndcId);
    if (!ndc) return res.status(404).json(errorResponse('NDC record not found'));

    const updatedNDC = {
      ...ndc,
      itClearance: {
        ...ndc.itClearance,
        assets:       assets       || ndc.itClearance.assets,
        systemAccess: systemAccess || ndc.itClearance.systemAccess,
        remarks:      remarks      !== undefined ? remarks : ndc.itClearance.remarks,
        status:       status       || ndc.itClearance.status,
        approvedBy:   status && status !== 'Pending' ? req.user.userId   : ndc.itClearance.approvedBy,
        approvedByName: status && status !== 'Pending' ? req.user.name   : ndc.itClearance.approvedByName,
        approvedAt:   status && status !== 'Pending' ? getCurrentTimestamp() : ndc.itClearance.approvedAt
      },
      updatedAt: getCurrentTimestamp()
    };
    updatedNDC.overallStatus = computeOverallNDCStatus(updatedNDC);
    await saveNDCRecord(updatedNDC);
    res.json(successResponse(updatedNDC, 'IT clearance updated'));
  } catch (error) { handleError(error, res); }
};

// PUT /hrms/separation/:separationId/ndc/media
const updateMediaClearance = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { equipment, digitalAssets, remarks, status } = req.body;
    const separation = await getSeparationRecord(separationId);
    if (!separation || !separation.ndcId) return res.status(404).json(errorResponse('NDC not found'));
    const ndc = await getNDCRecord(separation.ndcId);
    if (!ndc) return res.status(404).json(errorResponse('NDC record not found'));

    const updatedNDC = {
      ...ndc,
      mediaClearance: {
        ...ndc.mediaClearance,
        equipment:    equipment    || ndc.mediaClearance.equipment,
        digitalAssets: digitalAssets || ndc.mediaClearance.digitalAssets,
        remarks:      remarks      !== undefined ? remarks : ndc.mediaClearance.remarks,
        status:       status       || ndc.mediaClearance.status,
        approvedBy:   status && status !== 'Pending' ? req.user.userId : ndc.mediaClearance.approvedBy,
        approvedByName: status && status !== 'Pending' ? req.user.name : ndc.mediaClearance.approvedByName,
        approvedAt:   status && status !== 'Pending' ? getCurrentTimestamp() : ndc.mediaClearance.approvedAt
      },
      updatedAt: getCurrentTimestamp()
    };
    updatedNDC.overallStatus = computeOverallNDCStatus(updatedNDC);
    await saveNDCRecord(updatedNDC);
    res.json(successResponse(updatedNDC, 'Media clearance updated'));
  } catch (error) { handleError(error, res); }
};

// PUT /hrms/separation/:separationId/ndc/project
const updateProjectClearance = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { documents, tasksSummary, remarks, status } = req.body;
    const separation = await getSeparationRecord(separationId);
    if (!separation || !separation.ndcId) return res.status(404).json(errorResponse('NDC not found'));
    const ndc = await getNDCRecord(separation.ndcId);
    if (!ndc) return res.status(404).json(errorResponse('NDC record not found'));

    const updatedNDC = {
      ...ndc,
      projectClearance: {
        ...ndc.projectClearance,
        documents:    documents    || ndc.projectClearance.documents,
        tasksSummary: tasksSummary || ndc.projectClearance.tasksSummary,
        remarks:      remarks      !== undefined ? remarks : ndc.projectClearance.remarks,
        status:       status       || ndc.projectClearance.status,
        approvedBy:   status && status !== 'Pending' ? req.user.userId : ndc.projectClearance.approvedBy,
        approvedByName: status && status !== 'Pending' ? req.user.name : ndc.projectClearance.approvedByName,
        approvedAt:   status && status !== 'Pending' ? getCurrentTimestamp() : ndc.projectClearance.approvedAt
      },
      updatedAt: getCurrentTimestamp()
    };
    updatedNDC.overallStatus = computeOverallNDCStatus(updatedNDC);
    await saveNDCRecord(updatedNDC);
    res.json(successResponse(updatedNDC, 'Project clearance updated'));
  } catch (error) { handleError(error, res); }
};

// PUT /hrms/separation/:separationId/ndc/accounts
const updateAccountsClearance = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { financialSummary, remarks, status } = req.body;
    const separation = await getSeparationRecord(separationId);
    if (!separation || !separation.ndcId) return res.status(404).json(errorResponse('NDC not found'));
    const ndc = await getNDCRecord(separation.ndcId);
    if (!ndc) return res.status(404).json(errorResponse('NDC record not found'));

    // Compute F&F
    let fs = ndc.accountsClearance.financialSummary;
    if (financialSummary) {
      fs = { ...fs, ...financialSummary };
      fs.fullFinalAmount = (parseFloat(fs.salaryPayable) || 0) + (parseFloat(fs.expenseClaimsPending) || 0)
        - (parseFloat(fs.advanceOutstanding) || 0) - (parseFloat(fs.loanRecovery) || 0) - (parseFloat(fs.assetRecovery) || 0);
    }

    const updatedNDC = {
      ...ndc,
      accountsClearance: {
        ...ndc.accountsClearance,
        financialSummary: fs,
        remarks:          remarks !== undefined ? remarks : ndc.accountsClearance.remarks,
        status:           status  || ndc.accountsClearance.status,
        approvedBy:       status && status !== 'Pending' ? req.user.userId : ndc.accountsClearance.approvedBy,
        approvedByName:   status && status !== 'Pending' ? req.user.name   : ndc.accountsClearance.approvedByName,
        approvedAt:       status && status !== 'Pending' ? getCurrentTimestamp() : ndc.accountsClearance.approvedAt
      },
      updatedAt: getCurrentTimestamp()
    };
    updatedNDC.overallStatus = computeOverallNDCStatus(updatedNDC);
    await saveNDCRecord(updatedNDC);
    res.json(successResponse(updatedNDC, 'Accounts clearance updated'));
  } catch (error) { handleError(error, res); }
};

// PUT /hrms/separation/:separationId/ndc/hr
const updateHRClearance = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { checklist, remarks, status } = req.body;
    const separation = await getSeparationRecord(separationId);
    if (!separation || !separation.ndcId) return res.status(404).json(errorResponse('NDC not found'));
    const ndc = await getNDCRecord(separation.ndcId);
    if (!ndc) return res.status(404).json(errorResponse('NDC record not found'));

    const updatedNDC = {
      ...ndc,
      hrClearance: {
        ...ndc.hrClearance,
        checklist:    checklist ? { ...ndc.hrClearance.checklist, ...checklist } : ndc.hrClearance.checklist,
        remarks:      remarks   !== undefined ? remarks : ndc.hrClearance.remarks,
        status:       status    || ndc.hrClearance.status,
        approvedBy:   status && status !== 'Pending' ? req.user.userId : ndc.hrClearance.approvedBy,
        approvedByName: status && status !== 'Pending' ? req.user.name : ndc.hrClearance.approvedByName,
        approvedAt:   status && status !== 'Pending' ? getCurrentTimestamp() : ndc.hrClearance.approvedAt
      },
      updatedAt: getCurrentTimestamp()
    };
    updatedNDC.overallStatus = computeOverallNDCStatus(updatedNDC);
    await saveNDCRecord(updatedNDC);
    res.json(successResponse(updatedNDC, 'HR clearance updated'));
  } catch (error) { handleError(error, res); }
};

// PUT /hrms/separation/:separationId/ndc/final-approval  — HR Final Clearance
const updateFinalNDCApproval = async (req, res) => {
  try {
    const { separationId } = req.params;
    const { status, reason } = req.body;   // status: 'Cleared' | 'Not Cleared'
    if (!status) return res.status(400).json(errorResponse('Status is required'));

    const separation = await getSeparationRecord(separationId);
    if (!separation || !separation.ndcId) return res.status(404).json(errorResponse('NDC not found'));
    const ndc = await getNDCRecord(separation.ndcId);
    if (!ndc) return res.status(404).json(errorResponse('NDC record not found'));

    const updatedNDC = {
      ...ndc,
      finalClearance: {
        status,
        approvedBy:     req.user.userId,
        approvedByName: req.user.name,
        approvedAt:     getCurrentTimestamp(),
        reason:         reason || ''
      },
      overallStatus: status,
      updatedAt:     getCurrentTimestamp()
    };
    await saveNDCRecord(updatedNDC);

    // If cleared, mark separation as Completed
    if (status === 'Cleared') {
      const updatedSeparation = { ...separation, resignationStatus: 'Completed', updatedAt: getCurrentTimestamp(),
        statusHistory: [...(separation.statusHistory || []), { status: 'Completed', changedBy: req.user.userId, changedByName: req.user.name, timestamp: getCurrentTimestamp() }]
      };
      await saveSeparationRecord(updatedSeparation);
    }

    res.json(successResponse(updatedNDC, 'Final NDC approval updated'));
  } catch (error) { handleError(error, res); }
};

// Compute overall NDC status
function computeOverallNDCStatus(ndc) {
  const depts = ['itClearance','mediaClearance','projectClearance','accountsClearance','hrClearance'];
  const statuses = depts.map(d => ndc[d]?.status);
  if (statuses.some(s => s === 'Rejected')) return 'Not Cleared';
  if (statuses.every(s => s === 'Approved')) return 'All Departments Cleared';
  return 'In Progress';
}

/* ─── Employee Declaration (from Employee Portal) ───────────────────────── */

// PUT /employee/separation/:separationId/declaration
const submitEmployeeDeclaration = async (req, res) => {
  try {
    const employeeId = req.user?.employeeId;
    const { separationId } = req.params;

    const separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Separation not found'));
    if (separation.employeeId !== employeeId) return res.status(403).json(errorResponse('Forbidden'));
    if (!separation.ndcId)    return res.status(400).json(errorResponse('NDC not yet generated'));

    const ndc = await getNDCRecord(separation.ndcId);
    if (!ndc) return res.status(404).json(errorResponse('NDC not found'));

    const updatedNDC = {
      ...ndc,
      employeeDeclaration: { ...ndc.employeeDeclaration, signed: true, signedAt: getCurrentTimestamp() },
      updatedAt: getCurrentTimestamp()
    };
    await saveNDCRecord(updatedNDC);
    res.json(successResponse(updatedNDC, 'Declaration submitted successfully'));
  } catch (error) { handleError(error, res); }
};

/* ─── Employee Portal — view own separation ─────────────────────────────── */

// GET /employee/separation/my
const getMyResignation = async (req, res) => {
  try {
    const recruiterId = req.user?.companyId || req.user?.recruiterId;
    const employeeId  = req.user?.employeeId;
    if (!employeeId)  return res.status(400).json(errorResponse('Employee ID missing'));

    let separations;
    if (isUsingMockDB()) {
      separations = mockDB().scan(HRMS_SEPARATION_TABLE).filter(s => s.employeeId === employeeId);
    } else {
      const result = await dynamoClient.send(new ScanCommand({
        TableName: HRMS_SEPARATION_TABLE,
        FilterExpression: 'employeeId = :eid',
        ExpressionAttributeValues: { ':eid': employeeId }
      }));
      separations = result.Items || [];
    }

    separations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const active = separations.find(s => !['Completed','Rejected'].includes(s.resignationStatus)) || separations[0] || null;
    res.json(successResponse({ active, all: separations }, 'Separation data retrieved'));
  } catch (error) { handleError(error, res); }
};

// GET /employee/separation/:separationId/ndc  — Employee views NDC
const getMyNDC = async (req, res) => {
  try {
    const employeeId = req.user?.employeeId;
    const { separationId } = req.params;
    const separation = await getSeparationRecord(separationId);
    if (!separation) return res.status(404).json(errorResponse('Separation not found'));
    if (separation.employeeId !== employeeId) return res.status(403).json(errorResponse('Forbidden'));
    if (!separation.ndcId) return res.status(404).json(errorResponse('NDC not yet generated'));
    const ndc = await getNDCRecord(separation.ndcId);
    if (!ndc) return res.status(404).json(errorResponse('NDC not found'));
    res.json(successResponse(ndc, 'NDC retrieved'));
  } catch (error) { handleError(error, res); }
};

module.exports = {
  // HR Admin
  createSeparation,
  getSeparations,
  getSeparationById,
  getSeparationStats,
  updateResignationStatus,
  updateNoticePeriod,
  updateExitInterview,
  updateFnFSettlement,
  updateExitDocuments,
  updateFinalRating,
  // NDC
  generateNDC,
  getNDC,
  updateITClearance,
  updateMediaClearance,
  updateProjectClearance,
  updateAccountsClearance,
  updateHRClearance,
  updateFinalNDCApproval,
  // Employee Portal
  employeeInitiatedResignation,
  getMyResignation,
  getMyNDC,
  submitEmployeeDeclaration
};
