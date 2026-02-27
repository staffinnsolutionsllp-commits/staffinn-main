const express = require('express');
const router = express.Router();
const {
  createCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  updateCandidateStatus,
  deleteCandidate,
  getCandidateStats
} = require('../../controllers/hrms/hrmsCandidateController');
const { authenticateToken, authorizeRoles } = require('../../middleware/hrmsAuth');

// Remove auth for candidate creation (anyone can add candidates)
router.post('/', createCandidate);

// Apply auth to other routes
router.use(authenticateToken);
router.get('/', getAllCandidates);
router.get('/stats', getCandidateStats);
router.get('/:id', getCandidateById);
router.put('/:id', updateCandidate);
router.put('/:id/status', updateCandidateStatus);
router.delete('/:id', deleteCandidate);

module.exports = router;