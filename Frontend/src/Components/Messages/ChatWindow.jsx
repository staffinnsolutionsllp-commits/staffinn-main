import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import messageApi from '../../services/messageApi';
import './ChatWindow.css';

const ChatWindow = ({ isOpen, onClose, recipientId, recipientName }) => {
  const { currentUser } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (isOpen && recipientId) {
      fetchConversation();
      // Set up real-time updates for the conversation (less frequent)
      const interval = setInterval(() => {
        if (isOpen) {
          fetchConversation();
        }
      }, 15000); // Refresh every 15 seconds instead of 5
      return () => clearInterval(interval);
    }
  }, [isOpen, recipientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    if (!isOpen) return; // Don't fetch if chat is closed
    
    try {
      const response = await messageApi.getConversation(recipientId);
      if (response.success) {
        const newMessages = response.data.messages || [];
        // Only update if messages have actually changed
        if (JSON.stringify(newMessages) !== JSON.stringify(messages)) {
          setMessages(newMessages);
        }
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const response = await messageApi.sendMessage({
        receiverId: recipientId,
        subject: `Chat with ${recipientName}`,
        message: messageText,
        messageType: 'general'
      });

      if (response.success) {
        // Add message to local state immediately for better UX
        const tempMessage = {
          messageId: Date.now().toString(),
          senderId: currentUser.userId,
          receiverId: recipientId,
          message: messageText,
          createdAt: new Date().toISOString(),
          status: 'sent'
        };
        setMessages(prev => [...prev, tempMessage]);
        
        // Refresh conversation to get the actual message
        setTimeout(() => {
          fetchConversation();
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
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

  if (!isOpen) return null;

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-window" onClick={(e) => e.stopPropagation()}>
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-user-info">
            <div className="chat-avatar">
              {recipientName?.charAt(0) || 'U'}
            </div>
            <div className="chat-user-details">
              <h3>{recipientName}</h3>
              <span className="online-status">Online</span>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="chat-messages" ref={chatContainerRef}>
          {loading ? (
            <div className="chat-loading">
              <div className="loading-spinner"></div>
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <div className="empty-icon">💬</div>
              <p>Start a conversation with {recipientName}</p>
            </div>
          ) : (
            Object.entries(messageGroups).map(([date, dayMessages]) => (
              <div key={date} className="message-group">
                <div className="date-separator">
                  <span>{formatDate(date)}</span>
                </div>
                {dayMessages.map((message, index) => {
                  const isOwn = message.senderId === currentUser?.userId;
                  const showTime = index === dayMessages.length - 1 || 
                    dayMessages[index + 1]?.senderId !== message.senderId;
                  
                  return (
                    <div
                      key={message.messageId}
                      className={`message-bubble ${isOwn ? 'own' : 'other'}`}
                    >
                      <div className="message-content">
                        <p>{message.message}</p>
                        <div className="message-meta">
                          <span className="message-time">
                            {formatTime(message.createdAt)}
                          </span>
                          {isOwn && (
                            <div className="message-status">
                              <i className={`fas ${
                                message.status === 'read' ? 'fa-check-double read' :
                                message.status === 'unread' ? 'fa-check-double' : 'fa-check'
                              }`}></i>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <div className="chat-input-container">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${recipientName}...`}
              className="chat-input"
              disabled={sending}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-paper-plane"></i>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;