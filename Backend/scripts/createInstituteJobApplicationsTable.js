/**
 * Script to create the Institute Job Applications table in DynamoDB
 */
const AWS = require('aws-sdk');

// SECURITY FIX (CWE-798, CWE-259): Use environment variables instead of hardcoded credentials
// For local DynamoDB testing, set these environment variables:
//   export AWS_ACCESS_KEY_ID="dummy"
//   export AWS_SECRET_ACCESS_KEY="dummy"
//   export AWS_REGION="us-east-1"
//   export DYNAMODB_ENDPOINT="http://localhost:8000"

// Configure AWS from environment variables
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Validate credentials are set
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('❌ AWS credentials not found in environment variables');
  console.log('\n💡 For local DynamoDB testing, run:');
  console.log('   export AWS_ACCESS_KEY_ID="dummy"');
  console.log('   export AWS_SECRET_ACCESS_KEY="dummy"');
  console.log('\n   Then run: node createInstituteJobApplicationsTable.js');
  console.log('\n   Or run with inline variables:');
  console.log('   AWS_ACCESS_KEY_ID="dummy" AWS_SECRET_ACCESS_KEY="dummy" node createInstituteJobApplicationsTable.js\n');
  process.exit(1);
}

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