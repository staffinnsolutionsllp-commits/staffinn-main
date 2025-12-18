import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './MisRequests.css';

const MisRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchMisRequests();
  }, []);

  const fetchMisRequests = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAllMisRequests();
      if (response.success) {
        setRequests(response.data || []);
      } else {
        console.error('Failed to fetch MIS requests:', response.message);
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching MIS requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    if (!window.confirm('Are you sure you want to approve this MIS request?')) {
      return;
    }

    setProcessingId(requestId);
    try {
      const response = await apiService.approveMisRequest(requestId);
      if (response.success) {
        alert('MIS request approved successfully!');
        fetchMisRequests(); // Refresh the list
      } else {
        alert('Failed to approve MIS request: ' + response.message);
      }
    } catch (error) {
      console.error('Error approving MIS request:', error);
      alert('Failed to approve MIS request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this MIS request?')) {
      return;
    }

    setProcessingId(requestId);
    try {
      const response = await apiService.rejectMisRequest(requestId);
      if (response.success) {
        alert('MIS request rejected successfully!');
        fetchMisRequests(); // Refresh the list
      } else {
        alert('Failed to reject MIS request: ' + response.message);
      }
    } catch (error) {
      console.error('Error rejecting MIS request:', error);
      alert('Failed to reject MIS request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this MIS request? This action cannot be undone.')) {
      return;
    }

    setProcessingId(requestId);
    try {
      const response = await apiService.deleteMisRequest(requestId);
      if (response.success) {
        alert('MIS request deleted successfully!');
        fetchMisRequests(); // Refresh the list
      } else {
        alert('Failed to delete MIS request: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting MIS request:', error);
      alert('Failed to delete MIS request. Please try again.');
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

  const openPdf = (pdfUrl) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div className="mis-requests">
      <div className="requests-header">
        <h2>MIS Requests</h2>
        <p>Manage MIS agreement requests from Staffinn Partner institutes</p>
      </div>

      <div className="requests-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading MIS requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No MIS requests found</h3>
            <p>There are currently no MIS agreement requests from Staffinn Partner institutes.</p>
          </div>
        ) : (
          <div className="requests-table">
            <div className="table-header">
              <div className="header-cell">Institute</div>
              <div className="header-cell">Email</div>
              <div className="header-cell">Phone</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Submitted</div>
              <div className="header-cell">Agreement</div>
              <div className="header-cell">Actions</div>
            </div>
            
            {requests.map((request) => (
              <div key={request.requestId} className="table-row">
                <div className="table-cell">
                  <div className="name-cell">
                    <div className="name">{request.instituteName}</div>
                    <div className="type">Staffinn Partner</div>
                  </div>
                </div>
                <div className="table-cell">
                  <a href={`mailto:${request.email}`} className="email-link">
                    {request.email}
                  </a>
                </div>
                <div className="table-cell">
                  <a href={`tel:${request.instituteNumber}`} className="phone-link">
                    {request.instituteNumber}
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
                  {request.pdfUrl ? (
                    <button
                      className="view-pdf-btn"
                      onClick={() => openPdf(request.pdfUrl)}
                      title="View signed agreement"
                    >
                      📄 View PDF
                    </button>
                  ) : (
                    <span className="no-pdf">No PDF</span>
                  )}
                </div>
                <div className="table-cell">
                  {request.status === 'pending' ? (
                    <div className="action-buttons">
                      <button
                        className="approve-btn"
                        onClick={() => handleApprove(request.requestId)}
                        disabled={processingId === request.requestId}
                        title="Approve MIS request"
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
                        title="Reject MIS request"
                      >
                        {processingId === request.requestId ? (
                          <span className="btn-spinner"></span>
                        ) : (
                          '✗'
                        )}
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(request.requestId)}
                        disabled={processingId === request.requestId}
                        title="Delete MIS request"
                      >
                        {processingId === request.requestId ? (
                          <span className="btn-spinner"></span>
                        ) : (
                          '🗑️'
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="processed-actions">
                      <span className="processed-text">
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                      <button
                        className="delete-btn small"
                        onClick={() => handleDelete(request.requestId)}
                        disabled={processingId === request.requestId}
                        title="Delete MIS request"
                      >
                        🗑️
                      </button>
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

export default MisRequests;