const { scanTable, getItem, putItem } = require('../config/dynamoDB');
const { v4: uuidv4 } = require('uuid');

const enrollStudentsInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentIds } = req.body;
    
    const enrollments = [];
    for (const studentId of studentIds) {
      const enrollment = {
        enrollmentId: uuidv4(),
        courseId,
        studentId,
        enrolledAt: new Date().toISOString(),
        status: 'active'
      };
      await putItem('course-enrollments', enrollment);
      enrollments.push(enrollment);
    }
    
    res.status(201).json({ message: 'Students enrolled successfully', enrollments });
  } catch (error) {
    res.status(500).json({ message: 'Failed to enroll students', error: error.message });
  }
};

const getEnrollmentHistory = async (req, res) => {
  try {
    const params = {
      TableName: 'course-enrollments'
    };
    const enrollments = await scanTable(params);
    res.status(200).json({ enrollments });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch enrollment history', error: error.message });
  }
};

const getCourseEnrollmentTracking = async (req, res) => {
  try {
    const params = {
      TableName: 'course-enrollments'
    };
    const enrollments = await scanTable(params);
    res.status(200).json({ enrollments });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch enrollment tracking', error: error.message });
  }
};

const getEnrollmentDetails = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const enrollment = await getItem('course-enrollments', { enrollmentId });
    res.status(200).json({ enrollment });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch enrollment details', error: error.message });
  }
};

const getAvailableStudents = async (req, res) => {
  try {
    const params = {
      TableName: 'users',
      FilterExpression: 'userType = :userType',
      ExpressionAttributeValues: {
        ':userType': 'student'
      }
    };
    const students = await scanTable(params);
    res.status(200).json({ students });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch available students', error: error.message });
  }
};

const getEnrolledStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const params = {
      TableName: 'course-enrollments',
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    };
    const enrollments = await scanTable(params);
    res.status(200).json({ enrollments });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch enrolled students', error: error.message });
  }
};

const getInstituteStudentEnrollmentCount = async (req, res) => {
  try {
    const { courseId } = req.params;
    const params = {
      TableName: 'course-enrollments',
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    };
    const enrollments = await scanTable(params);
    res.status(200).json({
      courseId,
      enrollmentCount: enrollments.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch enrollment count', error: error.message });
  }
};

module.exports = {
  enrollStudentsInCourse,
  getEnrollmentHistory,
  getCourseEnrollmentTracking,
  getEnrollmentDetails,
  getAvailableStudents,
  getEnrolledStudents,
  getInstituteStudentEnrollmentCount
};
