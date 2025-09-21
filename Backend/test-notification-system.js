/**
 * Test Notification System
 * Simple test to verify the notification workflow
 */

const { v4: uuidv4 } = require('uuid');

// Mock notification data
const testNotification = {
  title: 'Welcome to Staffinn!',
  message: 'This is a test notification from the Master Admin Panel.',
  targetAudience: 'all'
};

// Mock users data
const mockUsers = [
  { userId: 'user1', role: 'staff', email: 'staff@test.com' },
  { userId: 'user2', role: 'recruiter', email: 'recruiter@test.com' },
  { userId: 'user3', role: 'institute', email: 'institute@test.com' }
];

// Simulate notification creation
const createNotifications = (notificationData, targetUsers) => {
  const notifications = [];
  const notificationId = uuidv4();
  const timestamp = new Date().toISOString();

  for (const user of targetUsers) {
    const userNotificationId = `${notificationId}_${user.userId}`;
    
    const notification = {
      notificationsId: userNotificationId,
      userId: user.userId,
      title: notificationData.title,
      message: notificationData.message,
      targetAudience: notificationData.targetAudience,
      isRead: false,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    notifications.push(notification);
  }

  return notifications;
};

// Test the notification system
console.log('🧪 Testing Notification System...\n');

console.log('📝 Test Notification Data:');
console.log(JSON.stringify(testNotification, null, 2));

console.log('\n👥 Mock Users:');
mockUsers.forEach(user => {
  console.log(`- ${user.role}: ${user.email} (${user.userId})`);
});

console.log('\n🔔 Generated Notifications:');
const notifications = createNotifications(testNotification, mockUsers);
notifications.forEach(notif => {
  console.log(`- ${notif.notificationsId}: ${notif.title} → ${notif.userId}`);
});

console.log('\n✅ Notification system test completed!');
console.log(`📊 Total notifications created: ${notifications.length}`);

module.exports = { createNotifications };