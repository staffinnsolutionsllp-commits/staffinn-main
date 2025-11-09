/**
 * Contact Model
 * Handles contact history database operations
 */
const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const CONTACT_TABLE = process.env.CONTACT_HISTORY_TABLE || 'staffinn-contact-history';

/**
 * Create a new contact record
 * @param {object} contactData - Contact record data
 * @returns {Promise<object>} - Created contact record
 */
const createContactRecord = async (contactData) => {
  try {
    const contactId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const contactRecord = {
      contactId,
      userId: contactData.userId,
      staffId: contactData.staffId,
      staffName: contactData.staffName,
      staffEmail: contactData.staffEmail,
      staffPhone: contactData.staffPhone,
      contactMethod: contactData.contactMethod, // 'call', 'whatsapp', 'email'
      createdAt: timestamp
    };
    
    await dynamoService.putItem(CONTACT_TABLE, contactRecord);
    return contactRecord;
  } catch (error) {
    console.error('Create contact record error:', error);
    throw new Error('Failed to create contact record');
  }
};

/**
 * Get contact history for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of contact records
 */
const getContactHistory = async (userId) => {
  try {
    const scanParams = {
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };
    
    const records = await dynamoService.scanItems(CONTACT_TABLE, scanParams);
    
    // Sort by created date (most recent first)
    return records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Get contact history error:', error);
    throw new Error('Failed to get contact history');
  }
};

module.exports = {
  createContactRecord,
  getContactHistory
};