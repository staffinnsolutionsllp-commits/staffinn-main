/**
 * Script to create the Industry Collaboration table in DynamoDB
 */

const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const awsConfig = require('../config/aws');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient(awsConfig);

const INDUSTRY_COLLAB_TABLE = 'institute-industrycollab-section';

const industryCollabTableSchema = {
  TableName: INDUSTRY_COLLAB_TABLE,
  KeySchema: [
    { AttributeName: 'instituteinduscollab', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'instituteinduscollab', AttributeType: 'S' }
  ],
  BillingMode: 'PAY_PER_REQUEST'
};

/**
 * Check if a table exists
 */
const tableExists = async (tableName) => {
  try {
    const command = new ListTablesCommand({});
    const response = await dynamoClient.send(command);
    return response.TableNames.includes(tableName);
  } catch (error) {
    console.error('Error checking if table exists:', error);
    return false;
  }
};

/**
 * Create the industry collaboration table
 */
const createIndustryCollabTable = async () => {
  try {
    console.log('Checking if industry collaboration table exists...');
    
    const exists = await tableExists(INDUSTRY_COLLAB_TABLE);
    
    if (exists) {
      console.log(`Table ${INDUSTRY_COLLAB_TABLE} already exists.`);
      return;
    }
    
    console.log(`Creating table: ${INDUSTRY_COLLAB_TABLE}`);
    
    const command = new CreateTableCommand(industryCollabTableSchema);
    const response = await dynamoClient.send(command);
    
    console.log(`Table ${INDUSTRY_COLLAB_TABLE} created successfully!`);
    console.log('Table details:', {
      TableName: response.TableDescription.TableName,
      TableStatus: response.TableDescription.TableStatus,
      KeySchema: response.TableDescription.KeySchema
    });
    
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`Table ${INDUSTRY_COLLAB_TABLE} already exists.`);
    } else {
      console.error('Error creating industry collaboration table:', error);
      throw error;
    }
  }
};

// Run the script
if (require.main === module) {
  createIndustryCollabTable()
    .then(() => {
      console.log('Industry collaboration table setup completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create industry collaboration table:', error);
      process.exit(1);
    });
}

module.exports = {
  createIndustryCollabTable,
  INDUSTRY_COLLAB_TABLE
};