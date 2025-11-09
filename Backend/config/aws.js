/**
 * AWS SDK Configuration
 * This file sets up the AWS SDK with credentials from environment variables
 */

// Base AWS configuration
const awsConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy'
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

// For local development, use DynamoDB Local only if explicitly enabled
if (process.env.USE_LOCAL_DYNAMODB === 'true') {
  awsConfig.endpoint = 'http://localhost:8000';
  awsConfig.credentials = {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy'
  };
  console.log('Using local DynamoDB endpoint');
} else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  console.log('Using real AWS DynamoDB');
} else {
  console.warn('AWS credentials not found, will fall back to mock database');
}

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