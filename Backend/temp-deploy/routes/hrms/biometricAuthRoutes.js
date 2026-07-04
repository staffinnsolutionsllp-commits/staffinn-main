const express = require('express');
const router = express.Router();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COMPANIES_TABLE = 'staffinn-hrms-companies';

// Verify bridge software credentials
router.post('/verify', async (req, res) => {
  try {
    const { companyId, apiKey } = req.body;

    console.log('🔐 Bridge authentication attempt:', { companyId });

    if (!companyId || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Company ID and API key are required'
      });
    }

    // Get company from database
    const result = await docClient.send(new GetCommand({
      TableName: COMPANIES_TABLE,
      Key: { companyId }
    }));

    if (!result.Item) {
      console.log('❌ Invalid company ID:', companyId);
      return res.status(404).json({
        success: false,
        message: 'Invalid company ID'
      });
    }

    // Verify API key
    if (result.Item.apiKey !== apiKey) {
      console.log('❌ Invalid API key for company:', companyId);
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    // Check subscription status
    if (result.Item.subscription !== 'active') {
      console.log('❌ Inactive subscription for company:', companyId);
      return res.status(403).json({
        success: false,
        message: 'Company subscription is not active'
      });
    }

    console.log('✅ Bridge authenticated successfully:', companyId);

    res.json({
      success: true,
      message: 'Authentication successful',
      companyId: result.Item.companyId,
      companyName: result.Item.companyName,
      devices: result.Item.devices || []
    });

  } catch (error) {
    console.error('❌ Bridge authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
});

module.exports = router;
