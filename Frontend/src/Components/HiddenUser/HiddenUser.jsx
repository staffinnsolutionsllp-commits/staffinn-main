import React, { useState } from 'react';
import './HiddenUser.css';

const HiddenUser = ({ user, onClose }) => {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.fullName || user?.companyName || user?.instituteName || '',
    email: user?.email || '',
    query: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.query) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:4001/api/v1/issues/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setSubmitSuccess(true);
        setFormData({ name: '', email: '', query: '' });
      } else {
        alert('Failed to submit request: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="hidden-user-overlay">
        <div className="hidden-user-container success">
          <div className="hidden-icon success-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <h1>Request Submitted Successfully!</h1>
          <p>Your help request has been sent to the administrators.</p>
          <p>You will be contacted soon regarding your profile visibility.</p>
          <button 
            className="primary-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden-user-overlay">
      <div className="hidden-user-container">
        {!showRequestForm ? (
          <>
            <div className="hidden-icon">
              <i className="fas fa-eye-slash"></i>
            </div>
            <h1>You are hidden from Staffinn</h1>
            <p>Your profile has been hidden by the administrators. If you believe this is an error or would like to request assistance, please click the button below.</p>
            
            <div className="hidden-actions">
              <button 
                className="request-help-btn"
                onClick={() => setShowRequestForm(true)}
              >
                Request Help
              </button>
              <button 
                className="close-btn"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="form-header">
              <button 
                className="back-btn"
                onClick={() => setShowRequestForm(false)}
              >
                <i className="fas fa-arrow-left"></i> Back
              </button>
              <h2>Request Help</h2>
            </div>
            
            <form onSubmit={handleSubmitRequest} className="help-request-form">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email ID *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="query">Query *</label>
                <textarea
                  id="query"
                  name="query"
                  value={formData.query}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Please describe your issue or request..."
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowRequestForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default HiddenUser;