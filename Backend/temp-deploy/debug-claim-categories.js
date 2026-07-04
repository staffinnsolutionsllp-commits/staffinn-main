const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function debugClaimCategories() {
  console.log('=== DEBUGGING CLAIM CATEGORIES ===\n');

  try {
    // 1. Get all claim categories
    console.log('1. Fetching all claim categories...');
    const categoriesResult = await docClient.send(new ScanCommand({
      TableName: 'HRMS-Claim-Management',
      FilterExpression: 'entityType = :type',
      ExpressionAttributeValues: { ':type': 'CATEGORY' }
    }));

    const categories = categoriesResult.Items || [];
    console.log(`Found ${categories.length} categories:\n`);
    categories.forEach(cat => {
      console.log(`  - Category: ${cat.name}`);
      console.log(`    ID: ${cat.categoryId}`);
      console.log(`    Recruiter ID: ${cat.recruiterId}`);
      console.log('');
    });

    // 2. Get all employee users
    console.log('\n2. Fetching all employee users...');
    const employeesResult = await docClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-employee-users'
    }));

    const employees = employeesResult.Items || [];
    console.log(`Found ${employees.length} employee users:\n`);
    employees.forEach(emp => {
      console.log(`  - Email: ${emp.email}`);
      console.log(`    Employee ID: ${emp.employeeId}`);
      console.log(`    Company ID: ${emp.companyId}`);
      console.log(`    Active: ${emp.isActive}`);
      console.log('');
    });

    // 3. Check for matches
    console.log('\n3. Checking for matches...\n');
    employees.forEach(emp => {
      const matchingCategories = categories.filter(cat => cat.recruiterId === emp.companyId);
      console.log(`Employee ${emp.email} (companyId: ${emp.companyId}):`);
      console.log(`  Should see ${matchingCategories.length} categories`);
      if (matchingCategories.length > 0) {
        matchingCategories.forEach(cat => {
          console.log(`    - ${cat.name}`);
        });
      }
      console.log('');
    });

    // 4. Get all employees from main table
    console.log('\n4. Fetching employees from main table...');
    const mainEmployeesResult = await docClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-employees'
    }));

    const mainEmployees = mainEmployeesResult.Items || [];
    console.log(`Found ${mainEmployees.length} employees in main table:\n`);
    
    const recruiterGroups = {};
    mainEmployees.forEach(emp => {
      if (!recruiterGroups[emp.recruiterId]) {
        recruiterGroups[emp.recruiterId] = [];
      }
      recruiterGroups[emp.recruiterId].push(emp);
    });

    Object.keys(recruiterGroups).forEach(recruiterId => {
      console.log(`Recruiter ID: ${recruiterId}`);
      console.log(`  Employees: ${recruiterGroups[recruiterId].length}`);
      const matchingCategories = categories.filter(cat => cat.recruiterId === recruiterId);
      console.log(`  Categories: ${matchingCategories.length}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

debugClaimCategories();
