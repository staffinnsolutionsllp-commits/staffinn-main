const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();

// Table 1: Payment Transactions
const createPaymentTransactionsTable = async () => {
  const params = {
    TableName: 'payment-transactions',
    KeySchema: [
      { AttributeName: 'transactionId', KeyType: 'HASH' } // Primary key
    ],
    AttributeDefinitions: [
      { AttributeName: 'transactionId', AttributeType: 'S' },
      { AttributeName: 'userId', AttributeType: 'S' },
      { AttributeName: 'instituteId', AttributeType: 'S' },
      { AttributeName: 'courseId', AttributeType: 'S' },
      { AttributeName: 'razorpayOrderId', AttributeType: 'S' },
      { AttributeName: 'paymentStatus', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'userId-index',
        KeySchema: [
          { AttributeName: 'userId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      },
      {
        IndexName: 'instituteId-index',
        KeySchema: [
          { AttributeName: 'instituteId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      },
      {
        IndexName: 'courseId-index',
        KeySchema: [
          { AttributeName: 'courseId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      },
      {
        IndexName: 'razorpayOrderId-index',
        KeySchema: [
          { AttributeName: 'razorpayOrderId', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      },
      {
        IndexName: 'paymentStatus-index',
        KeySchema: [
          { AttributeName: 'paymentStatus', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    const result = await dynamodb.createTable(params).promise();
    console.log('✅ Payment Transactions table created successfully:', result.TableDescription.TableName);
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('ℹ️  Payment Transactions table already exists');
    } else {
      console.error('❌ Error creating Payment Transactions table:', error);
      throw error;
    }
  }
};

// Table 2: Institute Bank Details
const createInstituteBankDetailsTable = async () => {
  const params = {
    TableName: 'institute-bank-details',
    KeySchema: [
      { AttributeName: 'instituteId', KeyType: 'HASH' } // Primary key
    ],
    AttributeDefinitions: [
      { AttributeName: 'instituteId', AttributeType: 'S' },
      { AttributeName: 'isVerified', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'isVerified-index',
        KeySchema: [
          { AttributeName: 'isVerified', KeyType: 'HASH' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    const result = await dynamodb.createTable(params).promise();
    console.log('✅ Institute Bank Details table created successfully:', result.TableDescription.TableName);
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('ℹ️  Institute Bank Details table already exists');
    } else {
      console.error('❌ Error creating Institute Bank Details table:', error);
      throw error;
    }
  }
};

// Table 3: Payment Settlements (for tracking institute payouts)
const createPaymentSettlementsTable = async () => {
  const params = {
    TableName: 'payment-settlements',
    KeySchema: [
      { AttributeName: 'settlementId', KeyType: 'HASH' } // Primary key
    ],
    AttributeDefinitions: [
      { AttributeName: 'settlementId', AttributeType: 'S' },
      { AttributeName: 'instituteId', AttributeType: 'S' },
      { AttributeName: 'settlementStatus', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'instituteId-index',
        KeySchema: [
          { AttributeName: 'instituteId', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      },
      {
        IndexName: 'settlementStatus-index',
        KeySchema: [
          { AttributeName: 'settlementStatus', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' }
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    const result = await dynamodb.createTable(params).promise();
    console.log('✅ Payment Settlements table created successfully:', result.TableDescription.TableName);
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('ℹ️  Payment Settlements table already exists');
    } else {
      console.error('❌ Error creating Payment Settlements table:', error);
      throw error;
    }
  }
};

// Main execution
const createAllPaymentTables = async () => {
  console.log('🚀 Starting payment tables creation...\n');
  
  try {
    await createPaymentTransactionsTable();
    await createInstituteBankDetailsTable();
    await createPaymentSettlementsTable();
    
    console.log('\n✅ All payment tables created successfully!');
    console.log('\n📊 Tables created:');
    console.log('   1. payment-transactions - Stores all payment transactions');
    console.log('   2. institute-bank-details - Stores institute bank account details');
    console.log('   3. payment-settlements - Tracks payouts to institutes');
  } catch (error) {
    console.error('\n❌ Error creating payment tables:', error);
    process.exit(1);
  }
};

// Run the script
createAllPaymentTables();
