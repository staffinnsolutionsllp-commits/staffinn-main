/**
 * DynamoDB Configuration
 * Sets up DynamoDB tables and configuration
 */
const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');
const awsConfig = require('./aws');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient(awsConfig);

// Define table names
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'staffinn-users';
const STAFF_TABLE = process.env.STAFF_TABLE || 'staffinn-staff-profiles';
const CONTACT_TABLE = process.env.CONTACT_HISTORY_TABLE || 'staffinn-contact-history';
const HIRING_TABLE = process.env.HIRING_TABLE || 'staffinn-hiring-records';
const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE || 'staffinn-notifications';

// Define table schemas
const usersTableSchema = {
  TableName: USERS_TABLE,
  KeySchema: [
    { AttributeName: 'userId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'userId', AttributeType: 'S' }
  ],
  BillingMode: 'ON_DEMAND'
};

const staffTableSchema = {
  TableName: STAFF_TABLE,
  KeySchema: [
    { AttributeName: 'staffId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'staffId', AttributeType: 'S' }
  ],
  BillingMode: 'ON_DEMAND'
};

const contactTableSchema = {
  TableName: CONTACT_TABLE,
  KeySchema: [
    { AttributeName: 'contactId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'contactId', AttributeType: 'S' }
  ],
  BillingMode: 'ON_DEMAND'
};

const hiringTableSchema = {
  TableName: HIRING_TABLE,
  KeySchema: [
    { AttributeName: 'hiringId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'hiringId', AttributeType: 'S' }
  ],
  BillingMode: 'ON_DEMAND'
};

const notificationsTableSchema = {
  TableName: NOTIFICATIONS_TABLE,
  KeySchema: [
    { AttributeName: 'notificationId', KeyType: 'HASH' }
  ],
  AttributeDefinitions: [
    { AttributeName: 'notificationId', AttributeType: 'S' }
  ],
  BillingMode: 'ON_DEMAND'
};

/**
 * Check if a table exists
 * @param {string} tableName - Table name to check
 * @returns {Promise} - True if table exists, false otherwise
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
 * Create DynamoDB tables if they don't exist
 */
const createTablesIfNotExist = async () => {
  try {
    // Check if users table exists
    const usersExists = await tableExists(USERS_TABLE);
    
    if (!usersExists) {
      // Create users table
      await dynamoClient.send(new CreateTableCommand(usersTableSchema));
      console.log(`Created table: ${USERS_TABLE}`);
    } else {
      console.log(`Table already exists: ${USERS_TABLE}`);
    }
    
    // Check if staff table exists
    const staffExists = await tableExists(STAFF_TABLE);
    
    if (!staffExists) {
      // Create staff table
      await dynamoClient.send(new CreateTableCommand(staffTableSchema));
      console.log(`Created table: ${STAFF_TABLE}`);
    } else {
      console.log(`Table already exists: ${STAFF_TABLE}`);
    }
    
    // Check if contact history table exists
    const contactExists = await tableExists(CONTACT_TABLE);
    
    if (!contactExists) {
      // Create contact history table
      await dynamoClient.send(new CreateTableCommand(contactTableSchema));
      console.log(`Created table: ${CONTACT_TABLE}`);
    } else {
      console.log(`Table already exists: ${CONTACT_TABLE}`);
    }
    
    // Check if hiring table exists
    const hiringExists = await tableExists(HIRING_TABLE);
    
    if (!hiringExists) {
      // Create hiring table
      await dynamoClient.send(new CreateTableCommand(hiringTableSchema));
      console.log(`Created table: ${HIRING_TABLE}`);
    } else {
      console.log(`Table already exists: ${HIRING_TABLE}`);
    }
    
    // Check if notifications table exists
    const notificationsExists = await tableExists(NOTIFICATIONS_TABLE);
    
    if (!notificationsExists) {
      // Create notifications table
      await dynamoClient.send(new CreateTableCommand(notificationsTableSchema));
      console.log(`Created table: ${NOTIFICATIONS_TABLE}`);
    } else {
      console.log(`Table already exists: ${NOTIFICATIONS_TABLE}`);
    }
  } catch (error) {
    // ResourceInUseException means table already exists
    if (error.name === 'ResourceInUseException') {
      console.log('Table already exists');
    } else {
      console.error('Error creating DynamoDB tables:', error);
      throw error;
    }
  }
};

module.exports = {
  dynamoClient,
  USERS_TABLE,
  STAFF_TABLE,
  CONTACT_TABLE,
  HIRING_TABLE,
  NOTIFICATIONS_TABLE,
  createTablesIfNotExist
};