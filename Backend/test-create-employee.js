const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcryptjs');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function createTestEmployee() {
  // SECURITY FIX (CWE-798, CWE-259): Use environment variables instead of hardcoded credentials
  const recruiterId = process.env.TEST_RECRUITER_ID || 'test-recruiter-001';
  const employeeId = process.env.TEST_EMPLOYEE_ID || 'EMP-TEST-001';
  const email = process.env.TEST_EMPLOYEE_EMAIL || 'test.employee@company.com';
  const password = process.env.TEST_EMPLOYEE_PASSWORD;
  const employeeName = process.env.TEST_EMPLOYEE_NAME || 'Test Employee';

  if (!password) {
    console.error('❌ TEST_EMPLOYEE_PASSWORD environment variable not set');
    console.log('\n💡 To run this test:');
    console.log('   export TEST_EMPLOYEE_PASSWORD="your-secure-password"');
    console.log('   export TEST_EMPLOYEE_EMAIL="employee@company.com"  # Optional');
    console.log('   export TEST_EMPLOYEE_ID="EMP-001"  # Optional');
    console.log('   export TEST_EMPLOYEE_NAME="Employee Name"  # Optional');
    console.log('   export TEST_RECRUITER_ID="recruiter-id"  # Optional');
    console.log('\n   Then run: node test-create-employee.js\n');
    process.exit(1);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create employee user
  const employeeUser = {
    userId: employeeId,
    employeeId: employeeId,
    companyId: recruiterId,
    email: email,
    password: hashedPassword,
    name: employeeName,
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
