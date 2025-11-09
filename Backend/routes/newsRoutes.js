const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const recruiterNewsController = require('../controllers/recruiterNewsController');
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'recruiter-news-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Public routes for news page
router.get('/all', newsController.getAllNews);
router.get('/category/:category', newsController.getNewsByCategory);

// Recruiter news routes
router.post('/recruiter', authenticate, upload.single('bannerImage'), recruiterNewsController.addNews);
router.get('/recruiter', authenticate, recruiterNewsController.getNews);
router.get('/recruiter/:newsId', authenticate, recruiterNewsController.getNewsById);
router.put('/recruiter/:newsId', authenticate, upload.single('bannerImage'), recruiterNewsController.updateNews);
router.delete('/recruiter/:newsId', authenticate, recruiterNewsController.deleteNews);
router.get('/recruiter/public/:recruiterId', recruiterNewsController.getPublicNews);
router.get('/recruiter/all', recruiterNewsController.getAllNews);

// Institute news routes
const instituteEventNewsController = require('../controllers/instituteEventNewsController');
router.get('/institute/all', instituteEventNewsController.getAllInstituteNews);

module.exports = router;