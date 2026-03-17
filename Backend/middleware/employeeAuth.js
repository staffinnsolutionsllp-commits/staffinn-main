const jwt = require('jsonwebtoken');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const authenticateEmployee = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await docClient.send(new GetCommand({
      TableName: 'staffinn-hrms-employee-users',
      Key: { userId: decoded.userId }
    }));
    
    if (!result.Item || !result.Item.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    req.user = result.Item;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
};

const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: 'staffinn-hrms-roles',
        Key: { roleId: req.user.roleId }
      }));

      if (!result.Item || !result.Item.permissions.includes(permission)) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  };
};

module.exports = {
  authenticateEmployee,
  checkPermission
};
