/**
 * Verify Field Name Consistency
 * Checks if all companies have consistent recruiterId field (camelCase)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COMPANIES_TABLE = 'staffinn-hrms-companies';

const verifyFieldConsistency = async () => {
  try {
    console.log('🔍 Verifying field name consistency...\n');

    const result = await docClient.send(new ScanCommand({
      TableName: COMPANIES_TABLE
    }));

    const companies = result.Items || [];
    console.log(`📊 Total companies: ${companies.length}\n`);

    let withRecruiterId = 0;
    let withRecruiterIdSnake = 0;
    let withoutRecruiterId = 0;

    companies.forEach(company => {
      if (company.recruiterId) {
        withRecruiterId++;
        console.log(`✅ ${company.companyId}: has recruiterId (camelCase) = ${company.recruiterId}`);
      } else if (company.recruiter_id) {
        withRecruiterIdSnake++;
        console.log(`⚠️  ${company.companyId}: has recruiter_id (snake_case) = ${company.recruiter_id}`);
      } else {
        withoutRecruiterId++;
        console.log(`❌ ${company.companyId}: missing recruiterId field`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 Field Consistency Report:');
    console.log(`   ✅ With recruiterId (camelCase): ${withRecruiterId}`);
    console.log(`   ⚠️  With recruiter_id (snake_case): ${withRecruiterIdSnake}`);
    console.log(`   ❌ Without recruiterId: ${withoutRecruiterId}`);
    console.log('='.repeat(60));

    if (withRecruiterIdSnake > 0 || withoutRecruiterId > 0) {
      console.log('\n⚠️  Inconsistencies found! Run migration script to fix:');
      console.log('   node Backend/scripts/migrate-add-recruiter-to-company.js');
    } else {
      console.log('\n✅ All companies have consistent recruiterId field!');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  verifyFieldConsistency()
    .then(() => {
      console.log('\n✅ Verification completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyFieldConsistency };
