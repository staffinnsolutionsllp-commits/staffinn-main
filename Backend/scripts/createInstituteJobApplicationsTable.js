/**
 * Script to create the Institute Job Applications table in DynamoDB
 */
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000', // Local DynamoDB endpoint
  accessKeyId: 'dummy',
  secretAccessKey: 'dummy'
});

const dynamodb = new AWS.DynamoDB();

const createInstituteJobApplicationsTable = async () => {
  const params = {
    TableName: 'staffinn-institute-job-applications',
    KeySchema: [
      {
        AttributeName: 'applicationId',
        KeyType: 'HASH' // Partition key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'applicationId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'instituteId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'recruiterId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'jobId',
        AttributeType: 'S'
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'InstituteIndex',
        KeySchema: [
          {
            AttributeName: 'instituteId',
            KeyType: 'HASH'
          }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'RecruiterIndex',
        KeySchema: [
          {
            AttributeName: 'recruiterId',
            KeyType: 'HASH'
          }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      },
      {
        IndexName: 'JobIndex',
        KeySchema: [
          {
            AttributeName: 'jobId',
            KeyType: 'HASH'
          }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
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
    console.log('Creating Institute Job Applications table...');
    const result = await dynamodb.createTable(params).promise();
    console.log('Table created successfully:', result.TableDescription.TableName);
    console.log('Table ARN:', result.TableDescription.TableArn);
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('Table already exists');
    } else {
      console.error('Error creating table:', error);
    }
  }
};

// Run the script
createInstituteJobApplicationsTable();