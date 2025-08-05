const { DynamoDBClient, PutItemCommand, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function testStudentTable() {
  try {
    console.log('Testing student table connection...');
    
    // Test adding a student
    const testStudent = {
      instituteStudntsID: 'test-123',
      instituteId: 'test-institute',
      fullName: 'Test Student',
      email: 'test@example.com',
      phoneNumber: '1234567890',
      placementStatus: 'Not Placed',
      createdAt: new Date().toISOString()
    };
    
    const putCommand = new PutItemCommand({
      TableName: 'staffinn-institute-students',
      Item: marshall(testStudent)
    });
    
    await dynamoClient.send(putCommand);
    console.log('✅ Test student added successfully');
    
    // Test reading students
    const scanCommand = new ScanCommand({
      TableName: 'staffinn-institute-students',
      Limit: 5
    });
    
    const response = await dynamoClient.send(scanCommand);
    const students = response.Items ? response.Items.map(item => unmarshall(item)) : [];
    
    console.log('✅ Students in table:', students.length);
    console.log('Sample student:', students[0]);
    
  } catch (error) {
    console.error('❌ Error testing student table:', error);
  }
}

testStudentTable();