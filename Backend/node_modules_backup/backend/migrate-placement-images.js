/**
 * Migration script to move existing placement images to correct S3 folders
 * This script will:
 * 1. Find all placement section data in DynamoDB
 * 2. Move company logos to placement-company-logos/ folder
 * 3. Move student photos to placement-student-photos/ folder
 * 4. Update the URLs in DynamoDB
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
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
const TABLE_NAME = 'Institute-placement-section';

/**
 * Extract S3 key from URL
 */
const extractKeyFromUrl = (url) => {
  try {
    if (!url || typeof url !== 'string') return null;
    
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part.includes('.s3.'));
    
    if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
      return urlParts.slice(bucketIndex + 1).join('/');
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    return null;
  }
};

/**
 * Check if object exists in S3
 */
const objectExists = async (key) => {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    }));
    return true;
  } catch (error) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
};

/**
 * Copy object to new location in S3
 */
const copyObject = async (sourceKey, destinationKey) => {
  try {
    console.log(`📋 Copying ${sourceKey} to ${destinationKey}`);
    
    const copyCommand = new CopyObjectCommand({
      Bucket: S3_BUCKET_NAME,
      CopySource: `${S3_BUCKET_NAME}/${sourceKey}`,
      Key: destinationKey,
      CacheControl: 'max-age=31536000'
    });
    
    await s3Client.send(copyCommand);
    console.log(`✅ Successfully copied to ${destinationKey}`);
    return true;
  } catch (error) {
    console.error(`❌ Error copying ${sourceKey} to ${destinationKey}:`, error);
    return false;
  }
};

/**
 * Delete object from S3
 */
const deleteObject = async (key) => {
  try {
    console.log(`🗑️ Deleting ${key}`);
    
    const deleteCommand = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    });
    
    await s3Client.send(deleteCommand);
    console.log(`✅ Successfully deleted ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting ${key}:`, error);
    return false;
  }
};

/**
 * Generate new S3 URL
 */
const generateNewUrl = (newKey) => {
  const region = process.env.AWS_REGION || 'ap-south-1';
  return `https://${S3_BUCKET_NAME}.s3.${region}.amazonaws.com/${newKey}`;
};

/**
 * Migrate company logos
 */
const migrateCompanyLogos = async (companies) => {
  const migratedCompanies = [];
  
  for (const company of companies) {
    const migratedCompany = { ...company };
    
    if (company.logo && typeof company.logo === 'string' && company.logo.includes('http')) {
      const oldKey = extractKeyFromUrl(company.logo);
      
      if (oldKey) {
        // Check if it's already in the correct folder
        if (oldKey.startsWith('placement-company-logos/')) {
          console.log(`✅ Company logo already in correct folder: ${oldKey}`);
          migratedCompanies.push(migratedCompany);
          continue;
        }
        
        // Generate new key
        const fileName = oldKey.split('/').pop();
        const newKey = `placement-company-logos/${fileName}`;
        
        // Check if source exists
        if (await objectExists(oldKey)) {
          // Check if destination already exists
          if (await objectExists(newKey)) {
            console.log(`⚠️ Destination already exists: ${newKey}, using existing file`);
            migratedCompany.logo = generateNewUrl(newKey);
          } else {
            // Copy to new location
            if (await copyObject(oldKey, newKey)) {
              migratedCompany.logo = generateNewUrl(newKey);
              
              // Delete old file if it's in a different location
              if (oldKey !== newKey) {
                await deleteObject(oldKey);
              }
            } else {
              console.log(`❌ Failed to migrate company logo: ${company.name}`);
            }
          }
        } else {
          console.log(`⚠️ Source file not found: ${oldKey} for company: ${company.name}`);
        }
      }
    }
    
    migratedCompanies.push(migratedCompany);
  }
  
  return migratedCompanies;
};

/**
 * Migrate student photos
 */
const migrateStudentPhotos = async (students) => {
  const migratedStudents = [];
  
  for (const student of students) {
    const migratedStudent = { ...student };
    
    if (student.photo && typeof student.photo === 'string' && student.photo.includes('http')) {
      const oldKey = extractKeyFromUrl(student.photo);
      
      if (oldKey) {
        // Check if it's already in the correct folder
        if (oldKey.startsWith('placement-student-photos/')) {
          console.log(`✅ Student photo already in correct folder: ${oldKey}`);
          migratedStudents.push(migratedStudent);
          continue;
        }
        
        // Generate new key
        const fileName = oldKey.split('/').pop();
        const newKey = `placement-student-photos/${fileName}`;
        
        // Check if source exists
        if (await objectExists(oldKey)) {
          // Check if destination already exists
          if (await objectExists(newKey)) {
            console.log(`⚠️ Destination already exists: ${newKey}, using existing file`);
            migratedStudent.photo = generateNewUrl(newKey);
          } else {
            // Copy to new location
            if (await copyObject(oldKey, newKey)) {
              migratedStudent.photo = generateNewUrl(newKey);
              
              // Delete old file if it's in a different location
              if (oldKey !== newKey) {
                await deleteObject(oldKey);
              }
            } else {
              console.log(`❌ Failed to migrate student photo: ${student.name}`);
            }
          }
        } else {
          console.log(`⚠️ Source file not found: ${oldKey} for student: ${student.name}`);
        }
      }
    }
    
    migratedStudents.push(migratedStudent);
  }
  
  return migratedStudents;
};

/**
 * Update placement section in DynamoDB
 */
const updatePlacementSection = async (item, migratedData) => {
  try {
    console.log(`📝 Updating placement section for: ${item.instituteName}`);
    
    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        instituteplacement: item.instituteplacement
      },
      UpdateExpression: 'SET topHiringCompanies = :companies, recentPlacementSuccess = :students, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':companies': migratedData.topHiringCompanies,
        ':students': migratedData.recentPlacementSuccess,
        ':updatedAt': new Date().toISOString()
      }
    });
    
    await docClient.send(updateCommand);
    console.log(`✅ Successfully updated placement section for: ${item.instituteName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating placement section for ${item.instituteName}:`, error);
    return false;
  }
};

/**
 * Main migration function
 */
const migratePlacementImages = async () => {
  try {
    console.log('🚀 Starting placement images migration...');
    console.log(`📊 S3 Bucket: ${S3_BUCKET_NAME}`);
    console.log(`📊 DynamoDB Table: ${TABLE_NAME}`);
    console.log(`📊 AWS Region: ${process.env.AWS_REGION || 'ap-south-1'}`);
    
    // Scan all placement sections
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME
    });
    
    const result = await docClient.send(scanCommand);
    const placementSections = result.Items || [];
    
    console.log(`📊 Found ${placementSections.length} placement sections to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const item of placementSections) {
      try {
        console.log(`\n🏢 Processing: ${item.instituteName} (${item.instituteId})`);
        
        const migratedData = {
          topHiringCompanies: [],
          recentPlacementSuccess: []
        };
        
        // Migrate company logos
        if (item.topHiringCompanies && Array.isArray(item.topHiringCompanies)) {
          console.log(`📋 Migrating ${item.topHiringCompanies.length} company logos...`);
          migratedData.topHiringCompanies = await migrateCompanyLogos(item.topHiringCompanies);
        }
        
        // Migrate student photos
        if (item.recentPlacementSuccess && Array.isArray(item.recentPlacementSuccess)) {
          console.log(`📋 Migrating ${item.recentPlacementSuccess.length} student photos...`);
          migratedData.recentPlacementSuccess = await migrateStudentPhotos(item.recentPlacementSuccess);
        }
        
        // Update DynamoDB
        if (await updatePlacementSection(item, migratedData)) {
          migratedCount++;
          console.log(`✅ Successfully migrated: ${item.instituteName}`);
        } else {
          errorCount++;
          console.log(`❌ Failed to update DynamoDB for: ${item.instituteName}`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing ${item.instituteName}:`, error);
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully migrated: ${migratedCount} placement sections`);
    console.log(`❌ Errors: ${errorCount} placement sections`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration if this script is executed directly
if (require.main === module) {
  migratePlacementImages()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  migratePlacementImages,
  extractKeyFromUrl,
  objectExists,
  copyObject,
  deleteObject,
  generateNewUrl
};