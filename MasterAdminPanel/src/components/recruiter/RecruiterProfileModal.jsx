import React, { useState } from 'react';
import RecruiterInstitutes from './RecruiterInstitutes';
import './RecruiterProfileModal.css';

const RecruiterProfileModal = ({ recruiter, onClose }) => {
  const [activeTab, setActiveTab] = useState('profile');

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const renderProfileTab = () => (
    <div className="tab-content">
      <div className="profile-section">
        <div className="profile-header">
          <div className="profile-photo-large">
            {recruiter.profilePhoto ? (
              <img src={recruiter.profilePhoto} alt="Profile" />
            ) : (
              <div className="profile-placeholder-large">
                {recruiter.companyName ? recruiter.companyName.charAt(0).toUpperCase() : 'R'}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h2>{recruiter.companyName || 'Unknown Company'}</h2>
            <p className="recruiter-name">{recruiter.recruiterName || 'HR Manager'}</p>
            <p className="designation">{recruiter.designation || 'HR Manager'}</p>
            <div className="profile-meta">
              <span className="meta-item">
                <i className="fas fa-envelope"></i>
                {recruiter.email}
              </span>
              <span className="meta-item">
                <i className="fas fa-phone"></i>
                {recruiter.phoneNumber || 'Not provided'}
              </span>
              {recruiter.website && (
                <span className="meta-item">
                  <i className="fas fa-globe"></i>
                  <a href={recruiter.website} target="_blank" rel="noopener noreferrer">
                    {recruiter.website}
                  </a>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-section">
            <h3>Company Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Industry:</label>
                <span>{recruiter.industry || 'Technology'}</span>
              </div>
              <div className="detail-item">
                <label>Location:</label>
                <span>{recruiter.location || 'India'}</span>
              </div>
              <div className="detail-item">
                <label>Experience:</label>
                <span>{recruiter.experience || '3+ years'}</span>
              </div>
              <div className="detail-item">
                <label>Followers:</label>
                <span>{recruiter.followersCount || 0}</span>
              </div>
            </div>
            <div className="description">
              <label>Company Description:</label>
              <p>{recruiter.companyDescription || 'No description provided'}</p>
            </div>
          </div>

          {recruiter.perks && recruiter.perks.length > 0 && (
            <div className="detail-section">
              <h3>Perks & Benefits</h3>
              <div className="perks-list">
                {recruiter.perks.map((perk, index) => (
                  <div key={index} className="perk-item">
                    <i className="fas fa-check-circle"></i>
                    {perk.text || perk}
                  </div>
                ))}
              </div>
            </div>
          )}

          {recruiter.hiringSteps && recruiter.hiringSteps.length > 0 && (
            <div className="detail-section">
              <h3>Hiring Process</h3>
              <div className="hiring-steps">
                {recruiter.hiringSteps.map((step, index) => (
                  <div key={index} className="step-item">
                    <div className="step-number">{index + 1}</div>
                    <div className="step-content">
                      <h4>{step.title}</h4>
                      <p>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recruiter.interviewQuestions && recruiter.interviewQuestions.length > 0 && (
            <div className="detail-section">
              <h3>Common Interview Questions</h3>
              <div className="questions-list">
                {recruiter.interviewQuestions.map((question, index) => (
                  <div key={index} className="question-item">
                    <span className="question-number">Q{index + 1}:</span>
                    <span className="question-text">{question}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recruiter.officeImages && recruiter.officeImages.length > 0 && (
            <div className="detail-section">
              <h3>Office Images</h3>
              <div className="office-images">
                {recruiter.officeImages.map((image, index) => (
                  <div key={index} className="office-image">
                    <img src={image} alt={`Office ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderJobsTab = () => (
    <div className="tab-content">
      <div className="jobs-section">
        <h3>Jobs Posted ({recruiter.jobs ? recruiter.jobs.length : 0})</h3>
        {recruiter.jobs && recruiter.jobs.length > 0 ? (
          <div className="jobs-list">
            {recruiter.jobs.map((job) => (
              <div key={job.jobId} className="job-card">
                <div className="job-header">
                  <h4>{job.jobTitle}</h4>
                  <span className={`job-status ${job.status?.toLowerCase()}`}>
                    {job.status || 'Active'}
                  </span>
                </div>
                <div className="job-details">
                  <p><strong>Location:</strong> {job.location}</p>
                  <p><strong>Experience:</strong> {job.experience}</p>
                  <p><strong>Salary:</strong> {job.salary}</p>
                  <p><strong>Posted:</strong> {formatDate(job.postedDate)}</p>
                  <p><strong>Staff Applications:</strong> {job.staffApplications || 0}</p>
                  <p><strong>Institute Applications:</strong> {job.instituteApplications || 0}</p>
                  <p><strong>Total Applications:</strong> {job.totalApplications || job.applications || 0}</p>
                </div>
                <div className="job-description">
                  <p>{job.jobDescription}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <p>No jobs posted yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderHiringTab = () => (
    <div className="tab-content">
      <div className="hiring-section">
        <h3>Hiring History ({recruiter.hiringHistory ? recruiter.hiringHistory.length : 0})</h3>
        {recruiter.hiringHistory && recruiter.hiringHistory.length > 0 ? (
          <div className="hiring-list">
            {recruiter.hiringHistory.map((hire) => (
              <div key={hire.hiringRecordID} className="hire-card">
                <div className="hire-header">
                  <div className="candidate-info">
                    <div className="candidate-photo">
                      {hire.studentSnapshot?.profilePhoto ? (
                        <img src={hire.studentSnapshot.profilePhoto} alt="Candidate" />
                      ) : (
                        <div className="candidate-placeholder">
                          {hire.studentSnapshot?.fullName?.charAt(0) || hire.staffName?.charAt(0) || 'C'}
                        </div>
                      )}
                    </div>
                    <div className="candidate-details">
                      <h4>{hire.studentSnapshot?.fullName || hire.staffName || 'Unknown'}</h4>
                      <p>{hire.studentSnapshot?.email || hire.staffEmail || 'No email'}</p>
                      <p className="job-title">{hire.jobTitle}</p>
                    </div>
                  </div>
                  <span className={`hire-status ${hire.status?.toLowerCase()}`}>
                    {hire.status}
                  </span>
                </div>
                <div className="hire-meta">
                  <span className="hire-date">
                    <i className="fas fa-calendar"></i>
                    {formatDate(hire.createdAt)}
                  </span>
                  <span className="hire-type">
                    <i className="fas fa-user"></i>
                    {hire.applicantType === 'institute' ? 'Institute Student' : 'Staff'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <p>No hiring history yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderDashboardTab = () => (
    <div className="tab-content">
      <div className="dashboard-section">
        <h3>Dashboard Statistics</h3>
        {recruiter.dashboardStats ? (
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-briefcase"></i>
              </div>
              <div className="stat-info">
                <h4>{recruiter.dashboardStats.totalJobs || 0}</h4>
                <p>Jobs Posted</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-file-alt"></i>
              </div>
              <div className="stat-info">
                <h4>{recruiter.dashboardStats.totalApplications || 0}</h4>
                <p>Applications</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-user-check"></i>
              </div>
              <div className="stat-info">
                <h4>{recruiter.dashboardStats.totalHires || 0}</h4>
                <p>Hires</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-info">
                <h4>{recruiter.followersCount || 0}</h4>
                <p>Followers</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-data">
            <p>Dashboard statistics not available</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Recruiter Profile Details</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <i className="fas fa-user"></i>
            Profile
          </button>
          <button
            className={`tab-btn ${activeTab === 'institutes' ? 'active' : ''}`}
            onClick={() => setActiveTab('institutes')}
          >
            <i className="fas fa-university"></i>
            Institutes
          </button>
          <button
            className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            <i className="fas fa-briefcase"></i>
            Jobs Posted
          </button>
          <button
            className={`tab-btn ${activeTab === 'hiring' ? 'active' : ''}`}
            onClick={() => setActiveTab('hiring')}
          >
            <i className="fas fa-user-check"></i>
            Hiring History
          </button>
          <button
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="fas fa-chart-bar"></i>
            Dashboard
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'institutes' && (
            <RecruiterInstitutes 
              recruiterId={recruiter.userId} 
              onClose={() => {}} 
            />
          )}
          {activeTab === 'jobs' && renderJobsTab()}
          {activeTab === 'hiring' && renderHiringTab()}
          {activeTab === 'dashboard' && renderDashboardTab()}
        </div>
      </div>
    </div>
  );
};

export default RecruiterProfileModal;