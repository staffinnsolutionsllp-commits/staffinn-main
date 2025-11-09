/**
 * News Admin Routes
 * Routes for News Admin Panel operations
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  // Hero Sections
  createHeroSection,
  getLatestHeroSection,
  getAllHeroSections,
  updateHeroSection,
  toggleHeroSectionVisibility,
  deleteHeroSection,
  // Trending Topics
  createTrendingTopic,
  getAllTrendingTopics,
  getVisibleTrendingTopics,
  updateTrendingTopic,
  toggleTrendingTopicVisibility,
  deleteTrendingTopic,
  // Expert Insights
  createExpertInsight,
  getAllExpertInsights,
  getVisibleExpertInsights,
  updateExpertInsight,
  toggleExpertInsightVisibility,
  deleteExpertInsight,
  // Posted News
  createPostedNews,
  getAllPostedNews,
  getVisiblePostedNews,
  updatePostedNews,
  togglePostedNewsVisibility,
  deletePostedNews
} = require('../controllers/newsAdminController');

// Configure multer for different file types
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

/**
 * Hero Sections Routes
 */

// Create new hero section
router.post('/hero-sections', upload.single('banner'), createHeroSection);

// Get latest hero section (for frontend display)
router.get('/hero-sections/latest', getLatestHeroSection);

// Get all hero sections (for admin panel)
router.get('/hero-sections', getAllHeroSections);

// Update hero section
router.put('/hero-sections/:heroId', upload.single('banner'), updateHeroSection);

// Toggle hero section visibility
router.patch('/hero-sections/:heroId/toggle-visibility', toggleHeroSectionVisibility);

// Delete hero section
router.delete('/hero-sections/:heroId', deleteHeroSection);

/**
 * Trending Topics Routes
 */

// Create new trending topic
router.post('/trending-topics', upload.single('image'), createTrendingTopic);

// Get all trending topics (for admin panel)
router.get('/trending-topics', getAllTrendingTopics);

// Get visible trending topics (for frontend display)
router.get('/trending-topics/visible', getVisibleTrendingTopics);

// Update trending topic
router.put('/trending-topics/:topicId', upload.single('image'), updateTrendingTopic);

// Toggle trending topic visibility
router.patch('/trending-topics/:topicId/toggle-visibility', toggleTrendingTopicVisibility);

// Delete trending topic
router.delete('/trending-topics/:topicId', deleteTrendingTopic);

/**
 * Expert Insights Routes
 */

// Create new expert insight
router.post('/expert-insights', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), createExpertInsight);

// Get all expert insights (for admin panel)
router.get('/expert-insights', getAllExpertInsights);

// Get visible expert insights (for frontend display)
router.get('/expert-insights/visible', getVisibleExpertInsights);

// Update expert insight
router.put('/expert-insights/:insightId', upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), updateExpertInsight);

// Toggle expert insight visibility
router.patch('/expert-insights/:insightId/toggle-visibility', toggleExpertInsightVisibility);

// Delete expert insight
router.delete('/expert-insights/:insightId', deleteExpertInsight);

/**
 * Posted News Routes
 */

// Create new posted news
router.post('/posted-news', upload.single('banner'), createPostedNews);

// Get all posted news (for admin panel)
router.get('/posted-news', getAllPostedNews);

// Get visible posted news (for frontend display)
router.get('/posted-news/visible', getVisiblePostedNews);

// Update posted news
router.put('/posted-news/:newsId', upload.single('banner'), updatePostedNews);

// Toggle posted news visibility
router.patch('/posted-news/:newsId/toggle-visibility', togglePostedNewsVisibility);

// Delete posted news
router.delete('/posted-news/:newsId', deletePostedNews);

/**
 * Recruiter News Management Routes
 */
const recruiterNewsModel = require('../models/recruiterNewsModel');

// Get all recruiter news (for admin panel)
router.get('/recruiter-news', async (req, res) => {
  try {
    const result = await recruiterNewsModel.getAll();
    res.json(result);
  } catch (error) {
    console.error('Error getting recruiter news:', error);
    res.status(500).json({ success: false, message: 'Failed to get recruiter news' });
  }
});

// Toggle recruiter news visibility
router.patch('/recruiter-news/:newsId/toggle-visibility', async (req, res) => {
  try {
    const { newsId } = req.params;
    const result = await recruiterNewsModel.toggleVisibility(newsId);
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io && result.success) {
      io.emit('recruiterNewsVisibilityToggled', result.data);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error toggling recruiter news visibility:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle visibility' });
  }
});

// Delete recruiter news
router.delete('/recruiter-news/:newsId', async (req, res) => {
  try {
    const { newsId } = req.params;
    const result = await recruiterNewsModel.delete(newsId);
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io && result.success) {
      io.emit('recruiterNewsDeleted', { recruiterNewsID: newsId });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting recruiter news:', error);
    res.status(500).json({ success: false, message: 'Failed to delete news' });
  }
});

/**
 * Institute News Management Routes
 */
const instituteEventNewsModel = require('../models/instituteEventNewsModel');

// Get all institute news (for admin panel)
router.get('/institute-news', async (req, res) => {
  try {
    const result = await instituteEventNewsModel.getAllPublic();
    res.json(result);
  } catch (error) {
    console.error('Error getting institute news:', error);
    res.status(500).json({ success: false, message: 'Failed to get institute news' });
  }
});

// Toggle institute news visibility
router.patch('/institute-news/:newsId/toggle-visibility', async (req, res) => {
  try {
    const { newsId } = req.params;
    const result = await instituteEventNewsModel.toggleVisibility(newsId);
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io && result.success) {
      io.emit('instituteNewsVisibilityToggled', result.data);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error toggling institute news visibility:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle visibility' });
  }
});

// Delete institute news
router.delete('/institute-news/:newsId', async (req, res) => {
  try {
    const { newsId } = req.params;
    const result = await instituteEventNewsModel.adminDelete(newsId);
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io && result.success) {
      io.emit('instituteNewsDeleted', { eventNewsId: newsId });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting institute news:', error);
    res.status(500).json({ success: false, message: 'Failed to delete news' });
  }
});

/**
 * Health check route
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'News Admin API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;