import React, { useState, useEffect } from 'react';
import messageApi from '../../services/messageApi';
import api from '../../services/api';

const ComposeMessage = ({ onBack, onMessageSent, recipientId = null }) => {
  const [formData, setFormData] = useState({
    receiverId: recipientId || '',
    subject: '',
    message: '',
    messageType: 'general'
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    if (!recipientId) {
      fetchUsers();
    }
  }, [recipientId]);

  const fetchUsers = async () => {
    try {
      // Fetch all users for recipient selection
      const response = await api.get('/auth/users'); // You'll need to create this endpoint
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserSearch = (e) => {
    setSearchTerm(e.target.value);
    setShowUserDropdown(true);
  };

  const selectUser = (user) => {
    setFormData(prev => ({
      ...prev,
      receiverId: user.userId
    }));
    setSearchTerm(user.name);
    setShowUserDropdown(false);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.receiverId || !formData.subject || !formData.message) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await messageApi.sendMessage(formData);
      if (response.success) {
        alert('Message sent successfully!');
        onMessageSent();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="compose-message">
      <div className="compose-header">
        <button className="back-btn" onClick={onBack}>
          <i className="fas fa-arrow-left"></i>
          Back
        </button>
        <h3>Compose Message</h3>
      </div>

      <form onSubmit={handleSubmit} className="compose-form">
        {!recipientId && (
          <div className="form-group">
            <label htmlFor="recipient">To: *</label>
            <div className="recipient-selector">
              <input
                type="text"
                placeholder="Search for recipient..."
                value={searchTerm}
                onChange={handleUserSearch}
                onFocus={() => setShowUserDropdown(true)}
                required
              />
              {showUserDropdown && filteredUsers.length > 0 && (
                <div className="user-dropdown">
                  {filteredUsers.slice(0, 10).map(user => (
                    <div
                      key={user.userId}
                      className="user-option"
                      onClick={() => selectUser(user)}
                    >
                      <div className="user-info">
                        <span className="user-name">{user.name}</span>
                        <span className="user-email">{user.email}</span>
                        <span className="user-type">{user.userType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="messageType">Message Type:</label>
          <select
            name="messageType"
            value={formData.messageType}
            onChange={handleInputChange}
          >
            <option value="general">General</option>
            <option value="inquiry">Inquiry</option>
            <option value="job_application">Job Application</option>
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
            rows="10"
            required
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onBack} className="cancel-btn">
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
  );
};

export default ComposeMessage;