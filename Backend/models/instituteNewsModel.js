/**
 * Institute News & Events Model
 * Handles news and events for institutes
 */
const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

const INSTITUTE_NEWS_TABLE = 'staffinn-institute-news';

/**
 * Create news/event
 */
const createNews = async (instituteId, newsData) => {
  try {
    const newsItem = {
      newsId: uuidv4(),
      instituteId,
      title: newsData.title,
      description: newsData.description,
      type: newsData.type || 'news', // 'news', 'event', 'job_fair'
      photos: newsData.photos || [],
      videos: newsData.videos || [],
      eventDate: newsData.eventDate || null,
      location: newsData.location || null,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoService.putItem(INSTITUTE_NEWS_TABLE, newsItem);
    return newsItem;
  } catch (error) {
    console.error('Create news error:', error);
    throw new Error('Failed to create news/event');
  }
};

/**
 * Get all news for an institute
 */
const getNewsByInstitute = async (instituteId) => {
  try {
    const params = {
      FilterExpression: 'instituteId = :instituteId AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':instituteId': instituteId,
        ':status': 'active'
      }
    };

    const news = await dynamoService.scanItems(INSTITUTE_NEWS_TABLE, params);
    
    // Sort by creation date (newest first)
    return news.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Get news by institute error:', error);
    return [];
  }
};

/**
 * Get news by ID
 */
const getNewsById = async (newsId) => {
  try {
    return await dynamoService.getItem(INSTITUTE_NEWS_TABLE, { newsId });
  } catch (error) {
    console.error('Get news by ID error:', error);
    return null;
  }
};

/**
 * Update news/event
 */
const updateNews = async (newsId, updateData) => {
  try {
    const key = { newsId };
    const updateParams = {
      UpdateExpression: 'SET',
      ExpressionAttributeValues: {},
      ExpressionAttributeNames: {}
    };

    const updateExpressions = [];
    Object.keys(updateData).forEach((field, index) => {
      if (field !== 'newsId' && field !== 'instituteId') {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        updateParams.ExpressionAttributeNames[attrName] = field;
        updateParams.ExpressionAttributeValues[attrValue] = updateData[field];
      }
    });

    updateParams.UpdateExpression += ` ${updateExpressions.join(', ')}, updatedAt = :updatedAt`;
    updateParams.ExpressionAttributeValues[':updatedAt'] = new Date().toISOString();

    await dynamoService.updateItem(INSTITUTE_NEWS_TABLE, key, updateParams);
    return true;
  } catch (error) {
    console.error('Update news error:', error);
    return false;
  }
};

/**
 * Delete news/event (soft delete)
 */
const deleteNews = async (newsId) => {
  try {
    const key = { newsId };
    const updateParams = {
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'deleted',
        ':updatedAt': new Date().toISOString()
      }
    };

    await dynamoService.updateItem(INSTITUTE_NEWS_TABLE, key, updateParams);
    return true;
  } catch (error) {
    console.error('Delete news error:', error);
    return false;
  }
};

/**
 * Get public news for an institute (for public page)
 */
const getPublicNews = async (instituteId) => {
  try {
    const params = {
      FilterExpression: 'instituteId = :instituteId AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':instituteId': instituteId,
        ':status': 'active'
      }
    };

    const news = await dynamoService.scanItems(INSTITUTE_NEWS_TABLE, params);
    
    // Sort by creation date (newest first)
    return news.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Get public news error:', error);
    return [];
  }
};

module.exports = {
  createNews,
  getNewsByInstitute,
  getNewsById,
  updateNews,
  deleteNews,
  getPublicNews
};
