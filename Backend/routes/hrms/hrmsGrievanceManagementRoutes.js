const express = require('express');
const router = express.Router();
const {
  createGrievance,
  getGrievances,
  getGrievanceById,
  updateGrievanceStatus,
  addRemark,
  getGrievanceStats
} = require('../../controllers/hrms/hrmsGrievanceManagementController');
const { authenticateToken, authorizeRoles } = require('../../middleware/hrmsAuth');

router.use(authenticateToken);

// Debug middleware
router.use((req, res, next) => {
  let rawBody = '';
  req.on('data', chunk => { rawBody += chunk.toString(); });
  req.on('end', () => {
    console.log('Raw body received:', rawBody);
    console.log('Parsed body:', req.body);
  });
  next();
});

router.post('/', createGrievance);
router.get('/', getGrievances);
router.get('/stats', getGrievanceStats);
router.get('/:grievanceId', getGrievanceById);
router.put('/:grievanceId/status', authorizeRoles('admin', 'hr', 'manager'), updateGrievanceStatus);
router.post('/:grievanceId/remarks', addRemark);

module.exports = router;
