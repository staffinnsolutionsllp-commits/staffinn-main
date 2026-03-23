/**
 * HRMS Access Control Middleware
 * Prevents direct access to HRMS - only allows access through Staffinn recruiter dashboard
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Store active HRMS access tokens with expiry (in-memory for now, can be moved to Redis for production)
const activeAccessTokens = new Map();

// Cleanup expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of activeAccessTokens.entries()) {
    if (data.expiresAt < now) {
      activeAccessTokens.delete(token);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate a secure one-time access token for HRMS
 * This token is only valid for 5 minutes and can only be used once
 */
const generateHRMSAccessToken = (recruiterId, userEmail) => {
  const accessToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes from now
  
  activeAccessTokens.set(accessToken, {
    recruiterId,
    userEmail,
    expiresAt,
    used: false,
    createdAt: Date.now()
  });
  
  console.log('🔐 Generated HRMS access token:', {
    recruiterId,
    userEmail,
    expiresAt: new Date(expiresAt).toISOString(),
    totalActiveTokens: activeAccessTokens.size
  });
  
  return accessToken;
};

/**
 * Validate and consume HRMS access token
 * Token can only be used once and expires after 5 minutes
 */
const validateHRMSAccessToken = (accessToken) => {
  const tokenData = activeAccessTokens.get(accessToken);
  
  if (!tokenData) {
    console.log('❌ Invalid or expired HRMS access token');
    return null;
  }
  
  if (tokenData.used) {
    console.log('❌ HRMS access token already used');
    activeAccessTokens.delete(accessToken);
    return null;
  }
  
  if (tokenData.expiresAt < Date.now()) {
    console.log('❌ HRMS access token expired');
    activeAccessTokens.delete(accessToken);
    return null;
  }
  
  // Mark token as used
  tokenData.used = true;
  
  console.log('✅ HRMS access token validated:', {
    recruiterId: tokenData.recruiterId,
    userEmail: tokenData.userEmail
  });
  
  return tokenData;
};

/**
 * Middleware to validate HRMS access
 * Checks for valid access token from Staffinn dashboard
 */
const validateHRMSAccess = (req, res, next) => {
  // Allow access to login and registration endpoints
  if (req.path === '/login' || req.path === '/register' || req.path.startsWith('/check-recruiter')) {
    return next();
  }
  
  // Check for HRMS access token in query params or headers
  const accessToken = req.query.hrmsAccessToken || req.headers['x-hrms-access-token'];
  
  if (!accessToken) {
    console.log('❌ No HRMS access token provided');
    return res.status(403).json({
      success: false,
      message: 'Direct access to HRMS is not allowed. Please access through Staffinn recruiter dashboard.',
      code: 'DIRECT_ACCESS_FORBIDDEN'
    });
  }
  
  const tokenData = validateHRMSAccessToken(accessToken);
  
  if (!tokenData) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired access token. Please access HRMS through Staffinn recruiter dashboard.',
      code: 'INVALID_ACCESS_TOKEN'
    });
  }
  
  // Store recruiter info in request for later use
  req.hrmsAccess = {
    recruiterId: tokenData.recruiterId,
    userEmail: tokenData.userEmail,
    accessGrantedAt: tokenData.createdAt
  };
  
  next();
};

/**
 * Enhanced HRMS authentication that also checks for valid session
 */
const authenticateHRMSWithSession = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required',
      code: 'NO_AUTH_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify that the user has a valid recruiterId
    if (!decoded.recruiterId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid HRMS session. Please login through Staffinn.',
        code: 'INVALID_HRMS_SESSION'
      });
    }
    
    // Get user from database
    const { dynamoClient, isUsingMockDB, mockDB, HRMS_USERS_TABLE } = require('../config/dynamodb-wrapper');
    const { GetCommand } = require('@aws-sdk/lib-dynamodb');
    
    let user;
    if (isUsingMockDB()) {
      user = mockDB().get(HRMS_USERS_TABLE, decoded.userId);
    } else {
      const command = new GetCommand({
        TableName: HRMS_USERS_TABLE,
        Key: { userId: decoded.userId }
      });
      const result = await dynamoClient.send(command);
      user = result.Item;
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid session',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Verify recruiterId matches
    if (user.recruiterId !== decoded.recruiterId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Session mismatch. Please login again.',
        code: 'SESSION_MISMATCH'
      });
    }

    // Add user and recruiter info to request
    req.user = user;
    req.recruiterId = decoded.recruiterId;
    
    console.log('🔐 HRMS session validated:', { 
      userId: user.userId, 
      recruiterId: user.recruiterId,
      email: user.email
    });

    next();
  } catch (error) {
    console.error('❌ HRMS authentication error:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired session',
      code: 'INVALID_SESSION'
    });
  }
};

/**
 * Check if recruiter already has HRMS account
 */
const checkExistingHRMSAccount = async (recruiterId) => {
  const { dynamoClient, isUsingMockDB, mockDB, HRMS_USERS_TABLE } = require('../config/dynamodb-wrapper');
  const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
  
  try {
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
    
    return existingUser;
  } catch (error) {
    console.error('Error checking existing HRMS account:', error);
    return null;
  }
};

module.exports = {
  generateHRMSAccessToken,
  validateHRMSAccessToken,
  validateHRMSAccess,
  authenticateHRMSWithSession,
  checkExistingHRMSAccount
};
