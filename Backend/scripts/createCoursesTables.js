const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();

const createCoursesTable = async () => {
  const params = {
    TableName: 'staffinn-courses',
    KeySchema: [
      {
        AttributeName: 'coursesId',
        KeyType: 'HASH'
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'coursesId',
        AttributeType: 'S'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    const result = await dynamodb.createTable(params).promise();
    console.log('✅ staffinn-courses table created successfully:', result.TableDescription.TableName);
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('ℹ️ staffinn-courses table already exists');
    } else {
      console.error('❌ Error creating staffinn-courses table:', error);
    }
  }
};

const createEnrollmentTable = async () => {
  const params = {
    TableName: 'course-enrolled-user',
    KeySchema: [
      {
        AttributeName: 'enrolledID',
        KeyType: 'HASH'
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'enrolledID',
        AttributeType: 'S'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    const result = await dynamodb.createTable(params).promise();
    console.log('✅ course-enrolled-user table created successfully:', result.TableDescription.TableName);
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('ℹ️ course-enrolled-user table already exists');
    } else {
      console.error('❌ Error creating course-enrolled-user table:', error);
    }
  }
};

const main = async () => {
  console.log('🚀 Creating DynamoDB tables for course management...');
  
  await createCoursesTable();
  await createEnrollmentTable();
  
  console.log('✨ Table creation process completed!');
};

main().catch(console.error);