import React, { useState } from 'react';
import adminAPI from '../services/adminApi';
import './Notifications.css';

const Notifications = () => {
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    targetAudience: 'all'
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNotificationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await adminAPI.sendNotification(notificationForm);
      
      if (response.success) {
        alert('Notification sent successfully!');
        setNotificationForm({
          title: '',
          message: '',
          targetAudience: 'all'
        });
      } else {
        alert('Failed to send notification: ' + response.message);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notifications-section">
      <div className="section-header">
        <h2>Send Notifications</h2>
        <p>Send notifications to users across the platform</p>
      </div>

      <div className="notification-form-container">
        <form onSubmit={handleSubmit} className="notification-form">
          <div className="form-group">
            <label htmlFor="title">Notification Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={notificationForm.title}
              onChange={handleInputChange}
              placeholder="Enter notification title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message *</label>
            <textarea
              id="message"
              name="message"
              value={notificationForm.message}
              onChange={handleInputChange}
              placeholder="Enter notification message"
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="targetAudience">Target Audience *</label>
            <select
              id="targetAudience"
              name="targetAudience"
              value={notificationForm.targetAudience}
              onChange={handleInputChange}
              required
            >
              <option value="all">All Users</option>
              <option value="staff">Staff Only</option>
              <option value="institute">Institutes Only</option>
              <option value="recruiter">Recruiters Only</option>
            </select>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="send-btn"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Notifications;