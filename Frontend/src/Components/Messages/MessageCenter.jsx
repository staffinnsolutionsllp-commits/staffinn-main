import React, { useState, useEffect } from 'react';
import messageApi from '../../services/messageApi';
import MessageList from './MessageList';
import MessageDetail from './MessageDetail';
import ComposeMessage from './ComposeMessage';
import './MessageCenter.css';

const MessageCenter = () => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
  }, [refreshTrigger]);

  const fetchUnreadCount = async () => {
    try {
      const response = await messageApi.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleMessageSelect = (message) => {
    setSelectedMessage(message);
    setShowCompose(false);
    
    // Mark as read if it's an unread inbox message
    if (activeTab === 'inbox' && message.status === 'unread') {
      markMessageAsRead(message);
    }
  };

  const markMessageAsRead = async (message) => {
    try {
      await messageApi.markAsRead(message.messageId, message.createdAt);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleCompose = () => {
    setShowCompose(true);
    setSelectedMessage(null);
  };

  const handleMessageSent = () => {
    setShowCompose(false);
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('sent'); // Switch to sent tab to show the sent message
  };

  const handleMessageDeleted = () => {
    setSelectedMessage(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBack = () => {
    setSelectedMessage(null);
    setShowCompose(false);
  };

  return (
    <div className="message-center">
      <div className="message-header">
        <h2>Messages</h2>
        <button className="compose-btn" onClick={handleCompose}>
          <i className="fas fa-plus"></i>
          Compose
        </button>
      </div>

      <div className="message-content">
        {!selectedMessage && !showCompose ? (
          <>
            <div className="message-tabs">
              <button
                className={`tab-btn ${activeTab === 'inbox' ? 'active' : ''}`}
                onClick={() => setActiveTab('inbox')}
              >
                <i className="fas fa-inbox"></i>
                Inbox
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount}</span>
                )}
              </button>
              <button
                className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
                onClick={() => setActiveTab('sent')}
              >
                <i className="fas fa-paper-plane"></i>
                Sent
              </button>
            </div>

            <MessageList
              type={activeTab}
              onMessageSelect={handleMessageSelect}
              refreshTrigger={refreshTrigger}
            />
          </>
        ) : showCompose ? (
          <ComposeMessage
            onBack={handleBack}
            onMessageSent={handleMessageSent}
          />
        ) : (
          <MessageDetail
            message={selectedMessage}
            onBack={handleBack}
            onMessageDeleted={handleMessageDeleted}
            type={activeTab}
          />
        )}
      </div>
    </div>
  );
};

export default MessageCenter;