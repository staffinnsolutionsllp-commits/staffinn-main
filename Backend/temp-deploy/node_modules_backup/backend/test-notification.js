const dynamoService = require('./services/dynamoService');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const NOTIFICATIONS_TABLE = 'staffinn-notifications';

const testNotification = async () => {
  try {
    console.log('🧪 Testing notification creation...');
    
    // Get institute ID from command line or use default
    const instituteId = process.argv[2] || 'test-institute-id';
    
    console.log('📝 Creating test notification for institute:', instituteId);
    
    const notification = {
      notificationId: uuidv4(),
      userId: instituteId,
      type: 'pending_payment',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working',
      data: {
        testData: 'test'
      },
      read: false,
      createdAt: new Date().toISOString()
    };
    
    console.log('💾 Saving notification to DynamoDB...');
    await dynamoService.putItem(NOTIFICATIONS_TABLE, notification);
    
    console.log('✅ Notification created successfully!');
    console.log('📊 Notification details:', JSON.stringify(notification, null, 2));
    
    // Try to fetch it back
    console.log('\n🔍 Fetching notification back...');
    const fetchedNotification = await dynamoService.getItem(NOTIFICATIONS_TABLE, {
      notificationId: notification.notificationId
    });
    
    if (fetchedNotification) {
      console.log('✅ Notification fetched successfully!');
      console.log('📊 Fetched data:', JSON.stringify(fetchedNotification, null, 2));
    } else {
      console.log('❌ Failed to fetch notification back');
    }
    
    // Fetch all notifications for this user
    console.log('\n🔍 Fetching all notifications for user:', instituteId);
    const allNotifications = await dynamoService.scanItems(NOTIFICATIONS_TABLE);
    const userNotifications = allNotifications.filter(n => n.userId === instituteId);
    
    console.log('📊 Total notifications for user:', userNotifications.length);
    console.log('📊 Unread notifications:', userNotifications.filter(n => !n.read).length);
    
    if (userNotifications.length > 0) {
      console.log('\n📋 User notifications:');
      userNotifications.forEach((notif, index) => {
        console.log(`\n${index + 1}. ${notif.title}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Read: ${notif.read}`);
        console.log(`   Created: ${notif.createdAt}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing notification:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

testNotification();
