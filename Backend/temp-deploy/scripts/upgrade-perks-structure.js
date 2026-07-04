/**
 * Migration Script: Upgrade Perks & Benefits Structure
 * 
 * This script upgrades existing perks from simple text format to enhanced format
 * with title, description, and image fields.
 * 
 * Old format: { text: 'Health insurance' }
 * New format: { title: 'Health Insurance', description: '...', image: '' }
 */

require('dotenv').config();
const dynamoService = require('../services/dynamoService');

const RECRUITER_PROFILES_TABLE = process.env.RECRUITER_PROFILES_TABLE || 'staffinn-recruiter-profiles';

async function upgradePerksStructure() {
  try {
    console.log('Starting migration: Upgrading Perks & Benefits structure...');
    console.log(`Target table: ${RECRUITER_PROFILES_TABLE}`);
    
    const allProfiles = await dynamoService.scanItems(RECRUITER_PROFILES_TABLE);
    console.log(`Found ${allProfiles.length} recruiter profiles`);
    
    if (allProfiles.length === 0) {
      console.log('No recruiter profiles found. Migration complete.');
      return;
    }
    
    let updatedCount = 0;
    let skippedCount = 0;
    let alreadyUpgradedCount = 0;
    
    for (const profile of allProfiles) {
      try {
        if (!profile.perks || profile.perks.length === 0) {
          console.log(`Profile ${profile.recruiterId} has no perks. Skipping...`);
          skippedCount++;
          continue;
        }
        
        // Check if already upgraded (has title field)
        if (profile.perks[0].title) {
          console.log(`Profile ${profile.recruiterId} already upgraded. Skipping...`);
          alreadyUpgradedCount++;
          continue;
        }
        
        // Upgrade perks from old format to new format
        const upgradedPerks = profile.perks.map(perk => {
          if (perk.text) {
            // Convert old format to new format
            return {
              title: perk.text,
              description: `${perk.text} provided to employees`,
              image: ''
            };
          }
          return perk; // Already in new format
        });
        
        const updatedProfile = {
          ...profile,
          perks: upgradedPerks,
          updatedAt: new Date().toISOString()
        };
        
        await dynamoService.putItem(RECRUITER_PROFILES_TABLE, updatedProfile);
        console.log(`✓ Upgraded perks for recruiter: ${profile.recruiterId}`);
        updatedCount++;
        
      } catch (error) {
        console.error(`✗ Error upgrading profile ${profile.recruiterId}:`, error.message);
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`Total profiles: ${allProfiles.length}`);
    console.log(`Upgraded: ${updatedCount}`);
    console.log(`Already upgraded: ${alreadyUpgradedCount}`);
    console.log(`Skipped (no perks): ${skippedCount}`);
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  upgradePerksStructure()
    .then(() => {
      console.log('\nMigration script finished.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nMigration script failed:', error);
      process.exit(1);
    });
}

module.exports = { upgradePerksStructure };
