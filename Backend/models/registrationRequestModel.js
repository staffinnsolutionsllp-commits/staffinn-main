/**
 * Registration Request Model
 * Handles registration requests for Institute and Recruiter roles
 */

const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = 'staffinn-registration-requests';

/**
 * Create a new registration request
 */
const createRegistrationRequest = async (requestData) => {
  try {
    const requestId = uuidv4();
    
    const registrationRequest = {
      requestId,
      type: requestData.type, // 'institute' or 'recruiter'
      name: requestData.name,
      email: requestData.email,
      phoneNumber: requestData.phoneNumber,
      status: 'pending', // pending, approved, rejected
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoService.putItem(TABLE_NAME, registrationRequest);
    return registrationRequest;
  } catch (error) {
    console.error('Error creating registration request:', error);
    throw new Error('Failed to create registration request');
  }
};

/**
 * Get all registration requests
 */
const getAllRegistrationRequests = async () => {
  try {
    const result = await dynamoService.scanItems(TABLE_NAME);
    return result || [];
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    return [];
  }
};

/**
 * Get registration requests by type
 */
const getRegistrationRequestsByType = async (type) => {
  try {
    const params = {
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: {
        ':type': type
      }
    };
    
    const result = await dynamoService.scanItems(TABLE_NAME, params);
    return result || [];
  } catch (error) {
    console.error('Error fetching registration requests by type:', error);
    return [];
  }
};

/**
 * Update registration request status
 */
const updateRegistrationRequestStatus = async (requestId, status, adminNotes = '') => {
  try {
    const key = { requestId };
    const updateParams = {
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt, adminNotes = :adminNotes',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString(),
        ':adminNotes': adminNotes
      }
    };

    await dynamoService.updateItem(TABLE_NAME, key, updateParams);
    return { success: true };
  } catch (error) {
    console.error('Error updating registration request status:', error);
    throw new Error('Failed to update registration request status');
  }
};

/**
 * Get registration request by ID
 */
const getRequestById = async (requestId) => {
  try {
    const result = await dynamoService.getItem(TABLE_NAME, { requestId });
    return result;
  } catch (error) {
    console.error('Error fetching registration request by ID:', error);
    return null;
  }
};

/**
 * Delete registration request
 */
const deleteRegistrationRequest = async (requestId) => {
  try {
    await dynamoService.deleteItem(TABLE_NAME, { requestId });
    return { success: true };
  } catch (error) {
    console.error('Error deleting registration request:', error);
    throw new Error('Failed to delete registration request');
  }
};

module.exports = {
  createRegistrationRequest,
  getAllRegistrationRequests,
  getRegistrationRequestsByType,
  updateRegistrationRequestStatus,
  deleteRegistrationRequest,
  getRequestById
};