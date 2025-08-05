/**
 * Institute Routes
 * Handles institute-related API endpoints
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  registerInstitute,
  getInstituteProfile,
  updateInstituteProfile,
  getInstituteProfileDetails,
  getAllLiveInstitutes,
  getInstituteById,
  verifyRegistrationNumber,
  getAllInstitutes,
  searchInstitutes,
  deleteInstitute,
  uploadProfileImage,
  deleteProfileImage,
  updatePlacementSection,
  getPlacementSection,
  getPublicPlacementSection,
  getPublicDashboardStats,
  upload,
  studentUpload,
  placementUpload
} = require('../controllers/instituteController');

// Import student controller
const {
  addStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getDashboardStats,
  updatePlacementStatus
} = require('../controllers/instituteStudentController');

// Public routes (no authentication required)
router.get('/public/all', getAllLiveInstitutes);
router.get('/public/:id', getInstituteById);
router.get('/public/:id/placement-section', getPublicPlacementSection);
router.get('/public/:id/dashboard-stats', getPublicDashboardStats);
router.post('/verify-registration', verifyRegistrationNumber);

// Registration route
router.post('/register', registerInstitute);

// Protected routes (authentication required)
router.use(protect); // Apply authentication middleware to all routes below

// Institute profile routes
router.get('/profile', getInstituteProfile);
router.get('/profile-details', getInstituteProfileDetails);
router.put('/profile', updateInstituteProfile);

// Image upload routes
router.post('/upload-image', upload.single('profileImage'), uploadProfileImage);
router.delete('/profile-image', deleteProfileImage);

// Placement section routes
router.put('/placement-section', placementUpload.fields([
  { name: 'companyLogos', maxCount: 10 },
  { name: 'studentPhotos', maxCount: 20 }
]), updatePlacementSection);
router.get('/placement-section', getPlacementSection);

// Student management routes
router.post('/students', studentUpload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'certificates', maxCount: 10 }
]), addStudent);
router.get('/students', getStudents);
router.get('/students/:studentId', getStudentById);
router.put('/students/:studentId', studentUpload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'resume', maxCount: 1 },
  { name: 'certificates', maxCount: 10 }
]), updateStudent);
router.delete('/students/:studentId', deleteStudent);
router.patch('/students/:studentId/placement-status', updatePlacementStatus);

// Dashboard stats route
router.get('/dashboard/stats', getDashboardStats);

// Course management routes
router.post('/courses', (req, res) => {
  res.json({ success: true, message: 'Course added successfully', data: { id: Date.now(), ...req.body, isActive: true } });
});
router.get('/courses', (req, res) => {
  res.json({ success: true, data: [] });
});
router.get('/active-courses-count', (req, res) => {
  res.json({ success: true, data: { activeCourses: 0 } });
});

// Admin routes
router.get('/all', getAllInstitutes);
router.get('/search', searchInstitutes);
router.delete('/:instituteId', deleteInstitute);

module.exports = router;