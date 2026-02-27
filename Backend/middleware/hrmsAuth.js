const jwt = require('jsonwebtoken');
const { dynamoClient, isUsingMockDB, mockDB, HRMS_USERS_TABLE } = require('../config/dynamodb-wrapper');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Add companyId and recruiterId from token OR database to user object
    if (decoded.companyId) {
      user.companyId = decoded.companyId;
    }
    if (decoded.recruiterId) {
      user.recruiterId = decoded.recruiterId;
    }
    // Fallback: if not in token, use from database
    if (!user.recruiterId && user.recruiterId) {
      user.recruiterId = user.recruiterId;
    }

    console.log('🔐 Auth middleware - User:', { userId: user.userId, recruiterId: user.recruiterId, companyId: user.companyId });

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};