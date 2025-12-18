/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import './JobCard.css';

const JobCard = ({ job, onApply, showApplyButton = true, buttonText = "Apply Now" }) => {
  const [showModal, setShowModal] = useState(false);

  const formatJobDescription = (description) => {
    if (!description) return '';
    
    return description
      // Convert headings (lines that end with :)
      .replace(/^(.+):$/gm, '<strong>$1:</strong>')
      // Convert lines that are all caps as headings
      .replace(/^([A-Z][A-Z\s]+)$/gm, '<strong>$1</strong>')
      // Convert **bold** text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Convert __underline__ text
      .replace(/__(.+?)__/g, '<u>$1</u>')
      // Convert bullet points (- or *)
      .replace(/^[\s]*[-\*]\s+(.+)$/gm, '• $1')
      // Convert numbered lists
      .replace(/^[\s]*\d+\.\s+(.+)$/gm, '$&')
      // Preserve line breaks
      .replace(/\n/g, '<br>');
  };

  const formatSalary = (salary) => {
    if (!salary) return 'Salary not disclosed';
    return salary;
  };

  const formatExperience = (experience) => {
    if (!experience) return 'Experience not specified';
    return experience;
  };

  const formatLocation = (location) => {
    if (!location) return 'Location not specified';
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

  return (
    <>
      <div className="job-card">
        <div className="job-card-header">
          <h3 className="job-title">{job.title || 'Job Title'}</h3>
          <div className="job-type-container">
            <span className={`job-type ${(job.jobType || 'full-time').toLowerCase().replace('-', '')}`}>
              {job.jobType || 'Full-time'}
            </span>
          </div>
        </div>
        
        <div className="job-card-content">
          <div className="job-card-details">
            <div className="detail-item">
              <span className="detail-label">Stipend:</span>
              <span className="detail-text">{formatSalary(job.salary)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Experience:</span>
              <span className="detail-text">{formatExperience(job.experience)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Location:</span>
              <span className="detail-text">{formatLocation(job.location)}</span>
            </div>
            {job.graduationYear && (
              <div className="detail-item">
                <span className="detail-label">Graduation Year:</span>
                <span className="detail-text">{job.graduationYear}</span>
              </div>
            )}
          </div>
          
          {job.description && (
            <p className="job-description">
              {job.description.length > 80 
                ? `${job.description.substring(0, 80)}...` 
                : job.description
              }
            </p>
          )}
          
          <div className="job-skills">
            {formatSkills(job.skills).slice(0, 3).map((skill, index) => (
              <span className="skill-tag" key={index}>{skill}</span>
            ))}
            {formatSkills(job.skills).length > 3 && (
              <span className="more-skills">+{formatSkills(job.skills).length - 3} more</span>
            )}
          </div>

          {job.recruiterInfo && (
            <div className="company-info">
              <span className="company-name">{job.recruiterInfo.companyName}</span>
              {job.recruiterInfo.verified && (
                <span className="verified-badge">✓ Verified</span>
              )}
            </div>
          )}
        </div>
        
        <div className="job-card-footer">
          <div className="job-meta">
            <span className="posted-date">Posted {getTimeSincePosted(job.postedDate)}</span>
            {job.applicationCount !== undefined && (
              <span className="application-count">
                {job.applicationCount} {job.applicationCount === 1 ? 'application' : 'applications'}
              </span>
            )}
          </div>
          <div className="job-card-actions">
            <button className="view-details-btn" onClick={handleViewDetails}>
              View Details
            </button>
            {showApplyButton && (
              <button className="apply-btn" onClick={handleApplyClick}>
                {buttonText}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Job Details Modal */}
      {showModal && (
        <div className="job-modal-overlay" onClick={closeModal}>
          <div className="job-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="job-modal-header">
              <h2>{job.title}</h2>
              <button className="job-modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="job-modal-body">
              <div className="job-modal-section">
                <h3>Job Details</h3>
                <div className="job-modal-details">
                  <div className="modal-detail-item">
                    <span className="modal-detail-label">Job Type:</span>
                    <span className="modal-detail-value">{job.jobType || 'Full-time'}</span>
                  </div>
                  <div className="modal-detail-item">
                    <span className="modal-detail-label">Stipend:</span>
                    <span className="modal-detail-value">{formatSalary(job.salary)}</span>
                  </div>
                  <div className="modal-detail-item">
                    <span className="modal-detail-label">Experience:</span>
                    <span className="modal-detail-value">{formatExperience(job.experience)}</span>
                  </div>
                  <div className="modal-detail-item">
                    <span className="modal-detail-label">Location:</span>
                    <span className="modal-detail-value">{formatLocation(job.location)}</span>
                  </div>
                  {job.graduationYear && (
                    <div className="modal-detail-item">
                      <span className="modal-detail-label">Graduation Year:</span>
                      <span className="modal-detail-value">{job.graduationYear}</span>
                    </div>
                  )}
                  <div className="modal-detail-item">
                    <span className="modal-detail-label">Department:</span>
                    <span className="modal-detail-value">{job.department || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              <div className="job-modal-section">
                <h3>Job Description</h3>
                <div 
                  className="job-modal-description" 
                  dangerouslySetInnerHTML={{ __html: formatJobDescription(job.description) || 'No description available' }}
                />
              </div>

              <div className="job-modal-section">
                <h3>Required Skills</h3>
                <div className="job-modal-skills">
                  {formatSkills(job.skills).map((skill, index) => (
                    <span className="modal-skill-tag" key={index}>{skill}</span>
                  ))}
                </div>
              </div>

              {job.recruiterInfo && (
                <div className="job-modal-section">
                  <h3>Company Information</h3>
                  <div className="job-modal-company">
                    <p><strong>Company:</strong> {job.recruiterInfo.companyName}</p>
                    <p><strong>Industry:</strong> {job.recruiterInfo.industry || 'Technology'}</p>
                    {job.recruiterInfo.website && (
                      <p><strong>Website:</strong> <a href={job.recruiterInfo.website} target="_blank" rel="noopener noreferrer">{job.recruiterInfo.website}</a></p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="job-modal-footer">
              {showApplyButton && (
                <button className="modal-apply-btn" onClick={() => { handleApplyClick(); closeModal(); }}>
                  {buttonText}
                </button>
              )}
              <button className="modal-close-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobCard;