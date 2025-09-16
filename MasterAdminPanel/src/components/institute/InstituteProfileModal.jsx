import React from 'react';
import './InstituteProfileModal.css';

const InstituteProfileModal = ({ institute, onClose }) => {
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
      <div className="institute-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Institute Profile Details</h2>
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
                <label>Institute Name:</label>
                <span>{institute.name || institute.instituteName || 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <label>Email:</label>
                <span>{institute.email || 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <label>Phone:</label>
                <span>{institute.phone || 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <label>Registration Number:</label>
                <span>{institute.registrationNumber || 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <label>Website:</label>
                <span>
                  {institute.website ? (
                    <a href={institute.website} target="_blank" rel="noopener noreferrer">
                      {institute.website}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </span>
              </div>
              <div className="profile-item full-width">
                <label>Address:</label>
                <span>{institute.address || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Profile Image */}
          {(institute.profileImage || institute.logo) && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Profile Image</h3>
              </div>
              <div className="profile-image-container">
                <img 
                  src={institute.profileImage || institute.logo} 
                  alt="Institute Profile" 
                  className="profile-image"
                />
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Additional Details</h3>
            </div>
            <div className="profile-grid">
              <div className="profile-item">
                <label>Established Year:</label>
                <span>{institute.establishedYear || 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <label>Experience:</label>
                <span>{institute.experience || 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <label>Total Students:</label>
                <span>{institute.totalStudents || 'Not provided'}</span>
              </div>
              <div className="profile-item">
                <label>Placement Rate:</label>
                <span>{institute.placementRate ? `${institute.placementRate}%` : 'Not provided'}</span>
              </div>
              <div className="profile-item full-width">
                <label>Description:</label>
                <span>{institute.description || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Courses */}
          {institute.courses && institute.courses.length > 0 && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Courses Offered</h3>
              </div>
              <div className="courses-list">
                {institute.courses.map((course, index) => (
                  <div key={index} className="course-item">
                    <span className="course-name">{course}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affiliations */}
          {institute.affiliations && institute.affiliations.length > 0 && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Affiliations</h3>
              </div>
              <div className="affiliations-list">
                {institute.affiliations.map((affiliation, index) => (
                  <div key={index} className="affiliation-item">
                    <span className="affiliation-name">{affiliation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          {institute.badges && institute.badges.length > 0 && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Badges & Certifications</h3>
              </div>
              <div className="badges-list">
                {institute.badges.map((badge, index) => (
                  <div key={index} className="badge-item">
                    <span className="badge-name">{badge}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Placement Information */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Placement Information</h3>
            </div>
            <div className="placement-stats">
              <div className="placement-stat-card">
                <div className="stat-icon placement">
                  <i className="fas fa-percentage"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Placement Rate</div>
                  <div className="stat-value">{institute.placementRate ? `${institute.placementRate}%` : 'Not provided'}</div>
                </div>
              </div>
              <div className="placement-stat-card">
                <div className="stat-icon salary">
                  <i className="fas fa-rupee-sign"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Average Salary</div>
                  <div className="stat-value">{institute.placementData?.averageSalary || 'Not provided'}</div>
                </div>
              </div>
              <div className="placement-stat-card">
                <div className="stat-icon package">
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Highest Package</div>
                  <div className="stat-value">{institute.placementData?.highestPackage || 'Not provided'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Hiring Companies */}
          {institute.placementData?.topHiringCompanies && institute.placementData.topHiringCompanies.length > 0 && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Top Hiring Companies</h3>
              </div>
              <div className="companies-grid">
                {institute.placementData.topHiringCompanies.map((company, index) => (
                  <div key={index} className="company-card">
                    {company.logo && (
                      <div className="company-logo">
                        <img src={company.logo} alt={company.name} />
                      </div>
                    )}
                    <div className="company-info">
                      <div className="company-name">{company.name}</div>
                      {company.packagesOffered && (
                        <div className="company-package">Package: {company.packagesOffered}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Placement Success */}
          {institute.placementData?.recentPlacementSuccess && institute.placementData.recentPlacementSuccess.length > 0 && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Recent Placement Success</h3>
              </div>
              <div className="placements-grid">
                {institute.placementData.recentPlacementSuccess.map((student, index) => (
                  <div key={index} className="placement-card">
                    {student.photo && (
                      <div className="student-photo">
                        <img src={student.photo} alt={student.name} />
                      </div>
                    )}
                    <div className="student-info">
                      <div className="student-name">{student.name}</div>
                      <div className="student-company">{student.companyName}</div>
                      <div className="student-package">{student.packageOffered}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Industry Collaborations */}
          {institute.collaborationData?.collaborationCards && institute.collaborationData.collaborationCards.length > 0 && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Industry Collaborations</h3>
              </div>
              <div className="collaborations-grid">
                {institute.collaborationData.collaborationCards.map((collab, index) => (
                  <div key={index} className="collaboration-card">
                    {collab.image && (
                      <div className="collaboration-image">
                        <img src={collab.image} alt={collab.title} />
                      </div>
                    )}
                    <div className="collaboration-info">
                      <div className="collaboration-title">{collab.title}</div>
                      <div className="collaboration-company">{collab.company}</div>
                      <div className="collaboration-type">{collab.type}</div>
                      {collab.description && (
                        <div className="collaboration-description">{collab.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Government Schemes (MOU Items) */}
          {institute.collaborationData?.mouItems && institute.collaborationData.mouItems.length > 0 && (
            <div className="profile-section">
              <div className="section-header">
                <h3>Government Schemes & MOUs</h3>
              </div>
              <div className="mou-list">
                {institute.collaborationData.mouItems.map((mou, index) => (
                  <div key={index} className="mou-item">
                    <div className="mou-header">
                      <div className="mou-title">{mou.title}</div>
                      {mou.pdfUrl && (
                        <a href={mou.pdfUrl} target="_blank" rel="noopener noreferrer" className="mou-pdf-link">
                          <i className="fas fa-file-pdf"></i>
                          View PDF
                        </a>
                      )}
                    </div>
                    {mou.description && (
                      <div className="mou-description">{mou.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Status */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Account Status</h3>
            </div>
            <div className="status-grid">
              <div className="status-item">
                <label>Account Status:</label>
                <span className={`status-badge ${institute.isBlocked ? 'blocked' : 'active'}`}>
                  {institute.isBlocked ? 'Blocked' : 'Active'}
                </span>
              </div>
              <div className="status-item">
                <label>Profile Visibility:</label>
                <span className={`visibility-badge ${institute.isVisible ? 'visible' : 'hidden'}`}>
                  {institute.isVisible ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div className="status-item">
                <label>Profile Status:</label>
                <span className={`profile-status ${institute.isLive ? 'live' : 'draft'}`}>
                  {institute.isLive ? 'Live' : 'Draft'}
                </span>
              </div>
              <div className="status-item">
                <label>User Role:</label>
                <span className="role-badge">{institute.role || 'institute'}</span>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="profile-section">
            <div className="section-header">
              <h3>Account Information</h3>
            </div>
            <div className="profile-grid">
              <div className="profile-item">
                <label>User ID:</label>
                <span className="user-id">{institute.userId || institute.instituteId || 'Not available'}</span>
              </div>
              <div className="profile-item">
                <label>Registered On:</label>
                <span>{formatDate(institute.createdAt)}</span>
              </div>
              <div className="profile-item">
                <label>Last Updated:</label>
                <span>{formatDate(institute.updatedAt)}</span>
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

export default InstituteProfileModal;