const express = require('express');
const router = express.Router();
const {
  getClaimStats,
  getClaimCategories,
  createClaimCategory,
  updateClaimCategory,
  deleteClaimCategory,
  getClaims,
  createClaim,
  updateClaimStatus
} = require('../../controllers/hrms/hrmsClaimController');
const { authenticateToken } = require('../../middleware/hrmsAuth');

router.use(authenticateToken);

router.get('/stats', getClaimStats);
router.get('/categories', getClaimCategories);
router.post('/categories', createClaimCategory);
router.put('/categories/:categoryId', updateClaimCategory);
router.delete('/categories/:categoryId', deleteClaimCategory);
router.get('/', getClaims);
router.post('/', createClaim);
router.put('/:claimId/status', updateClaimStatus);

module.exports = router;
