/* eslint-disable react/prop-types */
import React from 'react';
import { FiExternalLink, FiGithub, FiImage, FiStar, FiCalendar, FiLayers } from 'react-icons/fi';

const PortfolioShowcaseCard = ({ project, onViewProject }) => {
  const coverUrl = project.coverImageUrl || null;
  const galleryCount = project.galleryCount || 0;
  const startDate = project.startDate ? new Date(project.startDate + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : null;
  const techsToShow = (project.technologies || []).slice(0, 4);
  const moreTechs = (project.technologies || []).length - 4;

  return (
    <div className="pf-showcase-card" onClick={() => onViewProject(project)} role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewProject(project); } }}
      aria-label={`View project: ${project.title}`}>

      {/* Media Side */}
      <div className="pf-showcase-media">
        {coverUrl ? (
          <img src={coverUrl} alt={project.title} loading="lazy" />
        ) : (
          <div className="pf-showcase-placeholder"><FiImage size={36} /></div>
        )}
        {galleryCount > 0 && (
          <div className="pf-showcase-media-count" aria-label={`${galleryCount + 1} images`}>
            <FiLayers size={12} /> {galleryCount + 1}
          </div>
        )}
        {project.isFeatured && (
          <div className="pf-showcase-featured-badge"><FiStar size={11} /> Featured</div>
        )}
      </div>

      {/* Content Side */}
      <div className="pf-showcase-content">
        {startDate && (
          <div className="pf-showcase-date"><FiCalendar size={12} /> {startDate}</div>
        )}
        <h3 className="pf-showcase-title">{project.title}</h3>
        <p className="pf-showcase-description">{project.shortDescription || ''}</p>

        {/* Technologies */}
        {techsToShow.length > 0 && (
          <div className="pf-showcase-techs">
            {techsToShow.map(t => <span key={t} className="pf-showcase-tech">{t}</span>)}
            {moreTechs > 0 && <span className="pf-showcase-tech-more">+{moreTechs}</span>}
          </div>
        )}

        {/* Meta Row */}
        <div className="pf-showcase-meta">
          {project.projectType && (
            <span className="pf-showcase-type">{project.projectType}</span>
          )}
          {project.isOngoing && <span className="pf-showcase-ongoing">Ongoing</span>}
        </div>

        {/* Actions */}
        <div className="pf-showcase-actions">
          <button className="pf-btn pf-btn-primary pf-btn-sm" onClick={e => { e.stopPropagation(); onViewProject(project); }}>
            View Project
          </button>
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="pf-btn pf-btn-ghost pf-btn-sm"
              onClick={e => e.stopPropagation()} aria-label="View live project">
              <FiExternalLink size={13} /> Live
            </a>
          )}
          {project.repositoryUrl && (
            <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="pf-btn pf-btn-ghost pf-btn-sm"
              onClick={e => e.stopPropagation()} aria-label="View repository">
              <FiGithub size={13} /> Code
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioShowcaseCard;
