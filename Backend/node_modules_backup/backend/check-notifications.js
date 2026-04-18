const dynamoService = require('./services/dynamoService');
require('dotenv').config();

const NOTIFICATIONS_TABLE = 'staffinn-notifications';
const PENDING_PAYMENTS_TABLE = 'staffinn-pending-institute-payments';

const checkNotifications = async () => {
  try {
    console.log('🔍 Checking notifications in database...\n');
    
    // Get all notifications
    console.log('📊 Fetching all notifications...');
    const allNotifications = await dynamoService.scanItems(NOTIFICATIONS_TABLE);
    
    console.log(`✅ Found ${allNotifications.length} total notifications\n`);
    
    if (allNotifications.length === 0) {
      console.log('⚠️ No notifications found in database!');
      console.log('This means notifications are not being created.\n');
    } else {
      // Group by user
      const notificationsByUser = {};
      allNotifications.forEach(notif => {
        if (!notificationsByUser[notif.userId]) {
          notificationsByUser[notif.userId] = [];
        }
        notificationsByUser[notif.userId].push(notif);
      });
      
      console.log('📋 Notifications by user:\n');
      Object.keys(notificationsByUser).forEach(userId => {
        const userNotifs = notificationsByUser[userId];
        const unreadCount = userNotifs.filter(n => !n.read).length;
        
        console.log(`👤 User ID: ${userId}`);
        console.log(`   Total: ${userNotifs.length} | Unread: ${unreadCount}`);
        
        // Show recent notifications
        const recent = userNotifs.slice(0, 3);
        recent.forEach((notif, index) => {
          console.log(`\n   ${index + 1}. ${notif.title}`);
          console.log(`      Message: ${notif.message}`);
          console.log(`      Type: ${notif.type}`);
          console.log(`      Read: ${notif.read}`);
          console.log(`      Created: ${notif.createdAt}`);
        });
        console.log('\n' + '='.repeat(80) + '\n');
      });
    }
    
    // Check pending payments
    console.log('💰 Checking pending payments...\n');
    const allPayments = await dynamoService.scanItems(PENDING_PAYMENTS_TABLE);
    
    console.log(`✅ Found ${allPayments.length} pending payments\n`);
    
    if (allPayments.length > 0) {
      console.log('📋 Recent pending payments:\n');
      const recent = allPayments.slice(0, 5);
      recent.forEach((payment, index) => {
        console.log(`${index + 1}. ${payment.userName} - ${payment.courseName}`);
        console.log(`   Amount: ₹${payment.amount}`);
        console.log(`   Status: ${payment.paymentStatus}`);
        console.log(`   Institute: ${payment.instituteId}`);
        console.log(`   Created: ${payment.createdAt}\n`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking notifications:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

checkNotifications();
