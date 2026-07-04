const express = require('express');
const router = express.Router();
const instituteCourseEnrollmentController = require('../controllers/instituteCourseEnrollmentController');
const { authenticate } = require('../middleware/auth');

// Enroll students in a course (Staffinn Partner Institute only)
router.post('/courses/:courseId/enroll-students', authenticate, instituteCourseEnrollmentController.enrollStudentsInCourse);

// Get enrollment history for Staffinn Partner Institute
router.get('/enrollment-history', authenticate, instituteCourseEnrollmentController.getEnrollmentHistory);

// Get course enrollment tracking for institute dashboard
router.get('/course-enrollment-tracking', authenticate, instituteCourseEnrollmentController.getCourseEnrollmentTracking);

// Get detailed enrollment information
router.get('/enrollments/:enrollmentId', authenticate, instituteCourseEnrollmentController.getEnrollmentDetails);

// Get available students for enrollment
router.get('/available-students', authenticate, instituteCourseEnrollmentController.getAvailableStudents);

// Get enrolled students for a specific course
router.get('/courses/:courseId/enrolled-students', authenticate, instituteCourseEnrollmentController.getEnrolledStudents);

// Get enrollment status for a course (check if all students are enrolled)
router.get('/courses/:courseId/enrollment-status', authenticate, instituteCourseEnrollmentController.getCourseEnrollmentStatus);

// Approve pending payment
router.put('/payment/:pendingPaymentId/approve', authenticate, instituteCourseEnrollmentController.approvePayment);

// Reject pending payment
router.put('/payment/:pendingPaymentId/reject', authenticate, instituteCourseEnrollmentController.rejectPayment);

module.exports = router;
