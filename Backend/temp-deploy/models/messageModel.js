const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'Messages';

class MessageModel {
  static async sendMessage(messageData) {
    const messageId = uuidv4();
    const createdAt = new Date().toISOString();
    
    const item = {
      messageId,
      senderId: messageData.senderId,
      receiverId: messageData.receiverId,
      subject: messageData.subject || 'Chat Message',
      message: messageData.message,
      messageType: messageData.messageType || 'general',
      status: 'unread', // Changed from 'sent' to 'unread' for proper tracking
      createdAt,
      updatedAt: createdAt,
      attachments: messageData.attachments || []
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    });

    await docClient.send(command);
    return item;
  }

  static async getInboxMessages(userId, limit = 20, lastEvaluatedKey = null) {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'receiverId = :receiverId',
      ExpressionAttributeValues: {
        ':receiverId': userId
      },
      ScanIndexForward: false,
      Limit: limit
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const command = new ScanCommand(params);
    const result = await docClient.send(command);
    
    // Sort by createdAt descending
    result.Items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return {
      messages: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey
    };
  }

  static async getSentMessages(userId, limit = 20, lastEvaluatedKey = null) {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'senderId = :senderId',
      ExpressionAttributeValues: {
        ':senderId': userId
      },
      ScanIndexForward: false,
      Limit: limit
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    const command = new ScanCommand(params);
    const result = await docClient.send(command);
    
    // Sort by createdAt descending
    result.Items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return {
      messages: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey
    };
  }

  static async getMessage(messageId, createdAt) {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'messageId = :messageId AND createdAt = :createdAt',
      ExpressionAttributeValues: {
        ':messageId': messageId,
        ':createdAt': createdAt
      }
    });

    const result = await docClient.send(command);
    return result.Items[0] || null;
  }

  static async markAsRead(messageId, createdAt) {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        messageId,
        createdAt
      },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'read',
        ':updatedAt': new Date().toISOString()
      }
    });

    await docClient.send(command);
  }

  // Mark all messages in a conversation as read
  static async markConversationAsRead(userId, otherUserId) {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'senderId = :otherUserId AND receiverId = :userId AND #status = :unreadStatus',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':otherUserId': otherUserId,
        ':unreadStatus': 'unread'
      }
    });

    const result = await docClient.send(command);
    
    // Update each unread message to read
    for (const message of result.Items) {
      await this.markAsRead(message.messageId, message.createdAt);
    }
  }

  static async deleteMessage(messageId, createdAt) {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        messageId,
        createdAt
      }
    });

    await docClient.send(command);
  }

  static async deleteForEveryone(messageId, createdAt) {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        messageId,
        createdAt
      },
      UpdateExpression: 'SET deletedForEveryone = :true, message = :deletedMsg, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':true': true,
        ':deletedMsg': 'Message Deleted',
        ':updatedAt': new Date().toISOString()
      }
    });

    await docClient.send(command);
  }

  static async deleteForUser(messageId, createdAt, userId) {
    const message = await this.getMessage(messageId, createdAt);
    
    if (!message) return;

    const deletedForField = message.senderId === userId ? 'deletedForSender' : 'deletedForReceiver';

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        messageId,
        createdAt
      },
      UpdateExpression: `SET ${deletedForField} = :true, updatedAt = :updatedAt`,
      ExpressionAttributeValues: {
        ':true': true,
        ':updatedAt': new Date().toISOString()
      }
    });

    await docClient.send(command);
  }

  static async editMessage(messageId, createdAt, newMessage) {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        messageId,
        createdAt
      },
      UpdateExpression: 'SET message = :message, edited = :edited, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':message': newMessage,
        ':edited': true,
        ':updatedAt': new Date().toISOString()
      }
    });

    await docClient.send(command);
  }

  static async getUnreadCount(userId) {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'receiverId = :receiverId AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':receiverId': userId,
        ':status': 'unread'
      },
      Select: 'COUNT'
    });

    const result = await docClient.send(command);
    return result.Count || 0;
  }

  // Get unread count for specific conversation
  static async getConversationUnreadCount(userId, otherUserId) {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'senderId = :otherUserId AND receiverId = :userId AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':otherUserId': otherUserId,
        ':status': 'unread'
      },
      Select: 'COUNT'
    });

    const result = await docClient.send(command);
    return result.Count || 0;
  }

  static async getConversation(userId1, userId2, limit = 50) {
    // Scan ALL messages between these two users — no Limit on ScanCommand
    // because ScanCommand Limit = items scanned, not items returned, which
    // causes newer messages to be missed when they happen to be in unscanned pages.
    let allItems = [];
    let lastEvaluatedKey = null;

    do {
      const params = {
        TableName: TABLE_NAME,
        FilterExpression: '(senderId = :user1 AND receiverId = :user2) OR (senderId = :user2 AND receiverId = :user1)',
        ExpressionAttributeValues: {
          ':user1': userId1,
          ':user2': userId2
        }
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const command = new ScanCommand(params);
      const result = await docClient.send(command);
      allItems = allItems.concat(result.Items || []);
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);
    
    // Filter out messages deleted for current user
    const filteredMessages = allItems.filter(msg => {
      if (msg.deletedForEveryone) return true;
      if (msg.deletedForSender && msg.senderId === userId1) return false;
      if (msg.deletedForReceiver && msg.receiverId === userId1) return false;
      return true;
    });
    
    // Sort ascending for conversation view, then take latest `limit` messages
    filteredMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Return last N messages so UI shows the most recent ones
    return filteredMessages.slice(-limit);
  }

  // Get contact history with conversation partners
  static async getContactHistory(userId) {
    // Must paginate through ALL pages — ScanCommand without Limit
    // can still return a LastEvaluatedKey when the result set is large.
    let allItems = [];
    let lastEvaluatedKey = null;

    do {
      const params = {
        TableName: TABLE_NAME,
        FilterExpression: 'senderId = :userId OR receiverId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      };

      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }

      const command = new ScanCommand(params);
      const result = await docClient.send(command);
      allItems = allItems.concat(result.Items || []);
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    // Group messages by conversation partner
    const conversations = new Map();
    
    allItems.forEach(message => {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          partnerId,
          messages: [],
          lastMessage: null,
          unreadCount: 0
        });
      }
      
      const conversation = conversations.get(partnerId);
      conversation.messages.push(message);
      
      // Update last message if this one is newer
      if (!conversation.lastMessage || new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)) {
        conversation.lastMessage = message;
      }
      
      // Count unread messages (messages sent to current user that are unread)
      if (message.receiverId === userId && message.status === 'unread') {
        conversation.unreadCount++;
      }
    });
    
    // Convert to array and sort by last message time (most recent first)
    return Array.from(conversations.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
  }
}

module.exports = MessageModel;