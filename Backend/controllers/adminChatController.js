const MessageModel = require('../models/messageModel');
const UserModel = require('../models/userModel');

class AdminChatController {
  /**
   * Get all conversations for admin monitoring
   */
  static async getAllConversations(req, res) {
    try {
      // Get all messages from the database
      const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
      const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
      
      const client = new DynamoDBClient({ region: process.env.AWS_REGION });
      const docClient = DynamoDBDocumentClient.from(client);
      
      const command = new ScanCommand({
        TableName: 'Messages'
      });
      
      const result = await docClient.send(command);
      const messages = result.Items || [];
      
      // Group messages by conversation pairs
      const conversationMap = new Map();
      
      for (const message of messages) {
        const { senderId, receiverId } = message;
        
        // Create a consistent conversation key (smaller ID first)
        const conversationKey = senderId < receiverId 
          ? `${senderId}-${receiverId}` 
          : `${receiverId}-${senderId}`;
        
        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            user1Id: senderId < receiverId ? senderId : receiverId,
            user2Id: senderId < receiverId ? receiverId : senderId,
            messages: [],
            lastMessageAt: message.createdAt,
            messageCount: 0
          });
        }
        
        const conversation = conversationMap.get(conversationKey);
        conversation.messages.push(message);
        conversation.messageCount++;
        
        // Update last message time if this message is newer
        if (new Date(message.createdAt) > new Date(conversation.lastMessageAt)) {
          conversation.lastMessageAt = message.createdAt;
        }
      }
      
      // Get user details for each conversation
      const conversations = [];
      
      for (const [key, conversation] of conversationMap) {
        try {
          const [user1, user2] = await Promise.all([
            UserModel.getUserById(conversation.user1Id),
            UserModel.getUserById(conversation.user2Id)
          ]);
          
          if (user1 && user2) {
            // Get user types (check if they're active staff or just seekers)
            let user1Type = 'seeker';
            let user2Type = 'seeker';
            
            if (user1.role === 'recruiter') {
              user1Type = 'recruiter';
            } else if (user1.role === 'institute') {
              user1Type = 'institute';
            } else {
              // Check if they're active staff
              try {
                const StaffModel = require('../models/staffModel');
                const staffProfile = await StaffModel.getStaffProfile(user1.userId);
                if (staffProfile && staffProfile.isActiveStaff === true) {
                  user1Type = 'staff';
                }
              } catch (error) {
                // If error, keep as seeker
              }
            }
            
            if (user2.role === 'recruiter') {
              user2Type = 'recruiter';
            } else if (user2.role === 'institute') {
              user2Type = 'institute';
            } else {
              // Check if they're active staff
              try {
                const StaffModel = require('../models/staffModel');
                const staffProfile = await StaffModel.getStaffProfile(user2.userId);
                if (staffProfile && staffProfile.isActiveStaff === true) {
                  user2Type = 'staff';
                }
              } catch (error) {
                // If error, keep as seeker
              }
            }
            
            conversations.push({
              user1Id: conversation.user1Id,
              user1Name: user1.name || user1.fullName || 'Unknown User',
              user1Email: user1.email,
              user1Type: user1Type,
              user2Id: conversation.user2Id,
              user2Name: user2.name || user2.fullName || 'Unknown User',
              user2Email: user2.email,
              user2Type: user2Type,
              messageCount: conversation.messageCount,
              lastMessageAt: conversation.lastMessageAt
            });
          }
        } catch (error) {
          console.error('Error fetching user details for conversation:', error);
          // Skip this conversation if we can't get user details
        }
      }
      
      // Sort by last message time (most recent first)
      conversations.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      
      res.json({
        success: true,
        data: conversations
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversations'
      });
    }
  }

  /**
   * Get chat history between two specific users
   */
  static async getChatHistory(req, res) {
    try {
      const { user1Id, user2Id } = req.params;
      
      if (!user1Id || !user2Id) {
        return res.status(400).json({
          success: false,
          message: 'Both user IDs are required'
        });
      }
      
      // Get conversation messages
      const messages = await MessageModel.getConversation(user1Id, user2Id);
      
      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Error fetching chat history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chat history'
      });
    }
  }
}

module.exports = AdminChatController;