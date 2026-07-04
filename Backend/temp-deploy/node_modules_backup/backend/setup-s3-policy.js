/**
 * Setup S3 bucket policy for public read access
 */

// Load environment variables
require('dotenv').config();

const { S3Client, PutBucketPolicyCommand, GetBucketPolicyCommand } = require('@aws-sdk/client-s3');
const awsConfig = require('./config/aws');

const s3Client = new S3Client(awsConfig);
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

async function setupBucketPolicy() {
  try {
    console.log('Setting up S3 bucket policy for:', BUCKET_NAME);
    
    // Define the bucket policy for public read access
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
    
    const command = new PutBucketPolicyCommand({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(bucketPolicy)
    });
    
    await s3Client.send(command);
    console.log('✅ Bucket policy set successfully');
    
    // Verify the policy
    const getCommand = new GetBucketPolicyCommand({
      Bucket: BUCKET_NAME
    });
    
    const result = await s3Client.send(getCommand);
    console.log('Current bucket policy:', JSON.parse(result.Policy));
    
  } catch (error) {
    console.error('❌ Error setting bucket policy:', error.message);
  }
}

setupBucketPolicy();