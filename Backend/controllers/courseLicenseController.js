/**
 * Course License Controller
 * Handles recruiter course seat purchases and employee assignments
 */
const courseLicenseModel = require('../models/courseLicenseModel');
const dynamoService = require('../services/dynamoService');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COURSES_TABLE = 'staffinn-courses';
const HRMS_EMPLOYEES_TABLE = process.env.HRMS_EMPLOYEES_TABLE || 'staffinn-hrms-employees';

// ─── LICENSE PURCHASE ────────────────────────────────────────────────────────

/**
 * Create a course license after successful payment
 * Called after payment verification (internal use or direct for free courses)
 * POST /api/v1/course-licenses/create
 */
const createLicense = async (req, res) => {
  try {
    const recruiterId = req.user.userId;
    const { courseId, quantityPurchased, transactionId, totalAmount, pricePerSeat } = req.body;

    if (!courseId || !quantityPurchased || quantityPurchased < 1) {
      return res.status(400).json({ success: false, message: 'courseId and quantityPurchased (>= 1) are required' });
    }

    // Get course details
    const course = await dynamoService.getItem(COURSES_TABLE, { coursesId: courseId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const license = await courseLicenseModel.createLicense({
      recruiterId,
      courseId,
      courseName: course.courseName || course.name,
      instituteId: course.instituteId || course.institutesId,
      quantityPurchased: parseInt(quantityPurchased),
      pricePerSeat: pricePerSeat || parseFloat(course.fees) || 0,
      totalAmount: totalAmount || (parseFloat(course.fees) || 0) * parseInt(quantityPurchased),
      transactionId: transactionId || null,
      paymentStatus: transactionId ? 'success' : 'pending'
    });

    res.status(201).json({
      success: true,
      message: `Successfully purchased ${quantityPurchased} seat(s) for "${license.courseName}"`,
      data: license
    });
  } catch (error) {
    console.error('Create license error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create course license' });
  }
};

/**
 * Get all licenses for the authenticated recruiter
 * Also includes existing individual enrollments as single-seat licenses
 * GET /api/v1/course-licenses
 */
const getMyLicenses = async (req, res) => {
  try {
    const recruiterId = req.user.userId;
    
    // Get actual license purchases
    const licenses = await courseLicenseModel.getLicensesByRecruiter(recruiterId);

    // Also get existing individual enrollments (pre-license system)
    // These are courses the recruiter personally enrolled in — show them as 1-seat licenses
    const enrollmentParams = {
      FilterExpression: 'userId = :uid AND (#status = :active OR #status = :paid)',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':uid': recruiterId, ':active': 'active', ':paid': 'paid' }
    };
    const existingEnrollments = await dynamoService.scanItems('course-enrolled-user', enrollmentParams);
    
    // Convert existing enrollments to license format (if not already covered by a license)
    const licenseCourseIds = new Set(licenses.map(l => l.courseId));
    const legacyLicenses = (existingEnrollments || [])
      .filter(e => !licenseCourseIds.has(e.courseId) && (e.paymentStatus === 'paid' || e.paymentStatus === 'free'))
      .map(e => ({
        licenseId: `legacy_${e.enrolledID}`,
        recruiterId,
        courseId: e.courseId,
        courseName: e.courseName || 'Course',
        instituteId: e.instituteId || null,
        quantityPurchased: 1,
        quantityAssigned: 0,
        quantityRemaining: 1,
        pricePerSeat: e.amountPaid || 0,
        totalAmount: e.amountPaid || 0,
        transactionId: e.transactionId || null,
        paymentStatus: 'success',
        purchaseDate: e.enrollmentDate,
        status: 'active',
        isLegacy: true,
        createdAt: e.enrollmentDate,
        updatedAt: e.enrollmentDate
      }));

    const allLicenses = [...licenses, ...legacyLicenses];
    
    // Sort by purchase date (newest first)
    allLicenses.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));

    res.status(200).json({ success: true, data: allLicenses });
  } catch (error) {
    console.error('Get licenses error:', error);
    res.status(500).json({ success: false, message: 'Failed to get licenses' });
  }
};

/**
 * Get license details with assignments
 * GET /api/v1/course-licenses/:licenseId
 */
const getLicenseDetails = async (req, res) => {
  try {
    const recruiterId = req.user.userId;
    const { licenseId } = req.params;

    // Handle legacy license IDs (convert to real license on first access)
    if (licenseId.startsWith('legacy_')) {
      const enrolledID = licenseId.replace('legacy_', '');
      // Get the enrollment record
      const enrollment = await dynamoService.getItem('course-enrolled-user', { enrolledID });
      if (!enrollment || enrollment.userId !== recruiterId) {
        return res.status(404).json({ success: false, message: 'License not found' });
      }
      
      // Create a real license from this enrollment
      const newLicense = await courseLicenseModel.createLicense({
        recruiterId,
        courseId: enrollment.courseId,
        courseName: enrollment.courseName || 'Course',
        instituteId: enrollment.instituteId || null,
        quantityPurchased: 1,
        pricePerSeat: enrollment.amountPaid || 0,
        totalAmount: enrollment.amountPaid || 0,
        transactionId: enrollment.transactionId || null,
        paymentStatus: 'success'
      });
      
      return res.status(200).json({
        success: true,
        data: { ...newLicense, assignments: [] }
      });
    }

    const license = await courseLicenseModel.getLicenseById(licenseId);
    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    // Security: ensure recruiter owns this license
    if (license.recruiterId !== recruiterId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get assignments for this license
    const assignments = await courseLicenseModel.getAssignmentsByLicense(licenseId);

    res.status(200).json({
      success: true,
      data: { ...license, assignments }
    });
  } catch (error) {
    console.error('Get license details error:', error);
    res.status(500).json({ success: false, message: 'Failed to get license details' });
  }
};

// ─── EMPLOYEE ASSIGNMENT ─────────────────────────────────────────────────────

/**
 * Assign course seats to employees
 * POST /api/v1/course-licenses/:licenseId/assign
 */
const assignToEmployees = async (req, res) => {
  try {
    const recruiterId = req.user.userId;
    const { licenseId } = req.params;
    const { employeeIds } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ success: false, message: 'employeeIds array is required' });
    }

    // Get license and verify ownership
    const license = await courseLicenseModel.getLicenseById(licenseId);
    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }
    if (license.recruiterId !== recruiterId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (license.status !== 'active') {
      return res.status(400).json({ success: false, message: 'License is not active' });
    }

    // Check available seats
    if (employeeIds.length > license.quantityRemaining) {
      return res.status(400).json({
        success: false,
        message: `Not enough seats. Available: ${license.quantityRemaining}, Requested: ${employeeIds.length}`
      });
    }

    // Verify all employees belong to this recruiter
    const employeesResult = await docClient.send(new ScanCommand({
      TableName: HRMS_EMPLOYEES_TABLE,
      FilterExpression: 'recruiterId = :rid AND (attribute_not_exists(isDeleted) OR isDeleted = :false)',
      ExpressionAttributeValues: { ':rid': recruiterId, ':false': false }
    }));
    const recruiterEmployees = employeesResult.Items || [];
    const employeeMap = {};
    recruiterEmployees.forEach(emp => { employeeMap[emp.employeeId] = emp; });

    // Validate each employee
    const invalidIds = employeeIds.filter(id => !employeeMap[id]);
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Employees not found in your organization: ${invalidIds.join(', ')}`
      });
    }

    // Check for duplicate assignments
    const alreadyAssigned = [];
    for (const empId of employeeIds) {
      const isAssigned = await courseLicenseModel.isEmployeeAssigned(licenseId, empId);
      if (isAssigned) alreadyAssigned.push(empId);
    }
    if (alreadyAssigned.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Employees already assigned to this course: ${alreadyAssigned.map(id => employeeMap[id]?.fullName || id).join(', ')}`
      });
    }

    // Create assignments
    const assignmentData = employeeIds.map(empId => ({
      licenseId,
      recruiterId,
      employeeId: empId,
      employeeUserId: employeeMap[empId]?.userId || null,
      employeeName: employeeMap[empId]?.fullName || '',
      employeeEmail: employeeMap[empId]?.email || '',
      courseId: license.courseId,
      courseName: license.courseName,
      instituteId: license.instituteId,
      assignedBy: recruiterId
    }));

    const assignments = await courseLicenseModel.createAssignments(assignmentData);

    // Update license counts
    await courseLicenseModel.updateLicenseCounts(licenseId, employeeIds.length);

    res.status(200).json({
      success: true,
      message: `Successfully assigned course to ${employeeIds.length} employee(s)`,
      data: {
        assignedCount: assignments.length,
        assignments: assignments.map(a => ({
          assignmentId: a.assignmentId,
          employeeId: a.employeeId,
          employeeName: a.employeeName,
          status: a.status
        }))
      }
    });
  } catch (error) {
    console.error('Assign to employees error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to assign course' });
  }
};

/**
 * Revoke an assignment (free up a seat)
 * PUT /api/v1/course-licenses/assignments/:assignmentId/revoke
 */
const revokeAssignment = async (req, res) => {
  try {
    const recruiterId = req.user.userId;
    const { assignmentId } = req.params;

    const assignment = await courseLicenseModel.getAssignmentById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    if (assignment.recruiterId !== recruiterId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (assignment.status === 'revoked') {
      return res.status(400).json({ success: false, message: 'Assignment already revoked' });
    }

    // Revoke assignment
    await courseLicenseModel.updateAssignment(assignmentId, { status: 'revoked' });

    // Restore seat to license (decrement assigned by 1)
    await courseLicenseModel.updateLicenseCounts(assignment.licenseId, -1);

    res.status(200).json({ success: true, message: 'Assignment revoked successfully' });
  } catch (error) {
    console.error('Revoke assignment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to revoke assignment' });
  }
};

/**
 * Get employees available for assignment (recruiter's employees not yet assigned to this license)
 * GET /api/v1/course-licenses/:licenseId/available-employees
 */
const getAvailableEmployees = async (req, res) => {
  try {
    const recruiterId = req.user.userId;
    const { licenseId } = req.params;

    // Verify license ownership
    const license = await courseLicenseModel.getLicenseById(licenseId);
    if (!license || license.recruiterId !== recruiterId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get all recruiter employees
    const employeesResult = await docClient.send(new ScanCommand({
      TableName: HRMS_EMPLOYEES_TABLE,
      FilterExpression: 'recruiterId = :rid AND (attribute_not_exists(isDeleted) OR isDeleted = :false)',
      ExpressionAttributeValues: { ':rid': recruiterId, ':false': false }
    }));
    const allEmployees = employeesResult.Items || [];

    // Get already assigned employees for this license
    const assignments = await courseLicenseModel.getAssignmentsByLicense(licenseId);
    const assignedIds = new Set(assignments.filter(a => a.status !== 'revoked').map(a => a.employeeId));

    // Filter out already assigned
    const available = allEmployees
      .filter(emp => !assignedIds.has(emp.employeeId))
      .map(emp => ({
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        email: emp.email,
        designation: emp.designation,
        department: emp.department
      }));

    res.status(200).json({
      success: true,
      data: {
        available,
        totalEmployees: allEmployees.length,
        alreadyAssigned: assignedIds.size,
        remainingSeats: license.quantityRemaining
      }
    });
  } catch (error) {
    console.error('Get available employees error:', error);
    res.status(500).json({ success: false, message: 'Failed to get available employees' });
  }
};

// ─── EMPLOYEE PORTAL ENDPOINTS ───────────────────────────────────────────────

/**
 * Get courses assigned to the authenticated employee
 * GET /api/v1/employee/courses
 */
const getEmployeeCourses = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const companyId = req.user.companyId;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Employee ID not found in token' });
    }

    const assignments = await courseLicenseModel.getAssignmentsByEmployee(employeeId);

    // Only return active assignments (not revoked) that belong to this company
    const activeCourses = assignments
      .filter(a => a.status !== 'revoked' && a.recruiterId === companyId)
      .map(a => ({
        assignmentId: a.assignmentId,
        courseId: a.courseId,
        courseName: a.courseName,
        instituteId: a.instituteId,
        assignedAt: a.assignedAt,
        status: a.status,
        progress: a.progress || 0,
        completedAt: a.completedAt
      }));

    res.status(200).json({ success: true, data: activeCourses });
  } catch (error) {
    console.error('Get employee courses error:', error);
    res.status(500).json({ success: false, message: 'Failed to get courses' });
  }
};

/**
 * Generate a temporary course access token for an employee
 * This allows the employee to access the course on staffinn.com without a separate account
 * POST /api/v1/employee/courses/:assignmentId/access-token
 */
const generateCourseAccessToken = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const companyId = req.user.companyId;
    const { assignmentId } = req.params;

    // Get assignment and validate
    const assignment = await courseLicenseModel.getAssignmentById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    if (assignment.employeeId !== employeeId || assignment.recruiterId !== companyId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (assignment.status === 'revoked') {
      return res.status(403).json({ success: false, message: 'Course access has been revoked' });
    }

    // Generate a JWT token specifically for course access (valid 8 hours)
    const jwt = require('jsonwebtoken');
    const courseAccessToken = jwt.sign(
      {
        type: 'employee_course_access',
        employeeId,
        companyId,
        assignmentId,
        courseId: assignment.courseId,
        employeeName: assignment.employeeName
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const courseUrl = `https://staffinn.com/course-learning/${assignment.courseId}?eat=${courseAccessToken}`;

    res.status(200).json({
      success: true,
      data: {
        accessToken: courseAccessToken,
        courseUrl,
        courseId: assignment.courseId,
        courseName: assignment.courseName,
        expiresIn: '8 hours'
      }
    });
  } catch (error) {
    console.error('Generate course access token error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate access token' });
  }
};

/**
 * Validate employee course access token (called by StaffInn frontend)
 * GET /api/v1/course-access/validate?token=xxx&courseId=yyy
 */
const validateCourseAccessToken = async (req, res) => {
  try {
    const { token, courseId } = req.query;

    if (!token || !courseId) {
      return res.status(400).json({ success: false, message: 'Token and courseId required' });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired access token' });
    }

    if (decoded.type !== 'employee_course_access') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    if (decoded.courseId !== courseId) {
      return res.status(403).json({ success: false, message: 'Token not valid for this course' });
    }

    // Verify assignment still exists and is active
    const assignment = await courseLicenseModel.getAssignmentById(decoded.assignmentId);
    if (!assignment || assignment.status === 'revoked') {
      return res.status(403).json({ success: false, message: 'Course access has been revoked' });
    }

    res.status(200).json({
      success: true,
      data: {
        enrolled: true,
        hasStarted: assignment.progress > 0,
        progressPercentage: assignment.progress || 0,
        employeeName: decoded.employeeName,
        assignmentId: decoded.assignmentId,
        isEmployeeAccess: true
      }
    });
  } catch (error) {
    console.error('Validate course access token error:', error);
    res.status(500).json({ success: false, message: 'Failed to validate token' });
  }
};

/**
 * Update course progress for an employee
 * PUT /api/v1/employee/courses/:assignmentId/progress
 */
const updateCourseProgress = async (req, res) => {
  try {
    const employeeId = req.user.employeeId;
    const { assignmentId } = req.params;
    const { progress } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({ success: false, message: 'Progress must be between 0 and 100' });
    }

    const assignment = await courseLicenseModel.getAssignmentById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    if (assignment.employeeId !== employeeId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const updates = { progress, status: progress > 0 ? 'in-progress' : 'assigned' };
    if (progress >= 100) {
      updates.status = 'completed';
      updates.completedAt = new Date().toISOString();
    }

    await courseLicenseModel.updateAssignment(assignmentId, updates);

    res.status(200).json({ success: true, message: 'Progress updated' });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to update progress' });
  }
};

module.exports = {
  createLicense,
  getMyLicenses,
  getLicenseDetails,
  assignToEmployees,
  revokeAssignment,
  getAvailableEmployees,
  getEmployeeCourses,
  generateCourseAccessToken,
  validateCourseAccessToken,
  updateCourseProgress
};
