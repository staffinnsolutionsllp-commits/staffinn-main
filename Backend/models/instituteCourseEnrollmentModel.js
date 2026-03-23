const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

const INSTITUTE_COURSE_ENROLLMENTS_TABLE = 'staffinn-institute-course-enrollments';
const COURSE_ENROLLED_USER_TABLE = 'course-enrolled-user';

/**
 * Create a new institute course enrollment
 */
const createEnrollment = async (enrollmentData) => {
  try {
    const enrollmentsId = uuidv4();
    const timestamp = new Date().toISOString();

    // Create main enrollment record
    const enrollment = {
      enrollmentsId,
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

    // Save to institute enrollments table
    await dynamoService.putItem(INSTITUTE_COURSE_ENROLLMENTS_TABLE, enrollment);
    console.log('✅ Saved to staffinn-institute-course-enrollments table');

    // Also save each student enrollment to course-enrolled-user table for tracking
    const studentEnrollmentPromises = enrollmentData.enrolledStudents.map(async (student) => {
      const studentEnrollment = {
        enrolledID: uuidv4(),
        courseId: enrollmentData.courseId,
        userId: student.studentId, // Using studentId as userId for MIS students
        enrollmentDate: timestamp,
        progressPercentage: 0,
        completedModules: [],
        enrollmentType: 'institute', // Mark as institute enrollment
        enrollingInstituteId: enrollmentData.enrollingInstituteId,
        parentEnrollmentId: enrollmentsId, // Link to parent enrollment
        studentName: student.studentName,
        studentEmail: student.studentEmail,
        paymentStatus: enrollmentData.paymentStatus || 'completed',
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await dynamoService.putItem(COURSE_ENROLLED_USER_TABLE, studentEnrollment);
      console.log(`✅ Saved student ${student.studentName} to course-enrolled-user table`);
      return studentEnrollment;
    });

    await Promise.all(studentEnrollmentPromises);
    console.log('✅ All student enrollments saved to course-enrolled-user table');

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

/**
 * Check if a student is already enrolled in a course
 */
const isStudentEnrolled = async (courseId, studentId) => {
  try {
    const params = {
      FilterExpression: 'courseId = :courseId AND userId = :studentId',
      ExpressionAttributeValues: {
        ':courseId': courseId,
        ':studentId': studentId
      }
    };
    const enrollments = await dynamoService.scanItems(COURSE_ENROLLED_USER_TABLE, params);
    return enrollments && enrollments.length > 0;
  } catch (error) {
    console.error('Error checking student enrollment:', error);
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
  updateStudentStatus,
  isStudentEnrolled
};
