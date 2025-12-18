const express = require('express');
const router = express.Router();
const trainingInfrastructureController = require('../controllers/trainingInfrastructureController');
const { protect } = require('../middleware/auth');

router.post('/', protect, trainingInfrastructureController.create);
router.get('/', protect, trainingInfrastructureController.getAll);
router.put('/:id', protect, trainingInfrastructureController.update);
router.delete('/:id', protect, trainingInfrastructureController.delete);
router.post('/:id/photos', protect, trainingInfrastructureController.uploadMiddleware, trainingInfrastructureController.uploadPhotos);

module.exports = router;
