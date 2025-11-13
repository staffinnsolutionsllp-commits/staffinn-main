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
  getAllInstitutes,
  searchInstitutes,
  deleteInstitute,
  uploadProfileImage,
  deleteProfileImage,
  updatePlacementSection,
  getPlacementSection,
  getPublicPlacementSection,
  getPublicDashboardStats,
  getEnrollmentTrends,
  getPlacementTrends,
  updateIndustryCollaborations,
  getIndustryCollaborations,
  getPublicIndustryCollaborations,
  uploadCollaborationImage,
  uploadMouPdf,
  deleteCollaborationImage,
  deleteMouPdf,
  serveMouPdf,
  upload,
  studentUpload,
  placementUpload,
  industryCollabUpload
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

// Import event news controller
const {
  upload: eventNewsUpload,
  addEventNews,
  getEventNews,
  getEventNewsByTypeController,
  getEventNewsItem,
  updateEventNewsItem,
  deleteEventNewsItem,
  getPublicEventNews
} = require('../controllers/instituteEventNewsController');

// Import course controller
const {
  createCourse,
  getCourses,
  getPublicCourses,
  getPublicCourseById,
  checkEnrollmentStatus,
  enrollInCourse,
  getUserEnrollments,
  getCourseContent,
  updateProgress,
  getActiveCourseCount,
  debugCourseContent,
  fixContentUrls,
  getTrendingCourses
} = require('../controllers/instituteCourseController');

// Import quiz controller
const {
  createQuiz,
  getModuleQuiz,
  submitQuiz,
  submitContentQuiz,
  getUserQuizResults,
  getUserQuizProgress
} = require('../controllers/quizController');

// Import institute government scheme controller
const {
  addInstituteGovernmentScheme,
  getInstituteGovernmentSchemes,
  getPublicInstituteGovernmentSchemes,
  updateInstituteGovernmentScheme,
  deleteInstituteGovernmentScheme
} = require('../controllers/instituteGovernmentSchemeController');

// Public routes (no authentication required)
router.get('/public/all', getAllLiveInstitutes);
router.get('/public/:id', getInstituteById);
router.get('/public/:instituteId/courses', getPublicCourses);
router.get('/courses/:courseId/public', getPublicCourseById);
router.get('/courses/trending', getTrendingCourses);
router.get('/public/:id/placement-section', getPublicPlacementSection);
router.get('/public/:id/dashboard-stats', getPublicDashboardStats);
router.get('/public/:id/industry-collaborations', getPublicIndustryCollaborations);
router.get('/public/:instituteId/events-news', getPublicEventNews);
router.get('/public/:instituteId/government-schemes', getPublicInstituteGovernmentSchemes);
router.get('/mou-pdf/:filename', serveMouPdf); // Public PDF serving route


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
router.put('/placement-section', placementUpload.any(), updatePlacementSection);
router.get('/placement-section', getPlacementSection);

// Industry collaboration routes
router.put('/industry-collaborations', updateIndustryCollaborations);
router.get('/industry-collaborations', getIndustryCollaborations);

// Real-time file upload routes for industry collaborations
router.post('/upload-collaboration-image', industryCollabUpload.single('collaborationImage'), uploadCollaborationImage);
router.post('/upload-mou-pdf', industryCollabUpload.single('mouPdf'), uploadMouPdf);
router.delete('/delete-collaboration-image', deleteCollaborationImage);
router.delete('/delete-mou-pdf', deleteMouPdf);

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

// Dashboard chart data routes
router.get('/dashboard/enrollment-trends', getEnrollmentTrends);
router.get('/dashboard/placement-trends', getPlacementTrends);

// Events & News management routes
router.post('/events-news', eventNewsUpload.single('bannerImage'), addEventNews);
router.get('/events-news', getEventNews);
router.get('/events-news/type/:type', getEventNewsByTypeController);
router.get('/events-news/:eventNewsId', getEventNewsItem);
router.put('/events-news/:eventNewsId', eventNewsUpload.single('bannerImage'), updateEventNewsItem);
router.delete('/events-news/:eventNewsId', deleteEventNewsItem);

// Course management routes
const multer = require('multer');
const courseUpload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
    files: 50 // Maximum 50 files
  }
});

router.post('/courses', courseUpload.any(), createCourse);
router.get('/courses', getCourses);
router.get('/active-courses-count', getActiveCourseCount);
router.get('/courses/:courseId/debug', debugCourseContent);
router.post('/courses/:courseId/fix-urls', fixContentUrls);

// Course enrollment routes
router.get('/courses/:courseId/enrollment-status', checkEnrollmentStatus);
router.post('/courses/:courseId/enroll', enrollInCourse);
router.get('/my-enrollments', getUserEnrollments);
router.get('/courses/:courseId/content', getCourseContent);
router.put('/courses/content/:contentId/progress', updateProgress);

// Quiz routes
router.post('/modules/:moduleId/quiz', createQuiz);
router.get('/modules/:moduleId/quiz', getModuleQuiz);
router.post('/quiz/:quizId/submit', submitQuiz);
router.post('/content/:contentId/quiz/submit', submitContentQuiz);
router.get('/quiz/:quizId/results', getUserQuizResults);
router.get('/courses/:courseId/quiz-progress', getUserQuizProgress);

// Government schemes routes
router.post('/government-schemes', addInstituteGovernmentScheme);
router.get('/government-schemes', getInstituteGovernmentSchemes);
router.put('/government-schemes/:schemeId', updateInstituteGovernmentScheme);
router.delete('/government-schemes/:schemeId', deleteInstituteGovernmentScheme);

// Admin routes
router.get('/all', getAllInstitutes);
router.get('/search', searchInstitutes);
router.delete('/:instituteId', deleteInstitute);

module.exports = router;