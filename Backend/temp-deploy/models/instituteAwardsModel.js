const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const awsConfig = require('../config/aws');

const dynamoClient = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const AWARDS_TABLE = 'institute-awards-recognition';

const createAward = async (instituteId, awardData) => {
  try {
    const timestamp = new Date().toISOString();
    const awardId = uuidv4();
    
    const awardItem = {
      instituteaward: `${instituteId}#${awardId}`,
      instituteId,
      awardId,
      title: awardData.title,
      description: awardData.description,
      photos: awardData.photos || [],
      createdAt: timestamp,
      lastUpdated: timestamp
    };

    await docClient.send(new PutCommand({
      TableName: AWARDS_TABLE,
      Item: awardItem
    }));
    
    return awardItem;
  } catch (error) {
    console.error('Error creating award:', error);
    throw error;
  }
};

const getAwardsByInstituteId = async (instituteId) => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: AWARDS_TABLE,
      FilterExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': instituteId
      }
    }));

    return response.Items || [];
  } catch (error) {
    console.error('Error getting awards:', error);
    return [];
  }
};

const updateAward = async (instituteId, awardId, updateData) => {
  try {
    const timestamp = new Date().toISOString();
    
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updateExpression.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = updateData[key];
      }
    });
    
    updateExpression.push('#lastUpdated = :lastUpdated');
    expressionAttributeNames['#lastUpdated'] = 'lastUpdated';
    expressionAttributeValues[':lastUpdated'] = timestamp;

    const response = await docClient.send(new UpdateCommand({
      TableName: AWARDS_TABLE,
      Key: {
        instituteaward: `${instituteId}#${awardId}`
      },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return response.Attributes;
  } catch (error) {
    console.error('Error updating award:', error);
    throw error;
  }
};

const deleteAward = async (instituteId, awardId) => {
  try {
    await docClient.send(new DeleteCommand({
      TableName: AWARDS_TABLE,
      Key: {
        instituteaward: `${instituteId}#${awardId}`
      }
    }));
    
    return true;
  } catch (error) {
    console.error('Error deleting award:', error);
    throw error;
  }
};

module.exports = {
  createAward,
  getAwardsByInstituteId,
  updateAward,
  deleteAward
};
