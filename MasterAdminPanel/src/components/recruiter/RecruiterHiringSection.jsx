import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import './RecruiterHiringSection.css';

const RecruiterHiringSection = () => {
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [hiringHistory, setHiringHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hiringLoading, setHiringLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    loadRecruiters();
  }, []);

  const loadRecruiters = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllRecruiters();
      if (response.success) {
        setRecruiters(response.data);
      }
    } catch (error) {
      console.error('Failed to load recruiters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecruiterSelect = async (recruiterId) => {
    try {
      setHiringLoading(true);
      setSelectedRecruiter(recruiterId);
      const response = await adminAPI.getRecruiterHiringHistory(recruiterId);
      if (response.success) {
        setHiringHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to load hiring history:', error);
      setHiringHistory([]);
    } finally {
      setHiringLoading(false);
    }
  };

  const handleViewCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateModal(true);
  };

  const handleViewProfile = async (candidate) => {
    try {
      setProfileLoading(true);
      setShowProfileModal(true);
      
      let response;
      if (candidate.applicantType === 'staff') {
        response = await adminAPI.getStaffProfile(candidate.staffId);
      } else {
        response = await adminAPI.getStudentProfile(candidate.studentId);
      }
      
      if (response.success) {
        setSelectedProfile({ ...response.data, type: candidate.applicantType });
      } else {
        throw new Error(response.message || 'Failed to load profile');
      }
    } catch (error) {
      alert(`Failed to load profile: ` + error.message);
      setSelectedProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="recruiter-hiring-section">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading recruiters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recruiter-hiring-section">
      <div className="page-header">
        <h1 className="page-title">Recruiter Hiring History</h1>
        <div className="search-filter-section">
          <div className="filter-dropdown">
            <select 
              className="status-filter"
              value={selectedRecruiter || ''} 
              onChange={(e) => handleRecruiterSelect(e.target.value)}
            >
              <option value="">Choose a recruiter...</option>
              {recruiters.map(recruiter => (
                <option key={recruiter.userId} value={recruiter.userId}>
                  {recruiter.companyName || 'Unknown Company'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedRecruiter && (
        <div className="hiring-content">
          {hiringLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading hiring history...</p>
            </div>
          ) : hiringHistory.length === 0 ? (
            <div className="no-data">
              <i className="fas fa-user-check"></i>
              <h3>No Hiring History Found</h3>
              <p>This recruiter hasn't hired any candidates yet.</p>
            </div>
          ) : (
            <div className="modern-table-container">
              <div className="table-header">
                <div className="table-title">Hired Candidates</div>
                <div className="table-actions">
                  <button className="export-btn">
                    <i className="fas fa-download"></i>
                    Export
                  </button>
                </div>
              </div>
              
              <div className="table-content">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>CANDIDATE</th>
                      <th>JOB TITLE</th>
                      <th>SOURCE</th>
                      <th>HIRING DATE</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hiringHistory.map(hire => (
                      <tr key={hire.hiringRecordID} className="table-row">
                        <td>
                          <div className="staff-info">
                            <div className="staff-avatar">
                              {hire.studentSnapshot?.profilePhoto || hire.profilePhoto ? (
                                <img src={hire.studentSnapshot?.profilePhoto || hire.profilePhoto} alt="Profile" />
                              ) : (
                                <div className="avatar-placeholder">
                                  {(hire.studentSnapshot?.fullName || hire.staffName || 'C').charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="staff-details">
                              <div className="staff-name">{hire.studentSnapshot?.fullName || hire.staffName || 'Unknown'}</div>
                              <div className="staff-email">{hire.studentSnapshot?.email || hire.staffEmail || 'No email'}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="role-badge">
                            {hire.jobTitle}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${hire.applicantType === 'institute' ? 'active' : 'blocked'}`}>
                            {hire.applicantType === 'institute' ? 'Institute' : 'Staff'}
                          </span>
                        </td>
                        <td>
                          <span className="visibility-badge visible">
                            {formatDate(hire.createdAt)}
                          </span>
                        </td>
                        <td>
                          <div className="action-icons">
                            <button
                              className="icon-btn view-icon"
                              onClick={() => handleViewProfile(hire)}
                              title="View profile"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Candidate Details Modal */}
      {showCandidateModal && selectedCandidate && (
        <div className="modal-overlay" onClick={() => setShowCandidateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Candidate Profile</h3>
              <button className="close-btn" onClick={() => setShowCandidateModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="candidate-profile">
                <div className="profile-header">
                  <div className="profile-photo-large">
                    {selectedCandidate.studentSnapshot?.profilePhoto || selectedCandidate.profilePhoto ? (
                      <img 
                        src={selectedCandidate.studentSnapshot?.profilePhoto || selectedCandidate.profilePhoto} 
                        alt="Candidate" 
                      />
                    ) : (
                      <div className="photo-placeholder-large">
                        {(selectedCandidate.studentSnapshot?.fullName || selectedCandidate.staffName || 'C').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="profile-info">
                    <h2>{selectedCandidate.studentSnapshot?.fullName || selectedCandidate.staffName || 'Unknown'}</h2>
                    <p className="email">{selectedCandidate.studentSnapshot?.email || selectedCandidate.staffEmail || 'No email'}</p>
                    <p className="phone">{selectedCandidate.studentSnapshot?.phone || selectedCandidate.staffPhone || 'No phone'}</p>
                  </div>
                </div>

                <div className="hiring-details">
                  <div className="detail-section">
                    <h4>Hiring Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Job Title:</label>
                        <span>{selectedCandidate.jobTitle}</span>
                      </div>
                      <div className="detail-item">
                        <label>Source:</label>
                        <span className={`source-badge ${selectedCandidate.applicantType}`}>
                          {selectedCandidate.applicantType === 'institute' ? 'Institute Student' : 'Staff'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Hiring Date:</label>
                        <span>{formatDate(selectedCandidate.createdAt)}</span>
                      </div>
                      <div className="detail-item">
                        <label>Status:</label>
                        <span className="status-hired">Hired</span>
                      </div>
                    </div>
                  </div>

                  {selectedCandidate.studentSnapshot && (
                    <div className="detail-section">
                      <h4>Student Information</h4>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>Course:</label>
                          <span>{selectedCandidate.studentSnapshot.course || 'Not specified'}</span>
                        </div>
                        <div className="detail-item">
                          <label>Year:</label>
                          <span>{selectedCandidate.studentSnapshot.year || 'Not specified'}</span>
                        </div>
                        <div className="detail-item">
                          <label>Institute:</label>
                          <span>{selectedCandidate.studentSnapshot.instituteName || 'Not specified'}</span>
                        </div>
                        <div className="detail-item">
                          <label>CGPA:</label>
                          <span>{selectedCandidate.studentSnapshot.cgpa || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCandidate.studentSnapshot?.skills && (
                    <div className="detail-section">
                      <h4>Skills</h4>
                      <div className="skills-list">
                        {selectedCandidate.studentSnapshot.skills.split(',').map((skill, index) => (
                          <span key={index} className="skill-tag">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedProfile?.type === 'staff' ? 'Staff' : 'Student'} Profile</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowProfileModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {profileLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Loading profile...</p>
                </div>
              ) : selectedProfile ? (
                <div className="profile-content">
                  <div className="profile-header">
                    <div className="profile-photo">
                      {selectedProfile.profilePhoto ? (
                        <img src={selectedProfile.profilePhoto} alt="Profile" />
                      ) : (
                        <div className="photo-placeholder">
                          {selectedProfile.fullName ? selectedProfile.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <div className="profile-info">
                      <h2>{selectedProfile.fullName}</h2>
                      {selectedProfile.type === 'staff' ? (
                        <p className="experience">{selectedProfile.experience || 'Experience not specified'}</p>
                      ) : (
                        <p className="course">{selectedProfile.course} • {selectedProfile.year}</p>
                      )}
                      <p className="email">{selectedProfile.email}</p>
                      {selectedProfile.phone && (
                        <p className="phone">{selectedProfile.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="profile-details">
                    <div className="detail-section">
                      <h4>{selectedProfile.type === 'staff' ? 'Professional' : 'Academic'} Information</h4>
                      <div className="detail-grid">
                        {selectedProfile.type === 'staff' ? (
                          <>
                            <div className="detail-item">
                              <span className="detail-label">Experience:</span>
                              <span className="detail-value">{selectedProfile.experience || 'Not specified'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Role:</span>
                              <span className="detail-value">{selectedProfile.isActiveStaff ? 'Active Staff' : 'Job Seeker'}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="detail-item">
                              <span className="detail-label">Course:</span>
                              <span className="detail-value">{selectedProfile.course}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Year:</span>
                              <span className="detail-value">{selectedProfile.year}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Institute:</span>
                              <span className="detail-value">{selectedProfile.instituteName || 'Not specified'}</span>
                            </div>
                            {selectedProfile.cgpa && (
                              <div className="detail-item">
                                <span className="detail-label">CGPA:</span>
                                <span className="detail-value">{selectedProfile.cgpa}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {selectedProfile.applications && selectedProfile.applications.length > 0 && (
                      <div className="detail-section">
                        <h4>Application History</h4>
                        <div className="applications-list">
                          {selectedProfile.applications.slice(0, 5).map((app, index) => (
                            <div key={index} className="application-item">
                              <div className="app-info">
                                <h5>{app.jobTitle || 'Job Title Not Available'}</h5>
                                <p>{app.companyName || 'Company Not Available'}</p>
                              </div>
                              <div className="app-status">
                                <span className={`status ${app.status?.toLowerCase()}`}>
                                  {app.status || 'Pending'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="no-data">
                  <h4>Profile Not Available</h4>
                  <p>Profile information could not be loaded.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterHiringSection;