const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();

const createPendingInstitutePaymentsTable = async () => {
  const params = {
    TableName: 'staffinn-pending-institute-payments',
    KeySchema: [
      { AttributeName: 'enrollmentId', KeyType: 'HASH' } // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'enrollmentId', AttributeType: 'S' },
      { AttributeName: 'instituteId', AttributeType: 'S' },
      { AttributeName: 'paymentStatus', AttributeType: 'S' },
      { AttributeName: 'studentId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'instituteId-paymentStatus-index',
        KeySchema: [
          { AttributeName: 'instituteId', KeyType: 'HASH' },
          { AttributeName: 'paymentStatus', KeyType: 'RANGE' }
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
        IndexName: 'studentId-index',
        KeySchema: [
          { AttributeName: 'studentId', KeyType: 'HASH' }
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
    console.log('🔄 Creating staffinn-pending-institute-payments table...');
    const result = await dynamodb.createTable(params).promise();
    console.log('✅ Table created successfully!');
    console.log('📋 Table Description:', JSON.stringify(result.TableDescription, null, 2));
    
    // Wait for table to be active
    console.log('⏳ Waiting for table to become active...');
    await dynamodb.waitFor('tableExists', { TableName: 'staffinn-pending-institute-payments' }).promise();
    console.log('✅ Table is now active and ready to use!');
    
    return result;
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('ℹ️ Table already exists!');
    } else {
      console.error('❌ Error creating table:', error);
      throw error;
    }
  }
};

// Run the script
createPendingInstitutePaymentsTable()
  .then(() => {
    console.log('✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
