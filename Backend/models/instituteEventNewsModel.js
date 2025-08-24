/**
 * Institute Event News Model
 * Handles database operations for institute events and news
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const awsConfig = require('../config/aws');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Table name
const EVENT_NEWS_TABLE = 'inst-event-news';

/**
 * Create a new event or news item
 * @param {string} instituteId - Institute ID
 * @param {Object} eventNewsData - Event/News data
 * @returns {Promise<Object>} - Created event/news data
 */
const createEventNews = async (instituteId, eventNewsData) => {
  try {
    console.log('Creating event/news for institute:', instituteId);
    console.log('Event/News data:', eventNewsData);

    const timestamp = new Date().toISOString();
    const eventNewsId = uuidv4();
    
    const eventNewsItem = {
      insteventnews: `${instituteId}#${eventNewsId}`, // Partition key
      instituteId: instituteId,
      eventNewsId: eventNewsId,
      title: eventNewsData.title,
      date: eventNewsData.date,
      company: eventNewsData.company,
      venue: eventNewsData.venue || null,
      expectedParticipants: eventNewsData.expectedParticipants || null,
      details: eventNewsData.details,
      type: eventNewsData.type, // 'Event' or 'News'
      verified: eventNewsData.verified || false,
      bannerImage: eventNewsData.bannerImage || null,
      createdAt: timestamp,
      lastUpdated: timestamp
    };
    
    console.log('Saving to DynamoDB:', eventNewsItem);

    const command = new PutCommand({
      TableName: EVENT_NEWS_TABLE,
      Item: eventNewsItem
    });
    
    await docClient.send(command);
    console.log('Event/News created successfully in DynamoDB');
    
    return eventNewsItem;
  } catch (error) {
    console.error('Error creating event/news:', error);
    throw error;
  }
};

/**
 * Get all events and news for an institute
 * @param {string} instituteId - Institute ID
 * @returns {Promise<Array>} - Array of events and news
 */
const getEventNewsByInstituteId = async (instituteId) => {
  try {
    console.log('Getting events/news for institute:', instituteId);

    if (!instituteId) {
      console.log('No instituteId provided, returning empty array');
      return [];
    }

    const command = new ScanCommand({
      TableName: EVENT_NEWS_TABLE,
      FilterExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': instituteId
      }
    });

    const response = await docClient.send(command);
    console.log('Retrieved events/news:', response.Items?.length || 0);

    return response.Items || [];
  } catch (error) {
    console.error('Error getting events/news:', error);
    return [];
  }
};

/**
 * Get a specific event/news item
 * @param {string} instituteId - Institute ID
 * @param {string} eventNewsId - Event/News ID
 * @returns {Promise<Object|null>} - Event/News item or null
 */
const getEventNewsById = async (instituteId, eventNewsId) => {
  try {
    console.log('Getting event/news by ID:', { instituteId, eventNewsId });

    const command = new GetCommand({
      TableName: EVENT_NEWS_TABLE,
      Key: {
        insteventnews: `${instituteId}#${eventNewsId}`
      }
    });

    const response = await docClient.send(command);
    console.log('Retrieved event/news:', !!response.Item);

    return response.Item || null;
  } catch (error) {
    console.error('Error getting event/news by ID:', error);
    throw error;
  }
};

/**
 * Update an event/news item
 * @param {string} instituteId - Institute ID
 * @param {string} eventNewsId - Event/News ID
 * @param {Object} updateData - Updated data
 * @returns {Promise<Object>} - Updated event/news data
 */
const updateEventNews = async (instituteId, eventNewsId, updateData) => {
  try {
    console.log('Updating event/news:', { instituteId, eventNewsId });
    console.log('Update data:', updateData);

    const timestamp = new Date().toISOString();
    
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    // Build dynamic update expression
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = updateData[key];
      }
    });
    
    // Always update lastUpdated
    updateExpression.push('#lastUpdated = :lastUpdated');
    expressionAttributeNames['#lastUpdated'] = 'lastUpdated';
    expressionAttributeValues[':lastUpdated'] = timestamp;

    const command = new UpdateCommand({
      TableName: EVENT_NEWS_TABLE,
      Key: {
        insteventnews: `${instituteId}#${eventNewsId}`
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const response = await docClient.send(command);
    console.log('Event/News updated successfully');

    return response.Attributes;
  } catch (error) {
    console.error('Error updating event/news:', error);
    throw error;
  }
};

/**
 * Delete an event/news item
 * @param {string} instituteId - Institute ID
 * @param {string} eventNewsId - Event/News ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteEventNews = async (instituteId, eventNewsId) => {
  try {
    console.log('Deleting event/news:', { instituteId, eventNewsId });

    const command = new DeleteCommand({
      TableName: EVENT_NEWS_TABLE,
      Key: {
        insteventnews: `${instituteId}#${eventNewsId}`
      }
    });

    await docClient.send(command);
    console.log('Event/News deleted successfully');

    return true;
  } catch (error) {
    console.error('Error deleting event/news:', error);
    throw error;
  }
};

/**
 * Get events and news by type
 * @param {string} instituteId - Institute ID
 * @param {string} type - 'Event' or 'News'
 * @returns {Promise<Array>} - Array of events or news
 */
const getEventNewsByType = async (instituteId, type) => {
  try {
    console.log('Getting events/news by type:', { instituteId, type });

    if (!instituteId || !type) {
      console.log('Missing instituteId or type, returning empty array');
      return [];
    }

    const command = new ScanCommand({
      TableName: EVENT_NEWS_TABLE,
      FilterExpression: 'instituteId = :instituteId AND #type = :type',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':instituteId': instituteId,
        ':type': type
      }
    });

    const response = await docClient.send(command);
    console.log(`Retrieved ${type.toLowerCase()}s:`, response.Items?.length || 0);

    return response.Items || [];
  } catch (error) {
    console.error(`Error getting ${type.toLowerCase()}s:`, error);
    return [];
  }
};

/**
 * Get all events and news (for admin purposes)
 * @returns {Promise<Array>} - Array of all events and news
 */
const getAllEventNews = async () => {
  try {
    console.log('Getting all events/news');

    const command = new ScanCommand({
      TableName: EVENT_NEWS_TABLE
    });

    const response = await docClient.send(command);
    console.log('Retrieved all events/news:', response.Items?.length || 0);

    return response.Items || [];
  } catch (error) {
    console.error('Error getting all events/news:', error);
    throw error;
  }
};

/**
 * Get all public events and news (for news page)
 * @returns {Promise<Object>} - Success status and data
 */
const getAllPublic = async () => {
  try {
    console.log('Getting all public events/news');

    const command = new ScanCommand({
      TableName: EVENT_NEWS_TABLE
    });

    const response = await docClient.send(command);
    const items = response.Items || [];
    
    // Sort by date (newest first)
    const sortedItems = items.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
    
    console.log('Retrieved all public events/news:', sortedItems.length);

    return { success: true, data: sortedItems };
  } catch (error) {
    console.error('Error getting all public events/news:', error);
    return { success: false, message: 'Failed to get events/news' };
  }
};

module.exports = {
  createEventNews,
  getEventNewsByInstituteId,
  getEventNewsById,
  updateEventNews,
  deleteEventNews,
  getEventNewsByType,
  getAllEventNews,
  getAllPublic,
  EVENT_NEWS_TABLE
};