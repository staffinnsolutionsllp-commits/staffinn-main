/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import './JobCard.css';

const JobCard = ({ job, onApply, showApplyButton = true, buttonText = "Apply Now" }) => {
  const [showModal, setShowModal] = useState(false);

  const formatJobDescription = (description) => {
    if (!description) return '';
    
    return description
      .replace(/^(.+):$/gm, '<strong>$1:</strong>')
      .replace(/^([A-Z][A-Z\s]+)$/gm, '<strong>$1</strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<u>$1</u>')
      .replace(/^[\s]*[-\*]\s+(.+)$/gm, '• $1')
      .replace(/^[\s]*\d+\.\s+(.+)$/gm, '$&')
      .replace(/\n/g, '<br>');
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Not disclosed';
    // Check if salary is just a number
    const numericSalary = parseFloat(salary);
    if (!isNaN(numericSalary)) {
      return `${numericSalary} LPA`;
    }
    // If it already has text, return as is
    return salary;
  };

  const formatExperience = (experience) => {
    if (!experience) return 'Not specified';
    // If experience is a number, add '+ years'
    const numericExp = parseFloat(experience);
    if (!isNaN(numericExp)) {
      return `${numericExp}+ years`;
    }
    // If it already has text, return as is
    return experience;
  };

  const formatLocation = (location) => {
    if (!location) return 'Not specified';
    // If location has comma, take only the first part (city)
    if (location.includes(',')) {
      const parts = location.split(',').map(s => s.trim());
      // Return city, state format on same line
      return parts.slice(0, 2).join(', ');
    }
    return location;
  };

  const formatSkills = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    if (typeof skills === 'string') return skills.split(',').map(s => s.trim());
    return [];
  };

  const getTimeSincePosted = (postedDate) => {
    if (!postedDate) return 'Recently posted';
    
    const now = new Date();
    const posted = new Date(postedDate);
    const diffTime = Math.abs(now - posted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const handleApplyClick = () => {
    if (onApply) {
      onApply(job);
    }
  };

  const handleViewDetails = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleViewJob = () => {
    console.log('View Job clicked, job data:', job);
    const recruiterId = job.recruiterId || job.recruiterInfo?.id;
    const jobId = job.id || job.jobId;
    
    console.log('Recruiter ID:', recruiterId, 'Job ID:', jobId);
    
    if (recruiterId && jobId) {
      // Close modal first
      closeModal();
      
      // Navigate to recruiter page with job ID in URL hash
      setTimeout(() => {
        window.location.href = `/recruiter/${recruiterId}#job-${jobId}`;
      }, 100);
    } else {
      console.error('Missing recruiterId or jobId');
      alert('Unable to navigate to job. Missing information.');
    }
  };

  const getCompanyInitial = (companyName) => {
    if (!companyName) return 'C';
    return companyName.charAt(0).toUpperCase();
  };

  return (
    <>
      <div className="modern-job-card">
        {/* Company Header */}
        <div className="modern-job-header">
          <div className="company-logo-container">
            {(job.recruiterInfo?.companyLogo || job.recruiterInfo?.logo || job.recruiterInfo?.profilePhoto) ? (
              <img 
                src={job.recruiterInfo?.companyLogo || job.recruiterInfo?.logo || job.recruiterInfo?.profilePhoto} 
                alt={job.recruiterInfo?.companyName || 'Company'} 
                className="company-logo" 
                onError={(e) => {
                  console.log('Logo failed to load, showing placeholder');
                  e.target.style.display = 'none';
                  const placeholder = e.target.parentElement.querySelector('.company-logo-placeholder');
                  if (placeholder) placeholder.style.display = 'flex';
                }}
                onLoad={() => console.log('Logo loaded successfully:', job.recruiterInfo?.companyLogo || job.recruiterInfo?.logo)}
              />
            ) : null}
            <div 
              className="company-logo-placeholder" 
              style={{ display: (job.recruiterInfo?.companyLogo || job.recruiterInfo?.logo || job.recruiterInfo?.profilePhoto) ? 'none' : 'flex' }}
            >
              {getCompanyInitial(job.recruiterInfo?.companyName)}
            </div>
          </div>
          <div className="company-details">
            <div className="company-name-row">
              <span className="modern-company-name">{job.recruiterInfo?.companyName || 'Company Name'}</span>
              {job.recruiterInfo?.verified && (
                <span className="modern-verified-badge">✓</span>
              )}
            </div>
          </div>
        </div>

        {/* Job Title and Type Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <h3 className="modern-job-title">{job.title || 'Job Title'}</h3>
          
          {/* Job Type Badge */}
          <div className="modern-job-type-badge">
            <span className={`modern-job-type ${(job.jobType || 'full-time').toLowerCase().replace('-', '')}`}>
              {job.jobType || 'Full-time'}
            </span>
          </div>
        </div>

        {/* Job Description */}
        {job.description && (
          <p className="modern-job-description">
            {job.description.length > 100 
              ? `${job.description.substring(0, 100)}...` 
              : job.description
            }
          </p>
        )}

        {/* Job Info Row */}
        <div className="modern-job-info-row">
          <div className="modern-info-item">
            <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
            <span className="info-text">{formatSalary(job.salary)}</span>
          </div>
          <div className="modern-info-item">
            <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span className="info-text">{job.openings || '3'} Openings</span>
          </div>
          <div className="modern-info-item">
            <svg className="info-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span className="info-text">{formatLocation(job.location)}</span>
          </div>
        </div>

        {/* Skills Tags */}
        <div className="modern-job-skills">
          {formatSkills(job.skills).slice(0, 3).map((skill, index) => (
            <span className="modern-skill-tag" key={index}>{skill}</span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="modern-job-actions">
          <button className="modern-view-details-btn" onClick={handleViewDetails}>
            View Details
          </button>
          {showApplyButton && (
            <button className="modern-apply-btn" onClick={handleApplyClick}>
              {buttonText}
            </button>
          )}
        </div>

        {/* Posted Date */}
        <div className="modern-posted-date">
          Posted {getTimeSincePosted(job.postedDate)}
        </div>
      </div>

      {/* Job Details Modal - New Design */}
      {showModal && (
        <div className="modern-job-modal-overlay" onClick={closeModal}>
          <div className="modern-job-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modern-modal-header">
              <div className="modal-header-left">
                <div className="modal-company-logo">
                  {(job.recruiterInfo?.companyLogo || job.recruiterInfo?.logo || job.recruiterInfo?.profilePhoto) ? (
                    <img 
                      src={job.recruiterInfo?.companyLogo || job.recruiterInfo?.logo || job.recruiterInfo?.profilePhoto} 
                      alt={job.recruiterInfo?.companyName || 'Company'} 
                    />
                  ) : (
                    <div className="modal-logo-placeholder">
                      {getCompanyInitial(job.recruiterInfo?.companyName)}
                    </div>
                  )}
                </div>
                <div className="modal-title-section">
                  <h2 className="modal-job-title">{job.title || 'Job Title'}</h2>
                  <div className="modal-company-name">
                    <span>{job.recruiterInfo?.companyName || 'Company Name'}</span>
                    {job.recruiterInfo?.verified && (
                      <span className="modal-verified-icon">✓</span>
                    )}
                  </div>
                </div>
              </div>
              <button className="modern-modal-close" onClick={closeModal}>×</button>
            </div>

            {/* Modal Info Grid */}
            <div className="modern-modal-info-grid">
              <div className="modal-info-item">
                <div className="modal-info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <div className="modal-info-content">
                  <div className="modal-info-label">JOB TYPE</div>
                  <div className="modal-info-value">{job.jobType || 'Full-time'}</div>
                </div>
              </div>

              <div className="modal-info-item">
                <div className="modal-info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <div className="modal-info-content">
                  <div className="modal-info-label">STIPEND / SALARY</div>
                  <div className="modal-info-value">{formatSalary(job.salary)}</div>
                </div>
              </div>

              <div className="modal-info-item">
                <div className="modal-info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div className="modal-info-content">
                  <div className="modal-info-label">EXPERIENCE</div>
                  <div className="modal-info-value">{formatExperience(job.experience)}</div>
                </div>
              </div>

              <div className="modal-info-item">
                <div className="modal-info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div className="modal-info-content">
                  <div className="modal-info-label">LOCATION</div>
                  <div className="modal-info-value">{formatLocation(job.location)}</div>
                </div>
              </div>

              <div className="modal-info-item">
                <div className="modal-info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 7h16M4 12h16M4 17h16"></path>
                  </svg>
                </div>
                <div className="modal-info-content">
                  <div className="modal-info-label">DEPARTMENT</div>
                  <div className="modal-info-value">{job.department || 'Not specified'}</div>
                </div>
              </div>

              <div className="modal-info-item">
                <div className="modal-info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="modal-info-content">
                  <div className="modal-info-label">POSTED DATE</div>
                  <div className="modal-info-value">{getTimeSincePosted(job.postedDate)}</div>
                </div>
              </div>
            </div>

            {/* About the role */}
            <div className="modern-modal-section">
              <h3 className="modal-section-title">About the role</h3>
              <div 
                className="modal-description-text" 
                dangerouslySetInnerHTML={{ __html: formatJobDescription(job.description) || 'No description available' }}
              />
            </div>

            {/* Required Skills */}
            <div className="modern-modal-section">
              <h3 className="modal-section-title">Required Skills</h3>
              <div className="modal-skills-list">
                {formatSkills(job.skills).map((skill, index) => (
                  <span key={index} className="modal-skill-badge">{skill}</span>
                ))}
              </div>
            </div>

            {/* Company Information */}
            <div className="modern-modal-company-section">
              <div className="company-section-header">
                <h3 className="modal-section-title">Company Information</h3>
                <a 
                  href={job.recruiterId ? `/recruiter/${job.recruiterId}` : '#'} 
                  className="view-profile-link"
                  onClick={(e) => {
                    if (job.recruiterId) {
                      e.preventDefault();
                      window.location.href = `/recruiter/${job.recruiterId}`;
                    }
                  }}
                >
                  View Profile →
                </a>
              </div>
              <div className="company-info-content">
                <h4 className="company-info-name">{job.recruiterInfo?.companyName || 'Company Name'}</h4>
                <p className="company-info-industry">{job.recruiterInfo?.industry || 'Technology'}</p>
                {job.recruiterInfo?.location && (
                  <p className="company-info-location">{job.recruiterInfo.location}</p>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modern-modal-actions">
              <button className="modal-view-job-btn" onClick={handleViewJob}>
                View Job →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobCard;