const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();

const createQuizProgressTable = async () => {
  const params = {
    TableName: 'user-quiz-progress',
    KeySchema: [
      {
        AttributeName: 'quizprogressId',
        KeyType: 'HASH' // Partition key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'quizprogressId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'userId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'courseId',
        AttributeType: 'S'
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'userId-courseId-index',
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'courseId',
            KeyType: 'RANGE'
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
    const result = await dynamodb.createTable(params).promise();
    console.log('✅ Table created successfully:', result.TableDescription.TableName);
    console.log('Table ARN:', result.TableDescription.TableArn);
    console.log('Table Status:', result.TableDescription.TableStatus);
  } catch (error) {
    if (error.code === 'ResourceInUseException') {
      console.log('⚠️ Table already exists:', params.TableName);
    } else {
      console.error('❌ Error creating table:', error);
    }
  }
};

// Run the script
createQuizProgressTable();