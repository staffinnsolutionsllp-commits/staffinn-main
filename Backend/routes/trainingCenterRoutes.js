const express = require('express');
const router = express.Router();
const trainingCenterController = require('../controllers/trainingCenterController');
const { protect } = require('../middleware/auth');

router.post('/', protect, trainingCenterController.createTrainingCenter);
router.get('/', protect, trainingCenterController.getTrainingCenters);
router.put('/:id', protect, trainingCenterController.updateTrainingCenter);
router.delete('/:id', protect, trainingCenterController.deleteTrainingCenter);

module.exports = router;
