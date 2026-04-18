const instituteNewsModel = require('../models/instituteNewsModel');
const s3Service = require('../services/s3Service');

/**
 * Create news/event
 */
const createNews = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    const { title, description, type, eventDate, location } = req.body;

    console.log('📰 Creating news/event for institute:', instituteId);
    console.log('📝 Data:', { title, type, eventDate });

    // Handle file uploads
    const photos = [];
    const videos = [];

    if (req.files) {
      // Upload photos
      if (req.files.photos) {
        for (const photo of req.files.photos) {
          const photoResult = await s3Service.uploadFile(
            photo,
            `institutes/${instituteId}/news/photos/${Date.now()}-${photo.originalname}`
          );
          photos.push(photoResult.Location);
        }
      }

      // Upload videos
      if (req.files.videos) {
        for (const video of req.files.videos) {
          const videoResult = await s3Service.uploadFile(
            video,
            `institutes/${instituteId}/news/videos/${Date.now()}-${video.originalname}`
          );
          videos.push(videoResult.Location);
        }
      }
    }

    const newsData = {
      title,
      description,
      type,
      eventDate,
      location,
      photos,
      videos
    };

    const news = await instituteNewsModel.createNews(instituteId, newsData);

    console.log('✅ News/event created successfully:', news.newsId);

    res.status(201).json({
      success: true,
      message: 'News/event created successfully',
      data: news
    });
  } catch (error) {
    console.error('❌ Create news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create news/event'
    });
  }
};

/**
 * Get all news for logged-in institute
 */
const getNews = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    const news = await instituteNewsModel.getNewsByInstitute(instituteId);

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news/events'
    });
  }
};

/**
 * Get news by ID
 */
const getNewsById = async (req, res) => {
  try {
    const { newsId } = req.params;
    const news = await instituteNewsModel.getNewsById(newsId);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News/event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Get news by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news/event'
    });
  }
};

/**
 * Update news/event
 */
const updateNews = async (req, res) => {
  try {
    const { newsId } = req.params;
    const instituteId = req.user.userId;
    const { title, description, type, eventDate, location } = req.body;

    // Verify ownership
    const existingNews = await instituteNewsModel.getNewsById(newsId);
    if (!existingNews || existingNews.instituteId !== instituteId) {
      return res.status(404).json({
        success: false,
        message: 'News/event not found'
      });
    }

    const updateData = {
      title,
      description,
      type,
      eventDate,
      location
    };

    // Handle new file uploads
    if (req.files) {
      if (req.files.photos) {
        const newPhotos = [];
        for (const photo of req.files.photos) {
          const photoResult = await s3Service.uploadFile(
            photo,
            `institutes/${instituteId}/news/photos/${Date.now()}-${photo.originalname}`
          );
          newPhotos.push(photoResult.Location);
        }
        updateData.photos = [...(existingNews.photos || []), ...newPhotos];
      }

      if (req.files.videos) {
        const newVideos = [];
        for (const video of req.files.videos) {
          const videoResult = await s3Service.uploadFile(
            video,
            `institutes/${instituteId}/news/videos/${Date.now()}-${video.originalname}`
          );
          newVideos.push(videoResult.Location);
        }
        updateData.videos = [...(existingNews.videos || []), ...newVideos];
      }
    }

    const updated = await instituteNewsModel.updateNews(newsId, updateData);

    if (updated) {
      res.status(200).json({
        success: true,
        message: 'News/event updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to update news/event'
      });
    }
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update news/event'
    });
  }
};

/**
 * Delete news/event
 */
const deleteNews = async (req, res) => {
  try {
    const { newsId } = req.params;
    const instituteId = req.user.userId;

    // Verify ownership
    const existingNews = await instituteNewsModel.getNewsById(newsId);
    if (!existingNews || existingNews.instituteId !== instituteId) {
      return res.status(404).json({
        success: false,
        message: 'News/event not found'
      });
    }

    const deleted = await instituteNewsModel.deleteNews(newsId);

    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'News/event deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to delete news/event'
      });
    }
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete news/event'
    });
  }
};

/**
 * Get public news for an institute (for public page)
 */
const getPublicNews = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const news = await instituteNewsModel.getPublicNews(instituteId);

    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('Get public news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news/events'
    });
  }
};

module.exports = {
  createNews,
  getNews,
  getNewsById,
  updateNews,
  deleteNews,
  getPublicNews
};
