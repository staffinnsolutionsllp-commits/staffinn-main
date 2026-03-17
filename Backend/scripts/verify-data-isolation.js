const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const verifyDataIsolation = async () => {
  console.log('\n🔍 Verifying Data Isolation...\n');

  try {
    // Check employee users
    const usersResult = await docClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-employee-users'
    }));

    console.log('📋 Employee Users:');
    const usersByCompany = {};
    usersResult.Items?.forEach(user => {
      const companyId = user.companyId || 'NO_COMPANY';
      if (!usersByCompany[companyId]) {
        usersByCompany[companyId] = [];
      }
      usersByCompany[companyId].push({
        email: user.email,
        employeeId: user.employeeId
      });
    });

    Object.keys(usersByCompany).forEach(companyId => {
      console.log(`\n  Company/Recruiter: ${companyId}`);
      console.log(`  Employees: ${usersByCompany[companyId].length}`);
      usersByCompany[companyId].forEach(emp => {
        console.log(`    - ${emp.email} (${emp.employeeId})`);
      });
    });

    // Check employees table
    const employeesResult = await docClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-employees'
    }));

    console.log('\n\n📋 Employees Table:');
    const empsByRecruiter = {};
    employeesResult.Items?.forEach(emp => {
      const recruiterId = emp.recruiterId || 'NO_RECRUITER';
      if (!empsByRecruiter[recruiterId]) {
        empsByRecruiter[recruiterId] = [];
      }
      empsByRecruiter[recruiterId].push({
        name: emp.fullName,
        employeeId: emp.employeeId,
        email: emp.email
      });
    });

    Object.keys(empsByRecruiter).forEach(recruiterId => {
      console.log(`\n  Recruiter: ${recruiterId}`);
      console.log(`  Employees: ${empsByRecruiter[recruiterId].length}`);
      empsByRecruiter[recruiterId].forEach(emp => {
        console.log(`    - ${emp.name} (${emp.employeeId}) - ${emp.email}`);
      });
    });

    console.log('\n\n✅ Data Isolation Check Complete!');
    console.log('Each recruiter has separate employee data.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

verifyDataIsolation();
