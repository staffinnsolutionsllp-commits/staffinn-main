const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();

const createCourseReviewTable = async () => {
  const params = {
    TableName: 'course-review',
    KeySchema: [
      {
        AttributeName: 'coursereviewid',
        KeyType: 'HASH' // Partition key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'coursereviewid',
        AttributeType: 'S'
      },
      {
        AttributeName: 'courseId',
        AttributeType: 'S'
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'CourseIdIndex',
        KeySchema: [
          {
            AttributeName: 'courseId',
            KeyType: 'HASH'
          }
        ],
        Projection: {
          ProjectionType: 'ALL'
        }
      }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    console.log('Creating course-review table...');
    const result = await dynamodb.createTable(params).promise();
    console.log('✅ Course review table created successfully:', result.TableDescription.TableName);
    
    // Wait for table to be active
    console.log('Waiting for table to be active...');
    await dynamodb.waitFor('tableExists', { TableName: 'course-review' }).promise();
    console.log('✅ Table is now active and ready to use');
    
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('✅ Course review table already exists');
    } else {
      console.error('❌ Error creating course review table:', error);
    }
  }
};

// Run the script
createCourseReviewTable()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });