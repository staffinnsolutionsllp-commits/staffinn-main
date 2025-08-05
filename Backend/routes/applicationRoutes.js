/**
 * Application Routes
 * Handles application API endpoints
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  applyForJob,
  recordProfileView,
  getDashboardData,
  getAppliedInstitutes,
  getInstituteStudents,
  getMyApplications,
  getJobApplicationStudents,
  applyStudentsToJob,
  getStudentsApplicationStatus
} = require('../controllers/applicationController');

// All application routes require authentication
router.use(authenticate);

// POST /api/applications/apply - Apply for a job
router.post('/apply', applyForJob);

// POST /api/applications/profile-view - Record profile view
router.post('/profile-view', recordProfileView);

// GET /api/applications/dashboard - Get dashboard data
router.get('/dashboard', getDashboardData);

// GET /api/applications/institutes - Get applied institutes for recruiter
router.get('/institutes', getAppliedInstitutes);

// GET /api/applications/institutes/:instituteId/students - Get students of an institute
router.get('/institutes/:instituteId/students', getInstituteStudents);

// GET /api/applications/my-applications - Get my applications
router.get('/my-applications', getMyApplications);

// GET /api/applications/institutes/:instituteId/jobs/:jobId/students - Get students for specific job
router.get('/institutes/:instituteId/jobs/:jobId/students', getJobApplicationStudents);

// POST /api/applications/apply-students - Apply students to a job (Institute)
router.post('/apply-students', applyStudentsToJob);

// GET /api/applications/job/:jobId/students-status - Get students with application status
router.get('/job/:jobId/students-status', getStudentsApplicationStatus);

module.exports = router;