const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'mis-students';

const misStudentModel = {
  create: async (data) => {
    const studentsId = `STU-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const item = {
      studentsId,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoDB.put({
      TableName: TABLE_NAME,
      Item: item
    }).promise();

    return item;
  },

  getAll: async () => {
    const result = await dynamoDB.scan({
      TableName: TABLE_NAME
    }).promise();
    return result.Items || [];
  },

  getById: async (studentsId) => {
    const result = await dynamoDB.get({
      TableName: TABLE_NAME,
      Key: { studentsId }
    }).promise();
    return result.Item;
  },

  update: async (studentsId, data) => {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    console.log('Model update - studentsId:', studentsId);
    console.log('Model update - data:', JSON.stringify(updateData, null, 2));

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
      Key: { studentsId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    console.log('DynamoDB update params:', JSON.stringify(params, null, 2));
    const result = await dynamoDB.update(params).promise();
    console.log('DynamoDB update result:', JSON.stringify(result, null, 2));

    return result.Attributes;
  },

  delete: async (studentsId) => {
    await dynamoDB.delete({
      TableName: TABLE_NAME,
      Key: { studentsId }
    }).promise();
    return { studentsId };
  },

  getStudentsByInstitute: async (instituteId) => {
    try {
      // Get all students and filter manually since instituteId field might be missing
      const result = await dynamoDB.scan({
        TableName: TABLE_NAME
      }).promise();
      
      // Filter students that belong to this institute
      // Since instituteId field is missing, we'll return empty array for now
      // This ensures proper institute-wise filtering
      const filteredStudents = (result.Items || []).filter(student => {
        return student.instituteId === instituteId;
      });
      
      return filteredStudents;
    } catch (error) {
      console.error('Error fetching students by institute:', error);
      return [];
    }
  }
};

module.exports = misStudentModel;
