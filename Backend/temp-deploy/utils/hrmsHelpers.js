const { v4: uuidv4 } = require('uuid');
const { dynamoClient, isUsingMockDB, mockDB, HRMS_EMPLOYEES_TABLE } = require('../config/dynamodb-wrapper');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Generate numeric employee ID (e.g., 1001, 1002, 1003...)
const generateNumericEmployeeId = async () => {
  try {
    let employees;
    
    if (isUsingMockDB()) {
      employees = mockDB().scan(HRMS_EMPLOYEES_TABLE);
    } else {
      const command = new ScanCommand({
        TableName: HRMS_EMPLOYEES_TABLE,
        ProjectionExpression: 'employeeId'
      });
      const result = await dynamoClient.send(command);
      employees = result.Items || [];
    }

    // Find highest numeric employee ID
    let maxId = 1000; // Start from 1001
    
    employees.forEach(emp => {
      const id = emp.employeeId;
      // Check if it's a numeric ID
      if (/^\d+$/.test(id)) {
        const numId = parseInt(id, 10);
        if (numId > maxId) {
          maxId = numId;
        }
      }
    });

    // Return next ID
    return (maxId + 1).toString();
  } catch (error) {
    console.error('Error generating numeric employee ID:', error);
    // Fallback to timestamp-based ID if error
    return Date.now().toString().slice(-6);
  }
};

const generateId = () => uuidv4();

const getCurrentTimestamp = () => new Date().toISOString();

const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const handleError = (error, res) => {
  console.error('HRMS Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

const successResponse = (data, message = 'Success') => ({
  success: true,
  message,
  data
});

const errorResponse = (message, statusCode = 400) => ({
  success: false,
  message,
  statusCode
});

module.exports = {
  generateId,
  generateNumericEmployeeId,
  getCurrentTimestamp,
  formatDate,
  validateEmail,
  handleError,
  successResponse,
  errorResponse
};