/**
 * Debug Routes
 * Routes for debugging and testing
 */

const express = require('express');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const awsConfig = require('./config/aws');

const router = express.Router();

// Initialize DynamoDB client
const client = new DynamoDBClient(awsConfig);

// Table name
const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE || 'staffinn-users';

/**
 * @route GET /debug/users
 * @desc Get all users from DynamoDB
 * @access Public (for debugging only)
 */
router.get('/users', async (req, res) => {
  try {
    // Scan the table to see existing users
    const scanCommand = new ScanCommand({
      TableName: USERS_TABLE
    });
    
    const scanResponse = await client.send(scanCommand);
    const users = scanResponse.Items ? scanResponse.Items.map(item => unmarshall(item)) : [];
    
    // Remove sensitive information
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    res.json({
      success: true,
      count: safeUsers.length,
      users: safeUsers
    });
  } catch (error) {
    console.error('Error scanning users table:', error);
    res.status(500).json({
      success: false,
      message: 'Error scanning users table',
      error: error.message
    });
  }
});

/**
 * @route GET /debug/config
 * @desc Get configuration information
 * @access Public (for debugging only)
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    region: process.env.AWS_REGION,
    usersTable: USERS_TABLE,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;