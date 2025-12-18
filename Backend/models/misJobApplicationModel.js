const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = 'staffinn-mis-job-applications';

const misJobApplicationModel = {
  // Create MIS job application
  create: async (data) => {
    const misApplicationId = `MJA-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const item = {
      misApplicationId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoService.putItem(TABLE_NAME, item);
    return item;
  },

  // Create bulk MIS applications
  createBulk: async (applicationDataArray) => {
    const results = [];
    
    for (const applicationData of applicationDataArray) {
      const misApplicationId = `MJA-${Date.now()}-${uuidv4().substring(0, 8)}`;
      const item = {
        misApplicationId,
        ...applicationData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await dynamoService.putItem(TABLE_NAME, item);
      results.push(item);
    }
    
    return results;
  },

  // Get MIS applications by job
  getByJob: async (jobId) => {
    const params = {
      FilterExpression: 'jobId = :jobId',
      ExpressionAttributeValues: {
        ':jobId': jobId
      }
    };
    return await dynamoService.scanItems(TABLE_NAME, params);
  },

  // Get MIS applications by institute
  getByInstitute: async (instituteId) => {
    const params = {
      FilterExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': instituteId
      }
    };
    return await dynamoService.scanItems(TABLE_NAME, params);
  },

  // Get MIS applications by job and institute
  getByJobAndInstitute: async (jobId, instituteId) => {
    const params = {
      FilterExpression: 'jobId = :jobId AND instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':jobId': jobId,
        ':instituteId': instituteId
      }
    };
    return await dynamoService.scanItems(TABLE_NAME, params);
  },

  // Check if MIS student already applied
  checkExistingApplication: async (jobId, studentId) => {
    const params = {
      FilterExpression: 'jobId = :jobId AND studentId = :studentId',
      ExpressionAttributeValues: {
        ':jobId': jobId,
        ':studentId': studentId
      }
    };
    const applications = await dynamoService.scanItems(TABLE_NAME, params);
    return applications.length > 0 ? applications[0] : null;
  },

  // Update application status
  updateStatus: async (misApplicationId, status) => {
    const updateData = {
      status,
      updatedAt: new Date().toISOString()
    };
    return await dynamoService.simpleUpdate(TABLE_NAME, { misApplicationId }, updateData);
  }
};

module.exports = misJobApplicationModel;