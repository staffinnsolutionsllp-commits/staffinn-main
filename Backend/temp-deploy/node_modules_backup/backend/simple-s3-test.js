/**
 * Simple S3 test with basic configuration
 */
require('dotenv').config();
const { S3Client, ListBucketsCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

async function testS3() {
  try {
    console.log('🔍 Testing S3 with basic configuration...');
    
    // Create S3 client with explicit configuration
    const s3Client = new S3Client({
      region: 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },
      forcePathStyle: false
    });
    
    console.log('✅ S3 client created');
    
    // Test 1: List buckets
    console.log('🪣 Testing bucket access...');
    try {
      const listBucketsCommand = new ListBucketsCommand({});
      const bucketsResult = await s3Client.send(listBucketsCommand);
      console.log('✅ Buckets accessible:', bucketsResult.Buckets?.map(b => b.Name) || []);
    } catch (bucketError) {
      console.error('❌ Bucket access failed:', bucketError.message);
    }
    
    // Test 2: List objects in staffinn-files bucket
    console.log('📁 Testing bucket contents...');
    try {
      const listObjectsCommand = new ListObjectsV2Command({
        Bucket: 'staffinn-files',
        MaxKeys: 10
      });
      const objectsResult = await s3Client.send(listObjectsCommand);
      console.log('✅ Bucket contents:', objectsResult.Contents?.map(obj => obj.Key) || []);
      console.log('📊 Total objects:', objectsResult.KeyCount || 0);
    } catch (objectError) {
      console.error('❌ Object listing failed:', objectError.message);
    }
    
  } catch (error) {
    console.error('❌ S3 test failed:', error);
  }
}

testS3();