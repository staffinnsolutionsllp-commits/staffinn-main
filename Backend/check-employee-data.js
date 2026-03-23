const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config();

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function checkEmployeeData() {
  try {
    console.log('🔍 Checking employee data in DynamoDB...\n');

    // Get all employees
    const result = await docClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-employees'
    }));

    const employees = result.Items || [];
    console.log(`📊 Total employees found: ${employees.length}\n`);

    if (employees.length === 0) {
      console.log('❌ No employees found in the database!');
      return;
    }

    // Display each employee's data
    employees.forEach((emp, index) => {
      console.log(`\n========== Employee ${index + 1} ==========`);
      console.log('Employee ID:', emp.employeeId);
      console.log('Full Name:', emp.fullName || emp.name || 'NOT SET');
      console.log('Email:', emp.email || 'NOT SET');
      console.log('Designation:', emp.designation || 'NOT SET');
      console.log('Department:', emp.department || 'NOT SET');
      console.log('Date of Birth:', emp.dateOfBirth || 'NOT SET');
      console.log('Blood Group:', emp.bloodGroup || 'NOT SET');
      console.log('Phone:', emp.phone || 'NOT SET');
      console.log('Current Address:', emp.currentAddress || 'NOT SET');
      console.log('Date of Joining:', emp.dateOfJoining || 'NOT SET');
      console.log('Employment Type:', emp.employmentType || 'NOT SET');
      console.log('Emergency Contact Name:', emp.emergencyContactName || 'NOT SET');
      console.log('Emergency Contact Number:', emp.emergencyContactNumber || 'NOT SET');
      console.log('Emergency Contact Relation:', emp.emergencyContactRelation || 'NOT SET');
      console.log('Recruiter ID:', emp.recruiterId || 'NOT SET');
      console.log('=====================================');
    });

    // Check for missing data
    console.log('\n\n📋 Data Completeness Report:');
    employees.forEach((emp, index) => {
      const missingFields = [];
      if (!emp.fullName && !emp.name) missingFields.push('Full Name');
      if (!emp.email) missingFields.push('Email');
      if (!emp.designation) missingFields.push('Designation');
      if (!emp.department) missingFields.push('Department');
      if (!emp.dateOfBirth) missingFields.push('Date of Birth');
      if (!emp.bloodGroup) missingFields.push('Blood Group');
      if (!emp.phone) missingFields.push('Phone');
      if (!emp.currentAddress) missingFields.push('Current Address');
      if (!emp.dateOfJoining) missingFields.push('Date of Joining');
      if (!emp.employmentType) missingFields.push('Employment Type');

      if (missingFields.length > 0) {
        console.log(`\n⚠️  Employee ${index + 1} (${emp.employeeId}) - Missing fields:`);
        missingFields.forEach(field => console.log(`   - ${field}`));
      } else {
        console.log(`\n✅ Employee ${index + 1} (${emp.employeeId}) - All basic fields present`);
      }
    });

  } catch (error) {
    console.error('❌ Error checking employee data:', error);
  }
}

checkEmployeeData();
