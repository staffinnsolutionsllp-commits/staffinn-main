const express = require('express');
const router = express.Router();
const courseDetailController = require('../controllers/courseDetailController');
const { protect } = require('../middleware/auth');

router.post('/', protect, courseDetailController.create);
router.get('/', protect, courseDetailController.getAll);
router.put('/:id', protect, courseDetailController.update);
router.delete('/:id', protect, courseDetailController.delete);

module.exports = router;
