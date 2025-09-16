/**
 * Setup S3 CORS Configuration
 */

require('dotenv').config();
const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'HEAD'],
      AllowedOrigins: ['*'],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3000
    }
  ]
};

async function setupCORS() {
  try {
    console.log('🔧 Setting up S3 CORS configuration...\n');
    
    // Set CORS configuration
    await s3Client.send(new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: corsConfiguration
    }));
    
    console.log('✅ CORS configuration applied successfully');
    
    // Verify CORS configuration
    const corsResult = await s3Client.send(new GetBucketCorsCommand({
      Bucket: BUCKET_NAME
    }));
    
    console.log('📋 Current CORS configuration:');
    console.log(JSON.stringify(corsResult.CORSRules, null, 2));
    
  } catch (error) {
    console.error('❌ Error setting up CORS:', error.message);
  }
}

setupCORS().catch(console.error);