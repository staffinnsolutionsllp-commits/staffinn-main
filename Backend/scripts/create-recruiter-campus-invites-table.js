/**
 * Script to create recruiter-campus-invites DynamoDB table
 * Run this script once to create the table for RECRUITER → INSTITUTE campus invites
 */

require('dotenv').config();
const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const TABLE_NAME = process.env.RECRUITER_CAMPUS_INVITES_TABLE || 'recruiter-campus-invites';

// Direct AWS client initialization
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const createTable = async () => {
  const params = {
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: 'inviteId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'inviteId', AttributeType: 'S' },
      { AttributeName: 'recruiterId', AttributeType: 'S' },
      { AttributeName: 'instituteId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'RecruiterIdIndex',
        KeySchema: [
          { AttributeName: 'recruiterId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'InstituteIdIndex',
        KeySchema: [
          { AttributeName: 'instituteId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    console.log(`🚀 Creating DynamoDB table: ${TABLE_NAME}`);
    console.log(`📍 Region: ${process.env.AWS_REGION}`);
    
    const command = new CreateTableCommand(params);
    await client.send(command);
    console.log(`✅ Table "${TABLE_NAME}" created successfully!`);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`ℹ️  Table "${TABLE_NAME}" already exists.`);
    } else {
      console.error(`❌ Error creating table "${TABLE_NAME}":`, error);
      throw error;
    }
  }
};

// Run the script if executed directly
if (require.main === module) {
  createTable()
    .then(() => {
      console.log('Table creation completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Table creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createTable };
