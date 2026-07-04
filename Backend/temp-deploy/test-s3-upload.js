/**
 * Test S3 Upload Functionality
 * This script tests if S3 uploads are working correctly
 */

const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Initialize S3 client with the same configuration as the main app
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

async function testS3Connection() {
  console.log('🔍 Testing S3 Connection...');
  console.log('📋 Configuration:');
  console.log('  - Region:', process.env.AWS_REGION);
  console.log('  - Bucket:', S3_BUCKET_NAME);
  console.log('  - Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? 'Present' : 'Missing');
  console.log('  - Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? 'Present' : 'Missing');
  
  try {
    // Test 1: List objects in bucket
    console.log('\n📂 Test 1: Listing bucket contents...');
    const listCommand = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      MaxKeys: 10
    });
    
    const listResult = await s3Client.send(listCommand);
    console.log('✅ Bucket access successful!');
    console.log('📊 Objects found:', listResult.KeyCount || 0);
    
    if (listResult.Contents && listResult.Contents.length > 0) {
      console.log('📁 Sample objects:');
      listResult.Contents.slice(0, 5).forEach(obj => {
        console.log(`  - ${obj.Key} (${obj.Size} bytes)`);
      });
    }
    
    // Test 2: Upload a test file
    console.log('\n📤 Test 2: Uploading test file...');
    const testFileName = `test-upload-${uuidv4()}.txt`;
    const testContent = `Test upload at ${new Date().toISOString()}`;
    
    const uploadCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: `placement-company-logos/${testFileName}`,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
      CacheControl: 'max-age=31536000'
    });
    
    const uploadResult = await s3Client.send(uploadCommand);
    console.log('✅ Test file uploaded successfully!');
    console.log('📍 ETag:', uploadResult.ETag);
    
    const testFileUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/placement-company-logos/${testFileName}`;
    console.log('🔗 Test file URL:', testFileUrl);
    
    console.log('\n🎉 S3 Connection Test PASSED!');
    console.log('✅ All S3 operations are working correctly.');
    
  } catch (error) {
    console.error('\n❌ S3 Connection Test FAILED!');
    console.error('🚨 Error details:', error);
    
    if (error.name === 'CredentialsProviderError') {
      console.error('💡 Issue: AWS credentials are invalid or missing');
    } else if (error.name === 'NoSuchBucket') {
      console.error('💡 Issue: S3 bucket does not exist or is not accessible');
    } else if (error.name === 'AccessDenied') {
      console.error('💡 Issue: AWS credentials do not have permission to access S3');
    } else {
      console.error('💡 Issue: Unknown S3 error');
    }
    
    console.error('\n🔧 Troubleshooting steps:');
    console.error('1. Verify AWS credentials in .env file');
    console.error('2. Check if S3 bucket exists and is accessible');
    console.error('3. Verify AWS region is correct');
    console.error('4. Check IAM permissions for S3 access');
  }
}

// Run the test
testS3Connection();