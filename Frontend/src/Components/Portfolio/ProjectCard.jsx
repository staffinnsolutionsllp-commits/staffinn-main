/* eslint-disable react/prop-types */
import React, { useState, useRef, useEffect } from 'react';
import { FiEdit2, FiMoreVertical, FiGlobe, FiEyeOff, FiStar, FiArchive, FiRotateCcw, FiTrash2, FiImage } from 'react-icons/fi';

const ProjectCard = ({ project, onEdit, onAction }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const statusBadge = () => {
    const badges = {
      draft: 'pf-badge-draft',
      published: 'pf-badge-published',
      archived: 'pf-badge-archived'
    };
    return <span className={`pf-badge ${badges[project.status] || ''}`}>{project.status}</span>;
  };

  const techsToShow = (project.technologies || []).slice(0, 3);
  const moreCount = (project.technologies || []).length - 3;
  const coverUrl = project.coverMedia?.thumbnailUrl || project.coverMedia?.detailUrl || null;
  const updatedDate = project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

  const menuActions = [];
  if (project.status === 'draft') {
    menuActions.push({ key: 'publish', label: 'Publish', icon: <FiGlobe /> });
  }
  if (project.status === 'published') {
    menuActions.push({ key: 'unpublish', label: 'Unpublish', icon: <FiEyeOff /> });
    if (!project.isFeatured) menuActions.push({ key: 'feature', label: 'Feature', icon: <FiStar /> });
    if (project.isFeatured) menuActions.push({ key: 'unfeature', label: 'Unfeature', icon: <FiStar /> });
  }
  if (project.status !== 'archived') {
    menuActions.push({ key: 'archive', label: 'Archive', icon: <FiArchive /> });
  }
  if (project.status === 'archived') {
    menuActions.push({ key: 'restore', label: 'Restore', icon: <FiRotateCcw /> });
    menuActions.push({ key: 'delete', label: 'Delete', icon: <FiTrash2 />, destructive: true });
  }

  return (
    <div className="pf-project-card">
      {/* Cover */}
      <div className="pf-card-cover">
        {coverUrl ? (
          <img src={coverUrl} alt={project.title} loading="lazy" />
        ) : (
          <div className="pf-card-cover-placeholder"><FiImage /></div>
        )}
        <div className="pf-card-badges">
          {statusBadge()}
          {project.isFeatured && <span className="pf-badge pf-badge-featured"><FiStar size={10} /> Featured</span>}
        </div>
      </div>

      {/* Body */}
      <div className="pf-card-body">
        <h3 className="pf-card-title" title={project.title}>{project.title}</h3>
        <p className="pf-card-description">{project.shortDescription || 'No description yet'}</p>
        {techsToShow.length > 0 && (
          <div className="pf-card-technologies">
            {techsToShow.map(t => <span key={t} className="pf-tech-pill">{t}</span>)}
            {moreCount > 0 && <span className="pf-tech-more">+{moreCount}</span>}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pf-card-footer">
        <span className="pf-card-meta">{updatedDate && `Updated ${updatedDate}`}</span>
        <div className="pf-card-actions">
          <button className="pf-btn pf-btn-ghost pf-btn-sm" onClick={onEdit} aria-label="Edit project">
            <FiEdit2 size={14} /> Edit
          </button>
          <div className="pf-actions-menu" ref={menuRef}>
            <button className="pf-actions-trigger" onClick={() => setMenuOpen(!menuOpen)} aria-label="More actions" aria-expanded={menuOpen}>
              <FiMoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="pf-actions-dropdown" role="menu">
                {menuActions.map(a => (
                  <button key={a.key} className={a.destructive ? 'destructive' : ''} role="menuitem"
                    onClick={() => { setMenuOpen(false); onAction(a.key); }}>
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
