const { S3Client, PutBucketPolicyCommand, PutPublicAccessBlockCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

async function setupBucketForPublicRead() {
  try {
    console.log('Setting up bucket for public read access...');
    
    // First, allow public access
    const publicAccessCommand = new PutPublicAccessBlockCommand({
      Bucket: BUCKET_NAME,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false
      }
    });
    
    await s3Client.send(publicAccessCommand);
    console.log('✅ Public access block configuration updated');
    
    // Then set bucket policy for public read
    const bucketPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${BUCKET_NAME}/*`
        }
      ]
    };
    
    const policyCommand = new PutBucketPolicyCommand({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(bucketPolicy)
    });
    
    await s3Client.send(policyCommand);
    console.log('✅ Bucket policy updated for public read access');
    console.log('✅ Your S3 bucket is now configured for public image access');
    
  } catch (error) {
    console.error('❌ Error setting up bucket:', error.message);
    console.log('\nManual steps:');
    console.log('1. Go to AWS S3 Console');
    console.log('2. Select your bucket:', BUCKET_NAME);
    console.log('3. Go to Permissions tab');
    console.log('4. Edit Block public access and uncheck all options');
    console.log('5. Add this bucket policy:');
    console.log(JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'PublicReadGetObject',
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${BUCKET_NAME}/*`
        }
      ]
    }, null, 2));
  }
}

setupBucketForPublicRead();