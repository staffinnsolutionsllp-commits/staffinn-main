/**
 * Migration script to add isVisible field to existing recruiter news
 */

const RecruiterNewsModel = require('./models/recruiterNewsModel');

async function migrateRecruiterNewsVisibility() {
  try {
    console.log('Starting migration to add isVisible field to existing recruiter news...');
    
    // Get all existing news
    const result = await RecruiterNewsModel.getAll();
    
    if (!result.success) {
      console.log('No existing news found or error occurred:', result.message);
      return;
    }
    
    const newsItems = result.data;
    console.log(`Found ${newsItems.length} existing news items`);
    
    let updatedCount = 0;
    
    for (const news of newsItems) {
      // Only update if isVisible is not already set
      if (news.isVisible === undefined || news.isVisible === null) {
        try {
          await RecruiterNewsModel.update(news.recruiterNewsID, { isVisible: true });
          updatedCount++;
          console.log(`Updated news: ${news.title}`);
        } catch (error) {
          console.error(`Failed to update news ${news.recruiterNewsID}:`, error.message);
        }
      }
    }
    
    console.log(`Migration completed. Updated ${updatedCount} news items.`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateRecruiterNewsVisibility();
}

module.exports = { migrateRecruiterNewsVisibility };