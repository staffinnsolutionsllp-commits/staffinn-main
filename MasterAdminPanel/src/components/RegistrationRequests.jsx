import React, { useState, useEffect } from 'react';
import adminAPI from '../services/adminApi';
import './RegistrationRequests.css';

const RegistrationRequests = () => {
  // Get admin role from localStorage
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const isRecruiterAdmin = adminData.role === 'recruiter';
  const isInstituteAdmin = adminData.role === 'institute';
  
  const [activeTab, setActiveTab] = useState(isInstituteAdmin ? 'institute' : 'recruiter');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInstituteTypeModal, setShowInstituteTypeModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getRegistrationRequests(activeTab);
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to fetch registration requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      // Check if it's an institute request
      const request = requests.find(r => r.requestId === requestId);
      if (request && request.type === 'institute') {
        // Show institute type selection modal
        setSelectedRequestId(requestId);
        setShowInstituteTypeModal(true);
        return;
      }
      
      // For recruiters, approve directly
      console.log('🔄 Approving request:', requestId);
      await adminAPI.approveRegistrationRequest(requestId);
      console.log('✅ Request approved successfully');
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error approving request:', error);
      setError('Failed to approve request');
    }
  };

  const handleInstituteTypeSelection = async (instituteType) => {
    try {
      console.log('🔄 Approving institute request with type:', selectedRequestId, instituteType);
      await adminAPI.approveRegistrationRequest(selectedRequestId, instituteType);
      console.log('✅ Institute request approved successfully');
      setShowInstituteTypeModal(false);
      setSelectedRequestId(null);
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error approving institute request:', error);
      setError('Failed to approve institute request');
      setShowInstituteTypeModal(false);
      setSelectedRequestId(null);
    }
  };

  const handleReject = async (requestId) => {
    try {
      console.log('🔄 Rejecting request:', requestId);
      await adminAPI.rejectRegistrationRequest(requestId);
      console.log('✅ Request rejected successfully');
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError('Failed to reject request');
    }
  };

  const handleDelete = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await adminAPI.deleteRegistrationRequest(requestId);
        fetchRequests(); // Refresh the list
      } catch (error) {
        console.error('Error deleting request:', error);
        setError('Failed to delete request');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
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
      <span className={`status-badge ${statusClasses[status]}`}>
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

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Institute Type Selection Modal */}
      {showInstituteTypeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Select Institute Type</h3>
            <p>Choose the type for this institute:</p>
            <div className="institute-type-buttons">
              <button 
                className="type-btn normal-btn"
                onClick={() => handleInstituteTypeSelection('normal')}
              >
                <i className="fas fa-university"></i>
                Normal Institute
              </button>
              <button 
                className="type-btn partner-btn"
                onClick={() => handleInstituteTypeSelection('staffinn_partner')}
              >
                <i className="fas fa-handshake"></i>
                Staffinn Partner
              </button>
            </div>
            <button 
              className="cancel-btn"
              onClick={() => {
                setShowInstituteTypeModal(false);
                setSelectedRequestId(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="requests-tabs">
        {!isRecruiterAdmin && (
          <button
            className={`tab-button ${activeTab === 'institute' ? 'active' : ''}`}
            onClick={() => setActiveTab('institute')}
          >
            <i className="fas fa-university"></i>
            Institute Requests
          </button>
        )}
        {!isInstituteAdmin && (
          <button
            className={`tab-button ${activeTab === 'recruiter' ? 'active' : ''}`}
            onClick={() => setActiveTab('recruiter')}
          >
            <i className="fas fa-briefcase"></i>
            Recruiter Requests
          </button>
        )}
      </div>

      <div className="requests-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <h3>No {activeTab} requests found</h3>
            <p>There are currently no registration requests for {activeTab}s.</p>
          </div>
        ) : (
          <div className="requests-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.requestId}>
                    <td>
                      <div className="request-name">
                        <strong>{request.name}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="request-email">
                        {request.email}
                      </div>
                    </td>
                    <td>
                      <div className="request-phone">
                        {request.phoneNumber}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(request.status)}
                    </td>
                    <td>
                      <div className="request-date">
                        {formatDate(request.createdAt)}
                      </div>
                    </td>
                    <td>
                      <div className="request-actions">
                        {request.status === 'pending' && (
                          <>
                            <button
                              className="action-btn approve-btn"
                              onClick={() => handleApprove(request.requestId)}
                              title="Approve Request"
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              className="action-btn reject-btn"
                              onClick={() => handleReject(request.requestId)}
                              title="Reject Request"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </>
                        )}
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(request.requestId)}
                          title="Delete Request"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationRequests;