const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function updateFacultyRecords() {
  try {
    console.log('Fetching all faculty records...');
    
    // Get all faculty records
    const params = {
      TableName: 'FacultyList'
    };
    
    const result = await dynamodb.scan(params).promise();
    console.log(`Found ${result.Items.length} faculty records`);
    
    // Update each record that doesn't have instituteId
    for (const faculty of result.Items) {
      if (!faculty.instituteId) {
        console.log(`Updating faculty ${faculty.name || faculty.id}...`);
        
        const updateParams = {
          TableName: 'FacultyList',
          Key: { id: faculty.id },
          UpdateExpression: 'SET instituteId = :instituteId',
          ExpressionAttributeValues: {
            ':instituteId': 'default-institute-id' // You'll need to set proper institute IDs
          }
        };
        
        await dynamodb.update(updateParams).promise();
        console.log(`Updated faculty ${faculty.name || faculty.id}`);
      }
    }
    
    console.log('All faculty records updated successfully!');
  } catch (error) {
    console.error('Error updating faculty records:', error);
  }
}

updateFacultyRecords();