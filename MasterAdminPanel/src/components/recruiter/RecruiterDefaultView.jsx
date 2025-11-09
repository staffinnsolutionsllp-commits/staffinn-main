import React from 'react';
import './RecruiterDefaultView.css';

const RecruiterDefaultView = ({ recruiter }) => {
  if (!recruiter) {
    return (
      <div className="default-view-container">
        <div className="welcome-message">
          <div className="welcome-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <h2>Select a Recruiter</h2>
          <p>Choose a recruiter from the list to view their detailed information and statistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="default-view-container">
      <div className="recruiter-overview">
        <div className="recruiter-header">
          <div className="recruiter-avatar">
            {recruiter.profilePhoto ? (
              <img src={recruiter.profilePhoto} alt="Profile" />
            ) : (
              <div className="avatar-placeholder">
                {recruiter.companyName ? recruiter.companyName.charAt(0).toUpperCase() : 'R'}
              </div>
            )}
          </div>
          <div className="recruiter-info">
            <h2>{recruiter.companyName || 'Unknown Company'}</h2>
            <p className="recruiter-email">{recruiter.email}</p>
            <span className={`status-badge ${recruiter.isBlocked ? 'blocked' : 'active'}`}>
              {recruiter.isBlocked ? 'Blocked' : 'Active'}
            </span>
          </div>
        </div>

        <div className="quick-stats">
          <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-briefcase"></i>
            </div>
            <div className="stat-details">
              <h3>{recruiter.jobsCount || 0}</h3>
              <p>Jobs Posted</p>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <div className="stat-details">
              <h3>{recruiter.stats?.totalApplications || 0}</h3>
              <p>Applications</p>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-user-check"></i>
            </div>
            <div className="stat-details">
              <h3>{recruiter.hiresCount || 0}</h3>
              <p>Hires</p>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-details">
              <h3>{recruiter.followersCount || 0}</h3>
              <p>Followers</p>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button className="action-btn primary">
            <i className="fas fa-eye"></i>
            View Details
          </button>
          <button className="action-btn secondary">
            <i className="fas fa-briefcase"></i>
            View Jobs
          </button>
          <button className="action-btn secondary">
            <i className="fas fa-chart-bar"></i>
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDefaultView;