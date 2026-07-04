/**
 * MIS Request Model
 * Handles MIS requests for Staffinn Partner institutes
 */

const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = 'staffinn-mis-requests';

/**
 * Create a new MIS request
 */
const createMisRequest = async (requestData) => {
  try {
    const requestId = uuidv4();
    
    const misRequest = {
      requestId,
      instituteId: requestData.instituteId,
      instituteName: requestData.instituteName,
      email: requestData.email,
      instituteNumber: requestData.instituteNumber,
      pdfUrl: requestData.pdfUrl,
      status: 'pending', // pending, approved, rejected
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoService.putItem(TABLE_NAME, misRequest);
    return misRequest;
  } catch (error) {
    console.error('Error creating MIS request:', error);
    throw new Error('Failed to create MIS request');
  }
};

/**
 * Get all MIS requests
 */
const getAllMisRequests = async () => {
  try {
    const result = await dynamoService.scanItems(TABLE_NAME);
    return result || [];
  } catch (error) {
    console.error('Error fetching MIS requests:', error);
    return [];
  }
};

/**
 * Get MIS request by ID
 */
const getMisRequestById = async (requestId) => {
  try {
    const result = await dynamoService.getItem(TABLE_NAME, { requestId });
    return result;
  } catch (error) {
    console.error('Error fetching MIS request by ID:', error);
    return null;
  }
};

/**
 * Update MIS request status
 */
const updateMisRequestStatus = async (requestId, status, adminNotes = '') => {
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
    console.error('Error updating MIS request status:', error);
    throw new Error('Failed to update MIS request status');
  }
};

/**
 * Delete MIS request
 */
const deleteMisRequest = async (requestId) => {
  try {
    await dynamoService.deleteItem(TABLE_NAME, { requestId });
    return { success: true };
  } catch (error) {
    console.error('Error deleting MIS request:', error);
    throw new Error('Failed to delete MIS request');
  }
};

module.exports = {
  createMisRequest,
  getAllMisRequests,
  getMisRequestById,
  updateMisRequestStatus,
  deleteMisRequest
};