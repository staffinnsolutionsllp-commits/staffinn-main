/**
 * Script to set up S3 bucket with correct folder structure and permissions
 * for placement and industry collaboration files
 */

const { S3Client, PutBucketCorsCommand, PutBucketPolicyCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

async function setupS3PlacementFolders() {
  console.log('🚀 Setting up S3 bucket for placement files...');
  
  try {
    // 1. Set up CORS configuration
    console.log('🔧 Setting up CORS configuration...');
    
    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3000
        }
      ]
    };
    
    const corsCommand = new PutBucketCorsCommand({
      Bucket: S3_BUCKET_NAME,
      CORSConfiguration: corsConfiguration
    });
    
    await s3Client.send(corsCommand);
    console.log('✅ CORS configuration updated');
    
    // 2. Set up bucket policy for public read access to placement files
    console.log('🔧 Setting up bucket policy...');
    
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: [
            `arn:aws:s3:::${S3_BUCKET_NAME}/placement-company-logos/*`,
            `arn:aws:s3:::${S3_BUCKET_NAME}/placement-student-photos/*`,
            `arn:aws:s3:::${S3_BUCKET_NAME}/industry-collab-images/*`,
            `arn:aws:s3:::${S3_BUCKET_NAME}/industry-collab-pdfs/*`,
            `arn:aws:s3:::${S3_BUCKET_NAME}/institute-images/*`,
            `arn:aws:s3:::${S3_BUCKET_NAME}/course-thumbnails/*`,
            `arn:aws:s3:::${S3_BUCKET_NAME}/course-content/*`
          ]
        }
      ]
    };
    
    const policyCommand = new PutBucketPolicyCommand({
      Bucket: S3_BUCKET_NAME,
      Policy: JSON.stringify(bucketPolicy)
    });
    
    await s3Client.send(policyCommand);
    console.log('✅ Bucket policy updated');
    
    // 3. Create placeholder files in required folders to ensure they exist
    console.log('📁 Creating folder structure...');
    
    const folders = [
      'placement-company-logos/',
      'placement-student-photos/',
      'industry-collab-images/',
      'industry-collab-pdfs/'
    ];
    
    for (const folder of folders) {
      try {
        const placeholderCommand = new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: `${folder}.placeholder`,
          Body: 'This file ensures the folder exists in S3',
          ContentType: 'text/plain'
        });
        
        await s3Client.send(placeholderCommand);
        console.log(`✅ Created folder: ${folder}`);
      } catch (error) {
        console.error(`❌ Error creating folder ${folder}:`, error.message);
      }
    }
    
    console.log('\n✅ S3 setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- CORS configuration updated for cross-origin requests');
    console.log('- Bucket policy set for public read access to placement files');
    console.log('- Required folder structure created:');
    folders.forEach(folder => console.log(`  - ${folder}`));
    console.log('\n🔗 Files uploaded to these folders will be publicly accessible via:');
    console.log(`   https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/[folder]/[filename]`);
    
  } catch (error) {
    console.error('❌ S3 setup failed:', error);
    throw error;
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupS3PlacementFolders()
    .then(() => {
      console.log('S3 setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('S3 setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupS3PlacementFolders };