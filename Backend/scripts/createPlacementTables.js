const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();

const createPlacementTables = async () => {
  try {
    // 1. staffinn-placement-analytics table
    const analyticsTableParams = {
      TableName: 'staffinn-placement-analytics',
      KeySchema: [
        { AttributeName: 'analyticsId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'analyticsId', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    // 2. staffinn-student-placement-status table
    const statusTableParams = {
      TableName: 'staffinn-student-placement-status',
      KeySchema: [
        { AttributeName: 'statusId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'statusId', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    // 3. staffinn-mis-job-applications table
    const misApplicationsTableParams = {
      TableName: 'staffinn-mis-job-applications',
      KeySchema: [
        { AttributeName: 'misApplicationId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'misApplicationId', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    // Create tables
    console.log('Creating staffinn-placement-analytics table...');
    await dynamodb.createTable(analyticsTableParams).promise();
    console.log('✅ staffinn-placement-analytics table created');

    console.log('Creating staffinn-student-placement-status table...');
    await dynamodb.createTable(statusTableParams).promise();
    console.log('✅ staffinn-student-placement-status table created');

    console.log('Creating staffinn-mis-job-applications table...');
    await dynamodb.createTable(misApplicationsTableParams).promise();
    console.log('✅ staffinn-mis-job-applications table created');

    console.log('🎉 All placement tables created successfully!');
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('⚠️ Tables already exist');
    } else {
      console.error('❌ Error creating tables:', error);
    }
  }
};

// Run if called directly
if (require.main === module) {
  createPlacementTables();
}

module.exports = createPlacementTables;