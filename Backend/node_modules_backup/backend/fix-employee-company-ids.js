const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function fixEmployeeCompanyIds() {
  console.log('=== FIXING EMPLOYEE COMPANY IDs ===\n');

  try {
    // 1. Get all employees from main table
    console.log('1. Fetching employees from main table...');
    const mainEmployeesResult = await docClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-employees',
      FilterExpression: 'attribute_not_exists(isDeleted) OR isDeleted = :false',
      ExpressionAttributeValues: { ':false': false }
    }));

    const mainEmployees = mainEmployeesResult.Items || [];
    console.log(`Found ${mainEmployees.length} active employees\n`);

    // Create a map of employeeId -> recruiterId
    const employeeRecruiterId = {};
    mainEmployees.forEach(emp => {
      employeeRecruiterId[emp.employeeId] = emp.recruiterId;
    });

    // 2. Get all employee users
    console.log('2. Fetching employee users...');
    const employeeUsersResult = await docClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-employee-users'
    }));

    const employeeUsers = employeeUsersResult.Items || [];
    console.log(`Found ${employeeUsers.length} employee users\n`);

    // 3. Check and fix mismatches
    console.log('3. Checking for mismatches...\n');
    let fixedCount = 0;
    let alreadyCorrect = 0;
    let notFoundCount = 0;

    for (const empUser of employeeUsers) {
      const correctRecruiterId = employeeRecruiterId[empUser.employeeId];
      
      if (!correctRecruiterId) {
        console.log(`⚠️  Employee user ${empUser.email} (${empUser.employeeId}) not found in main table`);
        notFoundCount++;
        continue;
      }

      if (empUser.companyId !== correctRecruiterId) {
        console.log(`🔧 Fixing employee user: ${empUser.email}`);
        console.log(`   Current companyId: ${empUser.companyId}`);
        console.log(`   Correct companyId: ${correctRecruiterId}`);

        // Update the employee user
        const updatedUser = {
          ...empUser,
          companyId: correctRecruiterId
        };

        await docClient.send(new PutCommand({
          TableName: 'staffinn-hrms-employee-users',
          Item: updatedUser
        }));

        console.log(`   ✅ Fixed!\n`);
        fixedCount++;
      } else {
        console.log(`✅ Employee user ${empUser.email} already has correct companyId: ${empUser.companyId}`);
        alreadyCorrect++;
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total employee users: ${employeeUsers.length}`);
    console.log(`Already correct: ${alreadyCorrect}`);
    console.log(`Fixed: ${fixedCount}`);
    console.log(`Not found in main table: ${notFoundCount}`);
    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixEmployeeCompanyIds();
