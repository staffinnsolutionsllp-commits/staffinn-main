const express = require('express');
const router = express.Router();
const {
  getLeaveStats,
  getLeaves,
  getLeaveById,
  createLeave,
  updateLeaveStatus,
  getLeaveRules,
  createLeaveRule,
  updateLeaveRule,
  deactivateLeaveRule,
  getLeaveBalances,
  adjustLeaveBalance,
  createLeaveBalance,
  deleteLeaveBalancesByType,
  getLeaveAnalytics,
  getLeaveSettings,
  updateLeaveSettings,
  syncLeaveBalances,
  processCarryForwardLeaves
} = require('../../controllers/hrms/hrmsLeaveController');
const { authenticateToken } = require('../../middleware/hrmsAuth');

router.use(authenticateToken);

// Leave Stats & Dashboard
router.get('/stats', getLeaveStats);
router.get('/analytics', getLeaveAnalytics);
router.get('/rules', getLeaveRules);
router.get('/balances', getLeaveBalances);
router.get('/settings', getLeaveSettings);
router.get('/:leaveId', getLeaveById);
router.get('/', getLeaves);
router.post('/', createLeave);
router.put('/:leaveId/status', updateLeaveStatus);
router.post('/rules', createLeaveRule);
router.put('/rules/:ruleId', updateLeaveRule);
router.delete('/rules/:ruleId', deactivateLeaveRule);
router.post('/balances/adjust', adjustLeaveBalance);
router.post('/balances/create', createLeaveBalance);
router.post('/balances/sync', syncLeaveBalances);
router.post('/balances/carry-forward', processCarryForwardLeaves);
router.delete('/balances/delete-by-type', deleteLeaveBalancesByType);
router.put('/settings', updateLeaveSettings);

module.exports = router;
