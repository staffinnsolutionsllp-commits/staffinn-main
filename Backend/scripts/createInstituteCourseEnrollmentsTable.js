const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();

const createInstituteCourseEnrollmentsTable = async () => {
  const params = {
    TableName: 'staffinn-institute-course-enrollments',
    KeySchema: [
      {
        AttributeName: 'enrollmentId',
        KeyType: 'HASH'
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'enrollmentId',
        AttributeType: 'S'
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    const result = await dynamodb.createTable(params).promise();
    console.log('✅ staffinn-institute-course-enrollments table created successfully:', result.TableDescription.TableName);
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('ℹ️ staffinn-institute-course-enrollments table already exists');
    } else {
      console.error('❌ Error creating staffinn-institute-course-enrollments table:', error);
    }
  }
};

const main = async () => {
  console.log('🚀 Creating DynamoDB table for institute course enrollments...');
  await createInstituteCourseEnrollmentsTable();
  console.log('✨ Table creation process completed!');
};

main().catch(console.error);
