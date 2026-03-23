require('dotenv').config();
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();

const createPaymentTransactionsTable = async () => {
  const params = {
    TableName: 'payment-transactions',
    KeySchema: [
      { AttributeName: 'transactionId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'transactionId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'instituteId', AttributeType: 'S' },
      { AttributeName: 'orderId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserIdIndex',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' }
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
        IndexName: 'InstituteIdIndex',
        KeySchema: [
          { AttributeName: 'instituteId', KeyType: 'HASH' }
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
        IndexName: 'OrderIdIndex',
        KeySchema: [
          { AttributeName: 'orderId', KeyType: 'HASH' }
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
    console.log('🔄 Creating payment-transactions table...');
    console.log('📍 Region:', process.env.AWS_REGION || 'ap-south-1');
    console.log('🔑 Access Key:', process.env.AWS_ACCESS_KEY_ID ? 'Found' : 'Missing');
    
    const result = await dynamodb.createTable(params).promise();
    console.log('✅ Payment transactions table created successfully!');
    console.log('📊 Table ARN:', result.TableDescription.TableArn);
    console.log('📅 Created at:', result.TableDescription.CreationDateTime);
    return result;
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('ℹ️  Payment transactions table already exists');
      console.log('✅ No action needed - table is ready to use');
      return null;
    } else {
      console.error('❌ Error creating payment transactions table:', error.message);
      console.error('💡 Troubleshooting:');
      console.error('   1. Check if AWS credentials are set in .env file');
      console.error('   2. Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
      console.error('   3. Ensure AWS_REGION is set (default: ap-south-1)');
      console.error('   4. Check if you have DynamoDB permissions');
      throw error;
    }
  }
};

// Run if executed directly
if (require.main === module) {
  console.log('='.repeat(60));
  console.log('🚀 Payment Transactions Table Setup');
  console.log('='.repeat(60));
  
  createPaymentTransactionsTable()
    .then(() => {
      console.log('='.repeat(60));
      console.log('✅ Script completed successfully!');
      console.log('='.repeat(60));
      process.exit(0);
    })
    .catch((error) => {
      console.log('='.repeat(60));
      console.error('❌ Script failed!');
      console.log('='.repeat(60));
      process.exit(1);
    });
}

module.exports = { createPaymentTransactionsTable };
