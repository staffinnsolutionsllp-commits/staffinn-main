const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const {
  addStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getDashboardStats,
  updatePlacementStatus,
  getStudentApplicationHistory
} = require('../controllers/instituteStudentController');

const {
  createCourse,
  getCourses,
  getActiveCourseCount
} = require('../controllers/instituteCourseController');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'profilePhoto') {
      const allowedTypes = /jpeg|jpg|png|gif|webp/;
      const extname = allowedTypes.test(file.originalname.toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      if (mimetype && extname) return cb(null, true);
      else cb(new Error('Only image files are allowed for profile photo'));
    } else if (file.fieldname === 'resume') {
      const allowedTypes = /pdf|doc|docx/;
      const extname = allowedTypes.test(file.originalname.toLowerCase());
      if (extname) return cb(null, true);
      else cb(new Error('Only PDF/DOC files are allowed for resume'));
    } else if (file.fieldname === 'certificates') {
      const allowedTypes = /pdf|jpg|jpeg|png/;
      const extname = allowedTypes.test(file.originalname.toLowerCase());
      if (extname) return cb(null, true);
      else cb(new Error('Only PDF/Image files are allowed for certificates'));
    }
    cb(null, true);
  }
});

// Apply authentication middleware
router.use(authenticate);

// Student routes
router.post('/students', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'certificates', maxCount: 10 }
]), addStudent);

router.get('/students', getStudents);
router.get('/students/:studentId', getStudentById);
router.put('/students/:studentId', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'certificates', maxCount: 10 }
]), updateStudent);
router.delete('/students/:studentId', deleteStudent);
router.get('/dashboard-stats', getDashboardStats);
router.put('/students/:studentId/placement-status', updatePlacementStatus);
router.get('/students/:studentId/application-history', getStudentApplicationHistory);

// Course routes
router.post('/courses', createCourse);
router.get('/courses', getCourses);
router.get('/active-courses-count', getActiveCourseCount);

module.exports = router;