/**
 * Institute Event News Controller
 * Handles HTTP requests for institute events and news
 */

const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const awsConfig = require('../config/aws');
const {
  createEventNews,
  getEventNewsByInstituteId,
  getEventNewsById,
  updateEventNews,
  deleteEventNews,
  getEventNewsByType
} = require('../models/instituteEventNewsModel');

// Initialize S3 client
const s3Client = new S3Client(awsConfig);
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only image files for banner
    if (file.fieldname === 'bannerImage') {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
      }
    } else {
      cb(new Error('Unexpected field'));
    }
  }
});

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} mimeType - MIME type
 * @returns {Promise<string>} - S3 URL
 */
const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
  try {
    const key = `institute-events-news/${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType
    });

    await s3Client.send(command);
    
    const s3Url = `https://${S3_BUCKET_NAME}.s3.${awsConfig.region}.amazonaws.com/${key}`;
    console.log('File uploaded to S3:', s3Url);
    
    return s3Url;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

/**
 * Delete file from S3
 * @param {string} s3Url - S3 URL
 * @returns {Promise<boolean>} - Success status
 */
const deleteFromS3 = async (s3Url) => {
  try {
    // Extract key from S3 URL
    const urlParts = s3Url.split('/');
    const key = urlParts.slice(3).join('/'); // Remove https://bucket.s3.region.amazonaws.com/
    
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
    console.log('File deleted from S3:', key);
    
    return true;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    return false;
  }
};

/**
 * Create a new event or news item
 */
const addEventNews = async (req, res) => {
  try {
    console.log('Adding new event/news');
    console.log('Request body:', req.body);
    console.log('Files:', req.file);

    const { title, date, company, expectedParticipants, details, type, verified } = req.body;
    const instituteId = req.user?.userId;

    if (!instituteId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate required fields
    if (!title || !date || !company || !details || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, date, company, details, and type are required'
      });
    }

    // Validate type
    if (!['Event', 'News'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "Event" or "News"'
      });
    }

    let bannerImageUrl = null;

    // Handle banner image upload
    if (req.file && req.file.fieldname === 'bannerImage') {
      const fileName = `${uuidv4()}-${Date.now()}${path.extname(req.file.originalname)}`;
      bannerImageUrl = await uploadToS3(req.file.buffer, fileName, req.file.mimetype);
    }

    // Create event/news data
    const eventNewsData = {
      title,
      date,
      company,
      venue: req.body.venue || '',
      expectedParticipants: expectedParticipants ? parseInt(expectedParticipants) : null,
      details,
      type,
      verified: verified === 'true' || verified === true,
      bannerImage: bannerImageUrl
    };

    // Save to database
    const createdEventNews = await createEventNews(instituteId, eventNewsData);

    // Emit real-time update to News Admin Panel
    const io = req.app.get('io');
    if (io) {
      io.emit('instituteNewsCreated', createdEventNews);
    }

    res.status(201).json({
      success: true,
      message: `${type} added successfully`,
      data: createdEventNews
    });

  } catch (error) {
    console.error('Error adding event/news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add event/news'
    });
  }
};

/**
 * Get all events and news for the institute
 */
const getEventNews = async (req, res) => {
  try {
    console.log('Getting events/news for institute');
    const instituteId = req.user?.userId;

    if (!instituteId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const eventNewsItems = await getEventNewsByInstituteId(instituteId);

    // Separate events and news
    const events = eventNewsItems.filter(item => item.type === 'Event');
    const news = eventNewsItems.filter(item => item.type === 'News');

    res.json({
      success: true,
      data: {
        events,
        news,
        all: eventNewsItems
      }
    });

  } catch (error) {
    console.error('Error getting events/news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events/news'
    });
  }
};

/**
 * Get events and news by type
 */
const getEventNewsByTypeController = async (req, res) => {
  try {
    const { type } = req.params;
    const instituteId = req.user.userId;

    console.log('Getting events/news by type:', { instituteId, type });

    // Validate type
    if (!['Event', 'News'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "Event" or "News"'
      });
    }

    const items = await getEventNewsByType(instituteId, type);

    res.json({
      success: true,
      data: items
    });

  } catch (error) {
    console.error('Error getting events/news by type:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events/news'
    });
  }
};

/**
 * Get a specific event/news item
 */
const getEventNewsItem = async (req, res) => {
  try {
    const { eventNewsId } = req.params;
    const instituteId = req.user.userId;

    console.log('Getting event/news item:', { instituteId, eventNewsId });

    const eventNewsItem = await getEventNewsById(instituteId, eventNewsId);

    if (!eventNewsItem) {
      return res.status(404).json({
        success: false,
        message: 'Event/News not found'
      });
    }

    res.json({
      success: true,
      data: eventNewsItem
    });

  } catch (error) {
    console.error('Error getting event/news item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event/news item'
    });
  }
};

/**
 * Update an event/news item
 */
const updateEventNewsItem = async (req, res) => {
  try {
    const { eventNewsId } = req.params;
    const instituteId = req.user.userId;
    const { title, date, company, venue, expectedParticipants, details, type, verified } = req.body;

    console.log('Updating event/news item:', { instituteId, eventNewsId });
    console.log('Update data:', req.body);

    // Get existing item
    const existingItem = await getEventNewsById(instituteId, eventNewsId);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Event/News not found'
      });
    }

    let bannerImageUrl = existingItem.bannerImage;

    // Handle banner image upload
    if (req.file && req.file.fieldname === 'bannerImage') {
      // Delete old image if exists
      if (existingItem.bannerImage) {
        await deleteFromS3(existingItem.bannerImage);
      }
      
      const fileName = `${uuidv4()}-${Date.now()}${path.extname(req.file.originalname)}`;
      bannerImageUrl = await uploadToS3(req.file.buffer, fileName, req.file.mimetype);
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (date !== undefined) updateData.date = date;
    if (company !== undefined) updateData.company = company;
    if (venue !== undefined) updateData.venue = venue;
    if (expectedParticipants !== undefined) updateData.expectedParticipants = expectedParticipants ? parseInt(expectedParticipants) : null;
    if (details !== undefined) updateData.details = details;
    if (type !== undefined) updateData.type = type;
    if (verified !== undefined) updateData.verified = verified === 'true' || verified === true;
    if (bannerImageUrl !== existingItem.bannerImage) updateData.bannerImage = bannerImageUrl;

    // Update in database
    const updatedEventNews = await updateEventNews(instituteId, eventNewsId, updateData);

    // Emit real-time update to News Admin Panel
    const io = req.app.get('io');
    if (io) {
      io.emit('instituteNewsUpdated', updatedEventNews);
    }

    res.json({
      success: true,
      message: 'Event/News updated successfully',
      data: updatedEventNews
    });

  } catch (error) {
    console.error('Error updating event/news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event/news'
    });
  }
};

/**
 * Delete an event/news item
 */
const deleteEventNewsItem = async (req, res) => {
  try {
    const { eventNewsId } = req.params;
    const instituteId = req.user.userId;

    console.log('Deleting event/news item:', { instituteId, eventNewsId });

    // Get existing item to delete associated files
    const existingItem = await getEventNewsById(instituteId, eventNewsId);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Event/News not found'
      });
    }

    // Delete banner image from S3 if exists
    if (existingItem.bannerImage) {
      await deleteFromS3(existingItem.bannerImage);
    }

    // Delete from database
    await deleteEventNews(instituteId, eventNewsId);

    // Emit real-time update to News Admin Panel
    const io = req.app.get('io');
    if (io) {
      io.emit('instituteNewsDeleted', { eventNewsId });
    }

    res.json({
      success: true,
      message: 'Event/News deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting event/news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event/news'
    });
  }
};

/**
 * Get public events and news for an institute (for institute page)
 */
const getPublicEventNews = async (req, res) => {
  try {
    const { instituteId } = req.params;
    console.log('Getting public events/news for institute:', instituteId);

    const eventNewsItems = await getEventNewsByInstituteId(instituteId);

    // Separate events and news, sort by date (newest first)
    const events = eventNewsItems
      .filter(item => item.type === 'Event')
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const news = eventNewsItems
      .filter(item => item.type === 'News')
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: {
        events,
        news,
        all: eventNewsItems
      }
    });

  } catch (error) {
    console.error('Error getting public events/news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get events/news'
    });
  }
};

/**
 * Get all institute news (for admin panel)
 */
const getAllInstituteNews = async (req, res) => {
  try {
    console.log('Getting all institute news for admin panel');
    
    const { getAllPublic } = require('../models/instituteEventNewsModel');
    const result = await getAllPublic();

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error getting all institute news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get institute news'
    });
  }
};

module.exports = {
  upload,
  addEventNews,
  getEventNews,
  getEventNewsByTypeController,
  getEventNewsItem,
  updateEventNewsItem,
  deleteEventNewsItem,
  getPublicEventNews,
  getAllInstituteNews
};