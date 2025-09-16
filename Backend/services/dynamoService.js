/**
 * DynamoDB Service
 * Handles all DynamoDB operations using AWS SDK v3
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  QueryCommand,
  ScanCommand,
  DeleteCommand,
  UpdateCommand,
  BatchWriteCommand
} = require('@aws-sdk/lib-dynamodb');
const awsConfig = require('../config/aws');

// Initialize DynamoDB client with AWS configuration
const client = new DynamoDBClient(awsConfig);

// Create document client for easier data handling
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: false }
});

/**
 * Get an item from DynamoDB by key
 * @param {string} tableName - DynamoDB table name
 * @param {object} key - Key object (e.g., { userId: '123' })
 * @returns {Promise<object>} - Retrieved item or null
 */
const getItem = async (tableName, key) => {
  try {
    // Check if using mock DB
    const { isUsingMockDB, mockDB } = require('../config/dynamodb-wrapper');
    if (isUsingMockDB()) {
      return mockDB().getItem(tableName, key);
    }
    
    const command = new GetCommand({
      TableName: tableName,
      Key: key
    });
    
    const response = await docClient.send(command);
    return response.Item || null;
  } catch (error) {
    console.error('DynamoDB getItem error:', error);
    if (error.code === 'ENOTFOUND' || error.code === 'NetworkingError') {
      console.log('Network error - trying mock database fallback');
      const { mockDB } = require('../config/dynamodb-wrapper');
      const mockInstance = mockDB();
      if (!mockInstance) {
        const mockDBModule = require('../mock-dynamodb');
        return mockDBModule.getItem(tableName, key);
      }
      return mockInstance.getItem(tableName, key);
    }
    throw error;
  }
};

/**
 * Put an item into DynamoDB
 * @param {string} tableName - DynamoDB table name
 * @param {object} item - Item to store
 * @returns {Promise<object>} - Response from DynamoDB
 */
const putItem = async (tableName, item) => {
  try {
    // Check if using mock DB
    const { isUsingMockDB, mockDB } = require('../config/dynamodb-wrapper');
    if (isUsingMockDB()) {
      return mockDB().putItem(tableName, item);
    }
    
    const command = new PutCommand({
      TableName: tableName,
      Item: item
    });
    
    return await docClient.send(command);
  } catch (error) {
    console.error('DynamoDB putItem error:', error);
    if (error.code === 'ENOTFOUND' || error.code === 'NetworkingError') {
      console.log('Network error - using mock database fallback');
      const { mockDB } = require('../config/dynamodb-wrapper');
      const mockInstance = mockDB();
      if (!mockInstance) {
        const mockDBModule = require('../mock-dynamodb');
        return mockDBModule.putItem(tableName, item);
      }
      return mockInstance.putItem(tableName, item);
    }
    throw error;
  }
};

/**
 * Query items from DynamoDB
 * @param {string} tableName - DynamoDB table name
 * @param {object} params - Query parameters
 * @returns {Promise<Array>} - Array of items
 */
const queryItems = async (tableName, params) => {
  try {
    // Check if trying to use EmailIndex and handle it with scan instead
    if (params.IndexName === 'EmailIndex') {
      console.log('EmailIndex not available, falling back to scan operation');
      // Extract the email value from the KeyConditionExpression
      let emailValue = null;
      if (params.ExpressionAttributeValues && params.ExpressionAttributeValues[':email']) {
        emailValue = params.ExpressionAttributeValues[':email'];
      }
      
      // Use scan with filter instead
      return await scanItems(tableName, {
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': emailValue }
      });
    }
    
    const command = new QueryCommand({
      TableName: tableName,
      ...params
    });
    
    const response = await docClient.send(command);
    return response.Items || [];
  } catch (error) {
    console.error('DynamoDB queryItems error:', error);
    throw error;
  }
};

/**
 * Scan items from DynamoDB
 * @param {string} tableName - DynamoDB table name
 * @param {object} params - Scan parameters
 * @returns {Promise<Array>} - Array of items
 */
const scanItems = async (tableName, params = {}) => {
  try {
    // Check if using mock DB
    const { isUsingMockDB, mockDB } = require('../config/dynamodb-wrapper');
    if (isUsingMockDB()) {
      return mockDB().scanItems(tableName, params);
    }
    
    const command = new ScanCommand({
      TableName: tableName,
      ...params
    });
    
    const response = await docClient.send(command);
    return response.Items || [];
  } catch (error) {
    console.error('DynamoDB scanItems error:', error);
    if (error.code === 'ENOTFOUND' || error.code === 'NetworkingError') {
      console.log('Network error - using mock database fallback');
      const { mockDB } = require('../config/dynamodb-wrapper');
      const mockInstance = mockDB();
      if (!mockInstance) {
        const mockDBModule = require('../mock-dynamodb');
        return mockDBModule.scanItems(tableName, params);
      }
      return mockInstance.scanItems(tableName, params);
    }
    throw error;
  }
};

/**
 * Delete an item from DynamoDB
 * @param {string} tableName - DynamoDB table name
 * @param {object} key - Key object (e.g., { userId: '123' })
 * @returns {Promise<object>} - Response from DynamoDB
 */
const deleteItem = async (tableName, key) => {
  try {
    // Check if using mock DB
    const { isUsingMockDB, mockDB } = require('../config/dynamodb-wrapper');
    if (isUsingMockDB()) {
      return mockDB().deleteItem(tableName, key);
    }
    
    const command = new DeleteCommand({
      TableName: tableName,
      Key: key
    });
    
    return await docClient.send(command);
  } catch (error) {
    console.error('DynamoDB deleteItem error:', error);
    if (error.code === 'ENOTFOUND' || error.code === 'NetworkingError') {
      console.log('Network error - using mock database fallback');
      const { mockDB } = require('../config/dynamodb-wrapper');
      const mockInstance = mockDB();
      if (!mockInstance) {
        const mockDBModule = require('../mock-dynamodb');
        return mockDBModule.deleteItem(tableName, key);
      }
      return mockInstance.deleteItem(tableName, key);
    }
    throw error;
  }
};

/**
 * Update an item in DynamoDB
 * @param {string} tableName - DynamoDB table name
 * @param {object} key - Key object (e.g., { userId: '123' })
 * @param {object} params - Update parameters
 * @returns {Promise<object>} - Updated item
 */
const updateItem = async (tableName, key, params) => {
  try {
    const command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      ...params,
      ReturnValues: 'ALL_NEW'
    });
    
    const response = await docClient.send(command);
    return response.Attributes;
  } catch (error) {
    console.error('DynamoDB updateItem error:', error);
    throw error;
  }
};

/**
 * Batch write items to DynamoDB
 * @param {string} tableName - DynamoDB table name
 * @param {Array} items - Array of items to write
 * @returns {Promise<object>} - Response from DynamoDB
 */
const batchWriteItems = async (tableName, items) => {
  try {
    const putRequests = items.map(item => ({
      PutRequest: { Item: item }
    }));

    const command = new BatchWriteCommand({
      RequestItems: {
        [tableName]: putRequests
      }
    });
    
    return await docClient.send(command);
  } catch (error) {
    console.error('DynamoDB batchWriteItems error:', error);
    throw error;
  }
};

/**
 * Get multiple items by keys (enhanced for job and recruiter operations)
 * @param {string} tableName - DynamoDB table name
 * @param {Array} keys - Array of key objects
 * @returns {Promise<Array>} - Array of retrieved items
 */
const getMultipleItems = async (tableName, keys) => {
  try {
    const items = [];
    
    // Use Promise.all for concurrent requests
    const promises = keys.map(key => getItem(tableName, key));
    const results = await Promise.all(promises);
    
    // Filter out null results
    return results.filter(item => item !== null);
  } catch (error) {
    console.error('DynamoDB getMultipleItems error:', error);
    throw error;
  }
};

/**
 * Enhanced scan with pagination support
 * @param {string} tableName - DynamoDB table name
 * @param {object} params - Scan parameters
 * @param {number} limit - Maximum number of items to return
 * @returns {Promise<object>} - Object with items and pagination info
 */
const scanWithPagination = async (tableName, params = {}, limit = 100) => {
  try {
    const command = new ScanCommand({
      TableName: tableName,
      Limit: limit,
      ...params
    });
    
    const response = await docClient.send(command);
    
    return {
      items: response.Items || [],
      lastEvaluatedKey: response.LastEvaluatedKey,
      count: response.Count,
      scannedCount: response.ScannedCount
    };
  } catch (error) {
    console.error('DynamoDB scanWithPagination error:', error);
    throw error;
  }
};

/**
 * Count items in table with filter
 * @param {string} tableName - DynamoDB table name
 * @param {object} filterParams - Filter parameters
 * @returns {Promise<number>} - Count of matching items
 */
const countItems = async (tableName, filterParams = {}) => {
  try {
    const command = new ScanCommand({
      TableName: tableName,
      Select: 'COUNT',
      ...filterParams
    });
    
    const response = await docClient.send(command);
    return response.Count || 0;
  } catch (error) {
    console.error('DynamoDB countItems error:', error);
    throw error;
  }
};

/**
 * Conditional put - only put if item doesn't exist
 * @param {string} tableName - DynamoDB table name
 * @param {object} item - Item to store
 * @param {string} keyAttribute - Primary key attribute name
 * @returns {Promise<boolean>} - Success status
 */
const conditionalPut = async (tableName, item, keyAttribute = 'userId') => {
  try {
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: `attribute_not_exists(${keyAttribute})`
    });
    
    await docClient.send(command);
    return true;
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return false; // Item already exists
    }
    console.error('DynamoDB conditionalPut error:', error);
    throw error;
  }
};

/**
 * Atomic increment for numeric fields
 * @param {string} tableName - DynamoDB table name
 * @param {object} key - Key object
 * @param {string} attribute - Attribute name to increment
 * @param {number} increment - Amount to increment (default: 1)
 * @returns {Promise<object>} - Updated item
 */
const atomicIncrement = async (tableName, key, attribute, increment = 1) => {
  try {
    const command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: `ADD ${attribute} :increment`,
      ExpressionAttributeValues: {
        ':increment': increment
      },
      ReturnValues: 'ALL_NEW'
    });
    
    const response = await docClient.send(command);
    return response.Attributes;
  } catch (error) {
    console.error('DynamoDB atomicIncrement error:', error);
    throw error;
  }
};

/**
 * Simple update item with automatic timestamp
 * @param {string} tableName - DynamoDB table name
 * @param {object} key - Key object
 * @param {object} updates - Object with attributes to update
 * @returns {Promise<object>} - Updated item
 */
const simpleUpdate = async (tableName, key, updates) => {
  try {
    // Add timestamp
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    Object.keys(updatesWithTimestamp).forEach((attr, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      
      updateExpressions.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = attr;
      expressionAttributeValues[attrValue] = updatesWithTimestamp[attr];
    });
    
    const command = new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });
    
    const response = await docClient.send(command);
    return response.Attributes;
  } catch (error) {
    console.error('DynamoDB simpleUpdate error:', error);
    throw error;
  }
};

module.exports = {
  getItem,
  putItem,
  queryItems,
  scanItems,
  deleteItem,
  updateItem,
  batchWriteItems,
  getMultipleItems,
  scanWithPagination,
  countItems,
  conditionalPut,
  atomicIncrement,
  simpleUpdate,
  docClient // Export for advanced operations
};