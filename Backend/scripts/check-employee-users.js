const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const checkEmployeeUsers = async () => {
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: 'staffinn-hrms-employee-users'
    }));

    console.log('\n📋 Employee Users:');
    console.log('Total:', result.Items?.length || 0);
    
    if (result.Items && result.Items.length > 0) {
      result.Items.forEach(user => {
        console.log('\n---');
        console.log('Email:', user.email);
        console.log('Employee ID:', user.employeeId);
        console.log('Role:', user.roleId);
        console.log('First Login:', user.isFirstLogin);
        console.log('Active:', user.isActive);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

checkEmployeeUsers();
