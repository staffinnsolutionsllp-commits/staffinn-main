const express = require('express');
const router = express.Router();
const courseDetailController = require('../controllers/courseDetailController');
const { protect } = require('../middleware/auth');
const { upload } = require('../controllers/courseDetailController');

router.post('/', protect, upload.any(), courseDetailController.create);
router.get('/', protect, courseDetailController.getAll);
router.put('/:id', protect, upload.any(), courseDetailController.update);
router.delete('/:id', protect, courseDetailController.delete);

module.exports = router;
