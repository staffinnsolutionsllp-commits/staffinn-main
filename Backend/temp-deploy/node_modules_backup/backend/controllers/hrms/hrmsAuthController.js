const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dynamoClient, isUsingMockDB, mockDB, HRMS_USERS_TABLE } = require('../../config/dynamodb-wrapper');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { PutCommand, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { generateId, getCurrentTimestamp, validateEmail, handleError, successResponse, errorResponse } = require('../../utils/hrmsHelpers');

const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.userId, 
      email: user.email, 
      role: user.role,
      companyId: user.companyId || null,
      recruiterId: user.recruiterId || null
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const register = async (req, res) => {
  try {
    const { name, email, password, role = 'admin', recruiterId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json(errorResponse('Name, email, and password are required'));
    }

    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID is required for HRMS registration'));
    }

    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse('Invalid email format'));
    }

    // Check if this recruiter has already registered in HRMS
    let existingRecruiterUser;
    if (isUsingMockDB()) {
      const users = mockDB().scan(HRMS_USERS_TABLE);
      existingRecruiterUser = users.find(u => u.recruiterId === recruiterId);
    } else {
      const command = new ScanCommand({
        TableName: HRMS_USERS_TABLE,
        FilterExpression: 'recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(command);
      existingRecruiterUser = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (existingRecruiterUser) {
      return res.status(400).json(errorResponse('This recruiter has already registered in HRMS. Please sign in instead.'));
    }

    // Check if email already exists
    let existingEmailUser;
    if (isUsingMockDB()) {
      const users = mockDB().scan(HRMS_USERS_TABLE);
      existingEmailUser = users.find(u => u.email === email);
    } else {
      const command = new ScanCommand({
        TableName: HRMS_USERS_TABLE,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email }
      });
      const result = await dynamoClient.send(command);
      existingEmailUser = result.Items && result.Items.length > 0;
    }

    if (existingEmailUser) {
      return res.status(400).json(errorResponse('User with this email already exists'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = generateId();

    const user = {
      userId,
      recruiterId,
      name,
      email,
      role,
      password: hashedPassword,
      createdAt: getCurrentTimestamp(),
      isActive: true
    };

    if (isUsingMockDB()) {
      mockDB().put(HRMS_USERS_TABLE, user);
    } else {
      const command = new PutCommand({
        TableName: HRMS_USERS_TABLE,
        Item: user
      });
      await dynamoClient.send(command);
    }

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json(successResponse({
      user: userWithoutPassword,
      token
    }, 'User registered successfully'));

  } catch (error) {
    handleError(error, res);
  }
};

const login = async (req, res) => {
  try {
    const { email, password, recruiterId } = req.body;

    if (!email || !password) {
      return res.status(400).json(errorResponse('Email and password are required'));
    }

    let user;
    if (isUsingMockDB()) {
      const users = mockDB().scan(HRMS_USERS_TABLE);
      user = users.find(u => u.email === email);
    } else {
      const command = new ScanCommand({
        TableName: HRMS_USERS_TABLE,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email }
      });
      const result = await dynamoClient.send(command);
      user = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (!user) {
      return res.status(401).json(errorResponse('Invalid credentials'));
    }

    if (!user.isActive) {
      return res.status(401).json(errorResponse('Account is deactivated'));
    }

    // If recruiterId is provided, verify it matches
    if (recruiterId && user.recruiterId && user.recruiterId !== recruiterId) {
      return res.status(401).json(errorResponse('Invalid credentials for this recruiter'));
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json(errorResponse('Invalid credentials'));
    }

    // Fetch company details if user is admin
    if (user.role === 'admin' && user.email) {
      try {
        const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
        
        const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
        const docClient = DynamoDBDocumentClient.from(client);
        const COMPANIES_TABLE = 'staffinn-hrms-companies';
        
        const result = await docClient.send(new QueryCommand({
          TableName: COMPANIES_TABLE,
          IndexName: 'adminEmail-index',
          KeyConditionExpression: 'adminEmail = :email',
          ExpressionAttributeValues: {
            ':email': user.email
          }
        }));
        
        if (result.Items && result.Items.length > 0) {
          const company = result.Items[0];
          user.companyId = company.companyId;
          user.companyName = company.companyName;
          user.apiKey = company.apiKey;
          console.log('✅ Company details loaded for login:', { companyId: user.companyId, companyName: user.companyName });
        } else {
          console.log('⚠️ No company found for admin email:', user.email);
        }
      } catch (companyError) {
        console.error('❌ Error fetching company details:', companyError);
      }
    }

    const token = generateToken(user);
    console.log('🔑 Generated token with companyId:', user.companyId);
    const { password: _, ...userWithoutPassword } = user;

    res.json(successResponse({
      user: userWithoutPassword,
      token
    }, 'Login successful'));

  } catch (error) {
    handleError(error, res);
  }
};

const getProfile = async (req, res) => {
  try {
    const { password: _, ...userWithoutPassword } = req.user;
    
    // Fetch company details if user is admin
    if (userWithoutPassword.role === 'admin' && userWithoutPassword.email) {
      try {
        const { QueryCommand } = require('@aws-sdk/lib-dynamodb');
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
        
        const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
        const docClient = DynamoDBDocumentClient.from(client);
        const COMPANIES_TABLE = 'staffinn-hrms-companies';
        
        const result = await docClient.send(new QueryCommand({
          TableName: COMPANIES_TABLE,
          IndexName: 'adminEmail-index',
          KeyConditionExpression: 'adminEmail = :email',
          ExpressionAttributeValues: {
            ':email': userWithoutPassword.email
          }
        }));
        
        if (result.Items && result.Items.length > 0) {
          const company = result.Items[0];
          userWithoutPassword.companyId = company.companyId;
          userWithoutPassword.companyName = company.companyName;
          userWithoutPassword.apiKey = company.apiKey; // Add API key
        }
      } catch (companyError) {
        console.error('Error fetching company details:', companyError);
        // Continue without company details
      }
    }
    
    res.json(successResponse(userWithoutPassword));
  } catch (error) {
    handleError(error, res);
  }
};

const checkRecruiterRegistration = async (req, res) => {
  try {
    const { recruiterId } = req.params;

    if (!recruiterId) {
      return res.status(400).json(errorResponse('Recruiter ID is required'));
    }

    let existingUser;
    if (isUsingMockDB()) {
      const users = mockDB().scan(HRMS_USERS_TABLE);
      existingUser = users.find(u => u.recruiterId === recruiterId);
    } else {
      const command = new ScanCommand({
        TableName: HRMS_USERS_TABLE,
        FilterExpression: 'recruiterId = :recruiterId',
        ExpressionAttributeValues: { ':recruiterId': recruiterId }
      });
      const result = await dynamoClient.send(command);
      existingUser = result.Items && result.Items.length > 0 ? result.Items[0] : null;
    }

    if (existingUser) {
      const { password: _, ...userWithoutPassword } = existingUser;
      return res.json(successResponse({
        isRegistered: true,
        user: userWithoutPassword
      }, 'Recruiter is already registered'));
    }

    res.json(successResponse({
      isRegistered: false
    }, 'Recruiter is not registered'));

  } catch (error) {
    handleError(error, res);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  checkRecruiterRegistration
};