import React, { useState } from 'react';
import adminAPI from '../services/adminApi';
import './Login.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    adminId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordData, setForgotPasswordData] = useState({
    adminId: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleForgotPasswordChange = (e) => {
    const { name, value } = e.target;
    setForgotPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!formData.adminId || !formData.password) {
      setError('Please enter both Admin ID and Password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', formData.adminId);
      const response = await adminAPI.login(formData.adminId, formData.password);
      console.log('Login response:', response);
      
      if (response.success) {
        const adminData = {
          adminId: response.data.adminId,
          role: response.data.role
        };
        console.log('Storing admin data:', adminData);
        localStorage.setItem('adminData', JSON.stringify(adminData));
        onLogin(response.data);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordData.adminId || !forgotPasswordData.currentPassword || 
        !forgotPasswordData.newPassword || !forgotPasswordData.confirmPassword) {
      setError('Please fill all fields');
      return;
    }

    if (forgotPasswordData.newPassword !== forgotPasswordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (forgotPasswordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await adminAPI.changePassword(
        forgotPasswordData.adminId,
        forgotPasswordData.currentPassword,
        forgotPasswordData.newPassword
      );
      
      alert('Password changed successfully! Please login with your new password.');
      setShowForgotPassword(false);
      setForgotPasswordData({
        adminId: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setError(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1>Master Admin Panel</h1>
          <p>Staffinn Administration</p>
        </div>

        {!showForgotPassword ? (
          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="admin-form-group">
              <label htmlFor="adminId">Admin ID</label>
              <input
                type="text"
                id="adminId"
                name="adminId"
                value={formData.adminId}
                onChange={handleInputChange}
                placeholder="Enter Admin ID"
                disabled={loading}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter Password"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="admin-error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="admin-login-btn"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <button
              type="button"
              className="admin-forgot-password-btn"
              onClick={() => setShowForgotPassword(true)}
              disabled={loading}
            >
              Forgot Password?
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="admin-login-form">
            <h3>Change Password</h3>
            
            <div className="admin-form-group">
              <label htmlFor="forgotAdminId">Admin ID</label>
              <input
                type="text"
                id="forgotAdminId"
                name="adminId"
                value={forgotPasswordData.adminId}
                onChange={handleForgotPasswordChange}
                placeholder="Enter Admin ID"
                disabled={loading}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={forgotPasswordData.currentPassword}
                onChange={handleForgotPasswordChange}
                placeholder="Enter Current Password"
                disabled={loading}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={forgotPasswordData.newPassword}
                onChange={handleForgotPasswordChange}
                placeholder="Enter New Password"
                disabled={loading}
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={forgotPasswordData.confirmPassword}
                onChange={handleForgotPasswordChange}
                placeholder="Confirm New Password"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="admin-error-message">
                {error}
              </div>
            )}

            <div className="admin-form-buttons">
              <button 
                type="submit" 
                className="admin-login-btn"
                disabled={loading}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>

              <button
                type="button"
                className="admin-cancel-btn"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError('');
                  setForgotPasswordData({
                    adminId: '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;