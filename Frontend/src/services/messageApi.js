const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const messageApi = {
  // Send a new message
  sendMessage: async (messageData) => {
    const response = await fetch(`${API_URL}/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(messageData)
    });
    return await response.json();
  },

  // Get inbox messages
  getInboxMessages: async (limit = 20, lastEvaluatedKey = null) => {
    const params = new URLSearchParams();
    params.append('limit', limit);
    if (lastEvaluatedKey) {
      params.append('lastEvaluatedKey', JSON.stringify(lastEvaluatedKey));
    }
    
    const response = await fetch(`${API_URL}/messages/inbox?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return await response.json();
  },

  // Get sent messages
  getSentMessages: async (limit = 20, lastEvaluatedKey = null) => {
    const params = new URLSearchParams();
    params.append('limit', limit);
    if (lastEvaluatedKey) {
      params.append('lastEvaluatedKey', JSON.stringify(lastEvaluatedKey));
    }
    
    const response = await fetch(`${API_URL}/messages/sent?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return await response.json();
  },

  // Get specific message
  getMessage: async (messageId, createdAt) => {
    const response = await fetch(`${API_URL}/messages/${messageId}/${createdAt}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return await response.json();
  },

  // Mark message as read
  markAsRead: async (messageId, createdAt) => {
    const response = await fetch(`${API_URL}/messages/${messageId}/${createdAt}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return await response.json();
  },

  // Delete message
  deleteMessage: async (messageId, createdAt) => {
    const response = await fetch(`${API_URL}/messages/${messageId}/${createdAt}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return await response.json();
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await fetch(`${API_URL}/messages/unread-count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return await response.json();
  },

  // Get conversation with specific user
  getConversation: async (userId, limit = 20) => {
    const response = await fetch(`${API_URL}/messages/conversation/${userId}?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return await response.json();
  },

  // Get contact history
  getContactHistory: async () => {
    const response = await fetch(`${API_URL}/messages/contact-history`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return await response.json();
  },

  // Get unread count for specific conversation
  getConversationUnreadCount: async (userId) => {
    const response = await fetch(`${API_URL}/messages/conversation/${userId}/unread-count`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });
    return await response.json();
  }
};

export default messageApi;