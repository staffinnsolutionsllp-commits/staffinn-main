/**
 * Script to add the specific TFWS scheme that should be displayed
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS
require('dotenv').config();
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'institute-gov-schemes';

async function addTfwsScheme() {
  const tfwsScheme = {
    govschemes: 'govschemes',
    schemeId: uuidv4(),
    instituteId: 'd98f25d6-f18b-4e30-b383-7b164ba7cb18', // The institute ID from the URL
    schemeName: 'tfws',
    schemeDescription: 'No description available',
    link: 'View Details',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    console.log('Adding TFWS scheme...');
    await docClient.put({
      TableName: TABLE_NAME,
      Item: tfwsScheme
    }).promise();
    console.log('TFWS scheme added successfully:', tfwsScheme.schemeName);
    
    // Verify it was added
    const result = await docClient.scan({
      TableName: TABLE_NAME,
      FilterExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': 'd98f25d6-f18b-4e30-b383-7b164ba7cb18'
      }
    }).promise();
    
    console.log('Total schemes for this institute:', result.Items.length);
    result.Items.forEach(item => {
      console.log('- Scheme:', item.schemeName, 'ID:', item.schemeId);
    });
    
  } catch (error) {
    console.error('Error adding TFWS scheme:', error);
  }
}

addTfwsScheme();