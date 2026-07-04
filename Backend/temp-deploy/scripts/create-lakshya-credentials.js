const bcrypt = require('bcryptjs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const createCredentials = async () => {
  try {
    const employeeId = '1005';
    const email = 'sharma.it26@jecrc.ac.in';

    console.log('\n🔍 Finding employee...\n');

    // Find employee
    const empResult = await docClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-employees',
      FilterExpression: 'employeeId = :eid',
      ExpressionAttributeValues: { ':eid': employeeId }
    }));

    if (!empResult.Items || empResult.Items.length === 0) {
      console.log('❌ Employee not found!');
      return;
    }

    const employee = empResult.Items[0];
    console.log('✅ Employee found:');
    console.log(`   Name: ${employee.fullName}`);
    console.log(`   Employee ID: ${employee.employeeId}`);
    console.log(`   Email: ${employee.email}`);
    console.log(`   Recruiter: ${employee.recruiterId}`);
    console.log(`   Department: ${employee.department}\n`);

    // Generate credentials
    const tempPassword = `Emp@${employeeId}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const userId = `USER_${employeeId}_${Date.now()}`;

    const employeeUser = {
      userId,
      employeeId: employee.employeeId,
      email: employee.email,
      password: hashedPassword,
      roleId: 'ROLE_EMPLOYEE',
      companyId: employee.recruiterId,
      isFirstLogin: true,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    await docClient.send(new PutCommand({
      TableName: 'staffinn-hrms-employee-users',
      Item: employeeUser
    }));

    console.log('✅ Employee Portal Credentials Created!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    ' + employee.email);
    console.log('🔑 Password: ' + tempPassword);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🌐 Login URL: http://localhost:5177\n');
    console.log('⚠️  First login will require password change\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

createCredentials();
