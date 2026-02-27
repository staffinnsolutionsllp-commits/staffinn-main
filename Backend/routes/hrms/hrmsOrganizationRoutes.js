const express = require('express');
const router = express.Router();
const {
  createOrgNode,
  getOrganizationChart,
  updateOrgNode,
  deleteOrgNode
} = require('../../controllers/hrms/hrmsOrganizationController');
const { authenticateToken, authorizeRoles } = require('../../middleware/hrmsAuth');

router.use(authenticateToken);

router.post('/', createOrgNode);
router.get('/', getOrganizationChart);
router.put('/:id', updateOrgNode);
router.delete('/:id', deleteOrgNode);

module.exports = router;