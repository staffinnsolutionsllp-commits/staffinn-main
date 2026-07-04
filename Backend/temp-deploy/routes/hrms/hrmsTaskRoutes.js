const express = require('express');
const router = express.Router();
const {
  assignTask,
  getTasks,
  getTaskById,
  updateTaskStatus,
  getTaskStats,
  getPerformanceChart,
  addRating,
  getRatings
} = require('../../controllers/hrms/hrmsTaskController');
const { authenticateToken, authorizeRoles } = require('../../middleware/hrmsAuth');

router.use(authenticateToken);

router.post('/assign', authorizeRoles('admin', 'hr', 'manager'), assignTask);
router.get('/', getTasks);
router.get('/stats', getTaskStats);
router.get('/performance', getPerformanceChart);
router.get('/:taskId', getTaskById);
router.put('/:taskId/status', updateTaskStatus);
router.post('/ratings', authorizeRoles('admin', 'hr', 'manager'), addRating);
router.get('/ratings/list', getRatings);

module.exports = router;
