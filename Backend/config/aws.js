/**
 * AWS SDK Configuration
 * This file sets up the AWS SDK with credentials from environment variables
 */

// Base AWS configuration
const awsConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  // Additional S3 specific configuration
  s3: {
    apiVersion: '2006-03-01',
    signatureVersion: 'v4'
  },
  // DynamoDB specific configuration
  dynamodb: {
    apiVersion: '2012-08-10'
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID', 
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME',
  'STAFF_TABLE'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.warn('Missing AWS environment variables:', missingEnvVars.join(', '));
}

// Export the configuration for use in other modules
module.exports = awsConfig;