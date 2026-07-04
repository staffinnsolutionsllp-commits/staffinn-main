/**
 * Manual Fix: Add recruiterId to companies without HRMS user link
 * For companies where HRMS user doesn't have recruiterId
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COMPANIES_TABLE = 'staffinn-hrms-companies';
const HRMS_USERS_TABLE = 'staffinn-hrms-users';

const manualFixCompanies = async () => {
  try {
    console.log('🔧 Manual Fix: Adding recruiterId to companies...\n');

    // Get all companies without recruiterId
    const companiesResult = await docClient.send(new ScanCommand({
      TableName: COMPANIES_TABLE,
      FilterExpression: 'attribute_not_exists(recruiterId)'
    }));

    const companies = companiesResult.Items || [];
    console.log(`📊 Found ${companies.length} companies without recruiterId\n`);

    if (companies.length === 0) {
      console.log('✅ All companies already have recruiterId!');
      return;
    }

    let updated = 0;
    let errors = 0;

    for (const company of companies) {
      try {
        console.log(`\n🔍 Processing: ${company.companyId} (${company.adminEmail})`);

        // Find HRMS user by adminEmail
        const usersResult = await docClient.send(new ScanCommand({
          TableName: HRMS_USERS_TABLE,
          FilterExpression: 'email = :email',
          ExpressionAttributeValues: {
            ':email': company.adminEmail
          }
        }));

        if (!usersResult.Items || usersResult.Items.length === 0) {
          console.log(`   ⚠️  No HRMS user found for ${company.adminEmail}`);
          console.log(`   💡 Solution: Use companyId as recruiterId`);
          
          // Use companyId as recruiterId (fallback)
          await docClient.send(new UpdateCommand({
            TableName: COMPANIES_TABLE,
            Key: { companyId: company.companyId },
            UpdateExpression: 'SET recruiterId = :recruiterId, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
              ':recruiterId': company.companyId,
              ':updatedAt': new Date().toISOString()
            }
          }));

          console.log(`   ✅ Set recruiterId = ${company.companyId} (using companyId)`);
          updated++;
          continue;
        }

        const hrmsUser = usersResult.Items[0];
        const recruiterId = hrmsUser.recruiterId || hrmsUser.recruiter_id || hrmsUser.userId;

        if (!recruiterId) {
          console.log(`   ⚠️  HRMS user has no recruiterId/userId`);
          console.log(`   💡 Solution: Use companyId as recruiterId`);
          
          // Use companyId as recruiterId (fallback)
          await docClient.send(new UpdateCommand({
            TableName: COMPANIES_TABLE,
            Key: { companyId: company.companyId },
            UpdateExpression: 'SET recruiterId = :recruiterId, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
              ':recruiterId': company.companyId,
              ':updatedAt': new Date().toISOString()
            }
          }));

          console.log(`   ✅ Set recruiterId = ${company.companyId} (using companyId)`);
          updated++;
          continue;
        }

        // Update company with recruiterId from HRMS user
        await docClient.send(new UpdateCommand({
          TableName: COMPANIES_TABLE,
          Key: { companyId: company.companyId },
          UpdateExpression: 'SET recruiterId = :recruiterId, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':recruiterId': recruiterId,
            ':updatedAt': new Date().toISOString()
          }
        }));

        console.log(`   ✅ Set recruiterId = ${recruiterId} (from HRMS user)`);
        updated++;

      } catch (error) {
        console.error(`   ❌ Error processing ${company.companyId}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Manual Fix Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('='.repeat(60));

    if (updated > 0) {
      console.log('\n✅ Manual fix completed successfully!');
      console.log('💡 Run verification script to confirm:');
      console.log('   node Backend/scripts/verify-field-consistency.js');
    }

  } catch (error) {
    console.error('❌ Manual fix failed:', error);
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  manualFixCompanies()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { manualFixCompanies };
