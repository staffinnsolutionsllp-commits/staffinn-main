const MessageModel = require('../models/messageModel');
const UserModel = require('../models/userModel');

class MessageController {
  static async sendMessage(req, res) {
    try {
      const { receiverId, subject, message, messageType, attachments } = req.body;
      const senderId = req.user.userId;

      // Validate required fields
      if (!receiverId || !message) {
        return res.status(400).json({
          success: false,
          message: 'Receiver ID and message are required'
        });
      }

      // Check if receiver exists
      const receiver = await UserModel.getUserById(receiverId);
      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: 'Receiver not found'
        });
      }

      const messageData = {
        senderId,
        receiverId,
        subject,
        message,
        messageType: messageType || 'general',
        attachments: attachments || []
      };

      const newMessage = await MessageModel.sendMessage(messageData);

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: newMessage
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message'
      });
    }
  }

  static async sendFileMessage(req, res) {
    try {
      const { receiverId, fileType, sendTextMessage } = req.body;
      const senderId = req.user.userId;
      const file = req.file;

      if (!receiverId || !file) {
        return res.status(400).json({
          success: false,
          message: 'Receiver ID and file are required'
        });
      }

      // Check if receiver exists
      const receiver = await UserModel.getUserById(receiverId);
      if (!receiver) {
        return res.status(404).json({
          success: false,
          message: 'Receiver not found'
        });
      }

      // Upload file to S3
      const s3Service = require('../services/s3Service');
      const fileKey = `chat-files/${senderId}/${receiverId}/${Date.now()}-${file.originalname}`;
      const uploadResult = await s3Service.uploadFile(file, fileKey);

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload file'
        });
      }

      // Create message with attachment (no text message unless explicitly requested)
      const shouldSendText = sendTextMessage === 'true';
      const messageData = {
        senderId,
        receiverId,
        subject: `File: ${file.originalname}`,
        message: shouldSendText ? `Sent a ${fileType}` : '', // Empty message if not requested
        messageType: 'file',
        attachments: [{
          url: uploadResult.url,
          fileName: file.originalname,
          fileType: fileType,
          fileSize: file.size,
          mimeType: file.mimetype
        }]
      };

      const newMessage = await MessageModel.sendMessage(messageData);

      res.status(201).json({
        success: true,
        message: 'File sent successfully',
        data: newMessage
      });
    } catch (error) {
      console.error('Error sending file message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send file message'
      });
    }
  }

  static async getInboxMessages(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 20, lastEvaluatedKey } = req.query;

      const result = await MessageModel.getInboxMessages(
        userId, 
        parseInt(limit), 
        lastEvaluatedKey ? JSON.parse(lastEvaluatedKey) : null
      );

      // Get sender details for each message
      const messagesWithSenderInfo = await Promise.all(
        result.messages.map(async (message) => {
          const sender = await UserModel.getUserById(message.senderId);
          return {
            ...message,
            senderName: sender ? sender.name : 'Unknown User',
            senderEmail: sender ? sender.email : 'unknown@email.com'
          };
        })
      );

      res.json({
        success: true,
        data: {
          messages: messagesWithSenderInfo,
          lastEvaluatedKey: result.lastEvaluatedKey
        }
      });
    } catch (error) {
      console.error('Error fetching inbox messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inbox messages'
      });
    }
  }

  static async getSentMessages(req, res) {
    try {
      const userId = req.user.userId;
      const { limit = 20, lastEvaluatedKey } = req.query;

      const result = await MessageModel.getSentMessages(
        userId, 
        parseInt(limit), 
        lastEvaluatedKey ? JSON.parse(lastEvaluatedKey) : null
      );

      // Get receiver details for each message
      const messagesWithReceiverInfo = await Promise.all(
        result.messages.map(async (message) => {
          const receiver = await UserModel.getUserById(message.receiverId);
          return {
            ...message,
            receiverName: receiver ? receiver.name : 'Unknown User',
            receiverEmail: receiver ? receiver.email : 'unknown@email.com'
          };
        })
      );

      res.json({
        success: true,
        data: {
          messages: messagesWithReceiverInfo,
          lastEvaluatedKey: result.lastEvaluatedKey
        }
      });
    } catch (error) {
      console.error('Error fetching sent messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sent messages'
      });
    }
  }

  static async getMessage(req, res) {
    try {
      const { messageId, createdAt } = req.params;
      const userId = req.user.userId;

      const message = await MessageModel.getMessage(messageId, createdAt);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Check if user is sender or receiver
      if (message.senderId !== userId && message.receiverId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get sender and receiver details
      const [sender, receiver] = await Promise.all([
        UserModel.getUserById(message.senderId),
        UserModel.getUserById(message.receiverId)
      ]);

      const messageWithDetails = {
        ...message,
        senderName: sender ? sender.name : 'Unknown User',
        senderEmail: sender ? sender.email : 'unknown@email.com',
        receiverName: receiver ? receiver.name : 'Unknown User',
        receiverEmail: receiver ? receiver.email : 'unknown@email.com'
      };

      res.json({
        success: true,
        data: messageWithDetails
      });
    } catch (error) {
      console.error('Error fetching message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch message'
      });
    }
  }

  static async markAsRead(req, res) {
    try {
      const { messageId, createdAt } = req.params;
      const userId = req.user.userId;

      const message = await MessageModel.getMessage(messageId, createdAt);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Only receiver can mark as read
      if (message.receiverId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await MessageModel.markAsRead(messageId, createdAt);

      res.json({
        success: true,
        message: 'Message marked as read'
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark message as read'
      });
    }
  }

  static async deleteMessage(req, res) {
    try {
      const { messageId, createdAt } = req.params;
      const { deleteType } = req.body; // 'forMe' or 'forEveryone'
      const userId = req.user.userId;

      const message = await MessageModel.getMessage(messageId, createdAt);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Only sender or receiver can delete
      if (message.senderId !== userId && message.receiverId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (deleteType === 'forEveryone') {
        // Only sender can delete for everyone
        if (message.senderId !== userId) {
          return res.status(403).json({
            success: false,
            message: 'Only sender can delete for everyone'
          });
        }

        // Check if message has been read
        if (message.status === 'read') {
          return res.status(403).json({
            success: false,
            message: 'Cannot delete for everyone after message has been read'
          });
        }

        // Mark as deleted for everyone
        await MessageModel.deleteForEveryone(messageId, createdAt);
      } else {
        // Delete for me only
        await MessageModel.deleteForUser(messageId, createdAt, userId);
      }

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete message'
      });
    }
  }

  static async editMessage(req, res) {
    try {
      const { messageId, createdAt } = req.params;
      const { newMessage } = req.body;
      const userId = req.user.userId;

      if (!newMessage || !newMessage.trim()) {
        return res.status(400).json({
          success: false,
          message: 'New message text is required'
        });
      }

      const message = await MessageModel.getMessage(messageId, createdAt);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Only sender can edit
      if (message.senderId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only sender can edit message'
        });
      }

      // Check if message has been read
      if (message.status === 'read') {
        return res.status(403).json({
          success: false,
          message: 'Cannot edit message after it has been read'
        });
      }

      // Only text messages can be edited
      if (message.messageType === 'file') {
        return res.status(400).json({
          success: false,
          message: 'Cannot edit file messages'
        });
      }

      await MessageModel.editMessage(messageId, createdAt, newMessage.trim());

      res.json({
        success: true,
        message: 'Message edited successfully',
        data: {
          messageId,
          createdAt,
          newMessage: newMessage.trim()
        }
      });
    } catch (error) {
      console.error('Error editing message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to edit message'
      });
    }
  }

  static async deleteMultipleMessages(req, res) {
    try {
      const { messages, deleteType } = req.body; // messages: [{messageId, createdAt}]
      const userId = req.user.userId;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Messages array is required'
        });
      }

      const results = [];
      for (const msg of messages) {
        try {
          const message = await MessageModel.getMessage(msg.messageId, msg.createdAt);
          
          if (!message) {
            results.push({ messageId: msg.messageId, success: false, reason: 'Not found' });
            continue;
          }

          // Check access
          if (message.senderId !== userId && message.receiverId !== userId) {
            results.push({ messageId: msg.messageId, success: false, reason: 'Access denied' });
            continue;
          }

          if (deleteType === 'forEveryone') {
            if (message.senderId !== userId) {
              results.push({ messageId: msg.messageId, success: false, reason: 'Only sender can delete for everyone' });
              continue;
            }

            if (message.status === 'read') {
              results.push({ messageId: msg.messageId, success: false, reason: 'Message already read' });
              continue;
            }

            await MessageModel.deleteForEveryone(msg.messageId, msg.createdAt);
          } else {
            await MessageModel.deleteForUser(msg.messageId, msg.createdAt, userId);
          }

          results.push({ messageId: msg.messageId, success: true });
        } catch (error) {
          results.push({ messageId: msg.messageId, success: false, reason: error.message });
        }
      }

      res.json({
        success: true,
        message: 'Bulk delete completed',
        data: results
      });
    } catch (error) {
      console.error('Error deleting multiple messages:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete messages'
      });
    }
  }

  static async getUnreadCount(req, res) {
    try {
      const userId = req.user.userId;
      const count = await MessageModel.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count'
      });
    }
  }

  static async getConversation(req, res) {
    try {
      const { userId: otherUserId } = req.params;
      const userId = req.user.userId;
      const { limit = 20 } = req.query;

      const messages = await MessageModel.getConversation(userId, otherUserId, parseInt(limit));

      // Mark conversation as read when fetching
      await MessageModel.markConversationAsRead(userId, otherUserId);

      // Get user details
      const otherUser = await UserModel.getUserById(otherUserId);
      
      res.json({
        success: true,
        data: {
          messages,
          otherUser: otherUser ? {
            userId: otherUser.userId,
            name: otherUser.name,
            email: otherUser.email,
            userType: otherUser.userType
          } : null
        }
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversation'
      });
    }
  }

  static async getContactHistory(req, res) {
    try {
      const userId = req.user.userId;
      
      const conversations = await MessageModel.getContactHistory(userId);
      
      // Get user details for each conversation partner
      const conversationsWithUserInfo = await Promise.all(
        conversations.map(async (conversation) => {
          const partner = await UserModel.getUserById(conversation.partnerId);
          
          // Get additional profile info based on user type
          let profilePhoto = null;
          let fullName = partner ? (partner.name || partner.fullName) : 'Unknown User';
          
          if (partner) {
            try {
              // Check if user is a recruiter first
              if (partner.userType === 'recruiter' || partner.role === 'recruiter') {
                const RecruiterModel = require('../models/recruiterModel');
                const recruiterProfile = await RecruiterModel.getRecruiterById(partner.userId);
                if (recruiterProfile) {
                  profilePhoto = recruiterProfile.profilePhoto;
                  fullName = recruiterProfile.companyName || recruiterProfile.recruiterName || partner.name || partner.fullName || 'Recruiter';
                }
              } else {
                // For all other users, check staff profile to get photo and determine if they're active staff
                const StaffModel = require('../models/staffModel');
                const staffProfile = await StaffModel.getStaffProfile(partner.userId);
                if (staffProfile) {
                  profilePhoto = staffProfile.profilePhoto;
                  fullName = staffProfile.fullName || staffProfile.name || partner.name || partner.fullName || 'User';
                }
              }
            } catch (error) {
              // If profile fetch fails, use basic user info
              console.log('Could not fetch detailed profile for user:', partner.userId, error.message);
            }
          }
          
          // Determine actual user type based on profile data
          let actualUserType = 'user';
          if (partner) {
            if (partner.userType === 'recruiter' || partner.role === 'recruiter') {
              actualUserType = 'recruiter';
            } else {
              // Check if user is active staff or just a seeker
              try {
                const StaffModel = require('../models/staffModel');
                const staffProfile = await StaffModel.getStaffProfile(partner.userId);
                if (staffProfile && staffProfile.isActiveStaff === true) {
                  actualUserType = 'staff';
                } else {
                  actualUserType = 'seeker';
                }
              } catch (error) {
                actualUserType = 'seeker'; // Default to seeker if can't determine
              }
            }
          }
          
          return {
            ...conversation,
            partnerName: fullName,
            partnerEmail: partner ? partner.email : 'unknown@email.com',
            partnerUserType: actualUserType,
            partnerProfilePhoto: profilePhoto
          };
        })
      );
      
      res.json({
        success: true,
        data: conversationsWithUserInfo
      });
    } catch (error) {
      console.error('Error fetching contact history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch contact history'
      });
    }
  }

  static async getConversationUnreadCount(req, res) {
    try {
      const { userId: otherUserId } = req.params;
      const userId = req.user.userId;
      
      const count = await MessageModel.getConversationUnreadCount(userId, otherUserId);
      
      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      console.error('Error fetching conversation unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch unread count'
      });
    }
  }
}

module.exports = MessageController;