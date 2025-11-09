import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import './RecruiterInstitutes.css';

const RecruiterInstitutes = ({ recruiterId, onClose }) => {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInstitute, setSelectedInstitute] = useState(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    if (recruiterId) {
      loadInstitutes();
    }
  }, [recruiterId]);

  const loadInstitutes = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getRecruiterInstitutes(recruiterId);
      
      if (response.success) {
        setInstitutes(response.data);
      }
    } catch (error) {
      setError(error.message || 'Failed to load institutes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudents = async (institute) => {
    try {
      setStudentsLoading(true);
      setSelectedInstitute(institute);
      setShowStudentsModal(true);
      
      const response = await adminAPI.getInstituteStudents(institute.instituteId, recruiterId);
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
      const response = await adminAPI.getStudentProfile(studentId);
      if (response.success) {
        // Open student profile in new window or modal
        window.open(`/student-profile/${studentId}`, '_blank');
      }
    } catch (error) {
      alert('Failed to load student profile: ' + error.message);
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
      <div className="institutes-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading institutes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="institutes-container">
        <div className="error-message">
          <h3>Error Loading Institutes</h3>
          <p>{error}</p>
          <button onClick={loadInstitutes} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="institutes-container">
      <div className="institutes-header">
        <h3>Institutes ({institutes.length})</h3>
        <p>Institutes that have applied to this recruiter's jobs</p>
      </div>

      {institutes.length === 0 ? (
        <div className="no-data">
          <i className="fas fa-university"></i>
          <h4>No Institutes Found</h4>
          <p>No institutes have applied to this recruiter's jobs yet.</p>
        </div>
      ) : (
        <div className="institutes-grid">
          {institutes.map((institute) => (
            <div key={institute.instituteId} className="institute-card">
              <div className="institute-header">
                <div className="institute-logo">
                  {institute.logo ? (
                    <img src={institute.logo} alt="Institute Logo" />
                  ) : (
                    <div className="logo-placeholder">
                      {institute.instituteName ? institute.instituteName.charAt(0).toUpperCase() : 'I'}
                    </div>
                  )}
                </div>
                <div className="institute-info">
                  <h4>{institute.instituteName || 'Unknown Institute'}</h4>
                  <p className="institute-location">{institute.location || 'Location not specified'}</p>
                </div>
              </div>

              <div className="institute-stats">
                <div className="stat-item">
                  <span className="stat-label">Job Location</span>
                  <span className="stat-value">{institute.instituteLocation || institute.location || 'Location Not Defined'}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Students Count</span>
                  <span className="stat-value">{institute.studentsCount || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Jobs Applied</span>
                  <span className="stat-value">{institute.jobsApplied || 0}</span>
                </div>
              </div>

              <div className="institute-details">
                <div className="detail-row">
                  <span className="detail-label">Contact:</span>
                  <span className="detail-value">{institute.email || 'Not provided'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{institute.phone || 'Not provided'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">First Applied:</span>
                  <span className="detail-value">{formatDate(institute.firstApplicationDate)}</span>
                </div>
              </div>

              <div className="institute-actions">
                <button
                  className="action-btn view-students"
                  onClick={() => handleViewStudents(institute)}
                  title="View students from this institute"
                >
                  <i className="fas fa-users"></i>
                  View Students
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
                    <div key={student.studentId} className="student-card">
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
    </div>
  );
};

export default RecruiterInstitutes;