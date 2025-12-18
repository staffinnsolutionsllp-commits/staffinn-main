import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './RegistrationRequests.css';

console.log('🔥 RegistrationRequests component loaded at:', new Date().toISOString());

const RegistrationRequests = () => {
  console.log('🔥 RegistrationRequests component rendering');
  const [activeTab, setActiveTab] = useState('institute');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await apiService.getRegistrationRequests(activeTab);
      if (response.success) {
        setRequests(response.data || []);
      } else {
        console.error('Failed to fetch requests:', response.message);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    console.log('🔄 Approve button clicked for request:', requestId);
    console.log('🔍 Current token:', localStorage.getItem('token') ? 'Present' : 'Missing');
    console.log('🔍 API URL:', import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1');
    
    if (!window.confirm('Are you sure you want to approve this request? This will create a user account and send login credentials via email.')) {
      console.log('❌ User cancelled approval');
      return;
    }

    console.log('✅ User confirmed approval, processing...');
    setProcessingId(requestId);
    
    try {
      console.log('📡 Calling API to approve request...');
      console.log('📡 Making request to approve:', requestId);
      
      const response = await apiService.approveRegistrationRequest(requestId);
      console.log('📡 API response received:', response);
      
      if (response.success) {
        console.log('✅ Approval successful!');
        alert('Request approved successfully! Login credentials have been sent to the user\'s email.');
        fetchRequests(); // Refresh the list
      } else {
        console.log('❌ Approval failed:', response.message);
        alert('Failed to approve request: ' + response.message);
      }
    } catch (error) {
      console.error('❌ Error approving request:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      alert('Failed to approve request. Please try again.');
    } finally {
      console.log('🔄 Cleaning up processing state');
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this request? A rejection email will be sent to the user.')) {
      return;
    }

    setProcessingId(requestId);
    try {
      const response = await apiService.rejectRegistrationRequest(requestId);
      if (response.success) {
        alert('Request rejected successfully! Rejection email has been sent to the user.');
        fetchRequests(); // Refresh the list
      } else {
        alert('Failed to reject request: ' + response.message);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-pending'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="registration-requests">
      <div className="requests-header">
        <h2>Registration Requests</h2>
        <p>Manage Institute and Recruiter registration requests</p>
      </div>

      <div className="requests-tabs">
        <button 
          className={`tab-btn ${activeTab === 'institute' ? 'active' : ''}`}
          onClick={() => setActiveTab('institute')}
        >
          Institute Requests
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recruiter' ? 'active' : ''}`}
          onClick={() => setActiveTab('recruiter')}
        >
          Recruiter Requests
        </button>
      </div>

      <div className="requests-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading {activeTab} requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No {activeTab} requests found</h3>
            <p>There are currently no pending {activeTab} registration requests.</p>
          </div>
        ) : (
          <div className="requests-table">
            <div className="table-header">
              <div className="header-cell">Name</div>
              <div className="header-cell">Email</div>
              <div className="header-cell">Phone</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Submitted</div>
              <div className="header-cell">Actions</div>
            </div>
            
            {requests.map((request) => (
              <div key={request.requestId} className="table-row">
                <div className="table-cell">
                  <div className="name-cell">
                    <div className="name">{request.name}</div>
                    <div className="type">{request.type}</div>
                  </div>
                </div>
                <div className="table-cell">
                  <a href={`mailto:${request.email}`} className="email-link">
                    {request.email}
                  </a>
                </div>
                <div className="table-cell">
                  <a href={`tel:${request.phoneNumber}`} className="phone-link">
                    {request.phoneNumber}
                  </a>
                </div>
                <div className="table-cell">
                  {getStatusBadge(request.status)}
                </div>
                <div className="table-cell">
                  <div className="date-cell">
                    {formatDate(request.createdAt)}
                  </div>
                </div>
                <div className="table-cell">
                  {request.status === 'pending' ? (
                    <div className="action-buttons">
                      <button
                        className="approve-btn"
                        onClick={(e) => {
                          console.log('🔥 BUTTON CLICKED!', request.requestId);
                          e.preventDefault();
                          handleApprove(request.requestId);
                        }}
                        disabled={processingId === request.requestId}
                      >
                        {processingId === request.requestId ? (
                          <span className="btn-spinner"></span>
                        ) : (
                          '✓'
                        )}
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleReject(request.requestId)}
                        disabled={processingId === request.requestId}
                      >
                        {processingId === request.requestId ? (
                          <span className="btn-spinner"></span>
                        ) : (
                          '✗'
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="processed-actions">
                      <span className="processed-text">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationRequests;