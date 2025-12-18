/**
 * Create Registration Requests Table
 * Script to create the registration requests table in DynamoDB
 */

const { dynamoClient, isUsingMockDB, mockDB } = require('../config/dynamodb-wrapper');
const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const TABLE_NAME = 'staffinn-registration-requests';

const createRegistrationRequestsTable = async () => {
  try {
    if (isUsingMockDB()) {
      console.log('Using mock database - table will be created automatically');
      return;
    }

    const params = {
      TableName: TABLE_NAME,
      KeySchema: [
        {
          AttributeName: 'requestId',
          KeyType: 'HASH'
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'requestId',
          AttributeType: 'S'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    const command = new CreateTableCommand(params);
    const result = await dynamoClient.send(command);
    
    console.log('✅ Registration requests table created successfully:', result.TableDescription.TableName);
    return result;
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('ℹ️  Registration requests table already exists');
      return;
    }
    console.error('❌ Error creating registration requests table:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  createRegistrationRequestsTable()
    .then(() => {
      console.log('Registration requests table setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to create registration requests table:', error);
      process.exit(1);
    });
}

module.exports = { createRegistrationRequestsTable };