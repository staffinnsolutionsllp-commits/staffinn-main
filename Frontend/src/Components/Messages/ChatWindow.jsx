import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import messageApi from '../../services/messageApi';
import useWebSocket from '../../hooks/useWebSocket';
import './ChatWindow.css';

const ChatWindow = ({ isOpen, onClose, recipientId, recipientName }) => {
  const { currentUser } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  const [recipientProfilePhoto, setRecipientProfilePhoto] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [messageToEdit, setMessageToEdit] = useState(null);
  const [editText, setEditText] = useState('');
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const ws = useWebSocket();

  useEffect(() => {
    if (isOpen && recipientId) {
      fetchConversation();
      fetchRecipientProfile();
      
      // Prevent background scroll when chat is open
      document.body.style.overflow = 'hidden';
      
      // Polling fallback (less critical now that we have WebSocket push)
      const interval = setInterval(() => {
        if (isOpen) {
          fetchConversation();
        }
      }, 60000);
      
      return () => {
        clearInterval(interval);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, recipientId]);

  // Real-time: join user room and refresh on new-message events
  useEffect(() => {
    if (!isOpen || !currentUser?.userId || !ws.joinUserRoom) return;

    ws.joinUserRoom(currentUser.userId);

    const handleNewMessage = (data) => {
      const msg = data.message;
      // Only react if this message belongs to the currently open conversation
      if (
        (msg.senderId === recipientId && msg.receiverId === currentUser.userId) ||
        (msg.senderId === currentUser.userId && msg.receiverId === recipientId)
      ) {
        // Append the new message immediately without waiting for a full re-fetch
        setMessages(prev => {
          // Avoid duplicates (temp message was already added optimistically)
          const alreadyExists = prev.some(m => m.messageId === msg.messageId);
          if (alreadyExists) return prev;
          return [...prev, msg];
        });
      }
    };

    ws.onNewMessage(handleNewMessage);
    return () => ws.offNewMessage(handleNewMessage);
  }, [isOpen, recipientId, currentUser?.userId, ws.joinUserRoom, ws.onNewMessage, ws.offNewMessage]);

  const fetchRecipientProfile = async () => {
    try {
      const response = await messageApi.getUserProfile(recipientId);
      if (response.success && response.data) {
        setRecipientProfilePhoto(response.data.profilePhoto);
      }
    } catch (error) {
      console.error('Error fetching recipient profile:', error);
    }
  };

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

  const handleFileUpload = async (file, fileType) => {
    if (!file) return;

    setUploadingFile(true);
    setShowFileMenu(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('receiverId', recipientId);
      formData.append('fileType', fileType);
      formData.append('sendTextMessage', 'false'); // Don't send text message

      const response = await messageApi.sendFileMessage(formData);

      if (response.success) {
        // Refresh conversation to show the new file message
        fetchConversation();
      } else {
        alert('Failed to send file. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to send file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileSelect = (fileType) => {
    setShowFileMenu(false);
    const input = document.createElement('input');
    input.type = 'file';
    
    switch(fileType) {
      case 'photo':
        input.accept = 'image/*';
        break;
      case 'video':
        input.accept = 'video/*';
        break;
      case 'document':
        input.accept = '.pdf,.doc,.docx,.txt';
        break;
      default:
        break;
    }

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        handleFileUpload(file, fileType);
      }
    };

    input.click();
  };

  const handleFilePreview = (attachment) => {
    setPreviewFile(attachment);
    setShowPreview(true);
  };

  const closePreview = () => {
    setPreviewFile(null);
    setShowPreview(false);
  };

  const handleMessageSelect = (messageId) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedMessages(new Set());
  };

  const handleDeleteClick = (message) => {
    setMessageToDelete(message);
    setShowDeleteModal(true);
    setShowMessageMenu(null);
  };

  const handleDeleteConfirm = async (deleteType) => {
    try {
      if (selectedMessages.size > 0) {
        // Bulk delete
        const messagesToDelete = messages
          .filter(msg => selectedMessages.has(msg.messageId))
          .map(msg => ({ messageId: msg.messageId, createdAt: msg.createdAt }));

        const response = await messageApi.deleteMultipleMessages(messagesToDelete, deleteType);
        
        if (response.success) {
          setSelectedMessages(new Set());
          setSelectionMode(false);
          fetchConversation();
        }
      } else if (messageToDelete) {
        // Single delete
        const response = await messageApi.deleteMessageWithType(
          messageToDelete.messageId,
          messageToDelete.createdAt,
          deleteType
        );

        if (response.success) {
          fetchConversation();
        } else {
          alert(response.message || 'Failed to delete message');
        }
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    } finally {
      setShowDeleteModal(false);
      setMessageToDelete(null);
    }
  };

  const handleEditClick = (message) => {
    setMessageToEdit(message);
    setEditText(message.message);
    setShowEditModal(true);
    setShowMessageMenu(null);
  };

  const handleEditConfirm = async () => {
    if (!editText.trim()) {
      alert('Message cannot be empty');
      return;
    }

    try {
      const response = await messageApi.editMessage(
        messageToEdit.messageId,
        messageToEdit.createdAt,
        editText.trim()
      );

      if (response.success) {
        fetchConversation();
        setShowEditModal(false);
        setMessageToEdit(null);
        setEditText('');
      } else {
        alert(response.message || 'Failed to edit message');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message');
    }
  };

  const canDeleteForEveryone = (message) => {
    return message.senderId === currentUser?.userId && message.status !== 'read';
  };

  const canEdit = (message) => {
    return message.senderId === currentUser?.userId && 
           message.status !== 'read' && 
           message.messageType !== 'file' &&
           !message.deletedForEveryone;
  };

  const handleBulkDelete = () => {
    if (selectedMessages.size === 0) {
      alert('Please select messages to delete');
      return;
    }
    setShowDeleteModal(true);
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

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleChatWindowScroll = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="chat-overlay" onClick={handleOverlayClick} onWheel={(e) => e.stopPropagation()}>
      <div className="chat-window" onClick={(e) => e.stopPropagation()} onWheel={handleChatWindowScroll}>
        {/* Chat Header */}
        <div className="chat-header">
          {selectionMode ? (
            <div className="selection-header">
              <button className="cancel-selection-btn" onClick={toggleSelectionMode}>
                <i className="fas fa-times"></i>
              </button>
              <span className="selection-count">{selectedMessages.size} selected</span>
              <button 
                className="bulk-delete-btn" 
                onClick={handleBulkDelete}
                disabled={selectedMessages.size === 0}
              >
                <i className="fas fa-trash"></i> Delete
              </button>
            </div>
          ) : (
            <>
              <div className="chat-user-info">
                <div className="chat-avatar">
                  {recipientProfilePhoto ? (
                    <img src={recipientProfilePhoto} alt={recipientName} className="chat-avatar-img" />
                  ) : (
                    recipientName?.charAt(0) || 'U'
                  )}
                </div>
                <div className="chat-user-details">
                  <h3>{recipientName}</h3>
                  <span className="online-status">Online</span>
                </div>
              </div>
              <div className="header-actions">
                <button className="select-messages-btn" onClick={toggleSelectionMode} title="Select messages">
                  <i className="fas fa-check-square"></i>
                </button>
                <button className="chat-close-btn" onClick={onClose} title="Close chat">
                  <img src="/shield-cross.svg" alt="Close" className="close-icon-svg" />
                </button>
              </div>
            </>
          )}
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
                      className={`message-bubble ${isOwn ? 'own' : 'other'} ${selectionMode ? 'selection-mode' : ''} ${selectedMessages.has(message.messageId) ? 'selected' : ''}`}
                      style={{ marginBottom: '8px', display: 'flex', clear: 'both', position: 'relative' }}
                    >
                      {selectionMode && (
                        <div className="message-checkbox" onClick={() => handleMessageSelect(message.messageId)}>
                          <input 
                            type="checkbox" 
                            checked={selectedMessages.has(message.messageId)}
                            onChange={() => {}}
                          />
                        </div>
                      )}
                      <div 
                        className="message-wrapper"
                        style={{ 
                          display: 'inline-flex', 
                          flexDirection: 'column',
                          maxWidth: '70%',
                          alignItems: isOwn ? 'flex-end' : 'flex-start'
                        }}
                      >
                        {isOwn && !selectionMode && !message.deletedForEveryone && (
                          <div className="message-menu-trigger">
                            <button 
                              className="message-menu-btn"
                              onClick={() => setShowMessageMenu(showMessageMenu === message.messageId ? null : message.messageId)}
                            >
                              <img src="/arrow-down-04.svg" alt="Menu" className="dropdown-icon-svg" />
                            </button>
                            {showMessageMenu === message.messageId && (
                              <div className="message-dropdown-menu">
                                {canEdit(message) && (
                                  <button onClick={() => handleEditClick(message)}>
                                    <i className="fas fa-edit"></i> Edit
                                  </button>
                                )}
                                <button onClick={() => handleDeleteClick(message)}>
                                  <i className="fas fa-trash"></i> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        <div 
                          className="message-content"
                          style={{
                            padding: '10px 14px',
                            borderRadius: '18px',
                            fontSize: '14px',
                            lineHeight: '1.4',
                            whiteSpace: 'pre-wrap',
                            display: 'inline-block',
                            maxWidth: '100%',
                            minHeight: '0',
                            height: 'auto',
                            wordWrap: 'break-word',
                            background: message.deletedForEveryone ? '#f0f0f0' : (isOwn ? 'linear-gradient(135deg, #4863f7 0%, #3b82f6 100%)' : 'white'),
                            color: message.deletedForEveryone ? '#999' : (isOwn ? 'white' : '#333'),
                            border: isOwn ? 'none' : '1px solid #e9ecef',
                            borderBottomRightRadius: isOwn ? '4px' : '18px',
                            borderBottomLeftRadius: isOwn ? '18px' : '4px',
                            marginLeft: isOwn ? 'auto' : '0',
                            fontStyle: message.deletedForEveryone ? 'italic' : 'normal'
                          }}
                        >
                          {message.deletedForEveryone ? (
                            <span>
                              <i className="fas fa-ban" style={{ marginRight: '5px' }}></i>
                              Message Deleted
                            </span>
                          ) : message.attachments && message.attachments.length > 0 ? (
                            <div className="message-attachments">
                              {message.attachments.map((attachment, idx) => (
                                <div key={idx} className="attachment-item">
                                  {attachment.fileType === 'photo' && (
                                    <img 
                                      src={attachment.url} 
                                      alt="attachment" 
                                      style={{ maxWidth: '200px', borderRadius: '8px', cursor: 'pointer' }} 
                                      onClick={() => handleFilePreview(attachment)}
                                    />
                                  )}
                                  {attachment.fileType === 'video' && (
                                    <div 
                                      style={{ position: 'relative', maxWidth: '200px', cursor: 'pointer' }}
                                      onClick={() => handleFilePreview(attachment)}
                                    >
                                      <video 
                                        src={attachment.url} 
                                        style={{ width: '100%', borderRadius: '8px' }}
                                      />
                                      <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        background: 'rgba(0,0,0,0.6)',
                                        borderRadius: '50%',
                                        width: '50px',
                                        height: '50px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '24px'
                                      }}>
                                        ▶
                                      </div>
                                    </div>
                                  )}
                                  {attachment.fileType === 'document' && (
                                    <a href={attachment.url} target="_blank" rel="noopener noreferrer" style={{ color: isOwn ? 'white' : '#4863f7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <i className="fas fa-file-pdf" style={{ fontSize: '20px' }}></i>
                                      <span>{attachment.fileName || 'Document'}</span>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            message.message
                          )}
                        </div>
                        <div 
                          className="message-meta"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '4px',
                            fontSize: '11px',
                            justifyContent: isOwn ? 'flex-end' : 'flex-start'
                          }}
                        >
                          {message.edited && !message.deletedForEveryone && (
                            <span className="edited-indicator" style={{ fontSize: '11px', color: '#999', marginRight: '4px' }}>
                              (edited)
                            </span>
                          )}
                          <span className="message-time" style={{ fontSize: '11px', color: '#999' }}>
                            {formatTime(message.createdAt)}
                          </span>
                          {isOwn && (
                            <span className="message-status" style={{ fontSize: '12px', color: '#999' }}>
                              <i className={`fas ${
                                message.status === 'read' ? 'fa-check-double read' :
                                message.status === 'unread' ? 'fa-check-double' : 'fa-check'
                              }`}></i>
                            </span>
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
            <div className="file-upload-section">
              <button
                type="button"
                className="file-upload-btn"
                onClick={() => setShowFileMenu(!showFileMenu)}
                disabled={uploadingFile}
              >
                <img src="/add-circle.svg" alt="Add" className="icon-svg" />
              </button>
              {showFileMenu && (
                <div className="file-menu">
                  <button type="button" onClick={() => handleFileSelect('document')}>
                    <i className="fas fa-file-alt"></i> Document
                  </button>
                  <button type="button" onClick={() => handleFileSelect('photo')}>
                    <i className="fas fa-image"></i> Photo
                  </button>
                  <button type="button" onClick={() => handleFileSelect('video')}>
                    <i className="fas fa-video"></i> Video
                  </button>
                </div>
              )}
            </div>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={uploadingFile ? 'Uploading file...' : `Message ${recipientName}...`}
              className="chat-input"
              disabled={sending || uploadingFile}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!newMessage.trim() || sending || uploadingFile}
            >
              {sending ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <img src="/send-2.svg" alt="Send" className="icon-svg" />
              )}
            </button>
          </div>
        </form>

        {/* File Preview Modal */}
        {showPreview && previewFile && (
          <div className="file-preview-overlay" onClick={closePreview}>
            <div className="file-preview-content" onClick={(e) => e.stopPropagation()}>
              <button className="preview-close-btn" onClick={closePreview}>
                <i className="fas fa-times"></i>
              </button>
              {previewFile.fileType === 'photo' && (
                <img src={previewFile.url} alt="Preview" className="preview-image" />
              )}
              {previewFile.fileType === 'video' && (
                <video src={previewFile.url} controls className="preview-video" autoPlay />
              )}
              <div className="preview-info">
                <p>{previewFile.fileName}</p>
                <a href={previewFile.url} target="_blank" rel="noopener noreferrer" className="preview-download">
                  <i className="fas fa-download"></i> Download
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Message{selectedMessages.size > 1 ? 's' : ''}?</h3>
              <p>
                {selectedMessages.size > 1 
                  ? `Delete ${selectedMessages.size} messages?` 
                  : 'Are you sure you want to delete this message?'}
              </p>
              <div className="delete-options">
                <button 
                  className="delete-option-btn delete-for-me"
                  onClick={() => handleDeleteConfirm('forMe')}
                >
                  <i className="fas fa-user-times"></i>
                  <span>Delete for Me</span>
                </button>
                {(messageToDelete && canDeleteForEveryone(messageToDelete)) || selectedMessages.size > 0 ? (
                  <button 
                    className="delete-option-btn delete-for-everyone"
                    onClick={() => handleDeleteConfirm('forEveryone')}
                  >
                    <i className="fas fa-users-slash"></i>
                    <span>Delete for Everyone</span>
                  </button>
                ) : null}
              </div>
              <button className="cancel-delete-btn" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Edit Message Modal */}
        {showEditModal && messageToEdit && (
          <div className="edit-modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Edit Message</h3>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="edit-textarea"
                rows="4"
                placeholder="Type your message..."
                autoFocus
              />
              <div className="edit-modal-actions">
                <button className="cancel-edit-btn" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button 
                  className="confirm-edit-btn" 
                  onClick={handleEditConfirm}
                  disabled={!editText.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;