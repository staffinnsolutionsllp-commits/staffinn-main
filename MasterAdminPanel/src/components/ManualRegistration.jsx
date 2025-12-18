import React, { useState } from 'react';
import adminAPI from '../services/adminApi';
import './ManualRegistration.css';

const ManualRegistration = () => {
  // Get admin role from localStorage
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const isRecruiterAdmin = adminData.role === 'recruiter';
  const isInstituteAdmin = adminData.role === 'institute';
  
  const [activeTab, setActiveTab] = useState(isInstituteAdmin ? 'institute' : 'recruiter');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [recruiterForm, setRecruiterForm] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  });

  const [instituteForm, setInstituteForm] = useState({
    instituteName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    instituteType: 'normal'
  });

  const handleRecruiterChange = (e) => {
    setRecruiterForm({
      ...recruiterForm,
      [e.target.name]: e.target.value
    });
  };

  const handleInstituteChange = (e) => {
    setInstituteForm({
      ...instituteForm,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = (formData, type) => {
    const { companyName, instituteName, email, password, confirmPassword, phoneNumber } = formData;
    
    if (type === 'recruiter' && !companyName.trim()) {
      return 'Company name is required';
    }
    
    if (type === 'institute' && !instituteName.trim()) {
      return 'Institute name is required';
    }
    
    if (!email.trim()) {
      return 'Email is required';
    }
    
    if (!email.includes('@')) {
      return 'Please enter a valid email address';
    }
    
    if (!password.trim()) {
      return 'Password is required';
    }
    
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    
    if (!phoneNumber.trim()) {
      return 'Phone number is required';
    }
    
    if (phoneNumber.length < 10) {
      return 'Phone number must be at least 10 digits';
    }
    
    return null;
  };

  const handleRecruiterSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm(recruiterForm, 'recruiter');
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await adminAPI.manualRegisterRecruiter(recruiterForm);
      
      if (response.success) {
        setMessage({ type: 'success', text: `Recruiter registered successfully! User ID: ${response.data.userId}` });
        setRecruiterForm({
          companyName: '',
          email: '',
          password: '',
          confirmPassword: '',
          phoneNumber: ''
        });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to register recruiter' });
      }
    } catch (error) {
      console.error('Recruiter registration error:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to register recruiter' });
    } finally {
      setLoading(false);
    }
  };

  const handleInstituteSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm(instituteForm, 'institute');
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await adminAPI.manualRegisterInstitute(instituteForm);
      
      if (response.success) {
        setMessage({ type: 'success', text: `Institute registered successfully! User ID: ${response.data.userId}` });
        setInstituteForm({
          instituteName: '',
          email: '',
          password: '',
          confirmPassword: '',
          phoneNumber: '',
          instituteType: 'normal'
        });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to register institute' });
      }
    } catch (error) {
      console.error('Institute registration error:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to register institute' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manual-registration">
      <div className="manual-registration-header">
        <h2>Manual Registration</h2>
        <p>Manually register recruiters and institutes with valid IDs</p>
      </div>

      <div className="registration-tabs">
        {!isInstituteAdmin && (
          <button
            className={`tab-btn ${activeTab === 'recruiter' ? 'active' : ''}`}
            onClick={() => setActiveTab('recruiter')}
          >
            <i className="fas fa-briefcase"></i>
            Register Recruiter
          </button>
        )}
        {!isRecruiterAdmin && (
          <button
            className={`tab-btn ${activeTab === 'institute' ? 'active' : ''}`}
            onClick={() => setActiveTab('institute')}
          >
            <i className="fas fa-university"></i>
            Register Institute
          </button>
        )}
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          {message.text}
        </div>
      )}

      <div className="registration-content">
        {activeTab === 'recruiter' && !isInstituteAdmin && (
          <div className="registration-form">
            <h3>Register New Recruiter</h3>
            <form onSubmit={handleRecruiterSubmit}>
              <div className="form-group">
                <label htmlFor="companyName">Company Name *</label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={recruiterForm.companyName}
                  onChange={handleRecruiterChange}
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={recruiterForm.email}
                  onChange={handleRecruiterChange}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={recruiterForm.password}
                    onChange={handleRecruiterChange}
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={recruiterForm.confirmPassword}
                    onChange={handleRecruiterChange}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number *</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={recruiterForm.phoneNumber}
                  onChange={handleRecruiterChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Registering...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i>
                    Register Recruiter
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'institute' && !isRecruiterAdmin && (
          <div className="registration-form">
            <h3>Register New Institute</h3>
            <form onSubmit={handleInstituteSubmit}>
              <div className="form-group">
                <label htmlFor="instituteName">Institute Name *</label>
                <input
                  type="text"
                  id="instituteName"
                  name="instituteName"
                  value={instituteForm.instituteName}
                  onChange={handleInstituteChange}
                  placeholder="Enter institute name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={instituteForm.email}
                  onChange={handleInstituteChange}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={instituteForm.password}
                    onChange={handleInstituteChange}
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={instituteForm.confirmPassword}
                    onChange={handleInstituteChange}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number *</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={instituteForm.phoneNumber}
                  onChange={handleInstituteChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="instituteType">Institute Type *</label>
                <select
                  id="instituteType"
                  name="instituteType"
                  value={instituteForm.instituteType}
                  onChange={handleInstituteChange}
                  required
                >
                  <option value="normal">Normal Institute</option>
                  <option value="staffinn_partner">Staffinn Partner</option>
                </select>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Registering...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i>
                    Register Institute
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualRegistration;