const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function createTestEmployee() {
  const recruiterId = 'test-recruiter-001'; // Apna recruiter ID dalo
  const employeeId = 'EMP-TEST-001';
  const email = 'test.employee@company.com';
  const password = 'Test@123';

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create employee user
  const employeeUser = {
    userId: employeeId,
    employeeId: employeeId,
    companyId: recruiterId,
    email: email,
    password: hashedPassword,
    name: 'Test Employee',
    roleId: 'employee-role',
    isActive: true,
    createdAt: new Date().toISOString()
  };

  try {
    await docClient.send(new PutCommand({
      TableName: 'staffinn-hrms-employee-users',
      Item: employeeUser
    }));

    console.log('✅ Employee user created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('🆔 Employee ID:', employeeId);
    console.log('🏢 Recruiter ID:', recruiterId);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestEmployee();
