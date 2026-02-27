const express = require('express');
const router = express.Router();
const {
  createSeparation,
  getSeparations,
  getSeparationById,
  updateResignationStatus,
  updateNoticePeriod,
  updateExitInterview,
  updateFnFSettlement,
  updateExitDocuments,
  updateFinalRating,
  getSeparationStats
} = require('../../controllers/hrms/hrmsSeparationController');
const { authenticateToken, authorizeRoles } = require('../../middleware/hrmsAuth');

router.use(authenticateToken);

router.post('/', authorizeRoles('admin', 'hr'), createSeparation);
router.get('/', getSeparations);
router.get('/stats', getSeparationStats);
router.get('/:separationId', getSeparationById);
router.put('/:separationId/status', authorizeRoles('admin', 'hr'), updateResignationStatus);
router.put('/:separationId/notice-period', authorizeRoles('admin', 'hr'), updateNoticePeriod);
router.put('/:separationId/exit-interview', authorizeRoles('admin', 'hr'), updateExitInterview);
router.put('/:separationId/fnf-settlement', authorizeRoles('admin', 'hr'), updateFnFSettlement);
router.put('/:separationId/exit-documents', authorizeRoles('admin', 'hr'), updateExitDocuments);
router.put('/:separationId/final-rating', authorizeRoles('admin', 'hr', 'manager'), updateFinalRating);

module.exports = router;
