/**
 * Hiring Model
 * Handles all hiring-related database operations
 */
const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const HIRING_TABLE = process.env.HIRING_TABLE || 'staffinn-hiring-records';

// Helper function to get the correct primary key
const getHiringTableKey = (id) => {
  // Use hiringRecordID as the primary key for new records
  return { hiringRecordID: id };
};

/**
 * Create a new hiring record
 * @param {object} hiringData - Hiring record data
 * @returns {Promise<object>} - Created hiring record
 */
const createHiringRecord = async (hiringData) => {
  try {
    const hiringRecordID = uuidv4();
    const timestamp = new Date().toISOString();
    
    const hiringRecord = {
      hiringRecordID,
      applicantType: hiringData.applicantType, // 'staff' or 'institute'
      studentID: hiringData.studentID || hiringData.staffId, // For backward compatibility
      instituteID: hiringData.instituteID,
      recruiterID: hiringData.recruiterID || hiringData.seekerId, // For backward compatibility
      recruiterName: hiringData.recruiterName || hiringData.seekerName,
      recruiterCompany: hiringData.recruiterCompany,
      jobID: hiringData.jobID,
      jobTitle: hiringData.jobTitle,
      status: hiringData.status, // 'Hired' or 'Rejected'
      timestamp: timestamp,
      studentSnapshot: hiringData.studentSnapshot || null,
      
      // Legacy fields for backward compatibility
      hiringId: hiringRecordID,
      seekerId: hiringData.seekerId,
      staffId: hiringData.staffId,
      staffName: hiringData.staffName,
      staffEmail: hiringData.staffEmail,
      staffPhone: hiringData.staffPhone,
      seekerName: hiringData.seekerName,
      seekerEmail: hiringData.seekerEmail,
      contactMethod: hiringData.contactMethod,
      rating: hiringData.rating || null,
      feedback: hiringData.feedback || '',
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await dynamoService.putItem(HIRING_TABLE, hiringRecord);
    return hiringRecord;
  } catch (error) {
    console.error('Create hiring record error:', error);
    throw new Error('Failed to create hiring record');
  }
};

/**
 * Get hiring records for a recruiter
 * @param {string} recruiterId - Recruiter user ID
 * @returns {Promise<Array>} - Array of hiring records
 */
const getRecruiterHiringHistory = async (recruiterId) => {
  try {
    const scanParams = {
      FilterExpression: 'recruiterID = :recruiterId OR seekerId = :recruiterId',
      ExpressionAttributeValues: {
        ':recruiterId': recruiterId
      }
    };
    
    const records = await dynamoService.scanItems(HIRING_TABLE, scanParams);
    
    // Sort by timestamp (most recent first)
    return records.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
  } catch (error) {
    console.error('Get recruiter hiring history error:', error);
    throw new Error('Failed to get recruiter hiring history');
  }
};

/**
 * Get hiring records for a seeker (backward compatibility)
 * @param {string} seekerId - Seeker user ID
 * @returns {Promise<Array>} - Array of hiring records
 */
const getSeekerHiringHistory = async (seekerId) => {
  return getRecruiterHiringHistory(seekerId);
};

/**
 * Get hiring records for a staff member
 * @param {string} staffId - Staff user ID
 * @returns {Promise<Array>} - Array of hiring records
 */
const getStaffHiringHistory = async (staffId) => {
  try {
    const scanParams = {
      FilterExpression: 'staffId = :staffId',
      ExpressionAttributeValues: {
        ':staffId': staffId
      }
    };
    
    const records = await dynamoService.scanItems(HIRING_TABLE, scanParams);
    
    // Sort by created date (most recent first)
    return records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Get staff hiring history error:', error);
    throw new Error('Failed to get staff hiring history');
  }
};

/**
 * Update hiring record with rating and feedback
 * @param {string} hiringId - Hiring record ID
 * @param {object} updateData - Data to update
 * @returns {Promise<object>} - Updated hiring record
 */
const updateHiringRecord = async (hiringId, updateData) => {
  try {
    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    Object.keys(updateData).forEach((key, index) => {
      const attributeName = `#attr${index}`;
      const attributeValue = `:val${index}`;
      
      updateExpressions.push(`${attributeName} = ${attributeValue}`);
      expressionAttributeNames[attributeName] = key;
      expressionAttributeValues[attributeValue] = updateData[key];
    });
    
    // Add updatedAt timestamp
    const timestampIndex = Object.keys(updateData).length;
    updateExpressions.push(`#attr${timestampIndex} = :val${timestampIndex}`);
    expressionAttributeNames[`#attr${timestampIndex}`] = 'updatedAt';
    expressionAttributeValues[`:val${timestampIndex}`] = new Date().toISOString();
    
    const updateParams = {
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    };
    
    const updatedRecord = await dynamoService.updateItem(
      HIRING_TABLE,
      getHiringTableKey(hiringId),
      updateParams
    );
    
    return updatedRecord;
  } catch (error) {
    console.error('Update hiring record error:', error);
    throw new Error('Failed to update hiring record');
  }
};

/**
 * Get hiring record by ID
 * @param {string} hiringId - Hiring record ID
 * @returns {Promise<object|null>} - Hiring record or null
 */
const getHiringRecordById = async (hiringId) => {
  try {
    const record = await dynamoService.getItem(HIRING_TABLE, getHiringTableKey(hiringId));
    return record;
  } catch (error) {
    console.error('Get hiring record by ID error:', error);
    throw new Error('Failed to get hiring record');
  }
};

/**
 * Get hiring records for institute students by recruiter and institute
 * @param {string} recruiterId - Recruiter ID
 * @param {string} instituteId - Institute ID
 * @returns {Promise<Array>} - Array of hiring records
 */
const getInstituteHiringRecords = async (recruiterId, instituteId) => {
  try {
    const scanParams = {
      FilterExpression: 'recruiterID = :recruiterId AND instituteID = :instituteId AND applicantType = :applicantType',
      ExpressionAttributeValues: {
        ':recruiterId': recruiterId,
        ':instituteId': instituteId,
        ':applicantType': 'institute'
      }
    };
    
    const records = await dynamoService.scanItems(HIRING_TABLE, scanParams);
    return records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error('Get institute hiring records error:', error);
    throw new Error('Failed to get institute hiring records');
  }
};

/**
 * Delete hiring record
 * @param {string} hiringId - Hiring record ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteHiringRecord = async (hiringId) => {
  try {
    await dynamoService.deleteItem(HIRING_TABLE, getHiringTableKey(hiringId));
    return true;
  } catch (error) {
    console.error('Delete hiring record error:', error);
    throw new Error('Failed to delete hiring record');
  }
};

/**
 * Get hiring statistics for a user
 * @param {string} userId - User ID
 * @param {string} userType - 'seeker' or 'staff'
 * @returns {Promise<object>} - Hiring statistics
 */
const getHiringStats = async (userId, userType) => {
  try {
    const filterKey = userType === 'seeker' ? 'seekerId' : 'staffId';
    const scanParams = {
      FilterExpression: `${filterKey} = :userId`,
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };
    
    const records = await dynamoService.scanItems(HIRING_TABLE, scanParams);
    
    const stats = {
      total: records.length,
      completed: records.filter(r => r.status === 'completed').length,
      active: records.filter(r => r.status === 'hired').length,
      cancelled: records.filter(r => r.status === 'cancelled').length,
      averageRating: 0
    };
    
    // Calculate average rating
    const ratedRecords = records.filter(r => r.rating && r.rating > 0);
    if (ratedRecords.length > 0) {
      const totalRating = ratedRecords.reduce((sum, r) => sum + r.rating, 0);
      stats.averageRating = (totalRating / ratedRecords.length).toFixed(1);
    }
    
    return stats;
  } catch (error) {
    console.error('Get hiring stats error:', error);
    throw new Error('Failed to get hiring statistics');
  }
};

module.exports = {
  createHiringRecord,
  getSeekerHiringHistory,
  getRecruiterHiringHistory,
  getStaffHiringHistory,
  updateHiringRecord,
  getHiringRecordById,
  deleteHiringRecord,
  getHiringStats,
  getInstituteHiringRecords
};