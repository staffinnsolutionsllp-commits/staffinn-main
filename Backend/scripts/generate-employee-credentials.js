const bcrypt = require('bcryptjs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const generateCredentialsForExisting = async () => {
  try {
    console.log('\n🔍 Finding existing employees...\n');

    // Get all employees
    const empResult = await docClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-employees',
      FilterExpression: 'attribute_not_exists(isDeleted) OR isDeleted = :false',
      ExpressionAttributeValues: { ':false': false }
    }));

    const employees = empResult.Items || [];
    console.log(`Found ${employees.length} employees\n`);

    // Group by recruiter
    const byRecruiter = {};
    employees.forEach(emp => {
      const rid = emp.recruiterId || 'NO_RECRUITER';
      if (!byRecruiter[rid]) byRecruiter[rid] = [];
      byRecruiter[rid].push(emp);
    });

    // Show all recruiters
    console.log('📋 Employees by Recruiter:\n');
    for (const [recruiterId, emps] of Object.entries(byRecruiter)) {
      console.log(`\n🏢 Recruiter: ${recruiterId}`);
      console.log(`   Total Employees: ${emps.length}\n`);
      
      for (const emp of emps) {
        console.log(`   👤 ${emp.fullName}`);
        console.log(`      Employee ID: ${emp.employeeId}`);
        console.log(`      Email: ${emp.email}`);
        console.log(`      Department: ${emp.department}`);
        
        // Check if user already exists
        const userResult = await docClient.send(new QueryCommand({
          TableName: 'staffinn-hrms-employee-users',
          IndexName: 'email-index',
          KeyConditionExpression: 'email = :email',
          ExpressionAttributeValues: { ':email': emp.email }
        }));

        if (userResult.Items && userResult.Items.length > 0) {
          console.log(`      ✅ Login already exists`);
          console.log(`      📧 Email: ${emp.email}`);
          console.log(`      🔑 Password: Emp@${emp.employeeId}`);
        } else {
          console.log(`      ❌ No login credentials yet`);
          console.log(`      Creating credentials...`);
          
          // Generate credentials
          const tempPassword = `Emp@${emp.employeeId}`;
          const hashedPassword = await bcrypt.hash(tempPassword, 10);
          const userId = `USER_${emp.employeeId}_${Date.now()}`;

          const employeeUser = {
            userId,
            employeeId: emp.employeeId,
            email: emp.email,
            password: hashedPassword,
            roleId: 'ROLE_EMPLOYEE',
            companyId: emp.recruiterId,
            isFirstLogin: true,
            isActive: true,
            createdAt: new Date().toISOString()
          };

          await docClient.send(new PutCommand({
            TableName: 'staffinn-hrms-employee-users',
            Item: employeeUser
          }));

          console.log(`      ✅ Credentials created!`);
          console.log(`      📧 Email: ${emp.email}`);
          console.log(`      🔑 Password: ${tempPassword}`);
        }
        console.log('');
      }
    }

    console.log('\n✅ All done!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
};

generateCredentialsForExisting();
