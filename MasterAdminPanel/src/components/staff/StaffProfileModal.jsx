import React from 'react';
import './StaffProfileModal.css';

const StaffProfileModal = ({ staff, onClose }) => {
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

  const getContactTypeIcon = (type) => {
    switch (type) {
      case 'call': return '📞';
      case 'whatsapp': return '💬';
      case 'email': return '📧';
      default: return '📞';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Staff Profile Details</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Personal Information */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Personal Information</h3>
            </div>
            <div className="profile-info-grid">
              <div className="profile-photo-section">
                {staff.profilePhoto ? (
                  <img src={staff.profilePhoto} alt="Profile" className="profile-photo-large" />
                ) : (
                  <div className="profile-placeholder-large">
                    {staff.fullName ? staff.fullName.charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
              </div>
              <div className="profile-details">
                <div className="detail-item">
                  <label>Full Name:</label>
                  <span>{staff.fullName || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <label>Email:</label>
                  <span>{staff.email}</span>
                </div>
                <div className="detail-item">
                  <label>Phone:</label>
                  <span>{staff.phone || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <label>Address:</label>
                  <span>{staff.address || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <label>Profile Mode:</label>
                  <span className={`profile-mode ${staff.isActiveStaff ? 'active' : 'seeker'}`}>
                    {staff.isActiveStaff ? 'Active Staff' : 'Seeker'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Availability:</label>
                  <span className={`availability ${staff.availability}`}>
                    {staff.availability || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Professional Information</h3>
            </div>
            <div className="detail-item">
              <label>Skills:</label>
              <span>{staff.skills || 'Not provided'}</span>
            </div>
            <div className="detail-item">
              <label>Resume:</label>
              {staff.resumeUrl ? (
                <a href={staff.resumeUrl} target="_blank" rel="noopener noreferrer" className="resume-link">
                  View Resume
                </a>
              ) : (
                <span>Not uploaded</span>
              )}
            </div>
          </div>

          {/* Experience */}
          {staff.experiences && staff.experiences.length > 0 && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Experience</h3>
              </div>
              <div className="experiences-list">
                {staff.experiences.map((exp, index) => (
                  <div key={index} className="experience-item">
                    <h4>{exp.role || 'Position not specified'}</h4>
                    <p><strong>Company:</strong> {exp.company || 'Not specified'}</p>
                    <p><strong>Salary:</strong> {exp.salary || 'Not specified'}</p>
                    <p><strong>Duration:</strong> {exp.startDate || 'Not specified'} - {exp.endDate || 'Not specified'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {staff.education && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Education</h3>
              </div>
              <div className="education-grid">
                {staff.education.tenth && (staff.education.tenth.percentage || staff.education.tenth.school) && (
                  <div className="education-item">
                    <h4>10th Grade</h4>
                    <p><strong>Percentage:</strong> {staff.education.tenth.percentage || 'Not provided'}%</p>
                    <p><strong>School:</strong> {staff.education.tenth.school || 'Not provided'}</p>
                    <p><strong>Year:</strong> {staff.education.tenth.year || 'Not provided'}</p>
                  </div>
                )}
                
                {staff.education.twelfth && (staff.education.twelfth.percentage || staff.education.twelfth.school) && (
                  <div className="education-item">
                    <h4>12th Grade</h4>
                    <p><strong>Percentage:</strong> {staff.education.twelfth.percentage || 'Not provided'}%</p>
                    <p><strong>School:</strong> {staff.education.twelfth.school || 'Not provided'}</p>
                    <p><strong>Year:</strong> {staff.education.twelfth.year || 'Not provided'}</p>
                  </div>
                )}
                
                {staff.education.graduation && (staff.education.graduation.degree || staff.education.graduation.college) && (
                  <div className="education-item">
                    <h4>Graduation</h4>
                    <p><strong>Degree:</strong> {staff.education.graduation.degree || 'Not provided'}</p>
                    <p><strong>College:</strong> {staff.education.graduation.college || 'Not provided'}</p>
                    <p><strong>Percentage/CGPA:</strong> {staff.education.graduation.percentage || 'Not provided'}</p>
                    <p><strong>Duration:</strong> {staff.education.graduation.startDate || 'Not provided'} - {staff.education.graduation.pursuing ? 'Pursuing' : (staff.education.graduation.endDate || 'Not provided')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Certificates */}
          {staff.certificates && staff.certificates.length > 0 && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Certificates</h3>
              </div>
              <div className="certificates-list">
                {staff.certificates.map((cert, index) => (
                  <div key={index} className="certificate-item">
                    <h4>{cert.name}</h4>
                    <p><strong>Issuer:</strong> {cert.issuer}</p>
                    <p><strong>Duration:</strong> {cert.duration}</p>
                    <p><strong>Issued:</strong> {cert.issued}</p>
                    {cert.url && (
                      <a href={cert.url} target="_blank" rel="noopener noreferrer" className="certificate-link">
                        View Certificate
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dashboard Data */}
          {staff.dashboardData && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Dashboard Statistics</h3>
              </div>
              <div className="dashboard-stats">
                <div className="stat-item">
                  <span className="stat-number">{staff.dashboardData.totalApplications || 0}</span>
                  <span className="stat-label">Total Applications</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{staff.dashboardData.profileViews || 0}</span>
                  <span className="stat-label">Profile Views</span>
                </div>
              </div>
              
              {staff.dashboardData.recentApplications && staff.dashboardData.recentApplications.length > 0 && (
                <div className="recent-applications">
                  <h4>Recent Applications</h4>
                  <div className="applications-list">
                    {staff.dashboardData.recentApplications.map((app, index) => (
                      <div key={index} className="application-item">
                        <div className="app-company">{app.companyName}</div>
                        <div className="app-position">{app.jobTitle}</div>
                        <div className="app-date">{formatDate(app.appliedAt)}</div>
                        <div className="app-status">{app.status}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact History */}
          {staff.contactHistory && staff.contactHistory.length > 0 && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Contact History</h3>
              </div>
              <div className="contact-history-list">
                {staff.contactHistory.map((contact, index) => (
                  <div key={index} className="contact-item">
                    <div className="contact-type">
                      {getContactTypeIcon(contact.contactMethod)} {contact.contactMethod}
                    </div>
                    <div className="contact-details">
                      <p><strong>Staff:</strong> {contact.staffName}</p>
                      <p><strong>Phone:</strong> {contact.staffPhone}</p>
                      <p><strong>Date:</strong> {formatDate(contact.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Information */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Account Information</h3>
            </div>
            <div className="account-info">
              <div className="detail-item">
                <label>User ID:</label>
                <span>{staff.userId}</span>
              </div>
              <div className="detail-item">
                <label>Staff ID:</label>
                <span>{staff.staffId}</span>
              </div>
              <div className="detail-item">
                <label>Created At:</label>
                <span>{formatDate(staff.createdAt)}</span>
              </div>
              <div className="detail-item">
                <label>Last Updated:</label>
                <span>{formatDate(staff.updatedAt)}</span>
              </div>
              <div className="detail-item">
                <label>Profile Visibility:</label>
                <span className={`visibility ${staff.profileVisibility}`}>
                  {staff.profileVisibility}
                </span>
              </div>
              <div className="detail-item">
                <label>Account Status:</label>
                <span className={`status ${staff.isBlocked ? 'blocked' : 'active'}`}>
                  {staff.isBlocked ? 'Blocked' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfileModal;