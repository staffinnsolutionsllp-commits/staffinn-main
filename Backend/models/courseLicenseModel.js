/**
 * Course License Model
 * Handles recruiter course seat/license purchases
 */
const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

const COURSE_LICENSES_TABLE = 'staffinn-course-licenses';
const EMPLOYEE_ASSIGNMENTS_TABLE = 'staffinn-employee-course-assignments';

// ─── LICENSE OPERATIONS ─────────────────────────────────────────────────────

/**
 * Create a new course license (after payment verified)
 */
const createLicense = async (data) => {
  const license = {
    licenseId: uuidv4(),
    recruiterId: data.recruiterId,
    courseId: data.courseId,
    courseName: data.courseName,
    instituteId: data.instituteId,
    quantityPurchased: data.quantityPurchased,
    quantityAssigned: 0,
    quantityRemaining: data.quantityPurchased,
    pricePerSeat: data.pricePerSeat,
    totalAmount: data.totalAmount,
    transactionId: data.transactionId,
    paymentStatus: data.paymentStatus || 'success',
    purchaseDate: new Date().toISOString(),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await dynamoService.putItem(COURSE_LICENSES_TABLE, license);
  return license;
};

/**
 * Get all licenses for a recruiter
 */
const getLicensesByRecruiter = async (recruiterId) => {
  const params = {
    IndexName: 'recruiterId-index',
    KeyConditionExpression: 'recruiterId = :rid',
    ExpressionAttributeValues: { ':rid': recruiterId }
  };
  return await dynamoService.queryItems(COURSE_LICENSES_TABLE, params);
};

/**
 * Get a specific license by ID
 */
const getLicenseById = async (licenseId) => {
  return await dynamoService.getItem(COURSE_LICENSES_TABLE, { licenseId });
};

/**
 * Update license assignment counts (atomic decrement of remaining)
 */
const updateLicenseCounts = async (licenseId, assignedCount) => {
  const license = await getLicenseById(licenseId);
  if (!license) throw new Error('License not found');

  const newAssigned = license.quantityAssigned + assignedCount;
  const newRemaining = license.quantityPurchased - newAssigned;

  if (newRemaining < 0) throw new Error('Not enough remaining seats');

  const updateParams = {
    UpdateExpression: 'SET quantityAssigned = :assigned, quantityRemaining = :remaining, updatedAt = :now',
    ExpressionAttributeValues: {
      ':assigned': newAssigned,
      ':remaining': newRemaining,
      ':now': new Date().toISOString()
    }
  };

  await dynamoService.updateItem(COURSE_LICENSES_TABLE, { licenseId }, updateParams);
  return { ...license, quantityAssigned: newAssigned, quantityRemaining: newRemaining };
};

// ─── ASSIGNMENT OPERATIONS ──────────────────────────────────────────────────

/**
 * Create employee course assignments (batch)
 */
const createAssignments = async (assignments) => {
  const results = [];
  for (const data of assignments) {
    const assignment = {
      assignmentId: uuidv4(),
      licenseId: data.licenseId,
      recruiterId: data.recruiterId,
      employeeId: data.employeeId,
      employeeUserId: data.employeeUserId || null,
      employeeName: data.employeeName || '',
      employeeEmail: data.employeeEmail || '',
      courseId: data.courseId,
      courseName: data.courseName,
      instituteId: data.instituteId,
      assignedAt: new Date().toISOString(),
      assignedBy: data.assignedBy,
      status: 'assigned',
      progress: 0,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await dynamoService.putItem(EMPLOYEE_ASSIGNMENTS_TABLE, assignment);
    results.push(assignment);
  }
  return results;
};

/**
 * Get assignments by license
 */
const getAssignmentsByLicense = async (licenseId) => {
  const params = {
    IndexName: 'licenseId-index',
    KeyConditionExpression: 'licenseId = :lid',
    ExpressionAttributeValues: { ':lid': licenseId }
  };
  return await dynamoService.queryItems(EMPLOYEE_ASSIGNMENTS_TABLE, params);
};

/**
 * Get assignments by employee (for Employee Portal)
 */
const getAssignmentsByEmployee = async (employeeId) => {
  const params = {
    IndexName: 'employeeId-index',
    KeyConditionExpression: 'employeeId = :eid',
    ExpressionAttributeValues: { ':eid': employeeId }
  };
  return await dynamoService.queryItems(EMPLOYEE_ASSIGNMENTS_TABLE, params);
};

/**
 * Get assignments by recruiter
 */
const getAssignmentsByRecruiter = async (recruiterId) => {
  const params = {
    IndexName: 'recruiterId-index',
    KeyConditionExpression: 'recruiterId = :rid',
    ExpressionAttributeValues: { ':rid': recruiterId }
  };
  return await dynamoService.queryItems(EMPLOYEE_ASSIGNMENTS_TABLE, params);
};

/**
 * Get a single assignment
 */
const getAssignmentById = async (assignmentId) => {
  return await dynamoService.getItem(EMPLOYEE_ASSIGNMENTS_TABLE, { assignmentId });
};

/**
 * Update assignment status/progress
 */
const updateAssignment = async (assignmentId, updates) => {
  const expressions = [];
  const values = {};
  const names = {};

  if (updates.status !== undefined) {
    expressions.push('#status = :status');
    names['#status'] = 'status';
    values[':status'] = updates.status;
  }
  if (updates.progress !== undefined) {
    expressions.push('#progress = :progress');
    names['#progress'] = 'progress';
    values[':progress'] = updates.progress;
  }
  if (updates.completedAt !== undefined) {
    expressions.push('completedAt = :completedAt');
    values[':completedAt'] = updates.completedAt;
  }

  expressions.push('updatedAt = :now');
  values[':now'] = new Date().toISOString();

  const updateParams = {
    UpdateExpression: 'SET ' + expressions.join(', '),
    ExpressionAttributeValues: values,
    ...(Object.keys(names).length > 0 && { ExpressionAttributeNames: names })
  };

  await dynamoService.updateItem(EMPLOYEE_ASSIGNMENTS_TABLE, { assignmentId }, updateParams);
};

/**
 * Check if employee is already assigned to a course under a license
 */
const isEmployeeAssigned = async (licenseId, employeeId) => {
  const assignments = await getAssignmentsByLicense(licenseId);
  return assignments.some(a => a.employeeId === employeeId && a.status !== 'revoked');
};

module.exports = {
  createLicense,
  getLicensesByRecruiter,
  getLicenseById,
  updateLicenseCounts,
  createAssignments,
  getAssignmentsByLicense,
  getAssignmentsByEmployee,
  getAssignmentsByRecruiter,
  getAssignmentById,
  updateAssignment,
  isEmployeeAssigned
};
