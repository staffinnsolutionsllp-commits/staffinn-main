const express = require('express');
const router  = express.Router();
const {
  createSeparation,
  getSeparations,
  getSeparationById,
  getSeparationStats,
  updateResignationStatus,
  updateNoticePeriod,
  updateExitInterview,
  updateFnFSettlement,
  updateExitDocuments,
  updateFinalRating,
  generateNDC,
  getNDC,
  updateITClearance,
  updateMediaClearance,
  updateProjectClearance,
  updateAccountsClearance,
  updateHRClearance,
  updateFinalNDCApproval
} = require('../../controllers/hrms/hrmsSeparationController');
const { authenticateToken, authorizeRoles } = require('../../middleware/hrmsAuth');

router.use(authenticateToken);

// ── Separation CRUD ──────────────────────────────────────────────────────
router.post ('/',           authorizeRoles('admin', 'hr'), createSeparation);
router.get  ('/',           getSeparations);
router.get  ('/stats',      getSeparationStats);
router.get  ('/:separationId', getSeparationById);
router.put  ('/:separationId/status',         authorizeRoles('admin', 'hr'), updateResignationStatus);
router.put  ('/:separationId/notice-period',  authorizeRoles('admin', 'hr'), updateNoticePeriod);
router.put  ('/:separationId/exit-interview', authorizeRoles('admin', 'hr'), updateExitInterview);
router.put  ('/:separationId/fnf-settlement', authorizeRoles('admin', 'hr'), updateFnFSettlement);
router.put  ('/:separationId/exit-documents', authorizeRoles('admin', 'hr'), updateExitDocuments);
router.put  ('/:separationId/final-rating',   authorizeRoles('admin', 'hr', 'manager'), updateFinalRating);

// ── No Dues Clearance ────────────────────────────────────────────────────
router.post ('/:separationId/generate-ndc',       authorizeRoles('admin', 'hr'), generateNDC);
router.get  ('/:separationId/ndc',                getNDC);
router.put  ('/:separationId/ndc/it',             authorizeRoles('admin', 'hr', 'manager'), updateITClearance);
router.put  ('/:separationId/ndc/media',          authorizeRoles('admin', 'hr', 'manager'), updateMediaClearance);
router.put  ('/:separationId/ndc/project',        authorizeRoles('admin', 'hr', 'manager'), updateProjectClearance);
router.put  ('/:separationId/ndc/accounts',       authorizeRoles('admin', 'hr', 'manager'), updateAccountsClearance);
router.put  ('/:separationId/ndc/hr',             authorizeRoles('admin', 'hr'), updateHRClearance);
router.put  ('/:separationId/ndc/final-approval', authorizeRoles('admin', 'hr'), updateFinalNDCApproval);

module.exports = router;
