import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import './RecruiterJobsSection.css';

const RecruiterJobsSection = () => {
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCandidatesModal, setShowCandidatesModal] = useState(false);
  const [candidates, setCandidates] = useState({ staff: [], students: [] });
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [showCandidateProfileModal, setShowCandidateProfileModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [candidateProfileLoading, setCandidateProfileLoading] = useState(false);

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
      setJobsLoading(true);
      setSelectedRecruiter(recruiterId);
      const response = await adminAPI.getRecruiterJobs(recruiterId);
      if (response.success) {
        setJobs(response.data);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const handleViewJob = (job) => {
    setSelectedJob(job);
    setShowJobModal(true);
  };

  const handleViewCandidates = async (job) => {
    try {
      setCandidatesLoading(true);
      setSelectedJob(job);
      setShowCandidatesModal(true);
      
      const response = await adminAPI.getJobCandidates(job.jobId);
      if (response.success) {
        setCandidates({
          staff: response.data.staff || [],
          students: response.data.students || []
        });
      }
    } catch (error) {
      alert('Failed to load candidates: ' + error.message);
      setCandidates({ staff: [], students: [] });
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleViewCandidateProfile = async (candidateId, type) => {
    try {
      setCandidateProfileLoading(true);
      setShowCandidateProfileModal(true);
      
      let response;
      if (type === 'staff') {
        response = await adminAPI.getStaffProfile(candidateId);
      } else {
        response = await adminAPI.getStudentProfile(candidateId);
      }
      
      if (response.success) {
        setSelectedCandidate({ ...response.data, type });
      } else {
        throw new Error(response.message || 'Failed to load profile');
      }
    } catch (error) {
      alert(`Failed to load ${type} profile: ` + error.message);
      setSelectedCandidate(null);
    } finally {
      setCandidateProfileLoading(false);
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
      <div className="recruiter-jobs-section">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading recruiters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recruiter-jobs-container">
      <div className="page-header">
        <h1 className="page-title">Recruiter Jobs</h1>
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
        <div className="jobs-content">
          {jobsLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="no-data">
              <i className="fas fa-briefcase"></i>
              <h3>No Jobs Found</h3>
              <p>This recruiter hasn't posted any jobs yet.</p>
            </div>
          ) : (
            <div className="modern-table-container">
              <div className="table-header">
                <div className="table-title">Posted Jobs</div>
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
                      <th>JOB TITLE</th>
                      <th>LOCATION</th>
                      <th>STATUS</th>
                      <th>APPLICATIONS</th>
                      <th>CANDIDATES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => (
                      <tr key={job.jobId} className="table-row">
                        <td>
                          <div className="staff-info">
                            <div className="staff-avatar">
                              <div className="avatar-placeholder">
                                {(job.jobTitle || 'J').charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="staff-details">
                              <div className="staff-name">{job.jobTitle}</div>
                              <div className="staff-email">{job.experience}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="role-badge">
                            {job.location}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${job.status?.toLowerCase() === 'active' ? 'active' : 'blocked'}`}>
                            {job.status || 'active'}
                          </span>
                        </td>
                        <td>
                          <span className="visibility-badge visible">
                            {job.totalApplications || job.applications || 0}
                          </span>
                        </td>
                        <td>
                          <button
                            className="candidates-btn"
                            onClick={() => handleViewCandidates(job)}
                            title="View all candidates"
                          >
                            <i className="fas fa-users"></i>
                            View Candidates
                          </button>
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

      {/* Job Details Modal */}
      {showJobModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowJobModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedJob.jobTitle}</h3>
              <button className="close-btn" onClick={() => setShowJobModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="job-details">
                <div className="detail-row">
                  <label>Location:</label>
                  <span>{selectedJob.location}</span>
                </div>
                <div className="detail-row">
                  <label>Experience:</label>
                  <span>{selectedJob.experience}</span>
                </div>
                <div className="detail-row">
                  <label>Salary:</label>
                  <span>{selectedJob.salary}</span>
                </div>
                <div className="detail-row">
                  <label>Status:</label>
                  <span className={`status-badge ${selectedJob.status?.toLowerCase()}`}>
                    {selectedJob.status || 'Active'}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Posted Date:</label>
                  <span>{formatDate(selectedJob.postedDate)}</span>
                </div>
                {selectedJob.closedDate && (
                  <div className="detail-row">
                    <label>Closed Date:</label>
                    <span>{formatDate(selectedJob.closedDate)}</span>
                  </div>
                )}
                <div className="applications-summary">
                  <h4>Applications Summary</h4>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="summary-label">Staff Applications</span>
                      <span className="summary-value">{selectedJob.staffApplications || 0}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Institute Applications</span>
                      <span className="summary-value">{selectedJob.instituteApplications || 0}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Total Applications</span>
                      <span className="summary-value">{selectedJob.totalApplications || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="job-description">
                  <h4>Job Description</h4>
                  <p>{selectedJob.jobDescription || 'No description provided'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidates Modal */}
      {showCandidatesModal && selectedJob && (
        <div className="modal-overlay" onClick={() => setShowCandidatesModal(false)}>
          <div className="modal-content candidates-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Candidates for {selectedJob.jobTitle}</h3>
              <button className="close-btn" onClick={() => setShowCandidatesModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {candidatesLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Loading candidates...</p>
                </div>
              ) : (
                <div className="candidates-content">
                  {/* Staff Candidates */}
                  <div className="candidates-section">
                    <h4>Staff Applicants ({candidates.staff.length})</h4>
                    {candidates.staff.length === 0 ? (
                      <div className="no-candidates">
                        <p>No staff members have applied for this job.</p>
                      </div>
                    ) : (
                      <div className="candidates-list">
                        {candidates.staff.map((staff) => (
                          <div key={staff.staffId} className="candidate-card">
                            <div className="candidate-photo">
                              {staff.profilePhoto ? (
                                <img src={staff.profilePhoto} alt="Staff" />
                              ) : (
                                <div className="photo-placeholder">
                                  {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : 'S'}
                                </div>
                              )}
                            </div>
                            <div className="candidate-info">
                              <h5>{staff.fullName}</h5>
                              <p>{staff.email}</p>
                              <p className="experience">{staff.experience || 'Experience not specified'}</p>
                            </div>
                            <div className="candidate-actions">
                              <button
                                className="view-profile-btn"
                                onClick={() => handleViewCandidateProfile(staff.staffId, 'staff')}
                                title="View staff profile"
                              >
                                <i className="fas fa-user"></i>
                                View Profile
                              </button>
                              <span className={`status ${staff.applicationStatus?.toLowerCase()}`}>
                                {staff.applicationStatus || 'Pending'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Student Candidates */}
                  <div className="candidates-section">
                    <h4>Student Applicants ({candidates.students.length})</h4>
                    {candidates.students.length === 0 ? (
                      <div className="no-candidates">
                        <p>No students have applied for this job.</p>
                      </div>
                    ) : (
                      <div className="candidates-list">
                        {candidates.students.map((student) => (
                          <div key={student.studentId} className="candidate-card">
                            <div className="candidate-photo">
                              {student.profilePhoto ? (
                                <img src={student.profilePhoto} alt="Student" />
                              ) : (
                                <div className="photo-placeholder">
                                  {student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
                                </div>
                              )}
                            </div>
                            <div className="candidate-info">
                              <h5>{student.fullName}</h5>
                              <p>{student.email}</p>
                              <p className="course">{student.course} • {student.year}</p>
                              <p className="institute">{student.instituteName}</p>
                            </div>
                            <div className="candidate-actions">
                              <button
                                className="view-profile-btn"
                                onClick={() => handleViewCandidateProfile(student.studentId, 'student')}
                                title="View student profile"
                              >
                                <i className="fas fa-user"></i>
                                View Profile
                              </button>
                              <span className={`status ${student.applicationStatus?.toLowerCase()}`}>
                                {student.applicationStatus || 'Pending'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Candidate Profile Modal */}
      {showCandidateProfileModal && (
        <div className="modal-overlay" onClick={() => setShowCandidateProfileModal(false)}>
          <div className="modal-content candidate-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedCandidate?.type === 'staff' ? 'Staff' : 'Student'} Profile</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowCandidateProfileModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {candidateProfileLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Loading profile...</p>
                </div>
              ) : selectedCandidate ? (
                <div className="candidate-profile-content">
                  <div className="profile-header">
                    <div className="profile-photo">
                      {selectedCandidate.profilePhoto ? (
                        <img src={selectedCandidate.profilePhoto} alt="Profile" />
                      ) : (
                        <div className="photo-placeholder">
                          {selectedCandidate.fullName ? selectedCandidate.fullName.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <div className="profile-info">
                      <h2>{selectedCandidate.fullName}</h2>
                      {selectedCandidate.type === 'student' ? (
                        <p className="candidate-course">{selectedCandidate.course} • {selectedCandidate.year}</p>
                      ) : (
                        <p className="candidate-experience">{selectedCandidate.experience}</p>
                      )}
                      <p className="candidate-email">{selectedCandidate.email}</p>
                      {selectedCandidate.phone && (
                        <p className="candidate-phone">{selectedCandidate.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="profile-details">
                    <div className="detail-section">
                      <h4>{selectedCandidate.type === 'staff' ? 'Professional' : 'Academic'} Information</h4>
                      <div className="detail-grid">
                        {selectedCandidate.type === 'student' ? (
                          <>
                            <div className="detail-item">
                              <span className="detail-label">Course:</span>
                              <span className="detail-value">{selectedCandidate.course}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Year:</span>
                              <span className="detail-value">{selectedCandidate.year}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Institute:</span>
                              <span className="detail-value">{selectedCandidate.instituteName || 'Not specified'}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="detail-item">
                              <span className="detail-label">Experience:</span>
                              <span className="detail-value">{selectedCandidate.experience}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Role:</span>
                              <span className="detail-value">{selectedCandidate.isActiveStaff ? 'Active Staff' : 'Job Seeker'}</span>
                            </div>
                          </>
                        )}
                        <div className="detail-item">
                          <span className="detail-label">ID:</span>
                          <span className="detail-value">{selectedCandidate.studentId || selectedCandidate.userId}</span>
                        </div>
                      </div>
                    </div>
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

export default RecruiterJobsSection;