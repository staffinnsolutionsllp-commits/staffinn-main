/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { FiExternalLink, FiStar, FiGithub, FiImage } from 'react-icons/fi';
import * as portfolioApi from '../../services/portfolioApi';
import ProjectCardSkeleton from './ProjectCardSkeleton';
import './portfolio.css';

const ProfilePortfolioSection = ({ profileSlug, isOwner, onManage }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!profileSlug) return;
    const fetch = async () => {
      try {
        const res = await portfolioApi.getProfileProjects(profileSlug);
        if (res.success) setProjects(res.data.projects || []);
      } catch { setError(true); }
      finally { setLoading(false); }
    };
    fetch();
  }, [profileSlug]);

  if (loading) {
    return (
      <div className="pf-profile-section">
        <div className="pf-profile-section-header"><h2>Portfolio</h2></div>
        <div className="pf-profile-grid">
          {[1,2,3].map(i => <ProjectCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error || projects.length === 0) return null;

  const featured = projects.find(p => p.isFeatured);
  const rest = projects.filter(p => p !== featured);

  return (
    <div className="pf-profile-section">
      <div className="pf-profile-section-header">
        <div>
          <h2>Portfolio</h2>
          <p>Selected projects and professional work.</p>
        </div>
        {isOwner && (
          <button className="pf-btn pf-btn-secondary pf-btn-sm" onClick={onManage}>
            Manage Portfolio
          </button>
        )}
      </div>

      {/* Featured Project */}
      {featured && (
        <div className="pf-featured-card">
          <div className="pf-featured-cover">
            {featured.coverImageUrl ? (
              <img src={featured.coverImageUrl} alt={featured.title} loading="lazy" />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <FiImage size={32} color="var(--pf-text-muted)" />
              </div>
            )}
          </div>
          <div className="pf-featured-content">
            <span className="pf-badge pf-badge-featured" style={{ marginBottom: 10, alignSelf: 'flex-start' }}>
              <FiStar size={10} /> Featured
            </span>
            <h3>{featured.title}</h3>
            <p>{featured.shortDescription || ''}</p>
            {featured.technologies?.length > 0 && (
              <div className="pf-card-technologies" style={{ marginBottom: 16 }}>
                {featured.technologies.slice(0, 5).map(t => <span key={t} className="pf-tech-pill">{t}</span>)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              {featured.liveUrl && (
                <a href={featured.liveUrl} target="_blank" rel="noopener noreferrer" className="pf-btn pf-btn-primary pf-btn-sm">
                  <FiExternalLink size={13} /> View Live
                </a>
              )}
              {featured.repositoryUrl && (
                <a href={featured.repositoryUrl} target="_blank" rel="noopener noreferrer" className="pf-btn pf-btn-secondary pf-btn-sm">
                  <FiGithub size={13} /> Repository
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project Grid */}
      {rest.length > 0 && (
        <div className="pf-profile-grid">
          {rest.map(project => (
            <div key={project.projectId} className="pf-project-card">
              <div className="pf-card-cover">
                {project.coverImageUrl ? (
                  <img src={project.coverImageUrl} alt={project.title} loading="lazy" />
                ) : (
                  <div className="pf-card-cover-placeholder"><FiImage /></div>
                )}
              </div>
              <div className="pf-card-body">
                <h3 className="pf-card-title">{project.title}</h3>
                <p className="pf-card-description">{project.shortDescription || ''}</p>
                {project.technologies?.length > 0 && (
                  <div className="pf-card-technologies">
                    {project.technologies.slice(0, 3).map(t => <span key={t} className="pf-tech-pill">{t}</span>)}
                    {project.technologies.length > 3 && <span className="pf-tech-more">+{project.technologies.length - 3}</span>}
                  </div>
                )}
              </div>
              <div className="pf-card-footer">
                {project.projectType && <span className="pf-card-meta" style={{ textTransform: 'capitalize' }}>{project.projectType}</span>}
                <div style={{ display: 'flex', gap: 8 }}>
                  {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="pf-btn pf-btn-ghost pf-btn-sm" aria-label="View live">
                      <FiExternalLink size={13} />
                    </a>
                  )}
                  {project.repositoryUrl && (
                    <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="pf-btn pf-btn-ghost pf-btn-sm" aria-label="View repository">
                      <FiGithub size={13} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfilePortfolioSection;
