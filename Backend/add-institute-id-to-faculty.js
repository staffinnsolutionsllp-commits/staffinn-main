const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function addInstituteIdToFaculty() {
  try {
    console.log('Fetching all faculty records from mis-faculty-list table...');
    
    const params = {
      TableName: 'mis-faculty-list'
    };
    
    const result = await dynamodb.scan(params).promise();
    console.log(`Found ${result.Items.length} faculty records`);
    
    // Sample institute ID - you can change this to actual institute IDs
    const defaultInstituteId = '883c1784-7354-4fab-874b-0c7da5e7bb28';
    
    for (const faculty of result.Items) {
      if (!faculty.instituteId) {
        console.log(`Adding instituteId to faculty: ${faculty.name || faculty.misfaculty}`);
        
        const updateParams = {
          TableName: 'mis-faculty-list',
          Key: { 
            misfaculty: faculty.misfaculty 
          },
          UpdateExpression: 'SET instituteId = :instituteId',
          ExpressionAttributeValues: {
            ':instituteId': defaultInstituteId
          }
        };
        
        await dynamodb.update(updateParams).promise();
        console.log(`✓ Updated faculty: ${faculty.name || faculty.misfaculty}`);
      } else {
        console.log(`Faculty ${faculty.name || faculty.misfaculty} already has instituteId: ${faculty.instituteId}`);
      }
    }
    
    console.log('✅ All faculty records updated successfully!');
  } catch (error) {
    console.error('❌ Error updating faculty records:', error);
  }
}

// Run the script
addInstituteIdToFaculty();