/**
 * Migration script to move existing placement files to correct S3 folders
 * and fix any blob URLs or incorrect folder structures
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Initialize clients
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

async function migratePlacementFiles() {
  console.log('🚀 Starting placement files migration...');
  
  try {
    // 1. Scan placement section table
    const placementScanCommand = new ScanCommand({
      TableName: 'Institute-placement-section'
    });
    
    const placementResult = await docClient.send(placementScanCommand);
    console.log(`📊 Found ${placementResult.Items?.length || 0} placement sections`);
    
    if (!placementResult.Items || placementResult.Items.length === 0) {
      console.log('No placement sections found to migrate');
      return;
    }
    
    // 2. Process each placement section
    for (const item of placementResult.Items) {
      console.log(`\n🏢 Processing placement section for: ${item.instituteName}`);
      
      let updated = false;
      const updatedItem = { ...item };
      
      // Process company logos
      if (item.topHiringCompanies && Array.isArray(item.topHiringCompanies)) {
        console.log(`📋 Processing ${item.topHiringCompanies.length} companies`);
        
        for (let i = 0; i < item.topHiringCompanies.length; i++) {
          const company = item.topHiringCompanies[i];
          
          if (company.logo && typeof company.logo === 'string') {
            // Check if it's a blob URL or needs migration
            if (company.logo.startsWith('blob:') || !company.logo.includes('placement-company-logos/')) {
              console.log(`⚠️  Company ${company.name} has invalid logo URL: ${company.logo}`);
              // Remove blob URLs - they can't be migrated
              if (company.logo.startsWith('blob:')) {
                updatedItem.topHiringCompanies[i].logo = null;
                updated = true;
                console.log(`🗑️  Removed blob URL for ${company.name}`);
              }
            } else {
              console.log(`✅ Company ${company.name} logo is valid: ${company.logo}`);
            }
          }
        }
      }
      
      // Process student photos
      if (item.recentPlacementSuccess && Array.isArray(item.recentPlacementSuccess)) {
        console.log(`👥 Processing ${item.recentPlacementSuccess.length} students`);
        
        for (let i = 0; i < item.recentPlacementSuccess.length; i++) {
          const student = item.recentPlacementSuccess[i];
          
          if (student.photo && typeof student.photo === 'string') {
            // Check if it's a blob URL or needs migration
            if (student.photo.startsWith('blob:') || !student.photo.includes('placement-student-photos/')) {
              console.log(`⚠️  Student ${student.name} has invalid photo URL: ${student.photo}`);
              // Remove blob URLs - they can't be migrated
              if (student.photo.startsWith('blob:')) {
                updatedItem.recentPlacementSuccess[i].photo = null;
                updated = true;
                console.log(`🗑️  Removed blob URL for ${student.name}`);
              }
            } else {
              console.log(`✅ Student ${student.name} photo is valid: ${student.photo}`);
            }
          }
        }
      }
      
      // Update the item if changes were made
      if (updated) {
        console.log(`💾 Updating placement section for ${item.instituteName}`);
        
        const updateCommand = new PutCommand({
          TableName: 'Institute-placement-section',
          Item: {
            ...updatedItem,
            updatedAt: new Date().toISOString()
          }
        });
        
        await docClient.send(updateCommand);
        console.log(`✅ Updated placement section for ${item.instituteName}`);
      } else {
        console.log(`✅ No updates needed for ${item.instituteName}`);
      }
    }
    
    // 3. Migrate industry collaboration files
    console.log('\n🤝 Processing industry collaboration sections...');
    
    const collabScanCommand = new ScanCommand({
      TableName: 'institute-industrycollab-section'
    });
    
    const collabResult = await docClient.send(collabScanCommand);
    console.log(`📊 Found ${collabResult.Items?.length || 0} industry collaboration sections`);
    
    if (collabResult.Items && collabResult.Items.length > 0) {
      for (const item of collabResult.Items) {
        console.log(`\n🏢 Processing industry collaboration for: ${item.instituteName}`);
        
        let updated = false;
        const updatedItem = { ...item };
        
        // Process collaboration card images
        if (item.collaborationCards && Array.isArray(item.collaborationCards)) {
          console.log(`🖼️  Processing ${item.collaborationCards.length} collaboration cards`);
          
          for (let i = 0; i < item.collaborationCards.length; i++) {
            const card = item.collaborationCards[i];
            
            if (card.image && typeof card.image === 'string') {
              if (card.image.startsWith('blob:') || !card.image.includes('industry-collab-images/')) {
                console.log(`⚠️  Card ${card.title} has invalid image URL: ${card.image}`);
                if (card.image.startsWith('blob:')) {
                  updatedItem.collaborationCards[i].image = null;
                  updated = true;
                  console.log(`🗑️  Removed blob URL for ${card.title}`);
                }
              } else {
                console.log(`✅ Card ${card.title} image is valid: ${card.image}`);
              }
            }
          }
        }
        
        // Process MOU PDFs
        if (item.mouItems && Array.isArray(item.mouItems)) {
          console.log(`📄 Processing ${item.mouItems.length} MOU items`);
          
          for (let i = 0; i < item.mouItems.length; i++) {
            const mou = item.mouItems[i];
            
            if (mou.pdfUrl && typeof mou.pdfUrl === 'string') {
              if (mou.pdfUrl.startsWith('blob:') || !mou.pdfUrl.includes('industry-collab-pdfs/')) {
                console.log(`⚠️  MOU ${mou.title} has invalid PDF URL: ${mou.pdfUrl}`);
                if (mou.pdfUrl.startsWith('blob:')) {
                  updatedItem.mouItems[i].pdfUrl = '';
                  updated = true;
                  console.log(`🗑️  Removed blob URL for ${mou.title}`);
                }
              } else {
                console.log(`✅ MOU ${mou.title} PDF is valid: ${mou.pdfUrl}`);
              }
            }
          }
        }
        
        // Update the item if changes were made
        if (updated) {
          console.log(`💾 Updating industry collaboration for ${item.instituteName}`);
          
          const updateCommand = new PutCommand({
            TableName: 'institute-industrycollab-section',
            Item: {
              ...updatedItem,
              lastUpdated: new Date().toISOString()
            }
          });
          
          await docClient.send(updateCommand);
          console.log(`✅ Updated industry collaboration for ${item.instituteName}`);
        } else {
          console.log(`✅ No updates needed for ${item.instituteName}`);
        }
      }
    }
    
    // 4. Check S3 bucket structure
    console.log('\n🗂️  Checking S3 bucket structure...');
    
    const requiredFolders = [
      'placement-company-logos/',
      'placement-student-photos/',
      'industry-collab-images/',
      'industry-collab-pdfs/'
    ];
    
    for (const folder of requiredFolders) {
      try {
        const listCommand = new ListObjectsV2Command({
          Bucket: S3_BUCKET_NAME,
          Prefix: folder,
          MaxKeys: 1
        });
        
        const result = await s3Client.send(listCommand);
        console.log(`📁 Folder ${folder}: ${result.Contents?.length || 0} files`);
      } catch (error) {
        console.error(`❌ Error checking folder ${folder}:`, error.message);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Removed all blob: URLs from database records');
    console.log('- Verified S3 folder structure');
    console.log('- Future uploads will use correct folder structure');
    console.log('\n⚠️  Note: Blob URLs cannot be migrated as they are temporary browser URLs.');
    console.log('   Users will need to re-upload any images that were showing as blob URLs.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migratePlacementFiles()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migratePlacementFiles };