const express = require('express');
const router = express.Router();
const misPlacementController = require('../controllers/misPlacementController');

router.get('/analytics', misPlacementController.getMisPlacementAnalytics);
router.get('/stats', misPlacementController.getMisPlacementStats);

module.exports = router;