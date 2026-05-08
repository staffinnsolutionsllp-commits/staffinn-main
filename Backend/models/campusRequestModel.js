/**
 * Campus Request Model
 * Handles campus invite requests between institutes and recruiters
 */

const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const CAMPUS_REQUESTS_TABLE = process.env.CAMPUS_REQUESTS_TABLE || 'campus-requests';

/**
 * Create a new campus request
 */
const createCampusRequest = async (instituteId, recruiterId, instituteData, recruiterData) => {
  try {
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const requestData = {
      campusreq: requestId,
      instituteId,
      recruiterId,
      instituteName: instituteData.instituteName || instituteData.name || 'Institute',
      instituteEmail: instituteData.email,
      recruiterName: recruiterData.companyName || 'Company',
      recruiterEmail: recruiterData.email,
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await dynamoService.putItem(CAMPUS_REQUESTS_TABLE, requestData);
    
    return {
      success: true,
      data: requestData
    };
  } catch (error) {
    console.error('Create campus request error:', error);
    throw error;
  }
};

/**
 * Check if request already exists
 */
const checkExistingRequest = async (instituteId, recruiterId) => {
  try {
    const allRequests = await dynamoService.scanItems(CAMPUS_REQUESTS_TABLE);
    
    const existingRequest = allRequests.find(
      req => req.instituteId === instituteId && req.recruiterId === recruiterId
    );
    
    return existingRequest || null;
  } catch (error) {
    console.error('Check existing request error:', error);
    throw error;
  }
};

/**
 * Get all requests sent by an institute
 */
const getRequestsByInstitute = async (instituteId) => {
  try {
    const allRequests = await dynamoService.scanItems(CAMPUS_REQUESTS_TABLE);
    
    const instituteRequests = allRequests.filter(
      req => req.instituteId === instituteId
    );
    
    return instituteRequests;
  } catch (error) {
    console.error('Get requests by institute error:', error);
    throw error;
  }
};

/**
 * Get all requests received by a recruiter
 */
const getRequestsByRecruiter = async (recruiterId) => {
  try {
    const allRequests = await dynamoService.scanItems(CAMPUS_REQUESTS_TABLE);
    
    const recruiterRequests = allRequests.filter(
      req => req.recruiterId === recruiterId
    );
    
    return recruiterRequests;
  } catch (error) {
    console.error('Get requests by recruiter error:', error);
    throw error;
  }
};

/**
 * Update request status
 */
const updateRequestStatus = async (requestId, status) => {
  try {
    const existingRequest = await dynamoService.getItem(CAMPUS_REQUESTS_TABLE, { campusreq: requestId });
    
    if (!existingRequest) {
      throw new Error('Request not found');
    }
    
    const updatedRequest = {
      ...existingRequest,
      status,
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.putItem(CAMPUS_REQUESTS_TABLE, updatedRequest);
    
    return {
      success: true,
      data: updatedRequest
    };
  } catch (error) {
    console.error('Update request status error:', error);
    throw error;
  }
};

/**
 * Delete a campus request
 */
const deleteCampusRequest = async (requestId) => {
  try {
    await dynamoService.deleteItem(CAMPUS_REQUESTS_TABLE, { campusreq: requestId });
    
    return {
      success: true,
      message: 'Request deleted successfully'
    };
  } catch (error) {
    console.error('Delete campus request error:', error);
    throw error;
  }
};

module.exports = {
  createCampusRequest,
  checkExistingRequest,
  getRequestsByInstitute,
  getRequestsByRecruiter,
  updateRequestStatus,
  deleteCampusRequest
};
