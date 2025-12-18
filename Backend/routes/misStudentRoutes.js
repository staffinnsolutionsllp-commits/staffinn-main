const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const misStudentController = require('../controllers/misStudentController');

router.post('/upload-photo', protect, uploadSingle('profilePhoto'), misStudentController.uploadProfilePhoto);
router.post('/upload-document', protect, uploadSingle('document'), misStudentController.uploadDocument);
router.post('/', protect, misStudentController.create);
router.get('/', protect, misStudentController.getAll);
router.get('/count', protect, misStudentController.getCount);
router.get('/institute/:instituteId', protect, misStudentController.getStudentsByInstitute);
router.get('/:id', protect, misStudentController.getById);
router.put('/:id', protect, misStudentController.update);
router.delete('/:id', protect, misStudentController.delete);

module.exports = router;
