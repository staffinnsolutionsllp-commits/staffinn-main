import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import './RecruiterInstitutesSection.css';

const RecruiterInstitutesSection = () => {
  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [institutesLoading, setInstitutesLoading] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [showStudentProfileModal, setShowStudentProfileModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProfileLoading, setStudentProfileLoading] = useState(false);

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
      setInstitutesLoading(true);
      setSelectedRecruiter(recruiterId);
      const response = await adminAPI.getRecruiterInstitutes(recruiterId);
      if (response.success) {
        setInstitutes(response.data);
      }
    } catch (error) {
      console.error('Failed to load institutes:', error);
      setInstitutes([]);
    } finally {
      setInstitutesLoading(false);
    }
  };

  const handleViewStudents = async (institute) => {
    try {
      setStudentsLoading(true);
      setSelectedInstitute(institute);
      setShowStudentsModal(true);
      
      const response = await adminAPI.getInstituteStudents(institute.instituteId, selectedRecruiter);
      if (response.success) {
        setStudents(response.data);
      }
    } catch (error) {
      alert('Failed to load students: ' + error.message);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleViewStudentProfile = async (studentId) => {
    try {
      setStudentProfileLoading(true);
      setShowStudentProfileModal(true);
      
      const response = await adminAPI.getStudentProfile(studentId);
      if (response.success) {
        setSelectedStudent(response.data);
      }
    } catch (error) {
      alert('Failed to load student profile: ' + error.message);
      setSelectedStudent(null);
    } finally {
      setStudentProfileLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="recruiter-institutes-section">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading recruiters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recruiter-institutes-container">
      <div className="page-header">
        <h1 className="page-title">Recruiter Institutes</h1>
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

      <div className="modern-table-container">
        <div className="table-header">
          <div className="table-title">Institute Partners</div>
          <div className="table-actions">
            <button className="export-btn">
              <i className="fas fa-download"></i>
              Export
            </button>
          </div>
        </div>
        
        <div className="table-content">
          {!selectedRecruiter ? (
            <div className="no-data">
              <h3>Select a Recruiter</h3>
              <p>Please choose a recruiter from the dropdown to view their institute partners.</p>
            </div>
          ) : institutesLoading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading institutes...</p>
            </div>
          ) : institutes.length === 0 ? (
            <div className="no-data">
              <h3>No Institutes Found</h3>
              <p>This recruiter has no linked institutes yet.</p>
            </div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>INSTITUTE</th>
                  <th>LOCATION</th>
                  <th>STUDENTS</th>
                  <th>APPLICATIONS</th>
                  <th>JOBS APPLIED</th>
                  <th>VIEW STUDENTS</th>
                </tr>
              </thead>
              <tbody>
                {institutes.map(institute => (
                  <tr key={institute.instituteId} className="table-row">
                    <td>
                      <div className="institute-info">
                        <div className="institute-avatar">
                          <div className="avatar-placeholder">
                            {(institute.instituteName || 'I').charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="institute-details">
                          <div className="institute-name">{institute.instituteName || 'Unknown Institute'}</div>
                          <div className="institute-location">{institute.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="role-badge">
                        {institute.location || 'Not specified'}
                      </span>
                    </td>
                    <td>
                      <span className="metric-value placements">
                        {institute.studentsCount || 0}
                      </span>
                    </td>
                    <td>
                      <span className="metric-value collaborations">
                        {institute.totalApplications || 0}
                      </span>
                    </td>
                    <td>
                      <span className="metric-value placements">
                        {institute.jobsApplied || 0}
                      </span>
                    </td>
                    <td>
                      <button
                        className="view-students-btn"
                        onClick={() => handleViewStudents(institute)}
                        title="View students from this institute"
                      >
                        <i className="fas fa-users"></i>
                        View Students
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Students Modal */}
      {showStudentsModal && selectedInstitute && (
        <div className="modal-overlay" onClick={() => setShowStudentsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedInstitute.instituteName} - Students</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowStudentsModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {studentsLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Loading students...</p>
                </div>
              ) : students.length === 0 ? (
                <div className="no-data">
                  <i className="fas fa-user-graduate"></i>
                  <h4>No Students Found</h4>
                  <p>No students from this institute have applied yet.</p>
                </div>
              ) : (
                <div className="students-list">
                  {students.map((student) => (
                    <div key={student.uniqueKey || `${student.studentId}_${student.jobTitle}`} className="student-card">
                      <div className="student-photo">
                        {student.profilePhoto ? (
                          <img src={student.profilePhoto} alt="Student" />
                        ) : (
                          <div className="photo-placeholder">
                            {student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
                          </div>
                        )}
                      </div>
                      <div className="student-info">
                        <h4>{student.fullName}</h4>
                        <p>{student.course} • {student.year}</p>
                        <p className="student-email">{student.email}</p>
                        <p className="applied-job">Applied for: {student.jobTitle}</p>
                      </div>
                      <div className="student-actions">
                        <button
                          className="view-profile-btn"
                          onClick={() => handleViewStudentProfile(student.studentId)}
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
        </div>
      )}

      {/* Student Profile Modal */}
      {showStudentProfileModal && (
        <div className="modal-overlay" onClick={() => setShowStudentProfileModal(false)}>
          <div className="modal-content student-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Student Profile</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowStudentProfileModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              {studentProfileLoading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <p>Loading student profile...</p>
                </div>
              ) : selectedStudent ? (
                <div className="student-profile-content">
                  <div className="profile-header">
                    <div className="profile-photo">
                      {selectedStudent.profilePhoto ? (
                        <img src={selectedStudent.profilePhoto} alt="Student" />
                      ) : (
                        <div className="photo-placeholder">
                          {selectedStudent.fullName ? selectedStudent.fullName.charAt(0).toUpperCase() : 'S'}
                        </div>
                      )}
                    </div>
                    <div className="profile-info">
                      <h2>{selectedStudent.fullName}</h2>
                      <p className="student-course">{selectedStudent.course} • {selectedStudent.year}</p>
                      <p className="student-email">{selectedStudent.email}</p>
                      {selectedStudent.phone && (
                        <p className="student-phone">{selectedStudent.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="profile-details">
                    <div className="detail-section">
                      <h4>Academic Information</h4>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">Course:</span>
                          <span className="detail-value">{selectedStudent.course}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Year:</span>
                          <span className="detail-value">{selectedStudent.year}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Student ID:</span>
                          <span className="detail-value">{selectedStudent.studentId}</span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedStudent.applications && selectedStudent.applications.length > 0 && (
                      <div className="detail-section">
                        <h4>Application History ({selectedStudent.applications.length})</h4>
                        <div className="applications-list">
                          {selectedStudent.applications.map((app, index) => (
                            <div key={index} className="application-item">
                              <div className="app-info">
                                <h5>{app.jobTitle || 'Job Title Not Available'}</h5>
                                <p>{app.companyName || 'Company Not Available'}</p>
                              </div>
                              <div className="app-status">
                                <span className={`status ${app.status?.toLowerCase()}`}>
                                  {app.status || 'Pending'}
                                </span>
                                <span className="app-date">
                                  {new Date(app.appliedDate || app.timestamp).toLocaleDateString()}
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
                  <p>Student profile information could not be loaded.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterInstitutesSection;