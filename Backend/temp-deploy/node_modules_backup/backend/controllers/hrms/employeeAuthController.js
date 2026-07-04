const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.userId,
      employeeId: user.employeeId,
      email: user.email,
      roleId: user.roleId,
      companyId: user.companyId
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Employee Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user by email
    const result = await docClient.send(new QueryCommand({
      TableName: 'staffinn-hrms-employee-users',
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email }
    }));

    if (!result.Items || result.Items.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.Items[0];

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    await docClient.send(new UpdateCommand({
      TableName: 'staffinn-hrms-employee-users',
      Key: { userId: user.userId },
      UpdateExpression: 'SET lastLogin = :now',
      ExpressionAttributeValues: { ':now': new Date().toISOString() }
    }));

    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: userWithoutPassword, token }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Change Password (First Login)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const result = await docClient.send(new GetCommand({
      TableName: 'staffinn-hrms-employee-users',
      Key: { userId }
    }));

    if (!result.Item) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, result.Item.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await docClient.send(new UpdateCommand({
      TableName: 'staffinn-hrms-employee-users',
      Key: { userId },
      UpdateExpression: 'SET password = :pwd, isFirstLogin = :false',
      ExpressionAttributeValues: {
        ':pwd': hashedPassword,
        ':false': false
      }
    }));

    res.json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get Employee Profile
const getProfile = async (req, res) => {
  try {
    const { employeeId, companyId } = req.user;

    console.log('🔍 getProfile called for employeeId:', employeeId);

    // Get employee details
    const empResult = await docClient.send(new GetCommand({
      TableName: 'staffinn-hrms-employees',
      Key: { employeeId }
    }));

    console.log('📋 Employee found:', empResult.Item ? empResult.Item.fullName : 'Not found');

    if (!empResult.Item) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const employee = empResult.Item;
    const { password: _, ...userWithoutPassword } = req.user;
    
    // Return complete user profile with all employee details
    const enrichedUser = {
      ...userWithoutPassword,
      recruiterId: employee.recruiterId || companyId,
      employee: {
        employeeId: employee.employeeId,
        fullName: employee.fullName || employee.name,
        email: employee.email,
        designation: employee.designation,
        department: employee.department,
        dateOfBirth: employee.dateOfBirth,
        bloodGroup: employee.bloodGroup,
        phone: employee.phone,
        currentAddress: employee.currentAddress,
        permanentAddress: employee.permanentAddress,
        dateOfJoining: employee.dateOfJoining,
        employmentType: employee.employmentType,
        emergencyContactName: employee.emergencyContactName,
        emergencyContactNumber: employee.emergencyContactNumber,
        emergencyContactRelation: employee.emergencyContactRelation,
        gender: employee.gender,
        maritalStatus: employee.maritalStatus,
        nationality: employee.nationality,
        aadharNumber: employee.aadharNumber,
        panNumber: employee.panNumber,
        bankAccountNumber: employee.bankAccountNumber,
        bankName: employee.bankName,
        ifscCode: employee.ifscCode
      }
    };

    console.log('📤 Returning complete profile with all employee details');
    
    res.json({
      success: true,
      data: enrichedUser
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  login,
  changePassword,
  getProfile
};
