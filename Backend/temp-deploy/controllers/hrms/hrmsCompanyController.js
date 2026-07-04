const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COMPANIES_TABLE = 'staffinn-hrms-companies';

// Generate secure API key
const generateApiKey = () => {
  return 'sk_live_' + crypto.randomBytes(32).toString('hex');
};

// Generate company ID
const generateCompanyId = () => {
  return 'COMP-' + crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Register new company
exports.registerCompany = async (req, res) => {
  try {
    const { companyName, adminEmail, adminPassword, adminName, recruiterId } = req.body;

    if (!companyName || !adminEmail || !adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Company name, admin email, and password are required'
      });
    }

    if (!recruiterId) {
      return res.status(400).json({
        success: false,
        message: 'Recruiter ID is required'
      });
    }

    // Check if email already registered
    const existingCompany = await docClient.send(new QueryCommand({
      TableName: COMPANIES_TABLE,
      IndexName: 'adminEmail-index',
      KeyConditionExpression: 'adminEmail = :email',
      ExpressionAttributeValues: {
        ':email': adminEmail
      }
    }));

    if (existingCompany.Items && existingCompany.Items.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Generate credentials
    const companyId = generateCompanyId();
    const apiKey = generateApiKey();
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const now = new Date().toISOString();
    const companyData = {
      companyId,
      recruiterId, // Link company to recruiter
      companyName,
      adminEmail,
      adminName: adminName || companyName,
      adminPassword: hashedPassword,
      apiKey,
      subscription: 'active',
      devices: [],
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: COMPANIES_TABLE,
      Item: companyData
    }));

    console.log(`✅ Company registered: ${companyName} (${companyId})`);

    res.status(201).json({
      success: true,
      message: 'Company registered successfully',
      data: {
        companyId,
        companyName,
        adminEmail,
        apiKey,
        message: 'Save your API key securely - it will not be shown again!'
      }
    });

  } catch (error) {
    console.error('Company registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register company',
      error: error.message
    });
  }
};

// Get company profile
exports.getCompanyProfile = async (req, res) => {
  try {
    const { companyId } = req.params;

    const result = await docClient.send(new GetCommand({
      TableName: COMPANIES_TABLE,
      Key: { companyId }
    }));

    if (!result.Item) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Remove sensitive data
    const { adminPassword, apiKey, ...companyData } = result.Item;

    res.json({
      success: true,
      data: {
        ...companyData,
        recruiterId: companyData.recruiterId || null,
        apiKeyPreview: apiKey ? `${apiKey.substring(0, 15)}...` : null
      }
    });

  } catch (error) {
    console.error('Get company profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get company profile',
      error: error.message
    });
  }
};

// Regenerate API key
exports.regenerateApiKey = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { adminPassword } = req.body;

    if (!adminPassword) {
      return res.status(400).json({
        success: false,
        message: 'Admin password required'
      });
    }

    // Get company
    const result = await docClient.send(new GetCommand({
      TableName: COMPANIES_TABLE,
      Key: { companyId }
    }));

    if (!result.Item) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(adminPassword, result.Item.adminPassword);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Generate new API key
    const newApiKey = generateApiKey();

    await docClient.send(new UpdateCommand({
      TableName: COMPANIES_TABLE,
      Key: { companyId },
      UpdateExpression: 'SET apiKey = :apiKey, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':apiKey': newApiKey,
        ':updatedAt': new Date().toISOString()
      }
    }));

    console.log(`✅ API key regenerated for company: ${companyId}`);

    res.json({
      success: true,
      message: 'API key regenerated successfully',
      data: {
        apiKey: newApiKey,
        message: 'Save your new API key securely - it will not be shown again!'
      }
    });

  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate API key',
      error: error.message
    });
  }
};

// Register device
exports.registerDevice = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { deviceId, deviceName, macAddress } = req.body;

    if (!deviceId || !deviceName) {
      return res.status(400).json({
        success: false,
        message: 'Device ID and name are required'
      });
    }

    // Use companyId as recruiterId for HRMS integration
    const recruiterId = companyId;

    // CRITICAL: Check if device is already registered to ANY company
    const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
    const allCompaniesResult = await docClient.send(new ScanCommand({
      TableName: COMPANIES_TABLE
    }));
    
    const allCompanies = allCompaniesResult.Items || [];
    const existingCompany = allCompanies.find(company => 
      company.devices && company.devices.some(d => d.deviceId === deviceId)
    );
    
    if (existingCompany && existingCompany.companyId !== companyId) {
      console.log(`⚠️ Device ${deviceId} already registered to company ${existingCompany.companyId}`);
      return res.status(400).json({
        success: false,
        message: `Device already registered to another company (${existingCompany.companyName}). Please unregister it first.`,
        existingCompany: {
          companyId: existingCompany.companyId,
          companyName: existingCompany.companyName
        }
      });
    }

    // Get company/recruiter data
    const result = await docClient.send(new GetCommand({
      TableName: COMPANIES_TABLE,
      Key: { companyId: recruiterId }
    }));

    if (!result.Item) {
      // If not found in companies table, create new entry for this recruiter
      const now = new Date().toISOString();
      const companyData = {
        companyId: recruiterId,
        companyName: `Recruiter ${recruiterId}`,
        devices: [],
        createdAt: now,
        updatedAt: now
      };
      
      await docClient.send(new PutCommand({
        TableName: COMPANIES_TABLE,
        Item: companyData
      }));
      
      console.log(`✅ Created company entry for recruiter: ${recruiterId}`);
    }

    const devices = result.Item?.devices || [];

    // Check if device already registered to THIS company
    if (devices.find(d => d.deviceId === deviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Device already registered to this company'
      });
    }

    // Add device
    const newDevice = {
      deviceId,
      deviceName,
      macAddress: macAddress || null,
      registeredAt: new Date().toISOString(),
      status: 'active'
    };

    devices.push(newDevice);

    await docClient.send(new UpdateCommand({
      TableName: COMPANIES_TABLE,
      Key: { companyId: recruiterId },
      UpdateExpression: 'SET devices = :devices, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':devices': devices,
        ':updatedAt': new Date().toISOString()
      }
    }));

    console.log(`✅ Device registered: ${deviceName} (${deviceId}) for recruiter ${recruiterId}`);

    res.json({
      success: true,
      message: 'Device registered successfully',
      data: newDevice
    });

  } catch (error) {
    console.error('Register device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register device',
      error: error.message
    });
  }
};

// Get devices
exports.getDevices = async (req, res) => {
  try {
    const { companyId } = req.params;

    const result = await docClient.send(new GetCommand({
      TableName: COMPANIES_TABLE,
      Key: { companyId }
    }));

    if (!result.Item) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: result.Item.devices || []
    });

  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get devices',
      error: error.message
    });
  }
};

// Validate company credentials (for bridge software)
exports.validateCredentials = async (req, res) => {
  try {
    const { companyId, apiKey } = req.body;

    if (!companyId || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Company ID and API key are required'
      });
    }

    const result = await docClient.send(new GetCommand({
      TableName: COMPANIES_TABLE,
      Key: { companyId }
    }));

    if (!result.Item) {
      return res.status(404).json({
        success: false,
        message: 'Invalid company ID'
      });
    }

    if (result.Item.apiKey !== apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    if (result.Item.subscription !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Company subscription is not active'
      });
    }

    res.json({
      success: true,
      message: 'Credentials validated successfully',
      data: {
        companyId: result.Item.companyId,
        companyName: result.Item.companyName,
        recruiterId: result.Item.recruiterId || null,
        devices: result.Item.devices || []
      }
    });

  } catch (error) {
    console.error('Validate credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate credentials',
      error: error.message
    });
  }
};

// Get companies by recruiterId
exports.getCompaniesByRecruiterId = async (req, res) => {
  try {
    const { recruiterId } = req.params;

    if (!recruiterId) {
      return res.status(400).json({
        success: false,
        message: 'Recruiter ID is required'
      });
    }

    const result = await docClient.send(new QueryCommand({
      TableName: COMPANIES_TABLE,
      IndexName: 'recruiterId-index',
      KeyConditionExpression: 'recruiterId = :recruiterId',
      ExpressionAttributeValues: {
        ':recruiterId': recruiterId
      }
    }));

    const companies = (result.Items || []).map(company => {
      const { adminPassword, apiKey, ...companyData } = company;
      return {
        ...companyData,
        apiKeyPreview: apiKey ? `${apiKey.substring(0, 15)}...` : null
      };
    });

    res.json({
      success: true,
      data: companies,
      count: companies.length
    });

  } catch (error) {
    console.error('Get companies by recruiterId error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get companies',
      error: error.message
    });
  }
};

// Unregister device from company
exports.unregisterDevice = async (req, res) => {
  try {
    const { companyId, deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Device ID is required'
      });
    }

    // Get company
    const result = await docClient.send(new GetCommand({
      TableName: COMPANIES_TABLE,
      Key: { companyId }
    }));

    if (!result.Item) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const devices = result.Item.devices || [];
    const deviceExists = devices.find(d => d.deviceId === deviceId);

    if (!deviceExists) {
      return res.status(404).json({
        success: false,
        message: 'Device not registered to this company'
      });
    }

    // Remove device
    const updatedDevices = devices.filter(d => d.deviceId !== deviceId);

    await docClient.send(new UpdateCommand({
      TableName: COMPANIES_TABLE,
      Key: { companyId },
      UpdateExpression: 'SET devices = :devices, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':devices': updatedDevices,
        ':updatedAt': new Date().toISOString()
      }
    }));

    console.log(`✅ Device unregistered: ${deviceId} from company ${companyId}`);

    res.json({
      success: true,
      message: 'Device unregistered successfully',
      data: {
        deviceId,
        companyId
      }
    });

  } catch (error) {
    console.error('Unregister device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unregister device',
      error: error.message
    });
  }
};
