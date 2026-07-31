/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiExternalLink, FiGithub, FiPlay, FiImage, FiCalendar } from 'react-icons/fi';

const ProjectDetailModal = ({ project, projects, currentIndex, onClose, onNavigate, staffName, staffAvatar }) => {
  const modalRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState({});

  useEffect(() => {
    document.body.classList.add('modal-open');
    modalRef.current?.focus();
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => { document.body.classList.remove('modal-open'); document.removeEventListener('keydown', handleEsc); };
  }, [onClose]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < projects.length - 1;
  const handlePrev = () => { if (hasPrev) onNavigate(currentIndex - 1); };
  const handleNext = () => { if (hasNext) onNavigate(currentIndex + 1); };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft' && hasPrev) handlePrev();
      if (e.key === 'ArrowRight' && hasNext) handleNext();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [currentIndex, hasPrev, hasNext]);

  const formatDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : null;
  const initials = (staffName || 'S').charAt(0).toUpperCase();

  return (
    <div className="pf-detail-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="pf-detail-title" ref={modalRef} tabIndex={-1}>
      <div className="pf-detail-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="pf-detail-header">
          <div className="pf-detail-header-left">
            <div className="pf-detail-avatar">
              {staffAvatar ? <img src={staffAvatar} alt={staffName} /> : <span>{initials}</span>}
            </div>
            <span className="pf-detail-by">Project by <strong>{staffName || 'Staff Professional'}</strong></span>
          </div>
          <div className="pf-detail-header-right">
            <button className="pf-detail-nav-btn" onClick={handlePrev} disabled={!hasPrev} aria-label="Previous project"><FiChevronLeft /></button>
            <span className="pf-detail-counter">{currentIndex + 1} of {projects.length}</span>
            <button className="pf-detail-nav-btn" onClick={handleNext} disabled={!hasNext} aria-label="Next project"><FiChevronRight /></button>
            <button className="pf-detail-close" onClick={onClose} aria-label="Close"><FiX size={20} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="pf-detail-body">
          {/* Cover */}
          {project.coverImageUrl && (
            <div className="pf-detail-cover">
              <img src={project.coverImageUrl} alt={project.title} onLoad={() => setImageLoaded(p => ({ ...p, cover: true }))} />
            </div>
          )}

          {/* Title & Meta */}
          <div className="pf-detail-content">
            {project.startDate && (
              <div className="pf-detail-date"><FiCalendar size={13} /> {formatDate(project.startDate)}{project.endDate ? ` — ${formatDate(project.endDate)}` : project.isOngoing ? ' — Present' : ''}</div>
            )}
            <h1 className="pf-detail-title" id="pf-detail-title">{project.title}</h1>

            {project.shortDescription && (
              <p className="pf-detail-summary">{project.shortDescription}</p>
            )}

            {/* Role */}
            {project.roleOrContribution && (
              <div className="pf-detail-section">
                <h3>Role & Contribution</h3>
                <p>{project.roleOrContribution}</p>
              </div>
            )}

            {/* Detailed Description */}
            {project.detailedDescription && (
              <div className="pf-detail-section">
                <h3>Project Story</h3>
                <p className="pf-detail-story">{project.detailedDescription}</p>
              </div>
            )}

            {/* Technologies */}
            {project.technologies?.length > 0 && (
              <div className="pf-detail-section">
                <h3>Technologies</h3>
                <div className="pf-detail-techs">
                  {project.technologies.map(t => <span key={t} className="pf-showcase-tech">{t}</span>)}
                </div>
              </div>
            )}

            {/* Gallery */}
            {project.galleryImages?.length > 0 && (
              <div className="pf-detail-section">
                <h3>Gallery</h3>
                <div className="pf-detail-gallery">
                  {project.galleryImages.map((img, i) => (
                    <div key={i} className="pf-detail-gallery-item">
                      {(img.url || img.fullUrl) ? (
                        <img src={img.fullUrl || img.url} alt={`Gallery ${i + 1}`} loading="lazy" />
                      ) : (
                        <div className="pf-detail-gallery-placeholder"><FiImage /></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {project.videoEmbedUrl && (
              <div className="pf-detail-section">
                <h3>Video</h3>
                <div className="pf-detail-video">
                  <iframe src={project.videoEmbedUrl} title="Project video" allowFullScreen frameBorder="0" loading="lazy" />
                </div>
              </div>
            )}

            {/* Links */}
            {(project.liveUrl || project.repositoryUrl) && (
              <div className="pf-detail-section">
                <h3>Links</h3>
                <div className="pf-detail-links">
                  {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="pf-btn pf-btn-primary pf-btn-sm">
                      <FiExternalLink size={13} /> View Live Project
                    </a>
                  )}
                  {project.repositoryUrl && (
                    <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="pf-btn pf-btn-secondary pf-btn-sm">
                      <FiGithub size={13} /> Source Code
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="pf-detail-meta-grid">
              {project.projectType && <div className="pf-detail-meta-item"><span className="pf-detail-meta-label">Type</span><span className="pf-detail-meta-value">{project.projectType}</span></div>}
              {project.isOngoing && <div className="pf-detail-meta-item"><span className="pf-detail-meta-label">Status</span><span className="pf-detail-meta-value">Ongoing</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailModal;
