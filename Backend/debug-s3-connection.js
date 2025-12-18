const AWS = require('aws-sdk');
require('dotenv').config();

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1'
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

async function testS3Connection() {
  console.log('Testing S3 connection...');
  console.log('Bucket:', BUCKET_NAME);
  console.log('Region:', process.env.AWS_REGION);
  console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? 'Present' : 'Missing');
  console.log('Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? 'Present' : 'Missing');

  try {
    // Test bucket access
    console.log('\n1. Testing bucket access...');
    const headResult = await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    console.log('✅ Bucket access successful');

    // Test list objects
    console.log('\n2. Testing list objects...');
    const listResult = await s3.listObjectsV2({ 
      Bucket: BUCKET_NAME, 
      MaxKeys: 5,
      Prefix: 'student-reports/'
    }).promise();
    console.log('✅ List objects successful');
    console.log('Objects found:', listResult.Contents?.length || 0);

    // Test upload with a small file
    console.log('\n3. Testing file upload...');
    const testContent = Buffer.from('Test file content for upload test');
    const testKey = `test-uploads/test-${Date.now()}.txt`;
    
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
      ACL: 'public-read'
    };

    const uploadResult = await s3.upload(uploadParams).promise();
    console.log('✅ Upload successful');
    console.log('Upload URL:', uploadResult.Location);

    // Clean up test file
    console.log('\n4. Cleaning up test file...');
    await s3.deleteObject({ Bucket: BUCKET_NAME, Key: testKey }).promise();
    console.log('✅ Test file deleted');

    console.log('\n🎉 All S3 tests passed! Upload should work.');

  } catch (error) {
    console.error('\n❌ S3 Test failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Status code:', error.statusCode);
    
    if (error.code === 'NoSuchBucket') {
      console.log('\n💡 Solution: Create the S3 bucket or check bucket name');
    } else if (error.code === 'AccessDenied') {
      console.log('\n💡 Solution: Check AWS credentials and S3 permissions');
    } else if (error.code === 'InvalidAccessKeyId') {
      console.log('\n💡 Solution: Check AWS Access Key ID');
    } else if (error.code === 'SignatureDoesNotMatch') {
      console.log('\n💡 Solution: Check AWS Secret Access Key');
    }
  }
}

testS3Connection();