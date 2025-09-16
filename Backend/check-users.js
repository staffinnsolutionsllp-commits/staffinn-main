/**
 * Check existing users in the system
 */
const dynamoService = require('./services/dynamoService');

const USERS_TABLE = 'staffinn-users';

async function checkUsers() {
  try {
    console.log('👥 Checking existing users...\n');

    const allUsers = await dynamoService.scanItems(USERS_TABLE);
    console.log(`Found ${allUsers.length} users in database`);

    if (allUsers.length > 0) {
      console.log('\n📋 User List:');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.fullName || user.name || 'No Name'}`);
        console.log(`   ID: ${user.userId}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('---');
      });

      // Find staff users
      const staffUsers = allUsers.filter(user => user.role === 'staff');
      console.log(`\n👨‍💼 Staff Users: ${staffUsers.length}`);
      
      if (staffUsers.length > 0) {
        console.log('First staff user ID:', staffUsers[0].userId);
        return staffUsers[0].userId;
      }
    } else {
      console.log('No users found in database');
    }

    return null;
  } catch (error) {
    console.error('❌ Error checking users:', error);
    return null;
  }
}

// Run the check
checkUsers().then(staffUserId => {
  if (staffUserId) {
    console.log(`\n✅ Use this staff user ID for testing: ${staffUserId}`);
  }
});