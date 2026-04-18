/**
 * Script to create the institute government schemes table and add test data
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'institute-gov-schemes';

async function createTable() {
  const params = {
    TableName: TABLE_NAME,
    KeySchema: [
      {
        AttributeName: 'govschemes',
        KeyType: 'HASH' // Partition key
      },
      {
        AttributeName: 'schemeId',
        KeyType: 'RANGE' // Sort key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'govschemes',
        AttributeType: 'S'
      },
      {
        AttributeName: 'schemeId',
        AttributeType: 'S'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    console.log('Creating table:', TABLE_NAME);
    const result = await dynamodb.createTable(params).promise();
    console.log('Table created successfully:', result.TableDescription.TableName);
    
    // Wait for table to be active
    console.log('Waiting for table to be active...');
    await dynamodb.waitFor('tableExists', { TableName: TABLE_NAME }).promise();
    console.log('Table is now active');
    
    return true;
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('Table already exists');
      return true;
    } else {
      console.error('Error creating table:', error);
      return false;
    }
  }
}

async function addTestData() {
  const testSchemes = [
    {
      govschemes: 'govschemes',
      schemeId: uuidv4(),
      instituteId: 'd98f25d6-f18b-4e30-b383-7b164ba7cb18', // The institute ID from the URL
      schemeName: 'tfws',
      schemeDescription: 'Test scheme for frontend display',
      link: 'https://example.com/tfws',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      govschemes: 'govschemes',
      schemeId: uuidv4(),
      instituteId: 'd98f25d6-f18b-4e30-b383-7b164ba7cb18',
      schemeName: 'Skill Development Program',
      schemeDescription: 'Government skill development initiative for students',
      link: 'https://example.com/skill-development',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  try {
    console.log('Adding test data...');
    for (const scheme of testSchemes) {
      await docClient.put({
        TableName: TABLE_NAME,
        Item: scheme
      }).promise();
      console.log('Added scheme:', scheme.schemeName);
    }
    console.log('Test data added successfully');
    return true;
  } catch (error) {
    console.error('Error adding test data:', error);
    return false;
  }
}

async function main() {
  try {
    // Load environment variables
    require('dotenv').config();
    
    console.log('Starting table creation and data insertion...');
    
    // Create table
    const tableCreated = await createTable();
    if (!tableCreated) {
      console.error('Failed to create table');
      return;
    }
    
    // Add test data
    const dataAdded = await addTestData();
    if (!dataAdded) {
      console.error('Failed to add test data');
      return;
    }
    
    console.log('Setup completed successfully!');
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// Run the script
main();