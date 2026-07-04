/**
 * Create MIS Placement Analytics Table
 * Creates the DynamoDB table for tracking MIS student placements
 */

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1'
});

const dynamoDB = new AWS.DynamoDB();

const createMisPlacementTable = async () => {
  const tableName = 'staffinn-mis-placement-analytics';
  
  const params = {
    TableName: tableName,
    KeySchema: [
      {
        AttributeName: 'placementId',
        KeyType: 'HASH' // Partition key
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: 'placementId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'studentId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'status',
        AttributeType: 'S'
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'StudentIdIndex',
        KeySchema: [
          {
            AttributeName: 'studentId',
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
        IndexName: 'StatusIndex',
        KeySchema: [
          {
            AttributeName: 'status',
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
      ReadCapacityUnits: 10,
      WriteCapacityUnits: 10
    }
  };

  try {
    // Check if table already exists
    try {
      await dynamoDB.describeTable({ TableName: tableName }).promise();
      console.log(`✅ Table ${tableName} already exists`);
      return;
    } catch (error) {
      if (error.code !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // Create the table
    console.log(`🔄 Creating table ${tableName}...`);
    const result = await dynamoDB.createTable(params).promise();
    console.log(`✅ Table ${tableName} created successfully`);
    
    // Wait for table to be active
    console.log('⏳ Waiting for table to be active...');
    await dynamoDB.waitFor('tableExists', { TableName: tableName }).promise();
    console.log(`✅ Table ${tableName} is now active`);
    
    return result;
  } catch (error) {
    console.error(`❌ Error creating table ${tableName}:`, error);
    throw error;
  }
};

// Run the script if called directly
if (require.main === module) {
  createMisPlacementTable()
    .then(() => {
      console.log('🎉 MIS Placement Analytics table setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to create MIS Placement Analytics table:', error);
      process.exit(1);
    });
}

module.exports = { createMisPlacementTable };