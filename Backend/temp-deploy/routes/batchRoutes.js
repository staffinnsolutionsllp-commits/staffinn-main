const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const batchController = require('../controllers/batchController');

router.post('/', protect, batchController.create);
router.get('/', protect, batchController.getAll);
router.get('/:id', protect, batchController.getById);
router.put('/:id', protect, batchController.update);
router.put('/:id/status', protect, batchController.updateStatus);
router.delete('/:id', protect, batchController.delete);

module.exports = router;
