const express = require('express');
const router = express.Router();
const multer = require('multer');
const instituteStudentController = require('../controllers/instituteStudentController');
const { authenticate } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// Get all students for logged-in institute
router.get('/', authenticate, instituteStudentController.getStudents);

// Get student by ID
router.get('/:studentId', authenticate, instituteStudentController.getStudentById);

// Add new student
router.post('/', authenticate, upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'certificates', maxCount: 10 }
]), instituteStudentController.addStudent);

// Update student
router.put('/:studentId', authenticate, upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'certificates', maxCount: 10 }
]), instituteStudentController.updateStudent);

// Delete student
router.delete('/:studentId', authenticate, instituteStudentController.deleteStudent);

// Upload photo endpoint
router.post('/upload-photo', authenticate, upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const s3Service = require('../services/s3Service');
    const instituteId = req.user.userId;
    const result = await s3Service.uploadFile(
      req.file, 
      `institute-students/${instituteId}/profiles/${Date.now()}-${req.file.originalname}`
    );
    
    res.json({ success: true, url: result.Location });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// Upload document endpoint
router.post('/upload-document', authenticate, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const s3Service = require('../services/s3Service');
    const instituteId = req.user.userId;
    const result = await s3Service.uploadFile(
      req.file, 
      `institute-students/${instituteId}/documents/${Date.now()}-${req.file.originalname}`
    );
    
    res.json({ success: true, url: result.Location });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// Get dashboard stats
router.get('/stats/dashboard', authenticate, instituteStudentController.getDashboardStats);

// Update placement status
router.patch('/:studentId/placement-status', authenticate, instituteStudentController.updatePlacementStatus);

// Get student application history
router.get('/:studentId/application-history', authenticate, instituteStudentController.getStudentApplicationHistory);

module.exports = router;
