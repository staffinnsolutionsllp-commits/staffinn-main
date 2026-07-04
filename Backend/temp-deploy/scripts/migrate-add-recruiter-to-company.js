/**
 * Migration Script: Add recruiterId to existing company records
 * Links companies to their recruiter accounts via adminEmail
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-south-1' });
const docClient = DynamoDBDocumentClient.from(client);

const COMPANIES_TABLE = 'staffinn-hrms-companies';
const HRMS_USERS_TABLE = 'staffinn-hrms-users';

const migrateCompanies = async () => {
  try {
    console.log('🔄 Starting migration: Add recruiterId to companies...\n');

    // Get all companies
    const companiesResult = await docClient.send(new ScanCommand({
      TableName: COMPANIES_TABLE
    }));

    const companies = companiesResult.Items || [];
    console.log(`📊 Found ${companies.length} companies to process\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const company of companies) {
      try {
        // Skip if already has recruiterId
        if (company.recruiterId) {
          console.log(`⏭️  Skipping ${company.companyId} - already has recruiterId: ${company.recruiterId}`);
          skipped++;
          continue;
        }

        // Find HRMS user by adminEmail to get recruiterId
        const usersResult = await docClient.send(new ScanCommand({
          TableName: HRMS_USERS_TABLE,
          FilterExpression: 'email = :email',
          ExpressionAttributeValues: {
            ':email': company.adminEmail
          }
        }));

        if (!usersResult.Items || usersResult.Items.length === 0) {
          console.log(`⚠️  No HRMS user found for company ${company.companyId} (${company.adminEmail})`);
          errors++;
          continue;
        }

        const hrmsUser = usersResult.Items[0];
        
        // Check for recruiterId field (camelCase)
        const recruiterId = hrmsUser.recruiterId || hrmsUser.recruiter_id;
        
        if (!recruiterId) {
          console.log(`⚠️  HRMS user ${hrmsUser.email} has no recruiterId field`);
          errors++;
          continue;
        }

        // Update company with recruiterId (always use camelCase)
        await docClient.send(new UpdateCommand({
          TableName: COMPANIES_TABLE,
          Key: { companyId: company.companyId },
          UpdateExpression: 'SET recruiterId = :recruiterId, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':recruiterId': recruiterId,
            ':updatedAt': new Date().toISOString()
          }
        }));

        console.log(`✅ Updated ${company.companyId} → recruiterId: ${recruiterId}`);
        updated++;

      } catch (error) {
        console.error(`❌ Error processing company ${company.companyId}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('='.repeat(60));

    if (updated > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('💡 All companies now use consistent "recruiterId" field (camelCase)');
    } else if (errors > 0) {
      console.log('\n⚠️  Migration completed with errors. Please review above.');
    } else {
      console.log('\nℹ️  No companies needed migration.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  migrateCompanies()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateCompanies };
