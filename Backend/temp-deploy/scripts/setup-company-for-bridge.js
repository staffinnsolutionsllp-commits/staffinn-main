const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Generate credentials
function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

function generateCompanyId() {
  return 'COMP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Step 1: Create Companies Table
async function createCompaniesTable() {
  const params = {
    TableName: 'staffinn-hrms-companies',
    KeySchema: [
      { AttributeName: 'companyId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'companyId', AttributeType: 'S' },
      { AttributeName: 'recruiterId', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'recruiterId-index',
        KeySchema: [
          { AttributeName: 'recruiterId', KeyType: 'HASH' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    console.log('📦 Creating staffinn-hrms-companies table...');
    const command = new CreateTableCommand(params);
    await client.send(command);
    console.log('✅ Companies table created');
    await new Promise(resolve => setTimeout(resolve, 5000));
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('ℹ️  Companies table already exists');
    } else {
      throw error;
    }
  }
}

// Step 2: Create Company Record
async function createCompanyRecord(recruiterId, companyName) {
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
    console.log('\n📝 Creating company record...');
    const command = new PutCommand({
      TableName: 'staffinn-hrms-companies',
      Item: company
    });
    
    await docClient.send(command);
    console.log('✅ Company record created');
    
    return company;
  } catch (error) {
    console.error('❌ Error creating company record:', error);
    throw error;
  }
}

// Main setup function
async function setupCompanyForBridge() {
  console.log('\n🚀 HRMS Bridge Setup - Company Configuration\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Get recruiterId from command line
  const recruiterId = process.argv[2];
  const companyName = process.argv[3] || 'Default Company';
  
  if (!recruiterId) {
    console.error('❌ Error: Recruiter ID is required!\n');
    console.log('Usage: node setup-company-for-bridge.js <RECRUITER_ID> [COMPANY_NAME]\n');
    console.log('Example: node setup-company-for-bridge.js REC123 "My Company"\n');
    console.log('💡 To find your Recruiter ID:');
    console.log('   1. Log in to HRMS');
    console.log('   2. Open browser console (F12)');
    console.log('   3. Type: localStorage.getItem("hrms_user")');
    console.log('   4. Look for "recruiterId" in the JSON output\n');
    process.exit(1);
  }
  
  try {
    // Step 1: Create table
    await createCompaniesTable();
    
    // Step 2: Create company record
    const company = await createCompanyRecord(recruiterId, companyName);
    
    // Display credentials
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SETUP COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 BRIDGE SOFTWARE CREDENTIALS:\n');
    console.log('   Company ID: ' + company.companyId);
    console.log('   API Key:    ' + company.apiKey);
    console.log('   Recruiter:  ' + company.recruiterId);
    console.log('   Company:    ' + company.companyName);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Copy these credentials!\n');
    console.log('Next Steps:');
    console.log('1. Open Bridge Software');
    console.log('2. Enter Company ID: ' + company.companyId);
    console.log('3. Enter API Key: ' + company.apiKey);
    console.log('4. Connect your biometric device');
    console.log('5. Start syncing attendance!\n');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupCompanyForBridge()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
