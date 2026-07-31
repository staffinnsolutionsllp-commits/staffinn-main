/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { FiImage } from 'react-icons/fi';
import * as portfolioApi from '../../services/portfolioApi';
import PortfolioShowcaseCard from './PortfolioShowcaseCard';
import ProjectDetailModal from './ProjectDetailModal';
import ProjectCardSkeleton from './ProjectCardSkeleton';
import './portfolio.css';

const ProfilePortfolioSection = ({ profileSlug, isOwner, onManage, staffName, staffAvatar }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [detailProject, setDetailProject] = useState(null);
  const [detailIndex, setDetailIndex] = useState(0);

  useEffect(() => {
    if (!profileSlug) return;
    const fetchData = async () => {
      try {
        const res = await portfolioApi.getProfileProjects(profileSlug);
        if (res.success) setProjects(res.data.projects || []);
      } catch { setError(true); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [profileSlug]);

  const openDetail = async (project) => {
    // Fetch full detail for the project
    try {
      const res = await portfolioApi.getProfileProject(profileSlug, project.slug);
      if (res.success) {
        setDetailProject(res.data);
        setDetailIndex(projects.findIndex(p => p.projectId === project.projectId));
      }
    } catch {
      // Fallback: show card data in modal
      setDetailProject(project);
      setDetailIndex(projects.findIndex(p => p.projectId === project.projectId));
    }
  };

  const navigateDetail = async (newIndex) => {
    const target = projects[newIndex];
    if (!target) return;
    try {
      const res = await portfolioApi.getProfileProject(profileSlug, target.slug);
      if (res.success) { setDetailProject(res.data); setDetailIndex(newIndex); return; }
    } catch { /* fallback */ }
    setDetailProject(target);
    setDetailIndex(newIndex);
  };

  if (loading) {
    return (
      <div className="pf-profile-section">
        <div className="pf-profile-section-header"><h2>Portfolio</h2></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2].map(i => <ProjectCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error || projects.length === 0) return null;

  // Sort: featured first, then by displayOrder
  const sorted = [...projects].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

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

      {/* Showcase Cards — stacked vertically */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sorted.map(project => (
          <PortfolioShowcaseCard
            key={project.projectId}
            project={project}
            onViewProject={openDetail}
          />
        ))}
      </div>

      {/* Detail Modal */}
      {detailProject && (
        <ProjectDetailModal
          project={detailProject}
          projects={projects}
          currentIndex={detailIndex}
          onClose={() => setDetailProject(null)}
          onNavigate={navigateDetail}
          staffName={staffName}
          staffAvatar={staffAvatar}
        />
      )}
    </div>
  );
};

export default ProfilePortfolioSection;
