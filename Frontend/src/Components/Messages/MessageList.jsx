import React, { useState, useEffect } from 'react';
import messageApi from '../../services/messageApi';

const MessageList = ({ type, onMessageSelect, refreshTrigger }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMessages();
  }, [type, refreshTrigger]);

  const fetchMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const response = type === 'inbox' 
        ? await messageApi.getInboxMessages()
        : await messageApi.getSentMessages();
      
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const truncateMessage = (message, maxLength = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="message-loading">
        <div className="spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="message-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        <button onClick={fetchMessages}>Try Again</button>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="message-empty">
        <i className="fas fa-inbox"></i>
        <h3>No messages found</h3>
        <p>You don't have any {type} messages yet.</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <div
          key={`${message.messageId}-${message.createdAt}`}
          className={`message-item ${message.status === 'unread' && type === 'inbox' ? 'unread' : ''}`}
          onClick={() => onMessageSelect(message)}
        >
          <div className="message-avatar">
            <i className="fas fa-user-circle"></i>
          </div>
          
          <div className="message-content">
            <div className="message-header">
              <span className="message-sender">
                {type === 'inbox' ? message.senderName : message.receiverName}
              </span>
              <span className="message-date">
                {formatDate(message.createdAt)}
              </span>
            </div>
            
            <div className="message-subject">
              {message.subject}
            </div>
            
            <div className="message-preview">
              {truncateMessage(message.message)}
            </div>
            
            <div className="message-meta">
              <span className={`message-type ${message.messageType}`}>
                {message.messageType}
              </span>
              {message.status === 'unread' && type === 'inbox' && (
                <span className="unread-indicator">
                  <i className="fas fa-circle"></i>
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;