const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'mis-attendence';

const attendanceModel = {
  create: async (data) => {
    const attendanceId = `ATT-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const item = {
      misattendence: attendanceId,
      batchId: data.batchId,
      trainingCentreId: data.trainingCentreId,
      courseId: data.courseId,
      facultyId: data.facultyId,
      attendanceDate: data.attendanceDate,
      studentAttendance: data.studentAttendance || [],
      totalStudents: data.totalStudents || 0,
      presentCount: data.presentCount || 0,
      absentCount: data.absentCount || 0,
      markedBy: data.markedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoDB.put({
      TableName: TABLE_NAME,
      Item: item
    }).promise();

    return item;
  },

  getByBatchAndDate: async (batchId, attendanceDate) => {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'batchId = :batchId AND attendanceDate = :date',
      ExpressionAttributeValues: {
        ':batchId': batchId,
        ':date': attendanceDate
      }
    };

    const result = await dynamoDB.scan(params).promise();
    return result.Items?.[0] || null;
  },

  update: async (attendanceId, data) => {
    const updateData = {
      studentAttendance: data.studentAttendance,
      totalStudents: data.totalStudents,
      presentCount: data.presentCount,
      absentCount: data.absentCount,
      updatedAt: new Date().toISOString()
    };

    const updateExpression = [];
    const expressionAttributeValues = {};

    Object.keys(updateData).forEach((key) => {
      updateExpression.push(`${key} = :${key}`);
      expressionAttributeValues[`:${key}`] = updateData[key];
    });

    const params = {
      TableName: TABLE_NAME,
      Key: { misattendence: attendanceId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoDB.update(params).promise();
    return result.Attributes;
  },

  getAll: async () => {
    const result = await dynamoDB.scan({
      TableName: TABLE_NAME
    }).promise();
    return result.Items || [];
  },

  getByInstitute: async (instituteId) => {
    // Since attendance doesn't directly have instituteId, we need to filter by batches
    // For now, return all attendance records - this would need batch lookup for proper filtering
    const result = await dynamoDB.scan({
      TableName: TABLE_NAME
    }).promise();
    return result.Items || [];
  }
};

module.exports = attendanceModel;