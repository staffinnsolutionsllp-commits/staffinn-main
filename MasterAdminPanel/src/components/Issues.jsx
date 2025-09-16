import React, { useState, useEffect } from 'react';
import adminAPI from '../services/adminApi';
import './Issues.css';

const Issues = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllIssues();
      
      if (response.success) {
        setIssues(response.data);
      } else {
        setError(response.message || 'Failed to load issues');
      }
    } catch (error) {
      setError(error.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIssue = async (issueId, userName) => {
    if (!confirm(`Are you sure you want to resolve this issue and unblock ${userName}?`)) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [issueId]: 'resolving' }));
      const response = await adminAPI.resolveIssue(issueId);
      
      if (response.success) {
        // Update local state
        setIssues(prev => prev.map(issue => 
          issue.issuesection === issueId 
            ? { ...issue, status: 'resolved' }
            : issue
        ));
        alert('Issue resolved and user unblocked successfully!');
      } else {
        alert('Failed to resolve issue: ' + response.message);
      }
    } catch (error) {
      alert('Failed to resolve issue: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [issueId]: null }));
    }
  };

  const handleDeleteIssue = async (issueId, userName) => {
    if (!confirm(`Are you sure you want to delete this issue from ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [issueId]: 'deleting' }));
      const response = await adminAPI.deleteIssue(issueId);
      
      if (response.success) {
        // Remove from local state
        setIssues(prev => prev.filter(issue => issue.issuesection !== issueId));
        alert('Issue deleted successfully!');
      } else {
        alert('Failed to delete issue: ' + response.message);
      }
    } catch (error) {
      alert('Failed to delete issue: ' + error.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [issueId]: null }));
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      resolved: 'status-resolved'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-pending'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="issues-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading issues...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="issues-container">
        <div className="error-message">
          <h3>Error Loading Issues</h3>
          <p>{error}</p>
          <button onClick={loadIssues} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="issues-container">
      <div className="issues-header">
        <h2>Issues Management</h2>
        <p>Manage help requests from blocked users</p>
        <div className="issues-stats">
          <div className="stat-item">
            <span className="stat-number">{issues.length}</span>
            <span className="stat-label">Total Issues</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{issues.filter(i => i.status === 'pending').length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{issues.filter(i => i.status === 'resolved').length}</span>
            <span className="stat-label">Resolved</span>
          </div>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="no-data">
          <h3>No Issues Found</h3>
          <p>No help requests have been submitted yet.</p>
        </div>
      ) : (
        <div className="issues-list">
          {issues.map((issue) => (
            <div key={issue.issuesection} className={`issue-card ${issue.status}`}>
              <div className="issue-header">
                <div className="user-info">
                  <div className="user-avatar">
                    {issue.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-details">
                    <h4>{issue.name}</h4>
                    <p className="user-email">{issue.email}</p>
                    {issue.userProfile && (
                      <p className="user-id">User ID: {issue.userProfile.userId}</p>
                    )}
                  </div>
                </div>
                <div className="issue-meta">
                  {getStatusBadge(issue.status)}
                  <span className="issue-date">{formatDate(issue.createdAt)}</span>
                </div>
              </div>

              <div className="issue-content">
                <h5>Query:</h5>
                <p className="issue-query">{issue.query}</p>
              </div>

              {issue.userProfile && (
                <div className="user-profile-info">
                  <h5>User Profile:</h5>
                  <div className="profile-details">
                    <span><strong>Role:</strong> {issue.userProfile.role}</span>
                    <span><strong>Blocked:</strong> {issue.userProfile.isBlocked ? 'Yes' : 'No'}</span>
                    <span><strong>Joined:</strong> {formatDate(issue.userProfile.createdAt)}</span>
                  </div>
                </div>
              )}

              <div className="issue-actions">
                {issue.status === 'pending' && (
                  <button
                    className="action-btn resolve-btn"
                    onClick={() => handleResolveIssue(issue.issuesection, issue.name)}
                    disabled={actionLoading[issue.issuesection]}
                  >
                    {actionLoading[issue.issuesection] === 'resolving' ? '...' : 'Resolve & Unblock'}
                  </button>
                )}
                
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDeleteIssue(issue.issuesection, issue.name)}
                  disabled={actionLoading[issue.issuesection]}
                >
                  {actionLoading[issue.issuesection] === 'deleting' ? '...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Issues;