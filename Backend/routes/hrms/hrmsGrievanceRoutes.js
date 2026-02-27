const express = require('express');
const router = express.Router();
const {
  createGrievance,
  getAllGrievances,
  getGrievanceById,
  updateGrievanceStatus,
  addGrievanceComment,
  getMyGrievances
} = require('../../controllers/hrms/hrmsGrievanceController');
const { authenticateToken, authorizeRoles } = require('../../middleware/hrmsAuth');

router.use(authenticateToken);

router.post('/', createGrievance);
router.get('/', authorizeRoles('admin', 'hr', 'manager'), getAllGrievances);
router.get('/my', getMyGrievances);
router.get('/:id', getGrievanceById);
router.put('/:id/status', authorizeRoles('admin', 'hr', 'manager'), updateGrievanceStatus);
router.post('/:id/comments', addGrievanceComment);

module.exports = router;