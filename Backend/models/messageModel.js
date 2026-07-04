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
      status: 'unread',
      createdAt,
      updatedAt: createdAt,
      attachments: messageData.attachments || []
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return item;
  }

  static async getInboxMessages(userId, limit = 20, lastEvaluatedKey = null) {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'receiverId = :receiverId',
      ExpressionAttributeValues: { ':receiverId': userId },
      Limit: limit
    };
    if (lastEvaluatedKey) params.ExclusiveStartKey = lastEvaluatedKey;
    const command = new ScanCommand(params);
    const result = await docClient.send(command);
    result.Items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { messages: result.Items, lastEvaluatedKey: result.LastEvaluatedKey };
  }

  static async getSentMessages(userId, limit = 20, lastEvaluatedKey = null) {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'senderId = :senderId',
      ExpressionAttributeValues: { ':senderId': userId },
      Limit: limit
    };
    if (lastEvaluatedKey) params.ExclusiveStartKey = lastEvaluatedKey;
    const command = new ScanCommand(params);
    const result = await docClient.send(command);
    result.Items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { messages: result.Items, lastEvaluatedKey: result.LastEvaluatedKey };
  }

  static async getMessage(messageId, createdAt) {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'messageId = :messageId AND createdAt = :createdAt',
      ExpressionAttributeValues: { ':messageId': messageId, ':createdAt': createdAt }
    }));
    return result.Items[0] || null;
  }

  static async markAsRead(messageId, createdAt) {
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { messageId, createdAt },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': 'read', ':updatedAt': new Date().toISOString() }
    }));
  }

  static async markConversationAsRead(userId, otherUserId) {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'senderId = :otherUserId AND receiverId = :userId AND #status = :unreadStatus',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':userId': userId, ':otherUserId': otherUserId, ':unreadStatus': 'unread' }
    });
    const result = await docClient.send(command);
    for (const message of result.Items) {
      await this.markAsRead(message.messageId, message.createdAt);
    }
  }

  static async deleteMessage(messageId, createdAt) {
    await docClient.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { messageId, createdAt } }));
  }

  static async deleteForEveryone(messageId, createdAt) {
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { messageId, createdAt },
      UpdateExpression: 'SET deletedForEveryone = :true, message = :deletedMsg, updatedAt = :updatedAt',
      ExpressionAttributeValues: { ':true': true, ':deletedMsg': 'Message Deleted', ':updatedAt': new Date().toISOString() }
    }));
  }

  static async deleteForUser(messageId, createdAt, userId) {
    const message = await this.getMessage(messageId, createdAt);
    if (!message) return;
    const deletedForField = message.senderId === userId ? 'deletedForSender' : 'deletedForReceiver';
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { messageId, createdAt },
      UpdateExpression: `SET ${deletedForField} = :true, updatedAt = :updatedAt`,
      ExpressionAttributeValues: { ':true': true, ':updatedAt': new Date().toISOString() }
    }));
  }

  static async editMessage(messageId, createdAt, newMessage) {
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { messageId, createdAt },
      UpdateExpression: 'SET message = :message, edited = :edited, updatedAt = :updatedAt',
      ExpressionAttributeValues: { ':message': newMessage, ':edited': true, ':updatedAt': new Date().toISOString() }
    }));
  }

  static async getUnreadCount(userId) {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'receiverId = :receiverId AND #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':receiverId': userId, ':status': 'unread' },
      Select: 'COUNT'
    });
    const result = await docClient.send(command);
    return result.Count || 0;
  }

  static async getConversationUnreadCount(userId, otherUserId) {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'senderId = :otherUserId AND receiverId = :userId AND #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':userId': userId, ':otherUserId': otherUserId, ':status': 'unread' },
      Select: 'COUNT'
    });
    const result = await docClient.send(command);
    return result.Count || 0;
  }

  static async getConversation(userId1, userId2, limit = 50) {
    // Paginated scan — needed because ScanCommand Limit = items scanned, not returned
    let allItems = [];
    let lastEvaluatedKey = null;
    do {
      const params = {
        TableName: TABLE_NAME,
        FilterExpression: '(senderId = :user1 AND receiverId = :user2) OR (senderId = :user2 AND receiverId = :user1)',
        ExpressionAttributeValues: { ':user1': userId1, ':user2': userId2 }
      };
      if (lastEvaluatedKey) params.ExclusiveStartKey = lastEvaluatedKey;
      const result = await docClient.send(new ScanCommand(params));
      allItems = allItems.concat(result.Items || []);
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    const filteredMessages = allItems.filter(msg => {
      if (msg.deletedForEveryone) return true;
      if (msg.deletedForSender   && msg.senderId   === userId1) return false;
      if (msg.deletedForReceiver && msg.receiverId === userId1) return false;
      return true;
    });

    filteredMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return filteredMessages.slice(-limit);
  }

  static async getContactHistory(userId) {
    // Paginated scan — reads all messages for this user
    let allItems = [];
    let lastEvaluatedKey = null;
    do {
      const params = {
        TableName: TABLE_NAME,
        FilterExpression: 'senderId = :userId OR receiverId = :userId',
        ExpressionAttributeValues: { ':userId': userId }
      };
      if (lastEvaluatedKey) params.ExclusiveStartKey = lastEvaluatedKey;
      const result = await docClient.send(new ScanCommand(params));
      allItems = allItems.concat(result.Items || []);
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    const conversations = new Map();
    allItems.forEach(message => {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, { partnerId, messages: [], lastMessage: null, unreadCount: 0 });
      }
      const conv = conversations.get(partnerId);
      conv.messages.push(message);
      if (!conv.lastMessage || new Date(message.createdAt) > new Date(conv.lastMessage.createdAt)) {
        conv.lastMessage = message;
      }
      if (message.receiverId === userId && message.status === 'unread') {
        conv.unreadCount++;
      }
    });

    return Array.from(conversations.values())
      .sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
  }
}

module.exports = MessageModel;
