import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import messageApi from '../../services/messageApi';
import ChatWindow from './ChatWindow';
import './ContactHistory.css';

const ContactHistory = () => {
  const { currentUser } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    fetchConversations();
    // Set up real-time updates
    const interval = setInterval(fetchConversations, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await messageApi.getContactHistory();
      
      if (response.success) {
        setConversations(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const handleChatOpen = (conversation) => {
    setSelectedChat({
      recipientId: conversation.partnerId,
      recipientName: conversation.partnerName,
      recipientUserType: conversation.partnerUserType,
      recipientProfilePhoto: conversation.partnerProfilePhoto
    });
  };

  const handleChatClose = () => {
    setSelectedChat(null);
    // Refresh conversations to update unread counts
    fetchConversations();
  };

  const getUserTypeLabel = (userType) => {
    switch (userType) {
      case 'staff': return 'Staff Member';
      case 'recruiter': return 'Recruiter';
      case 'institute': return 'Institute';
      case 'seeker': return 'Seeker';
      default: return 'User';
    }
  };

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'staff': return '#10b981';
      case 'recruiter': return '#3b82f6';
      case 'institute': return '#f59e0b';
      case 'seeker': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="contact-history">
      <div className="contact-history-header">
        <h2>Contact History</h2>
        <p>Your recent conversations with other users</p>
        <button 
          className="refresh-btn"
          onClick={fetchConversations}
          disabled={loading}
        >
          <i className="fas fa-sync-alt"></i>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading conversations...</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>No conversations yet</h3>
          <p>Start chatting with staff members or recruiters to see your conversation history here</p>
        </div>
      ) : (
        <div className="contact-history-table">
          <table className="conversations-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Type</th>
                <th>Last Message</th>
                <th>Time</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conversation) => (
                <tr key={conversation.partnerId} className={conversation.unreadCount > 0 ? 'unread-row' : ''}>
                  <td>
                    <div className="contact-info">
                      <div className="contact-avatar">
                        {conversation.partnerProfilePhoto ? (
                          <img 
                            src={conversation.partnerProfilePhoto} 
                            alt={conversation.partnerName}
                            className="avatar-img"
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {conversation.partnerName?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="contact-details">
                        <div className="contact-name">{conversation.partnerName}</div>
                        <div className="contact-type">{getUserTypeLabel(conversation.partnerUserType)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="user-type-badge"
                      style={{ backgroundColor: getUserTypeColor(conversation.partnerUserType) }}
                    >
                      {getUserTypeLabel(conversation.partnerUserType)}
                    </span>
                  </td>
                  <td>
                    <div className="last-message-preview">
                      <span className="message-text">
                        {conversation.lastMessage.senderId === currentUser.userId ? 'You: ' : ''}
                        {truncateMessage(conversation.lastMessage.message, 40)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="message-time">
                      {formatTime(conversation.lastMessage.createdAt)}
                    </span>
                  </td>
                  <td>
                    <div className="message-status">
                      {conversation.unreadCount > 0 ? (
                        <span className="unread-badge">
                          {conversation.unreadCount} new
                        </span>
                      ) : (
                        <span className="read-status">Read</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <button 
                      className="chat-btn"
                      onClick={() => handleChatOpen(conversation)}
                    >
                      <i className="fas fa-comment"></i>
                      Chat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedChat && (
        <ChatWindow
          isOpen={true}
          onClose={handleChatClose}
          recipientId={selectedChat.recipientId}
          recipientName={selectedChat.recipientName}
        />
      )}
    </div>
  );
};

export default ContactHistory;