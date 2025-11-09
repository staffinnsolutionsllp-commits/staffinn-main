/**
 * Check environment variables and AWS credentials
 */
require('dotenv').config();

console.log('🔍 Checking environment variables...\n');

// Check basic environment variables
const requiredEnvVars = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'S3_BUCKET_NAME'
];

console.log('📋 Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    if (varName.includes('SECRET') || varName.includes('KEY')) {
      console.log(`✅ ${varName}: ${value.substring(0, 4)}****${value.substring(value.length - 4)}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n🔧 AWS Configuration:');
console.log(`Region: ${process.env.AWS_REGION || 'NOT SET'}`);
console.log(`Bucket: ${process.env.S3_BUCKET_NAME || 'NOT SET'}`);
console.log(`Access Key ID: ${process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET'}`);
console.log(`Secret Access Key: ${process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'}`);

// Check if all required variables are set
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.log('\n❌ Missing environment variables:', missingVars.join(', '));
  console.log('Please check your .env file');
} else {
  console.log('\n✅ All required environment variables are set');
}

// Test AWS credentials format
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  
  console.log('\n🔐 Credential Format Check:');
  console.log(`Access Key ID length: ${accessKeyId.length} (should be 20)`);
  console.log(`Secret Access Key length: ${secretAccessKey.length} (should be 40)`);
  console.log(`Access Key ID format: ${/^[A-Z0-9]{20}$/.test(accessKeyId) ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`Secret Access Key format: ${/^[A-Za-z0-9+/]{40}$/.test(secretAccessKey) ? '✅ Valid' : '❌ Invalid'}`);
}