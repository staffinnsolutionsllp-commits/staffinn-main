import React, { useState, useEffect } from 'react';
import adminAPI from '../services/adminApi';
import './MisRequests.css';

const MisRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMisRequests();
  }, []);

  const fetchMisRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminAPI.getAllMisRequests();
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching MIS requests:', error);
      setError('Failed to fetch MIS requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      console.log('🔄 Approving MIS request:', requestId);
      await adminAPI.approveMisRequest(requestId);
      console.log('✅ MIS request approved successfully');
      fetchMisRequests(); // Refresh the list
    } catch (error) {
      console.error('Error approving MIS request:', error);
      setError('Failed to approve MIS request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      console.log('🔄 Rejecting MIS request:', requestId);
      await adminAPI.rejectMisRequest(requestId);
      console.log('✅ MIS request rejected successfully');
      fetchMisRequests(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting MIS request:', error);
      setError('Failed to reject MIS request');
    }
  };

  const handleDelete = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this MIS request?')) {
      try {
        await adminAPI.deleteMisRequest(requestId);
        fetchMisRequests(); // Refresh the list
      } catch (error) {
        console.error('Error deleting MIS request:', error);
        setError('Failed to delete MIS request');
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

  const handleViewPdf = (pdfUrl) => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="mis-requests">
      <div className="requests-header">
        <h2>MIS Requests</h2>
        <p>Manage signed PDF submissions from Staffinn Partner institutes</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="requests-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading MIS requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-file-pdf"></i>
            <h3>No MIS requests found</h3>
            <p>There are currently no MIS requests from Staffinn Partner institutes.</p>
          </div>
        ) : (
          <div className="requests-table">
            <table>
              <thead>
                <tr>
                  <th>Institute Name</th>
                  <th>Email</th>
                  <th>Institute Number</th>
                  <th>Signed PDF</th>
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
                        <strong>{request.instituteName}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="request-email">
                        {request.email}
                      </div>
                    </td>
                    <td>
                      <div className="request-phone">
                        {request.instituteNumber || 'Not provided'}
                      </div>
                    </td>
                    <td>
                      <div className="pdf-actions">
                        <button
                          className="view-pdf-btn"
                          onClick={() => handleViewPdf(request.pdfUrl)}
                          title="View PDF"
                        >
                          <i className="fas fa-eye"></i>
                          View PDF
                        </button>
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

export default MisRequests;