const AWS = require('aws-sdk');

// SECURITY FIX (CWE-798): Use environment variables instead of hardcoded credentials
// For local DynamoDB testing, set these environment variables:
//   export AWS_ACCESS_KEY_ID="dummy"
//   export AWS_SECRET_ACCESS_KEY="dummy"
//   export DYNAMODB_ENDPOINT="http://localhost:8000"

// Configure AWS from environment variables
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000'
});

// Validate credentials are set
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('❌ AWS credentials not found in environment variables');
  console.log('\n💡 For local DynamoDB testing, run:');
  console.log('   export AWS_ACCESS_KEY_ID="dummy"');
  console.log('   export AWS_SECRET_ACCESS_KEY="dummy"');
  console.log('\n   Then run: node test-new-table.js');
  console.log('\n   Or run with inline variables:');
  console.log('   AWS_ACCESS_KEY_ID="dummy" AWS_SECRET_ACCESS_KEY="dummy" node test-new-table.js\n');
  process.exit(1);
}

const dynamodb = new AWS.DynamoDB.DocumentClient();

const addTestScheme = async () => {
  const scheme = {
    instituteId: 'd98f25d6-f18b-4e30-b383-7b164ba7cb18', // Partition key
    schemeId: 'scheme-' + Date.now(), // Sort key
    schemeName: 'TFWS Scheme',
    schemeDescription: 'Tuition Fee Waiver Scheme for eligible students',
    link: 'https://example.com/tfws',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await dynamodb.put({
      TableName: 'institute-gov-schemes',
      Item: scheme
    }).promise();
    
    console.log('✅ Test scheme added successfully:', scheme);
  } catch (error) {
    console.error('❌ Error adding test scheme:', error);
  }
};

const getSchemes = async () => {
  try {
    const result = await dynamodb.query({
      TableName: 'institute-gov-schemes',
      KeyConditionExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': 'd98f25d6-f18b-4e30-b383-7b164ba7cb18'
      }
    }).promise();
    
    console.log('📋 Schemes found:', result.Items.length);
    result.Items.forEach(scheme => {
      console.log(`- ${scheme.schemeName} (${scheme.schemeId})`);
    });
  } catch (error) {
    console.error('❌ Error getting schemes:', error);
  }
};

// Run tests
(async () => {
  console.log('🧪 Testing new table structure...\n');
  
  await addTestScheme();
  console.log();
  await getSchemes();
})();