const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

const INSTITUTE_COURSE_ENROLLMENTS_TABLE = 'staffinn-institute-course-enrollments';

/**
 * Create a new institute course enrollment
 */
const createEnrollment = async (enrollmentData) => {
  try {
    const enrollmentsId = uuidv4(); // Changed to match table primary key
    const timestamp = new Date().toISOString();

    const enrollment = {
      enrollmentsId, // Changed from enrollmentId
      courseId: enrollmentData.courseId,
      courseInstituteId: enrollmentData.courseInstituteId,
      enrollingInstituteId: enrollmentData.enrollingInstituteId,
      enrolledStudents: enrollmentData.enrolledStudents.map(student => ({
        studentId: student.studentId,
        studentName: student.studentName,
        studentEmail: student.studentEmail,
        enrollmentDate: timestamp,
        status: 'active'
      })),
      totalStudentsEnrolled: enrollmentData.enrolledStudents.length,
      enrollmentDate: timestamp,
      paymentStatus: enrollmentData.paymentStatus || 'pending',
      totalAmount: enrollmentData.totalAmount || 0,
      paymentDetails: enrollmentData.paymentDetails || {},
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await dynamoService.putItem(INSTITUTE_COURSE_ENROLLMENTS_TABLE, enrollment);
    return enrollment;
  } catch (error) {
    console.error('Error creating institute course enrollment:', error);
    throw error;
  }
};

/**
 * Get all enrollments for a specific course
 */
const getEnrollmentsByCourse = async (courseId) => {
  try {
    const params = {
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    };

    const enrollments = await dynamoService.scanItems(INSTITUTE_COURSE_ENROLLMENTS_TABLE, params);
    return enrollments || [];
  } catch (error) {
    console.error('Error getting enrollments by course:', error);
    return [];
  }
};

/**
 * Get all enrollments done by a specific institute
 */
const getEnrollmentsByEnrollingInstitute = async (enrollingInstituteId) => {
  try {
    const params = {
      FilterExpression: 'enrollingInstituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': enrollingInstituteId
      }
    };

    const enrollments = await dynamoService.scanItems(INSTITUTE_COURSE_ENROLLMENTS_TABLE, params);
    return enrollments || [];
  } catch (error) {
    console.error('Error getting enrollments by enrolling institute:', error);
    return [];
  }
};

/**
 * Get all enrollments for courses offered by a specific institute
 */
const getEnrollmentsByCourseInstitute = async (courseInstituteId) => {
  try {
    const params = {
      FilterExpression: 'courseInstituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': courseInstituteId
      }
    };

    const enrollments = await dynamoService.scanItems(INSTITUTE_COURSE_ENROLLMENTS_TABLE, params);
    return enrollments || [];
  } catch (error) {
    console.error('Error getting enrollments by course institute:', error);
    return [];
  }
};

/**
 * Get enrollment by ID
 */
const getEnrollmentById = async (enrollmentsId) => {
  try {
    const enrollment = await dynamoService.getItem(INSTITUTE_COURSE_ENROLLMENTS_TABLE, { enrollmentsId });
    return enrollment;
  } catch (error) {
    console.error('Error getting enrollment by ID:', error);
    return null;
  }
};

/**
 * Update enrollment payment status
 */
const updatePaymentStatus = async (enrollmentsId, paymentStatus, paymentDetails) => {
  try {
    const key = { enrollmentsId };
    const updateParams = {
      UpdateExpression: 'SET paymentStatus = :status, paymentDetails = :details, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':status': paymentStatus,
        ':details': paymentDetails,
        ':updatedAt': new Date().toISOString()
      }
    };

    await dynamoService.updateItem(INSTITUTE_COURSE_ENROLLMENTS_TABLE, key, updateParams);
    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    return false;
  }
};

/**
 * Update student status in enrollment
 */
const updateStudentStatus = async (enrollmentsId, studentId, status) => {
  try {
    const enrollment = await getEnrollmentById(enrollmentsId);
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const updatedStudents = enrollment.enrolledStudents.map(student => {
      if (student.studentId === studentId) {
        return { ...student, status };
      }
      return student;
    });

    const key = { enrollmentsId };
    const updateParams = {
      UpdateExpression: 'SET enrolledStudents = :students, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':students': updatedStudents,
        ':updatedAt': new Date().toISOString()
      }
    };

    await dynamoService.updateItem(INSTITUTE_COURSE_ENROLLMENTS_TABLE, key, updateParams);
    return true;
  } catch (error) {
    console.error('Error updating student status:', error);
    return false;
  }
};

module.exports = {
  createEnrollment,
  getEnrollmentsByCourse,
  getEnrollmentsByEnrollingInstitute,
  getEnrollmentsByCourseInstitute,
  getEnrollmentById,
  updatePaymentStatus,
  updateStudentStatus
};
