/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback } from 'react';
import { FiPackage, FiPlus, FiSearch, FiGlobe, FiPause, FiPlay, FiArchive, FiTrash2, FiEdit2, FiMoreVertical } from 'react-icons/fi';
import { toast } from 'sonner';
import * as serviceApi from '../../services/serviceApi';
import './services.css';

const ServicesDashboard = ({ onNavigate }) => {
  const [services, setServices] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, draft: 0, paused: 0, archived: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionDialog, setActionDialog] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setError(null);
      const res = await serviceApi.getMyServices();
      if (res.success) {
        setServices(res.data.services || []);
        setStats({ total: res.data.total, active: res.data.active, draft: res.data.draft, paused: res.data.paused, archived: res.data.archived });
      }
    } catch (err) {
      setError(err.message || 'Failed to load services');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const handleAction = async (action, service) => {
    setActionLoading(true);
    try {
      switch (action) {
        case 'publish': await serviceApi.publishService(service.serviceId, service.version); toast.success('Service published'); break;
        case 'pause': await serviceApi.pauseService(service.serviceId, service.version); toast.success('Service paused'); break;
        case 'reactivate': await serviceApi.reactivateService(service.serviceId, service.version); toast.success('Service reactivated'); break;
        case 'archive': await serviceApi.archiveService(service.serviceId, service.version); toast.success('Service archived'); break;
        case 'delete': await serviceApi.deleteService(service.serviceId); toast.success('Service deleted'); break;
        default: break;
      }
      setActionDialog(null);
      await fetchServices();
    } catch (err) {
      if (err.code === 'VERSION_CONFLICT') { toast.error('Service updated elsewhere. Refreshing...'); await fetchServices(); }
      else toast.error(err.message || 'Action failed');
    } finally { setActionLoading(false); }
  };

  const filtered = services.filter(s => {
    if (search && !s.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="pf-page">
        <div className="pf-page-header"><div className="pf-page-header-left"><div className="pf-skeleton" style={{ width: 180, height: 28, marginBottom: 8 }} /><div className="pf-skeleton" style={{ width: 260, height: 16 }} /></div></div>
        <div className="pf-stats-grid">{[1,2,3,4,5].map(i => <div key={i} className="pf-skeleton" style={{ height: 76 }} />)}</div>
        <div className="sv-grid">{[1,2,3].map(i => <div key={i} className="pf-skeleton" style={{ height: 200 }} />)}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pf-page">
        <div className="pf-empty-state">
          <div className="pf-empty-icon"><FiPackage /></div>
          <h3>Unable to load services</h3>
          <p>{error}</p>
          <button className="pf-btn pf-btn-primary" onClick={() => { setLoading(true); fetchServices(); }}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-page">
      {/* Header */}
      <div className="pf-page-header">
        <div className="pf-page-header-left">
          <h1>My Services</h1>
          <p>Define what you offer — packages, pricing, and availability.</p>
        </div>
        <div className="pf-page-header-actions">
          <button className="pf-btn pf-btn-primary" onClick={() => onNavigate('create')}>
            <FiPlus /> Add Service
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="pf-stats-grid">
        {[
          { label: 'Total', value: stats.total, icon: <FiPackage />, cls: 'total' },
          { label: 'Active', value: stats.active, icon: <FiGlobe />, cls: 'published' },
          { label: 'Drafts', value: stats.draft, icon: <FiEdit2 />, cls: 'draft' },
          { label: 'Paused', value: stats.paused, icon: <FiPause />, cls: 'featured' },
          { label: 'Archived', value: stats.archived, icon: <FiArchive />, cls: 'archived' },
        ].map(item => (
          <div className="pf-stat-card" key={item.label}>
            <div className={`pf-stat-icon ${item.cls}`}>{item.icon}</div>
            <div className="pf-stat-content"><h4>{item.value}</h4><span>{item.label}</span></div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="pf-toolbar">
        <div className="pf-search-wrapper">
          <FiSearch className="pf-search-icon" />
          <input className="pf-search-input" placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search services" />
        </div>
        <select className="pf-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
        {(search || statusFilter !== 'all') && (
          <button className="pf-btn pf-btn-ghost pf-btn-sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}>Clear</button>
        )}
      </div>

      {/* Service List or Empty */}
      {filtered.length === 0 ? (
        <div className="pf-empty-state">
          <div className="pf-empty-icon"><FiPackage /></div>
          <h3>{services.length === 0 ? 'Create your first service' : 'No services match your filters'}</h3>
          <p>{services.length === 0 ? 'Define what you offer so clients can discover, compare, and hire you directly.' : 'Try adjusting your search or filter.'}</p>
          <button className="pf-btn pf-btn-primary" onClick={() => services.length === 0 ? onNavigate('create') : (setSearch(''), setStatusFilter('all'))}>
            {services.length === 0 ? <><FiPlus /> Add Service</> : 'Clear Filters'}
          </button>
        </div>
      ) : (
        <div className="sv-grid">
          {filtered.map(service => (
            <ServiceManagementCard key={service.serviceId} service={service} onEdit={() => onNavigate('edit', service.serviceId)} onAction={(action) => setActionDialog({ action, service })} />
          ))}
        </div>
      )}

      {/* Action Confirmation Dialog */}
      {actionDialog && (
        <ServiceActionDialog action={actionDialog.action} service={actionDialog.service} loading={actionLoading} onConfirm={() => handleAction(actionDialog.action, actionDialog.service)} onCancel={() => setActionDialog(null)} />
      )}
    </div>
  );
};

// ─── Service Management Card ──────────────────────────────────────────

const ServiceManagementCard = ({ service, onEdit, onAction }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const statusClass = { draft: 'pf-badge-draft', active: 'pf-badge-published', paused: 'pf-badge-featured', archived: 'pf-badge-archived' };
  const priceDisplay = service.startingPrice ? `₹${Number(service.startingPrice).toLocaleString('en-IN')}` : 'Custom Quote';
  const pricingLabel = { fixed: '', hourly: '/hr', daily: '/day', per_visit: '/visit', per_session: '/session', monthly: '/mo', per_item: '/item' };

  const menuActions = [];
  if (service.status === 'draft') menuActions.push({ key: 'publish', label: 'Publish', icon: <FiGlobe /> });
  if (service.status === 'active') menuActions.push({ key: 'pause', label: 'Pause', icon: <FiPause /> });
  if (service.status === 'paused') menuActions.push({ key: 'reactivate', label: 'Reactivate', icon: <FiPlay /> });
  if (service.status !== 'archived') menuActions.push({ key: 'archive', label: 'Archive', icon: <FiArchive /> });
  if (service.status === 'archived') menuActions.push({ key: 'delete', label: 'Delete', icon: <FiTrash2 />, destructive: true });

  return (
    <div className="sv-mgmt-card">
      <div className="sv-mgmt-card-header">
        <span className={`pf-badge ${statusClass[service.status] || ''}`}>{service.status}</span>
        {service.category && <span className="sv-mgmt-category">{service.category}</span>}
      </div>
      <h3 className="sv-mgmt-title">{service.title}</h3>
      <p className="sv-mgmt-desc">{service.shortDescription || 'No description'}</p>
      <div className="sv-mgmt-meta">
        <span className="sv-mgmt-price">{priceDisplay}{pricingLabel[service.pricingMode] || ''}</span>
        {service.workMode && <span className="sv-mgmt-mode">{service.workMode.replace('_', '-')}</span>}
      </div>
      <div className="sv-mgmt-footer">
        <button className="pf-btn pf-btn-ghost pf-btn-sm" onClick={onEdit}><FiEdit2 size={13} /> Edit</button>
        <div className="pf-actions-menu" ref={menuRef}>
          <button className="pf-actions-trigger" onClick={() => setMenuOpen(!menuOpen)} aria-label="More actions"><FiMoreVertical size={16} /></button>
          {menuOpen && (
            <div className="pf-actions-dropdown" role="menu">
              {menuActions.map(a => (
                <button key={a.key} className={a.destructive ? 'destructive' : ''} role="menuitem" onClick={() => { setMenuOpen(false); onAction(a.key); }}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Action Confirmation Dialog ───────────────────────────────────────

const dialogCfg = {
  publish: { title: 'Publish this service?', desc: 'It will become visible to clients.', btn: 'Publish', cls: 'pf-btn-primary' },
  pause: { title: 'Pause this service?', desc: 'It will be temporarily hidden from clients.', btn: 'Pause', cls: 'pf-btn-secondary' },
  reactivate: { title: 'Reactivate this service?', desc: 'It will be visible to clients again.', btn: 'Reactivate', cls: 'pf-btn-primary' },
  archive: { title: 'Archive this service?', desc: 'It will be removed from your active listings.', btn: 'Archive', cls: 'pf-btn-secondary' },
  delete: { title: 'Permanently delete?', desc: 'This cannot be undone.', btn: 'Delete', cls: 'pf-btn-destructive' },
};

const ServiceActionDialog = ({ action, service, loading, onConfirm, onCancel }) => {
  const cfg = dialogCfg[action] || {};
  React.useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape' && !loading) onCancel(); };
    document.addEventListener('keydown', esc);
    document.body.classList.add('modal-open');
    return () => { document.removeEventListener('keydown', esc); document.body.classList.remove('modal-open'); };
  }, [loading, onCancel]);

  return (
    <div className="pf-modal-overlay" onClick={loading ? undefined : onCancel} role="dialog" aria-modal="true">
      <div className="pf-modal" onClick={e => e.stopPropagation()}>
        <div className="pf-modal-header">
          <h3>{cfg.title}</h3>
          <p>{cfg.desc}</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--pf-text-muted)', marginTop: 6 }}>{service.title}</p>
        </div>
        <div className="pf-modal-footer">
          <button className="pf-btn pf-btn-ghost" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={`pf-btn ${cfg.cls}`} onClick={onConfirm} disabled={loading}>{loading ? 'Processing...' : cfg.btn}</button>
        </div>
      </div>
    </div>
  );
};

export default ServicesDashboard;
