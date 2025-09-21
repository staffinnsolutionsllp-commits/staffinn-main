/* eslint-disable no-unused-vars */
import React from 'react';
import './JobCard.css';

const JobCard = ({ job, onApply, showApplyButton = true, buttonText = "Apply Now" }) => {
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

  return (
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
            <span className="detail-icon">💰</span>
            <span className="detail-text">{formatSalary(job.salary)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">⏱️</span>
            <span className="detail-text">{formatExperience(job.experience)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">📍</span>
            <span className="detail-text">{formatLocation(job.location)}</span>
          </div>
        </div>
        
        {job.description && (
          <p className="job-description">
            {job.description.length > 120 
              ? `${job.description.substring(0, 120)}...` 
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
        {showApplyButton && (
          <button className="apply-btn" onClick={handleApplyClick}>
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default JobCard;