const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'mis-report';

const reportModel = {
  create: async (data) => {
    const reportId = `REPORT-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const item = {
      reportId,
      instituteId: data.instituteId,
      centerId: data.centerId,
      courseId: data.courseId,
      batchId: data.batchId,
      students: data.students,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoDB.put({
      TableName: TABLE_NAME,
      Item: item
    }).promise();

    return item;
  },

  getAll: async (instituteId) => {
    const params = {
      TableName: TABLE_NAME
    };
    
    if (instituteId) {
      params.FilterExpression = 'instituteId = :instituteId';
      params.ExpressionAttributeValues = { ':instituteId': instituteId };
    }

    const result = await dynamoDB.scan(params).promise();
    return result.Items || [];
  },

  getById: async (reportId) => {
    const result = await dynamoDB.get({
      TableName: TABLE_NAME,
      Key: { reportId }
    }).promise();
    return result.Item;
  }
};

module.exports = reportModel;