import React, { useState } from 'react';
import messageApi from '../../services/messageApi';
import './QuickContactModal.css';

const QuickContactModal = ({ isOpen, onClose, recipientId, recipientName }) => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    messageType: 'inquiry'
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject || !formData.message) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const messageData = {
        receiverId: recipientId,
        subject: formData.subject,
        message: formData.message,
        messageType: formData.messageType
      };

      const response = await messageApi.sendMessage(messageData);
      if (response.success) {
        alert('Message sent successfully!');
        setFormData({ subject: '', message: '', messageType: 'inquiry' });
        onClose();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="quick-contact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Send Message to {recipientName}</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="quick-contact-form">
          <div className="form-group">
            <label htmlFor="messageType">Message Type:</label>
            <select
              name="messageType"
              value={formData.messageType}
              onChange={handleInputChange}
            >
              <option value="inquiry">General Inquiry</option>
              <option value="job_application">Job Application</option>
              <option value="general">General Message</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject: *</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder="Enter message subject"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message: *</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Type your message here..."
              rows="6"
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="send-btn">
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  Send Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickContactModal;