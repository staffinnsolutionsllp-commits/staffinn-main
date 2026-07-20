const express = require('express');
const router = express.Router();
const {
  getDTRReports,
  getDTRStats,
  getDTRByTask,
  getEmployeeDTRHistory,
  checkDTRCompliance
} = require('../../controllers/hrms/dtrController');
const { authenticateToken, authorizeRoles } = require('../../middleware/hrmsAuth');

router.use(authenticateToken);

// GET /api/v1/hrms/dtr/reports - Get all DTR reports (filterable)
router.get('/reports', getDTRReports);

// GET /api/v1/hrms/dtr/stats - Get DTR statistics
router.get('/stats', getDTRStats);

// GET /api/v1/hrms/dtr/task/:taskId - Get DTR history for a task
router.get('/task/:taskId', getDTRByTask);

// GET /api/v1/hrms/dtr/employee/:employeeId - Get employee DTR history
router.get('/employee/:employeeId', getEmployeeDTRHistory);

// POST /api/v1/hrms/dtr/check-compliance - Run compliance check
router.post('/check-compliance', authorizeRoles('admin', 'hr'), checkDTRCompliance);

module.exports = router;
