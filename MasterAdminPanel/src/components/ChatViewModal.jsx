import React, { useState, useEffect } from 'react';
import adminAPI from '../services/adminApi';
import './ChatViewModal.css';

const ChatViewModal = ({ conversation, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (conversation) {
      fetchChatHistory();
    }
  }, [conversation]);

  const fetchChatHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getChatHistory(conversation.user1Id, conversation.user2Id);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setError('Failed to fetch chat history');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const getSenderName = (senderId) => {
    if (senderId === conversation.user1Id) {
      return conversation.user1Name;
    } else if (senderId === conversation.user2Id) {
      return conversation.user2Name;
    }
    return 'Unknown User';
  };

  if (!conversation) return null;

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-modal-header">
          <div className="chat-participants">
            <h3>Chat History</h3>
            <div className="participants-info">
              <span className="participant">
                {conversation.user1Name} ({conversation.user1Type})
              </span>
              <i className="fas fa-exchange-alt"></i>
              <span className="participant">
                {conversation.user2Name} ({conversation.user2Type})
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="chat-modal-content">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading chat history...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <i className="fas fa-exclamation-triangle"></i>
              <p>{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-comments"></i>
              <p>No messages found in this conversation</p>
            </div>
          ) : (
            <div className="messages-container">
              {Object.entries(messageGroups).map(([date, dayMessages]) => (
                <div key={date} className="message-group">
                  <div className="date-separator">
                    <span>{formatDate(date)}</span>
                  </div>
                  {dayMessages.map((message) => (
                    <div key={message.messageId} className="message-item">
                      <div className="message-sender">
                        <strong>{getSenderName(message.senderId)}</strong>
                        <span className="message-time">{formatTime(message.createdAt)}</span>
                      </div>
                      <div className="message-text">
                        {message.message}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chat-modal-footer">
          <div className="chat-stats">
            <span>Total Messages: {messages.length}</span>
            <span>Last Activity: {formatDate(conversation.lastMessageAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatViewModal;