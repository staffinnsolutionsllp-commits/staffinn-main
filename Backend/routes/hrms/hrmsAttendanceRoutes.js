const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendanceByDate,
  getEmployeeAttendance,
  getAttendanceStats,
  getDeviceStatus,
  syncFromBridge
} = require('../../controllers/hrms/hrmsAttendanceController');
const { authenticateToken, authorizeRoles } = require('../../middleware/hrmsAuth');

// Heartbeat endpoint - no auth required
router.post('/heartbeat', (req, res) => {
  const { deviceHeartbeats } = require('../../controllers/hrms/hrmsAttendanceController');
  const companyId = req.body.companyId;
  if (companyId) {
    deviceHeartbeats.set(companyId, Date.now());
    console.log(`💓 Heartbeat received from company: ${companyId}`);
  }
  res.json({ success: true });
});

// Bridge sync endpoint - no auth required for bridge service
router.post('/bridge-sync', syncFromBridge);

// Manual stats endpoint for testing - no auth required
router.get('/manual-stats', async (req, res) => {
  try {
    const { getAttendanceStats } = require('../../controllers/hrms/hrmsAttendanceController');
    await getAttendanceStats(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Manual sync endpoint for testing - no auth required
router.get('/manual-sync', async (req, res) => {
  try {
    const { syncFromBridge } = require('../../controllers/hrms/hrmsAttendanceController');
    await syncFromBridge(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.use(authenticateToken);

router.post('/', authorizeRoles('admin', 'hr', 'manager', 'employee'), markAttendance);
router.get('/stats', getAttendanceStats);
router.get('/device-status', getDeviceStatus);
router.get('/date/:date', getAttendanceByDate);
router.get('/employee/:employeeId', getEmployeeAttendance);

module.exports = router;