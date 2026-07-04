const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Generate a random API key
function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

// Generate a company ID
function generateCompanyId() {
  return 'COMP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

async function createCompanyRecord(recruiterId, companyName = 'Default Company') {
  const companyId = generateCompanyId();
  const apiKey = generateApiKey();
  
  const company = {
    companyId,
    apiKey,
    recruiterId,
    companyName,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    console.log('Creating company record...');
    console.log('Company ID:', companyId);
    console.log('API Key:', apiKey);
    console.log('Recruiter ID:', recruiterId);
    
    const command = new PutCommand({
      TableName: 'staffinn-hrms-companies',
      Item: company
    });
    
    await docClient.send(command);
    
    console.log('\n✅ Company record created successfully!');
    console.log('\n📋 SAVE THESE CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Company ID:', companyId);
    console.log('API Key:', apiKey);
    console.log('Recruiter ID:', recruiterId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️ IMPORTANT: Copy these credentials and enter them in Bridge Software!');
    
    return company;
  } catch (error) {
    console.error('❌ Error creating company record:', error);
    throw error;
  }
}

// Get recruiterId from command line argument
const recruiterId = process.argv[2];
const companyName = process.argv[3] || 'Default Company';

if (!recruiterId) {
  console.error('❌ Error: Recruiter ID is required!');
  console.log('\nUsage: node create-company-record.js <RECRUITER_ID> [COMPANY_NAME]');
  console.log('Example: node create-company-record.js REC123 "My Company"');
  console.log('\n💡 To find your Recruiter ID:');
  console.log('   1. Log in to HRMS');
  console.log('   2. Open browser console (F12)');
  console.log('   3. Type: localStorage.getItem("hrms_user")');
  console.log('   4. Look for "recruiterId" in the output');
  process.exit(1);
}

createCompanyRecord(recruiterId, companyName)
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Failed to create company record');
    process.exit(1);
  });
