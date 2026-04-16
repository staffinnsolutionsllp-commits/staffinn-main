import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import messageApi from '../../services/messageApi';
import ChatWindow from './ChatWindow';
import './ContactHistory.css';

const ContactHistory = () => {
  const { currentUser } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

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

  const truncateMessage = (message, maxLength = 35) => {
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
    // Don't close the chat, just keep it open
    // The sidebar will remain visible
    // User can select another chat from the sidebar
    // Optionally refresh conversations to update unread counts
    fetchConversations();
  };

  const getUserTypeLabel = (userType) => {
    switch (userType) {
      case 'staff': return 'Staff';
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

  const filteredConversations = conversations.filter(conv =>
    conv.partnerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle resizing
  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      
      // Set min and max width constraints
      if (newWidth >= 250 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <div className="contact-history-container" ref={containerRef}>
      <div className="chat-layout">
        {/* Left Sidebar - Contacts List */}
        <div className="contacts-sidebar" style={{ width: `${sidebarWidth}px` }}>
          <div className="sidebar-header">
            <h2>Messages</h2>
            <button 
              className="refresh-icon-btn"
              onClick={fetchConversations}
              disabled={loading}
              title="Refresh"
            >
              <img src="/icons8-refresh.svg" alt="Refresh" className="refresh-icon-svg" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="search-container">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Contacts List */}
          <div className="contacts-list">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h3>No conversations</h3>
                <p>Start chatting to see your messages here</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.partnerId}
                  className={`contact-item ${
                    selectedChat?.recipientId === conversation.partnerId ? 'active' : ''
                  } ${conversation.unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => handleChatOpen(conversation)}
                >
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
                    {conversation.unreadCount > 0 && (
                      <div className="online-indicator"></div>
                    )}
                  </div>
                  <div className="contact-content">
                    <div className="contact-header">
                      <div className="contact-name-wrapper">
                        <span className="contact-name">{conversation.partnerName}</span>
                        <span 
                          className="user-type-badge"
                          style={{ backgroundColor: getUserTypeColor(conversation.partnerUserType) }}
                        >
                          {getUserTypeLabel(conversation.partnerUserType)}
                        </span>
                      </div>
                      <span className="message-time">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    </div>
                    <div className="contact-footer">
                      <span className={`last-message ${conversation.unreadCount > 0 ? 'unread-text' : ''}`}>
                        {conversation.lastMessage.senderId === currentUser.userId ? (
                          <i className="fas fa-check message-check"></i>
                        ) : null}
                        {truncateMessage(conversation.lastMessage.message)}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="unread-count">{conversation.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resizable Divider */}
        <div 
          className="resize-divider"
          onMouseDown={handleMouseDown}
          style={{ cursor: isResizing ? 'col-resize' : 'col-resize' }}
        >
          <div className="resize-handle"></div>
        </div>

        {/* Right Side - Chat Window */}
        <div className="chat-area">
          {selectedChat ? (
            <div className="chat-window-wrapper">
              <ChatWindow
                isOpen={true}
                onClose={handleChatClose}
                recipientId={selectedChat.recipientId}
                recipientName={selectedChat.recipientName}
              />
            </div>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-icon">💬</div>
              <h3>Select a conversation</h3>
              <p>Choose a contact from the left to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactHistory;