/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback } from 'react';
import { FiFolder, FiPlus, FiSearch, FiGlobe, FiStar, FiArchive, FiEdit2 } from 'react-icons/fi';
import { toast } from 'sonner';
import * as portfolioApi from '../../services/portfolioApi';
import ProjectCard from './ProjectCard';
import PortfolioStats from './PortfolioStats';
import ProjectEmptyState from './ProjectEmptyState';
import ProjectCardSkeleton from './ProjectCardSkeleton';
import ProjectLifecycleDialog from './ProjectLifecycleDialog';
import './portfolio.css';

const PortfolioDashboard = ({ onNavigate }) => {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, featured: 0, archived: 0 });
  const [portfolioVersion, setPortfolioVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [lifecycleDialog, setLifecycleDialog] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      const res = await portfolioApi.getMyProjects();
      if (res.success) {
        setProjects(res.data.projects || []);
        setStats({
          total: res.data.total || 0,
          published: res.data.publishedTotal || 0,
          drafts: res.data.draftTotal || 0,
          featured: res.data.projects?.filter(p => p.isFeatured).length || 0,
          archived: res.data.archivedTotal || 0
        });
        setPortfolioVersion(res.data.portfolioVersion || 0);
      }
    } catch (err) {
      setError(portfolioApi.getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleLifecycleAction = async (action, project) => {
    setActionLoading(true);
    try {
      let res;
      switch (action) {
        case 'publish': res = await portfolioApi.publishProject(project.projectId, project.version); break;
        case 'unpublish': res = await portfolioApi.unpublishProject(project.projectId, project.version); break;
        case 'feature': res = await portfolioApi.featureProject(project.projectId, project.version); break;
        case 'unfeature': res = await portfolioApi.unfeatureProject(project.projectId, project.version); break;
        case 'archive': res = await portfolioApi.archiveProject(project.projectId, project.version); break;
        case 'restore': res = await portfolioApi.restoreProject(project.projectId, project.version); break;
        case 'delete': res = await portfolioApi.deleteProject(project.projectId, project.version); break;
        default: return;
      }
      const messages = {
        publish: 'Project published', unpublish: 'Project moved to drafts',
        feature: 'Project featured', unfeature: 'Project unfeatured',
        archive: 'Project archived', restore: 'Project restored',
        delete: 'Project permanently deleted'
      };
      toast.success(messages[action] || 'Action completed');
      setLifecycleDialog(null);
      await fetchProjects();
    } catch (err) {
      const errType = portfolioApi.classifyError(err);
      if (errType === 'version_conflict') {
        toast.error('Project was updated elsewhere. Refreshing...');
        await fetchProjects();
      } else {
        toast.error(portfolioApi.getErrorMessage(err));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (typeFilter !== 'all' && p.projectType !== typeFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="pf-page">
        <div className="pf-page-header">
          <div className="pf-page-header-left">
            <div className="pf-skeleton" style={{ width: 180, height: 28, marginBottom: 8 }} />
            <div className="pf-skeleton" style={{ width: 280, height: 16 }} />
          </div>
        </div>
        <div className="pf-stats-grid">
          {[1,2,3,4,5].map(i => <div key={i} className="pf-skeleton" style={{ height: 76 }} />)}
        </div>
        <div className="pf-projects-grid">
          {[1,2,3,4,5,6].map(i => <ProjectCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pf-page">
        <div className="pf-empty-state">
          <div className="pf-empty-icon"><FiFolder /></div>
          <h3>Unable to load portfolio</h3>
          <p>{error}</p>
          <button className="pf-btn pf-btn-primary" onClick={() => { setLoading(true); fetchProjects(); }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-page">
      {/* Page Header */}
      <div className="pf-page-header">
        <div className="pf-page-header-left">
          <h1>My Portfolio</h1>
          <p>Showcase your best projects, skills and professional achievements.</p>
        </div>
        <div className="pf-page-header-actions">
          <button className="pf-btn pf-btn-primary" onClick={() => onNavigate('create')}>
            <FiPlus /> Add Project
          </button>
        </div>
      </div>

      {/* Stats */}
      <PortfolioStats stats={stats} />

      {/* Toolbar */}
      <div className="pf-toolbar">
        <div className="pf-search-wrapper">
          <FiSearch className="pf-search-icon" />
          <input
            className="pf-search-input"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search projects"
          />
        </div>
        <select className="pf-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="all">All Status</option>
          <option value="draft">Drafts</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <select className="pf-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} aria-label="Filter by type">
          <option value="all">All Types</option>
          <option value="personal">Personal</option>
          <option value="client">Client</option>
          <option value="open-source">Open Source</option>
          <option value="academic">Academic</option>
          <option value="freelance">Freelance</option>
        </select>
        {(search || statusFilter !== 'all' || typeFilter !== 'all') && (
          <button className="pf-btn pf-btn-ghost pf-btn-sm" onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); }}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Projects Grid or Empty */}
      {filteredProjects.length === 0 ? (
        <ProjectEmptyState
          hasFilters={search || statusFilter !== 'all' || typeFilter !== 'all'}
          onClearFilters={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); }}
          onAddProject={() => onNavigate('create')}
        />
      ) : (
        <div className="pf-projects-grid">
          {filteredProjects.map(project => (
            <ProjectCard
              key={project.projectId}
              project={project}
              onEdit={() => onNavigate('edit', project.projectId)}
              onAction={(action) => setLifecycleDialog({ action, project })}
            />
          ))}
        </div>
      )}

      {/* Lifecycle Confirmation Dialog */}
      {lifecycleDialog && (
        <ProjectLifecycleDialog
          action={lifecycleDialog.action}
          project={lifecycleDialog.project}
          loading={actionLoading}
          onConfirm={() => handleLifecycleAction(lifecycleDialog.action, lifecycleDialog.project)}
          onCancel={() => setLifecycleDialog(null)}
        />
      )}
    </div>
  );
};

export default PortfolioDashboard;
