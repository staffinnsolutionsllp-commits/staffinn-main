/**
 * Delete Invalid Users Script
 * Removes users with missing email or role
 */

require('dotenv').config();
const dynamoService = require('./services/dynamoService');

const USERS_TABLE = process.env.DYNAMODB_USERS_TABLE;

const deleteInvalidUsers = async () => {
  try {
    console.log('Starting invalid users deletion...');
    
    // Get all users
    const allUsers = await dynamoService.scanItems(USERS_TABLE);
    console.log(`Found ${allUsers.length} users to check`);
    
    let deletedCount = 0;
    
    for (const user of allUsers) {
      // Check if user has required fields
      if (!user.email || !user.role || !user.userId) {
        console.log(`Deleting invalid user: ${user.userId} (email: ${user.email}, role: ${user.role})`);
        
        // Delete invalid user
        await dynamoService.deleteItem(USERS_TABLE, { userId: user.userId });
        deletedCount++;
        
        console.log(`✓ Deleted invalid user: ${user.userId}`);
      }
    }
    
    console.log(`✅ Deleted ${deletedCount} invalid users`);
    console.log(`Remaining users: ${allUsers.length - deletedCount}`);
    
  } catch (error) {
    console.error('❌ Error during deletion:', error);
    process.exit(1);
  }
};

// Run deletion if this script is executed directly
if (require.main === module) {
  deleteInvalidUsers()
    .then(() => {
      console.log('Deletion script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Deletion script failed:', error);
      process.exit(1);
    });
}

module.exports = { deleteInvalidUsers };