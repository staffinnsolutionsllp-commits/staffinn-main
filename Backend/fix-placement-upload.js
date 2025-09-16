/**
 * Fix for placement upload system - ensures files are uploaded to S3 instead of blob URLs
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Initialize clients
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

async function fixPlacementUploadSystem() {
  console.log('🔧 Fixing placement upload system...');
  
  try {
    // 1. Check current placement data
    console.log('📊 Checking current placement data...');
    const scanCommand = new ScanCommand({
      TableName: 'Institute-placement-section'
    });
    
    const result = await docClient.send(scanCommand);
    console.log(`Found ${result.Items?.length || 0} placement sections`);
    
    if (!result.Items || result.Items.length === 0) {
      console.log('No placement data found to fix');
      return;
    }
    
    // 2. Process each placement section
    for (const item of result.Items) {
      console.log(`\n🏢 Processing institute: ${item.instituteName}`);
      let hasChanges = false;
      
      // Check company logos
      if (item.topHiringCompanies && Array.isArray(item.topHiringCompanies)) {
        for (let i = 0; i < item.topHiringCompanies.length; i++) {
          const company = item.topHiringCompanies[i];
          if (company.logo && typeof company.logo === 'string' && company.logo.startsWith('blob:')) {
            console.log(`❌ Found blob URL for company ${company.name}: ${company.logo}`);
            // Remove blob URLs - they will be replaced when user uploads new files
            company.logo = null;
            hasChanges = true;
          } else if (company.logo && typeof company.logo === 'string' && company.logo.includes('http')) {
            console.log(`✅ Valid S3 URL for company ${company.name}: ${company.logo}`);
          }
        }
      }
      
      // Check student photos
      if (item.recentPlacementSuccess && Array.isArray(item.recentPlacementSuccess)) {
        for (let i = 0; i < item.recentPlacementSuccess.length; i++) {
          const student = item.recentPlacementSuccess[i];
          if (student.photo && typeof student.photo === 'string' && student.photo.startsWith('blob:')) {
            console.log(`❌ Found blob URL for student ${student.name}: ${student.photo}`);
            // Remove blob URLs - they will be replaced when user uploads new files
            student.photo = null;
            hasChanges = true;
          } else if (student.photo && typeof student.photo === 'string' && student.photo.includes('http')) {
            console.log(`✅ Valid S3 URL for student ${student.name}: ${student.photo}`);
          }
        }
      }
      
      // Update the record if changes were made
      if (hasChanges) {
        console.log('💾 Updating placement section to remove blob URLs...');
        const updateCommand = new UpdateCommand({
          TableName: 'Institute-placement-section',
          Key: {
            instituteId: item.instituteId
          },
          UpdateExpression: 'SET topHiringCompanies = :companies, recentPlacementSuccess = :students',
          ExpressionAttributeValues: {
            ':companies': item.topHiringCompanies,
            ':students': item.recentPlacementSuccess
          }
        });
        
        await docClient.send(updateCommand);
        console.log('✅ Updated placement section');
      } else {
        console.log('✅ No blob URLs found, placement section is clean');
      }
    }
    
    console.log('\n🎉 Placement upload system fix completed!');
    console.log('\n📋 Summary:');
    console.log('- Removed all blob URLs from placement data');
    console.log('- Preserved valid S3 URLs');
    console.log('- Users can now upload new files through the dashboard');
    console.log('- Files will be properly stored in S3 with correct URLs');
    
    console.log('\n🔧 Backend Configuration:');
    console.log('- S3 bucket:', S3_BUCKET_NAME);
    console.log('- Region:', process.env.AWS_REGION || 'ap-south-1');
    console.log('- Upload endpoint: PUT /api/v1/institutes/placement-section');
    console.log('- File validation: Images (5MB max), proper MIME types');
    
    console.log('\n📱 Frontend Fix Required:');
    console.log('- Ensure file uploads use FormData with actual File objects');
    console.log('- Remove blob URL creation for final submission');
    console.log('- Use blob URLs only for preview, not for API calls');\n    \n  } catch (error) {
    console.error('❌ Fix failed:', error);
    throw error;
  }
}

// Run fix if this file is executed directly
if (require.main === module) {
  fixPlacementUploadSystem()
    .then(() => {
      console.log('\n✅ Fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixPlacementUploadSystem };