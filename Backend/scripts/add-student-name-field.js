const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'mis-students';

async function addStudentNameField() {
  try {
    console.log('Starting migration to add studentName field to mis-students table...');
    
    // Scan all records in the table
    const scanParams = {
      TableName: TABLE_NAME
    };
    
    const result = await dynamoDB.scan(scanParams).promise();
    const students = result.Items || [];
    
    console.log(`Found ${students.length} student records to update`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const student of students) {
      // Skip if studentName already exists
      if (student.studentName) {
        console.log(`Skipping student ${student.studentsId} - studentName already exists`);
        skippedCount++;
        continue;
      }
      
      // Use fatherName as default studentName if available, otherwise use a placeholder
      const defaultStudentName = student.fatherName || 'Student Name Not Set';
      
      const updateParams = {
        TableName: TABLE_NAME,
        Key: { studentsId: student.studentsId },
        UpdateExpression: 'SET studentName = :studentName, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':studentName': defaultStudentName,
          ':updatedAt': new Date().toISOString()
        }
      };
      
      try {
        await dynamoDB.update(updateParams).promise();
        console.log(`Updated student ${student.studentsId} with studentName: "${defaultStudentName}"`);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating student ${student.studentsId}:`, error);
      }
    }
    
    console.log('\nMigration completed!');
    console.log(`Updated: ${updatedCount} records`);
    console.log(`Skipped: ${skippedCount} records`);
    console.log(`Total: ${students.length} records`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
addStudentNameField()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });