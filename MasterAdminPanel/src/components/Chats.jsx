import React, { useState, useEffect } from 'react';
import adminAPI from '../services/adminApi';
import ChatViewModal from './ChatViewModal';
import './Chats.css';

const Chats = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getAllConversations();
      setConversations(response.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserTypeBadge = (userType) => {
    const typeClasses = {
      staff: 'type-staff',
      seeker: 'type-seeker',
      recruiter: 'type-recruiter',
      institute: 'type-institute'
    };
    
    return (
      <span className={`user-type-badge ${typeClasses[userType] || 'type-default'}`}>
        {userType.charAt(0).toUpperCase() + userType.slice(1)}
      </span>
    );
  };

  const handleViewChat = (conversation) => {
    setSelectedChat(conversation);
  };

  const handleCloseChat = () => {
    setSelectedChat(null);
  };

  return (
    <div className="chats-management">
      <div className="chats-header">
        <h2>Chat Management</h2>
        <p>Monitor all conversations between users</p>
        <button 
          className="refresh-btn"
          onClick={fetchConversations}
          disabled={loading}
        >
          <i className="fas fa-sync-alt"></i>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="chats-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-comments"></i>
            <h3>No conversations found</h3>
            <p>No chat conversations have been recorded yet.</p>
          </div>
        ) : (
          <div className="chats-table">
            <table>
              <thead>
                <tr>
                  <th>User 1</th>
                  <th>Type</th>
                  <th>User 2</th>
                  <th>Type</th>
                  <th>Messages</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conversation) => (
                  <tr key={`${conversation.user1Id}-${conversation.user2Id}`}>
                    <td>
                      <div className="user-info">
                        <strong>{conversation.user1Name}</strong>
                        <div className="user-email">{conversation.user1Email}</div>
                      </div>
                    </td>
                    <td>
                      {getUserTypeBadge(conversation.user1Type)}
                    </td>
                    <td>
                      <div className="user-info">
                        <strong>{conversation.user2Name}</strong>
                        <div className="user-email">{conversation.user2Email}</div>
                      </div>
                    </td>
                    <td>
                      {getUserTypeBadge(conversation.user2Type)}
                    </td>
                    <td>
                      <div className="message-count">
                        {conversation.messageCount} messages
                      </div>
                    </td>
                    <td>
                      <div className="last-activity">
                        {formatDate(conversation.lastMessageAt)}
                      </div>
                    </td>
                    <td>
                      <button
                        className="action-btn view-btn"
                        onClick={() => handleViewChat(conversation)}
                        title="View Chat History"
                      >
                        <i className="fas fa-eye"></i>
                        View Chat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedChat && (
        <ChatViewModal
          conversation={selectedChat}
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
};

export default Chats;