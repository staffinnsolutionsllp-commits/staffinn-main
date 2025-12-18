const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'Batches';

const batchModel = {
  create: async (data) => {
    const batchId = `BATCH-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const item = {
      batchId,
      instituteId: data.instituteId,
      trainingCentreId: data.trainingCentreId,
      trainingCentreName: data.trainingCentreName,
      courseId: data.courseId,
      courseName: data.courseName,
      trainerId: data.trainerId,
      trainerName: data.trainerName,
      trainerCode: data.trainerCode || '',
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      selectedStudents: data.selectedStudents || [],
      status: 'Applied',
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
    console.log('Scanning Batches table for instituteId:', instituteId);
    const params = {
      TableName: TABLE_NAME
    };
    
    if (instituteId) {
      params.FilterExpression = 'instituteId = :instituteId';
      params.ExpressionAttributeValues = { ':instituteId': instituteId };
    }

    const result = await dynamoDB.scan(params).promise();
    console.log('Batches scan result:', result.Items?.length || 0, 'items');
    if (result.Items && result.Items.length > 0) {
      console.log('Sample batch:', result.Items[0]);
    }
    return result.Items || [];
  },

  getById: async (batchId) => {
    const result = await dynamoDB.get({
      TableName: TABLE_NAME,
      Key: { batchId }
    }).promise();
    return result.Item;
  },

  update: async (batchId, data) => {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updateData).forEach((key, index) => {
      if (updateData[key] !== undefined) {
        const placeholder = `#attr${index}`;
        const valuePlaceholder = `:val${index}`;
        updateExpression.push(`${placeholder} = ${valuePlaceholder}`);
        expressionAttributeNames[placeholder] = key;
        expressionAttributeValues[valuePlaceholder] = updateData[key];
      }
    });

    const params = {
      TableName: TABLE_NAME,
      Key: { batchId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoDB.update(params).promise();
    return result.Attributes;
  },

  updateStatus: async (batchId, status) => {
    const params = {
      TableName: TABLE_NAME,
      Key: { batchId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { 
        ':status': status,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };
    const result = await dynamoDB.update(params).promise();
    return result.Attributes;
  },

  delete: async (batchId) => {
    await dynamoDB.delete({
      TableName: TABLE_NAME,
      Key: { batchId }
    }).promise();
    return { batchId };
  }
};

module.exports = batchModel;
