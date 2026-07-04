const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const TABLE_NAME = 'staffinn-student-placement-status';

const studentPlacementStatusModel = {
  // Create placement status record
  create: async (data) => {
    const statusId = `SPS-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const item = {
      statusId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoService.putItem(TABLE_NAME, item);
    return item;
  },

  // Get student placement status
  getByStudent: async (studentId) => {
    const params = {
      FilterExpression: 'studentId = :studentId',
      ExpressionAttributeValues: {
        ':studentId': studentId
      }
    };
    return await dynamoService.scanItems(TABLE_NAME, params);
  },

  // Get placement status by job
  getByJob: async (jobId) => {
    const params = {
      FilterExpression: 'jobId = :jobId',
      ExpressionAttributeValues: {
        ':jobId': jobId
      }
    };
    return await dynamoService.scanItems(TABLE_NAME, params);
  },

  // Get placement status by company
  getByCompany: async (companyName) => {
    const params = {
      FilterExpression: 'companyName = :companyName',
      ExpressionAttributeValues: {
        ':companyName': companyName
      }
    };
    return await dynamoService.scanItems(TABLE_NAME, params);
  },

  // Update placement status
  update: async (statusId, data) => {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    return await dynamoService.simpleUpdate(TABLE_NAME, { statusId }, updateData);
  },

  // Get student detailed status for view status panel
  getStudentDetailedStatus: async (studentId) => {
    const params = {
      FilterExpression: 'studentId = :studentId',
      ExpressionAttributeValues: {
        ':studentId': studentId
      }
    };
    const statuses = await dynamoService.scanItems(TABLE_NAME, params);
    
    // Group by status type
    const result = {
      hired: [],
      rejected: [],
      pending: []
    };

    statuses.forEach(status => {
      if (status.status === 'hired') {
        result.hired.push(status);
      } else if (status.status === 'rejected') {
        result.rejected.push(status);
      } else {
        result.pending.push(status);
      }
    });

    return result;
  }
};

module.exports = studentPlacementStatusModel;