import React, { useState } from 'react';
import messageApi from '../../services/messageApi';

const MessageDetail = ({ message, onBack, onMessageDeleted, type }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      setLoading(true);
      try {
        await messageApi.deleteMessage(message.messageId, message.createdAt);
        onMessageDeleted();
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      unread: 'status-unread',
      read: 'status-read',
      replied: 'status-replied'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getMessageTypeBadge = (messageType) => {
    const typeClasses = {
      general: 'type-general',
      inquiry: 'type-inquiry',
      job_application: 'type-job'
    };
    
    return (
      <span className={`type-badge ${typeClasses[messageType]}`}>
        {messageType.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="message-detail">
      <div className="message-detail-header">
        <button className="back-btn" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
          Back
        </button>
        
        <div className="message-actions">
          <button 
            className="delete-btn" 
            onClick={handleDelete}
            disabled={loading}
          >
            <i className="fas fa-trash"></i>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="message-detail-content">
        <div className="message-info">
          <div className="message-participants">
            <div className="participant">
              <strong>From:</strong> 
              <span>{type === 'inbox' ? message.senderName : 'You'}</span>
              <span className="email">({type === 'inbox' ? message.senderEmail : message.receiverEmail})</span>
            </div>
            <div className="participant">
              <strong>To:</strong> 
              <span>{type === 'inbox' ? 'You' : message.receiverName}</span>
              <span className="email">({type === 'inbox' ? message.receiverEmail : message.receiverEmail})</span>
            </div>
          </div>

          <div className="message-metadata">
            <div className="metadata-item">
              <strong>Date:</strong> {formatDate(message.createdAt)}
            </div>
            <div className="metadata-item">
              <strong>Status:</strong> {getStatusBadge(message.status)}
            </div>
            <div className="metadata-item">
              <strong>Type:</strong> {getMessageTypeBadge(message.messageType)}
            </div>
          </div>
        </div>

        <div className="message-subject">
          <h3>{message.subject}</h3>
        </div>

        <div className="message-body">
          <div className="message-text">
            {message.message.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>

        {message.attachments && message.attachments.length > 0 && (
          <div className="message-attachments">
            <h4>Attachments:</h4>
            <div className="attachment-list">
              {message.attachments.map((attachment, index) => (
                <div key={index} className="attachment-item">
                  <i className="fas fa-paperclip"></i>
                  <a 
                    href={attachment.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {attachment.fileName}
                  </a>
                  <span className="file-type">({attachment.fileType})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageDetail;