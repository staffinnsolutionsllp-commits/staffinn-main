const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const awsConfig = require('./config/aws');

const client = new DynamoDBClient(awsConfig);

const createQuizProgressTable = async () => {
  const params = {
    TableName: 'user-quiz-progress',
    KeySchema: [
      {
        AttributeName: 'quizprogressId',
        KeyType: 'HASH'
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
    const command = new CreateTableCommand(params);
    const result = await client.send(command);
    console.log('✅ Table created successfully:', result.TableDescription.TableName);
    console.log('Table ARN:', result.TableDescription.TableArn);
    console.log('Table Status:', result.TableDescription.TableStatus);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('⚠️ Table already exists:', params.TableName);
    } else {
      console.error('❌ Error creating table:', error);
    }
  }
};

createQuizProgressTable();