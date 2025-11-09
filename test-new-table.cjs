const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: 'dummy',
  secretAccessKey: 'dummy',
  endpoint: 'http://localhost:8000'
});

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