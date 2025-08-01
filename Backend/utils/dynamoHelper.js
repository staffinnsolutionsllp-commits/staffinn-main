/**
 * DynamoDB Helper Functions
 * Utility functions for common DynamoDB patterns and operations
 */

/**
 * Format DynamoDB response for consistent API responses
 * @param {object|array} data - Data from DynamoDB
 * @param {boolean} success - Whether the operation was successful
 * @param {string} message - Optional message
 * @returns {object} - Formatted response
 */
const formatResponse = (data, success = true, message = '') => {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Handle DynamoDB errors with consistent error formatting
 * @param {Error} error - Error object
 * @param {string} operation - Operation that failed
 * @returns {object} - Formatted error response
 */
const handleError = (error, operation = 'database operation') => {
  console.error(`DynamoDB error during ${operation}:`, error);
  
  // Determine appropriate status code based on error type
  let statusCode = 500;
  let message = `Failed to perform ${operation}`;
  
  if (error.name === 'ConditionalCheckFailedException') {
    statusCode = 400;
    message = 'Item does not meet conditions';
  } else if (error.name === 'ResourceNotFoundException') {
    statusCode = 404;
    message = 'Resource not found';
  } else if (error.name === 'ValidationException') {
    statusCode = 400;
    message = error.message;
  }
  
  return {
    success: false,
    statusCode,
    message,
    error: error.message,
    timestamp: new Date().toISOString()
  };
};

/**
 * Create expression attribute names for DynamoDB
 * @param {Array} attributes - Array of attribute names
 * @returns {object} - Expression attribute names object
 */
const createExpressionAttributeNames = (attributes) => {
  return attributes.reduce((acc, attr) => {
    acc[`#${attr}`] = attr;
    return acc;
  }, {});
};

/**
 * Create update expression for DynamoDB
 * @param {object} updates - Object with updates
 * @returns {object} - Update expression and attribute values
 */
const createUpdateExpression = (updates) => {
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  
  const updateExpressions = Object.keys(updates).map(key => {
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:${key}`] = updates[key];
    return `#${key} = :${key}`;
  });
  
  return {
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues
  };
};

/**
 * Create filter expression for DynamoDB
 * @param {object} filters - Object with filters
 * @returns {object} - Filter expression and attribute values
 */
const createFilterExpression = (filters) => {
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  
  const filterExpressions = Object.keys(filters).map(key => {
    expressionAttributeNames[`#${key}`] = key;
    expressionAttributeValues[`:${key}`] = filters[key];
    return `#${key} = :${key}`;
  });
  
  return {
    FilterExpression: filterExpressions.join(' AND '),
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues
  };
};

/**
 * Generate a pagination token for DynamoDB responses
 * @param {object} lastEvaluatedKey - LastEvaluatedKey from DynamoDB response
 * @returns {string|null} - Pagination token or null
 */
const generatePaginationToken = (lastEvaluatedKey) => {
  if (!lastEvaluatedKey) return null;
  return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64');
};

/**
 * Parse a pagination token for DynamoDB queries
 * @param {string} token - Pagination token
 * @returns {object|null} - ExclusiveStartKey object or null
 */
const parsePaginationToken = (token) => {
  if (!token) return null;
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString());
  } catch (error) {
    console.error('Invalid pagination token:', error);
    return null;
  }
};

module.exports = {
  formatResponse,
  handleError,
  createExpressionAttributeNames,
  createUpdateExpression,
  createFilterExpression,
  generatePaginationToken,
  parsePaginationToken
};