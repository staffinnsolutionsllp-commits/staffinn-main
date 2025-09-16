import React from 'react';
import './StudentProfileModal.css';

const StudentProfileModal = ({ student, onClose }) => {
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
      return dateString || 'Not available';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="student-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Student Profile Details</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-content">
          {/* Basic Information */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Basic Information</h3>
            </div>
            <div className="profile-grid">
              <div className="profile-item">
                <label>Full Name:</label>
                <span>{student.fullName || student.name || 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <label>Student ID:</label>
                <span className="student-id">
                  {student.studentId || student.instituteStudntsID || 'Not provided'}
                </span>
              </div>
              <div className="profile-item">
                <label>Email:</label>
                <span>{student.email || student.emailAddress || 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <label>Phone:</label>
                <span>{student.phone || student.phoneNumber || student.mobile || 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <label>Course/Program:</label>
                <span>{student.course || student.program || student.branch || student.department || 'Not specified'}</span>
              </div>
              <div className="profile-item">
                <label>Year/Semester:</label>
                <span>{student.year || student.currentYear || student.academicYear || student.semester || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Profile Photo */}
          {(student.profilePhoto || student.photo || student.profilePicture) && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Profile Photo</h3>
              </div>
              <div className="profile-image-container">
                <img 
                  src={student.profilePhoto || student.photo || student.profilePicture} 
                  alt="Student Profile" 
                  className="profile-image"
                />
              </div>
            </div>
          )}

          {/* Academic Information */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Academic Information</h3>
            </div>
            <div className="profile-grid">
              <div className="profile-item">
                <label>Institute ID:</label>
                <span className="institute-id">{student.instituteId || 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <label>Institute Name:</label>
                <span>{student.instituteName || 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <label>CGPA/GPA:</label>
                <span>{student.cgpa || student.gpa || 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <label>Enrollment Date:</label>
                <span>{formatDate(student.enrollmentDate || student.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Skills */}
          {student.skills && student.skills.length > 0 && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Skills</h3>
              </div>
              <div className="skills-list">
                {(Array.isArray(student.skills) ? student.skills : [student.skills]).map((skill, index) => (
                  <div key={index} className="skill-item">
                    <span className="skill-name">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application History */}
          {student.applications && student.applications.length > 0 && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Application History ({student.applications.length})</h3>
              </div>
              <div className="applications-list">
                {student.applications.map((application, index) => (
                  <div key={index} className="application-item">
                    <div className="application-header">
                      <div className="job-title">
                        {application.jobTitle || 'Job Title Not Available'}
                      </div>
                      <div className={`application-status ${application.status || 'pending'}`}>
                        {(application.status || 'pending').toUpperCase()}
                      </div>
                    </div>
                    <div className="application-details">
                      <div className="company-name">
                        <i className="fas fa-building"></i>
                        {application.companyName || 'Company Not Available'}
                      </div>
                      <div className="application-date">
                        <i className="fas fa-calendar"></i>
                        Applied: {formatDate(application.appliedDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Additional Information</h3>
            </div>
            <div className="profile-grid">
              <div className="profile-item">
                <label>Date of Birth:</label>
                <span>{student.dateOfBirth ? formatDate(student.dateOfBirth) : 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <label>Gender:</label>
                <span>{student.gender || 'Not specified'}</span>
              </div>
              <div className="profile-item">
                <label>Address:</label>
                <span>{student.address || 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <label>Emergency Contact:</label>
                <span>{student.emergencyContact || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Account Information</h3>
            </div>
            <div className="profile-grid">
              <div className="profile-item">
                <label>Profile Created:</label>
                <span>{formatDate(student.createdAt || student.timestamp)}</span>
              </div>
              <div className="profile-item">
                <label>Last Updated:</label>
                <span>{formatDate(student.updatedAt || student.lastModified)}</span>
              </div>
              <div className="profile-item">
                <label>Total Applications:</label>
                <span className="applications-count">
                  {student.applications ? student.applications.length : 0}
                </span>
              </div>
              <div className="profile-item">
                <label>Profile Status:</label>
                <span className="profile-status active">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="close-modal-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;