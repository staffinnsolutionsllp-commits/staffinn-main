/**
 * Cleanup script for placement section data
 * This script fixes existing placement data that has empty objects instead of proper URLs
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'Institute-placement-section';

async function cleanupPlacementData() {
  try {
    console.log('🧹 Starting placement data cleanup...');
    
    // Scan all placement records
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME
    });
    
    const result = await docClient.send(scanCommand);
    const items = result.Items || [];
    
    console.log(`📊 Found ${items.length} placement records to check`);
    
    let updatedCount = 0;
    
    for (const item of items) {
      let needsUpdate = false;
      const updatedItem = { ...item };
      
      // Fix company logos
      if (updatedItem.topHiringCompanies && Array.isArray(updatedItem.topHiringCompanies)) {
        updatedItem.topHiringCompanies = updatedItem.topHiringCompanies.map(company => {
          const fixedCompany = { ...company };
          
          // Check if logo is an empty object or invalid
          if (fixedCompany.logo && typeof fixedCompany.logo === 'object' && Object.keys(fixedCompany.logo).length === 0) {
            fixedCompany.logo = null;
            needsUpdate = true;
            console.log(`🔧 Fixed empty logo object for company: ${fixedCompany.name}`);
          } else if (fixedCompany.logo && typeof fixedCompany.logo === 'string' && !fixedCompany.logo.includes('http')) {
            fixedCompany.logo = null;
            needsUpdate = true;
            console.log(`🔧 Fixed invalid logo URL for company: ${fixedCompany.name}`);
          }
          
          return fixedCompany;
        });
      }
      
      // Fix student photos
      if (updatedItem.recentPlacementSuccess && Array.isArray(updatedItem.recentPlacementSuccess)) {
        updatedItem.recentPlacementSuccess = updatedItem.recentPlacementSuccess.map(student => {
          const fixedStudent = { ...student };
          
          // Check if photo is an empty object or invalid
          if (fixedStudent.photo && typeof fixedStudent.photo === 'object' && Object.keys(fixedStudent.photo).length === 0) {
            fixedStudent.photo = null;
            needsUpdate = true;
            console.log(`🔧 Fixed empty photo object for student: ${fixedStudent.name}`);
          } else if (fixedStudent.photo && typeof fixedStudent.photo === 'string' && !fixedStudent.photo.includes('http')) {
            fixedStudent.photo = null;
            needsUpdate = true;
            console.log(`🔧 Fixed invalid photo URL for student: ${fixedStudent.name}`);
          }
          
          return fixedStudent;
        });
      }
      
      // Update the record if needed
      if (needsUpdate) {
        updatedItem.updatedAt = new Date().toISOString();
        
        const putCommand = new PutCommand({
          TableName: TABLE_NAME,
          Item: updatedItem
        });
        
        await docClient.send(putCommand);
        updatedCount++;
        
        console.log(`✅ Updated placement record for institute: ${updatedItem.instituteName}`);
      }
    }
    
    console.log(`\n🎉 Cleanup completed!`);
    console.log(`📊 Total records checked: ${items.length}`);
    console.log(`🔧 Records updated: ${updatedCount}`);
    console.log(`✨ Records already clean: ${items.length - updatedCount}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanupPlacementData().catch(console.error);
}

module.exports = { cleanupPlacementData };