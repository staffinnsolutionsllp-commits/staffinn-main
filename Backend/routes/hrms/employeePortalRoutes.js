const express = require('express');
const router = express.Router();
const { login, changePassword, getProfile } = require('../../controllers/hrms/employeeAuthController');
const { 
  getDashboardStats, 
  getMyAttendance, 
  markAttendance, 
  getMyLeaves, 
  getLeaveBalance, 
  applyLeave, 
  cancelLeave, 
  getMyPayslips, 
  updateProfile,
  getMyClaims,
  getClaimCategories,
  submitClaim,
  getMyTasks,
  updateMyTask,
  getMyRatings,
  getMyGrievances,
  submitGrievance,
  getAssignedGrievances,
  updateGrievanceStatus,
  getMyHierarchy,
  getFullOrganogram,
  getNodeDetails
} = require('../../controllers/hrms/employeePortalController');
const { authenticateEmployee, checkPermission } = require('../../middleware/employeeAuth');

// Auth routes
router.post('/auth/login', login);
router.post('/auth/change-password', authenticateEmployee, changePassword);
router.get('/auth/profile', authenticateEmployee, getProfile);

// Dashboard
router.get('/dashboard/stats', authenticateEmployee, getDashboardStats);

// Profile
router.put('/profile', authenticateEmployee, updateProfile);

// Attendance routes
router.get('/attendance', authenticateEmployee, checkPermission('mark_attendance'), getMyAttendance);
router.post('/attendance/mark', authenticateEmployee, checkPermission('mark_attendance'), markAttendance);

// Leave routes
router.get('/leaves', authenticateEmployee, checkPermission('apply_leave'), getMyLeaves);
router.get('/leaves/balance', authenticateEmployee, checkPermission('apply_leave'), getLeaveBalance);
router.post('/leaves/apply', authenticateEmployee, checkPermission('apply_leave'), applyLeave);
router.delete('/leaves/:id', authenticateEmployee, checkPermission('apply_leave'), cancelLeave);

// Payroll routes
router.get('/payslips', authenticateEmployee, checkPermission('view_payslip'), getMyPayslips);

// Claim routes
router.get('/claims', authenticateEmployee, getMyClaims);
router.get('/claims/categories', authenticateEmployee, getClaimCategories);
router.post('/claims', authenticateEmployee, submitClaim);

// Task routes
router.get('/tasks', authenticateEmployee, getMyTasks);
router.put('/tasks/:taskId', authenticateEmployee, updateMyTask);
router.get('/performance/ratings', authenticateEmployee, getMyRatings);

// Grievance routes
router.get('/grievances', authenticateEmployee, getMyGrievances);
router.post('/grievances', authenticateEmployee, submitGrievance);
router.get('/grievances/assigned', authenticateEmployee, getAssignedGrievances);
router.put('/grievances/:grievanceId/status', authenticateEmployee, updateGrievanceStatus);

// Organogram routes
router.get('/organogram', authenticateEmployee, getMyHierarchy);
router.get('/organogram/full', authenticateEmployee, getFullOrganogram);
router.get('/organogram/node/:nodeId', authenticateEmployee, getNodeDetails);

module.exports = router;
