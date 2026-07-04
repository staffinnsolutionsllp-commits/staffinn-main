/**
 * Migration Script: Add GST Number and PAN Number fields to Recruiter Profiles
 * 
 * This script adds gstNumber and panNumber fields to the recruiter-profiles table.
 * These fields are private and will not be exposed in public APIs.
 * 
 * Run this script once to update the database schema.
 */

require('dotenv').config();
const dynamoService = require('../services/dynamoService');

const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE || 'staffinn-recruiter-profiles';

async function addGstPanFields() {
  try {
    console.log('Starting migration: Adding GST and PAN fields to recruiter profiles...');
    console.log(`Target table: ${RECRUITER_PROFILES_TABLE}`);
    
    // Get all recruiter profiles
    const allProfiles = await dynamoService.scanItems(RECRUITER_PROFILES_TABLE);
    console.log(`Found ${allProfiles.length} recruiter profiles`);
    
    if (allProfiles.length === 0) {
      console.log('No recruiter profiles found. Migration complete.');
      return;
    }
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Update each profile to include the new fields (if not already present)
    for (const profile of allProfiles) {
      try {
        // Check if fields already exist
        if (profile.hasOwnProperty('gstNumber') && profile.hasOwnProperty('panNumber')) {
          console.log(`Profile ${profile.recruiterId} already has GST and PAN fields. Skipping...`);
          skippedCount++;
          continue;
        }
        
        // Add the new fields with empty string as default
        const updatedProfile = {
          ...profile,
          gstNumber: profile.gstNumber || '',
          panNumber: profile.panNumber || '',
          updatedAt: new Date().toISOString()
        };
        
        await dynamoService.putItem(RECRUITER_PROFILES_TABLE, updatedProfile);
        console.log(`✓ Updated profile for recruiter: ${profile.recruiterId}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`✗ Error updating profile ${profile.recruiterId}:`, error.message);
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`Total profiles: ${allProfiles.length}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  addGstPanFields()
    .then(() => {
      console.log('\nMigration script finished.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nMigration script failed:', error);
      process.exit(1);
    });
}

module.exports = { addGstPanFields };
