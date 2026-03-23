const express = require('express');
const router = express.Router();
const { login, changePassword, getProfile } = require('../../controllers/hrms/employeeAuthController');
const { 
  getDashboardStats, 
  getMyAttendance, 
  markAttendance, 
  getMyLeaves, 
  getLeaveBalance,
  getLeaveTypes, 
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
  getNodeDetails,
  getSubordinatesHierarchy,
  assignTask
} = require('../../controllers/hrms/employeePortalController');

// Import grievance-specific controllers
const { 
  getReportingManagers, 
  getOrganizationEmployees 
} = require('../../controllers/hrms/hrmsGrievanceController');

// Import notification controller
const {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../../controllers/hrms/notificationController');

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
router.get('/leaves/types', authenticateEmployee, checkPermission('apply_leave'), getLeaveTypes);
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
router.post('/tasks/assign', authenticateEmployee, assignTask);
router.get('/performance/ratings', authenticateEmployee, getMyRatings);

// Grievance routes
router.get('/grievances', authenticateEmployee, getMyGrievances);
router.post('/grievances', authenticateEmployee, submitGrievance);
router.get('/grievances/assigned', authenticateEmployee, getAssignedGrievances);
router.get('/grievances/reporting-managers', authenticateEmployee, getReportingManagers);
router.get('/grievances/organization-employees', authenticateEmployee, getOrganizationEmployees);
router.put('/grievances/:grievanceId/status', authenticateEmployee, updateGrievanceStatus);

// Organogram routes
router.get('/organogram', authenticateEmployee, getMyHierarchy);
router.get('/organogram/subordinates', authenticateEmployee, getSubordinatesHierarchy);
router.get('/organogram/full', authenticateEmployee, getFullOrganogram);
router.get('/organogram/node/:nodeId', authenticateEmployee, getNodeDetails);

// Notification routes
router.get('/notifications', authenticateEmployee, getMyNotifications);
router.get('/notifications/unread-count', authenticateEmployee, getUnreadNotificationCount);
router.put('/notifications/:notificationId/read', authenticateEmployee, markNotificationAsRead);
router.put('/notifications/mark-all-read', authenticateEmployee, markAllNotificationsAsRead);

module.exports = router;
