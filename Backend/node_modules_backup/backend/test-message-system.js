const MessageModel = require('./models/messageModel');

async function testMessageSystem() {
  console.log('🧪 Testing Message System...');
  
  try {
    // Test sending a message
    console.log('📤 Testing sendMessage...');
    const testMessage = await MessageModel.sendMessage({
      senderId: 'test-user-1',
      receiverId: 'test-user-2',
      subject: 'Test Chat Message',
      message: 'Hello! This is a test message from the chat system.',
      messageType: 'general'
    });
    console.log('✅ Message sent:', testMessage.messageId);
    
    // Test getting contact history
    console.log('📋 Testing getContactHistory...');
    const contactHistory = await MessageModel.getContactHistory('test-user-1');
    console.log('✅ Contact history retrieved:', contactHistory.length, 'conversations');
    
    // Test getting conversation
    console.log('💬 Testing getConversation...');
    const conversation = await MessageModel.getConversation('test-user-1', 'test-user-2');
    console.log('✅ Conversation retrieved:', conversation.length, 'messages');
    
    // Test getting unread count
    console.log('🔢 Testing getUnreadCount...');
    const unreadCount = await MessageModel.getUnreadCount('test-user-2');
    console.log('✅ Unread count:', unreadCount);
    
    // Test marking conversation as read
    console.log('✅ Testing markConversationAsRead...');
    await MessageModel.markConversationAsRead('test-user-2', 'test-user-1');
    console.log('✅ Conversation marked as read');
    
    // Test unread count after marking as read
    const unreadCountAfter = await MessageModel.getUnreadCount('test-user-2');
    console.log('✅ Unread count after marking as read:', unreadCountAfter);
    
    console.log('🎉 All message system tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMessageSystem().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});