/**
 * News Admin Controller
 * Handles News Admin Panel operations with real-time updates
 */

const { HeroSectionsModel, TrendingTopicsModel, ExpertInsightsModel, PostedNewsModel } = require('../models/newsAdminModel');
const s3Service = require('../services/s3Service');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

/**
 * Hero Sections Controllers
 */

// Create new hero section
const createHeroSection = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    let bannerImageUrl = null;

    // Handle banner image upload
    if (req.file) {
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `hero-${uuidv4()}.${fileExtension}`;
      const s3Key = `news-hero-sections/${fileName}`;
      
      const uploadResult = await s3Service.uploadFile(req.file, s3Key);
      bannerImageUrl = uploadResult.Location;
    }

    // Create hero section in database
    const heroData = {
      title,
      content,
      tags: tags || '',
      bannerImageUrl
    };

    const result = await HeroSectionsModel.create(heroData);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('heroSectionCreated', result.data);
    }

    res.status(201).json({
      success: true,
      message: 'Hero section created successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error creating hero section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create hero section',
      error: error.message
    });
  }
};

// Get latest hero section
const getLatestHeroSection = async (req, res) => {
  try {
    const heroSection = await HeroSectionsModel.getLatest();
    
    res.json({
      success: true,
      data: heroSection
    });
  } catch (error) {
    console.error('Error getting latest hero section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get latest hero section',
      error: error.message
    });
  }
};

// Get all hero sections
const getAllHeroSections = async (req, res) => {
  try {
    const heroSections = await HeroSectionsModel.getAll();
    
    res.json({
      success: true,
      data: heroSections
    });
  } catch (error) {
    console.error('Error getting hero sections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hero sections',
      error: error.message
    });
  }
};

// Update hero section
const updateHeroSection = async (req, res) => {
  try {
    const { heroId } = req.params;
    const { title, content, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    let bannerImageUrl = req.body.bannerImageUrl; // Keep existing if no new file

    // Handle new banner image upload
    if (req.file) {
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `hero-${uuidv4()}.${fileExtension}`;
      const s3Key = `news-hero-sections/${fileName}`;
      
      const uploadResult = await s3Service.uploadFile(req.file, s3Key);
      bannerImageUrl = uploadResult.Location;
    }

    const updateData = {
      title,
      content,
      tags: tags || '',
      bannerImageUrl
    };

    const result = await HeroSectionsModel.update(heroId, updateData);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('heroSectionUpdated', result.data);
    }

    res.json({
      success: true,
      message: 'Hero section updated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error updating hero section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hero section',
      error: error.message
    });
  }
};

// Toggle hero section visibility
const toggleHeroSectionVisibility = async (req, res) => {
  try {
    const { heroId } = req.params;
    
    const result = await HeroSectionsModel.toggleVisibility(heroId);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('heroSectionVisibilityToggled', result.data);
    }

    res.json({
      success: true,
      message: 'Hero section visibility toggled successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error toggling hero section visibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle hero section visibility',
      error: error.message
    });
  }
};

// Delete hero section
const deleteHeroSection = async (req, res) => {
  try {
    const { heroId } = req.params;
    
    await HeroSectionsModel.delete(heroId);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('heroSectionDeleted', { heroId });
    }

    res.json({
      success: true,
      message: 'Hero section deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hero section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete hero section',
      error: error.message
    });
  }
};

/**
 * Trending Topics Controllers
 */

// Create new trending topic
const createTrendingTopic = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    let imageUrl = null;

    // Handle image upload
    if (req.file) {
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `topic-${uuidv4()}.${fileExtension}`;
      const s3Key = `news-trending-topics/${fileName}`;
      
      const uploadResult = await s3Service.uploadFile(req.file, s3Key);
      imageUrl = uploadResult.Location;
    }

    // Create trending topic in database
    const topicData = {
      title,
      description,
      imageUrl
    };

    const result = await TrendingTopicsModel.create(topicData);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('trendingTopicCreated', result.data);
    }

    res.status(201).json({
      success: true,
      message: 'Trending topic created successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error creating trending topic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create trending topic',
      error: error.message
    });
  }
};

// Get all trending topics
const getAllTrendingTopics = async (req, res) => {
  try {
    const topics = await TrendingTopicsModel.getAll();
    
    res.json({
      success: true,
      data: topics
    });
  } catch (error) {
    console.error('Error getting trending topics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending topics',
      error: error.message
    });
  }
};

// Get visible trending topics
const getVisibleTrendingTopics = async (req, res) => {
  try {
    const topics = await TrendingTopicsModel.getVisible();
    
    res.json({
      success: true,
      data: topics
    });
  } catch (error) {
    console.error('Error getting visible trending topics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get visible trending topics',
      error: error.message
    });
  }
};

// Update trending topic
const updateTrendingTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { title, description } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    let imageUrl = req.body.imageUrl; // Keep existing if no new file

    // Handle new image upload
    if (req.file) {
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `topic-${uuidv4()}.${fileExtension}`;
      const s3Key = `news-trending-topics/${fileName}`;
      
      const uploadResult = await s3Service.uploadFile(req.file, s3Key);
      imageUrl = uploadResult.Location;
    }

    const updateData = {
      title,
      description,
      imageUrl
    };

    const result = await TrendingTopicsModel.update(topicId, updateData);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('trendingTopicUpdated', result.data);
    }

    res.json({
      success: true,
      message: 'Trending topic updated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error updating trending topic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update trending topic',
      error: error.message
    });
  }
};

// Toggle trending topic visibility
const toggleTrendingTopicVisibility = async (req, res) => {
  try {
    const { topicId } = req.params;
    
    const result = await TrendingTopicsModel.toggleVisibility(topicId);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('trendingTopicVisibilityToggled', result.data);
    }

    res.json({
      success: true,
      message: 'Trending topic visibility toggled successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error toggling trending topic visibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle trending topic visibility',
      error: error.message
    });
  }
};

// Delete trending topic
const deleteTrendingTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    
    await TrendingTopicsModel.delete(topicId);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('trendingTopicDeleted', { topicId });
    }

    res.json({
      success: true,
      message: 'Trending topic deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting trending topic:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete trending topic',
      error: error.message
    });
  }
};

/**
 * Expert Insights Controllers
 */

// Create new expert insight
const createExpertInsight = async (req, res) => {
  try {
    const { title, name, designation } = req.body;
    
    if (!title || !name || !designation) {
      return res.status(400).json({
        success: false,
        message: 'Title, name, and designation are required'
      });
    }

    let videoUrl = null;
    let thumbnailUrl = null;

    // Handle file uploads
    if (req.files) {
      // Handle video upload
      if (req.files.video && req.files.video[0]) {
        const videoFile = req.files.video[0];
        const videoExtension = videoFile.originalname.split('.').pop();
        const videoFileName = `insight-video-${uuidv4()}.${videoExtension}`;
        const videoS3Key = `news-expert-insights-videos/${videoFileName}`;
        
        const videoUploadResult = await s3Service.uploadFile(videoFile, videoS3Key);
        videoUrl = videoUploadResult.Location;
      }

      // Handle thumbnail upload
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        const thumbnailFile = req.files.thumbnail[0];
        const thumbnailExtension = thumbnailFile.originalname.split('.').pop();
        const thumbnailFileName = `insight-thumbnail-${uuidv4()}.${thumbnailExtension}`;
        const thumbnailS3Key = `news-expert-insights-thumbnails/${thumbnailFileName}`;
        
        const thumbnailUploadResult = await s3Service.uploadFile(thumbnailFile, thumbnailS3Key);
        thumbnailUrl = thumbnailUploadResult.Location;
      }
    }

    // Create expert insight in database
    const insightData = {
      title,
      name,
      designation,
      videoUrl,
      thumbnailUrl
    };

    const result = await ExpertInsightsModel.create(insightData);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('expertInsightCreated', result.data);
    }

    res.status(201).json({
      success: true,
      message: 'Expert insight created successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error creating expert insight:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expert insight',
      error: error.message
    });
  }
};

// Get all expert insights
const getAllExpertInsights = async (req, res) => {
  try {
    const insights = await ExpertInsightsModel.getAll();
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error getting expert insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expert insights',
      error: error.message
    });
  }
};

// Get visible expert insights
const getVisibleExpertInsights = async (req, res) => {
  try {
    const insights = await ExpertInsightsModel.getVisible();
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error getting visible expert insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get visible expert insights',
      error: error.message
    });
  }
};

// Update expert insight
const updateExpertInsight = async (req, res) => {
  try {
    const { insightId } = req.params;
    const { title, name, designation } = req.body;
    
    if (!title || !name || !designation) {
      return res.status(400).json({
        success: false,
        message: 'Title, name, and designation are required'
      });
    }

    let videoUrl = req.body.videoUrl; // Keep existing if no new file
    let thumbnailUrl = req.body.thumbnailUrl; // Keep existing if no new file

    // Handle new file uploads
    if (req.files) {
      // Handle video upload
      if (req.files.video && req.files.video[0]) {
        const videoFile = req.files.video[0];
        const videoExtension = videoFile.originalname.split('.').pop();
        const videoFileName = `insight-video-${uuidv4()}.${videoExtension}`;
        const videoS3Key = `news-expert-insights-videos/${videoFileName}`;
        
        const videoUploadResult = await s3Service.uploadFile(videoFile, videoS3Key);
        videoUrl = videoUploadResult.Location;
      }

      // Handle thumbnail upload
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        const thumbnailFile = req.files.thumbnail[0];
        const thumbnailExtension = thumbnailFile.originalname.split('.').pop();
        const thumbnailFileName = `insight-thumbnail-${uuidv4()}.${thumbnailExtension}`;
        const thumbnailS3Key = `news-expert-insights-thumbnails/${thumbnailFileName}`;
        
        const thumbnailUploadResult = await s3Service.uploadFile(thumbnailFile, thumbnailS3Key);
        thumbnailUrl = thumbnailUploadResult.Location;
      }
    }

    const updateData = {
      title,
      name,
      designation,
      videoUrl,
      thumbnailUrl
    };

    const result = await ExpertInsightsModel.update(insightId, updateData);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('expertInsightUpdated', result.data);
    }

    res.json({
      success: true,
      message: 'Expert insight updated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error updating expert insight:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expert insight',
      error: error.message
    });
  }
};

// Toggle expert insight visibility
const toggleExpertInsightVisibility = async (req, res) => {
  try {
    const { insightId } = req.params;
    
    const result = await ExpertInsightsModel.toggleVisibility(insightId);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('expertInsightVisibilityToggled', result.data);
    }

    res.json({
      success: true,
      message: 'Expert insight visibility toggled successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error toggling expert insight visibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle expert insight visibility',
      error: error.message
    });
  }
};

// Delete expert insight
const deleteExpertInsight = async (req, res) => {
  try {
    const { insightId } = req.params;
    
    await ExpertInsightsModel.delete(insightId);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('expertInsightDeleted', { insightId });
    }

    res.json({
      success: true,
      message: 'Expert insight deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expert insight:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete expert insight',
      error: error.message
    });
  }
};

/**
 * Posted News Controllers
 */

// Create new posted news
const createPostedNews = async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    let bannerImageUrl = null;

    if (req.file) {
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `posted-news-${uuidv4()}.${fileExtension}`;
      const s3Key = `staffinn-posted-news-photos/${fileName}`;
      
      const uploadResult = await s3Service.uploadFile(req.file, s3Key);
      bannerImageUrl = uploadResult.Location;
    }

    const newsData = {
      title,
      description,
      bannerImageUrl
    };

    const result = await PostedNewsModel.create(newsData);

    const io = req.app.get('io');
    if (io) {
      io.emit('postedNewsCreated', result.data);
    }

    res.status(201).json({
      success: true,
      message: 'Posted news created successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error creating posted news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create posted news',
      error: error.message
    });
  }
};

// Get all posted news
const getAllPostedNews = async (req, res) => {
  try {
    const news = await PostedNewsModel.getAll();
    
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error getting posted news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get posted news',
      error: error.message
    });
  }
};

// Get visible posted news
const getVisiblePostedNews = async (req, res) => {
  try {
    const news = await PostedNewsModel.getVisible();
    
    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Error getting visible posted news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get visible posted news',
      error: error.message
    });
  }
};

// Update posted news
const updatePostedNews = async (req, res) => {
  try {
    const { newsId } = req.params;
    const { title, description } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    let bannerImageUrl = req.body.bannerImageUrl;

    if (req.file) {
      const fileExtension = req.file.originalname.split('.').pop();
      const fileName = `posted-news-${uuidv4()}.${fileExtension}`;
      const s3Key = `staffinn-posted-news-photos/${fileName}`;
      
      const uploadResult = await s3Service.uploadFile(req.file, s3Key);
      bannerImageUrl = uploadResult.Location;
    }

    const updateData = {
      title,
      description,
      bannerImageUrl
    };

    const result = await PostedNewsModel.update(newsId, updateData);

    const io = req.app.get('io');
    if (io) {
      io.emit('postedNewsUpdated', result.data);
    }

    res.json({
      success: true,
      message: 'Posted news updated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error updating posted news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update posted news',
      error: error.message
    });
  }
};

// Toggle posted news visibility
const togglePostedNewsVisibility = async (req, res) => {
  try {
    const { newsId } = req.params;
    
    const result = await PostedNewsModel.toggleVisibility(newsId);

    const io = req.app.get('io');
    if (io) {
      io.emit('postedNewsVisibilityToggled', result.data);
    }

    res.json({
      success: true,
      message: 'Posted news visibility toggled successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error toggling posted news visibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle posted news visibility',
      error: error.message
    });
  }
};

// Delete posted news
const deletePostedNews = async (req, res) => {
  try {
    const { newsId } = req.params;
    
    await PostedNewsModel.delete(newsId);

    const io = req.app.get('io');
    if (io) {
      io.emit('postedNewsDeleted', { newsId });
    }

    res.json({
      success: true,
      message: 'Posted news deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting posted news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete posted news',
      error: error.message
    });
  }
};

module.exports = {
  upload,
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
};