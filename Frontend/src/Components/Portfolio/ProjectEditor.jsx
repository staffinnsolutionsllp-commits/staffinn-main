/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiArrowLeft, FiSave, FiImage, FiLink, FiCalendar, FiCpu, FiFileText } from 'react-icons/fi';
import { toast } from 'sonner';
import * as portfolioApi from '../../services/portfolioApi';
import TechnologyInput from './TechnologyInput';
import CoverUploader from './CoverUploader';
import GalleryUploader from './GalleryUploader';
import './portfolio.css';

function generateIdempotencyKey() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

const ProjectEditor = ({ projectId, onNavigate }) => {
  const isEdit = Boolean(projectId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);
  const [dirty, setDirty] = useState(false);
  const idempotencyKeyRef = useRef(generateIdempotencyKey());

  const [form, setForm] = useState({
    title: '', shortDescription: '', detailedDescription: '',
    projectType: '', roleOrContribution: '', technologies: [],
    liveUrl: '', repositoryUrl: '', videoUrl: '',
    showLiveUrl: true, showRepositoryUrl: true, showVideoUrl: true,
    startDate: '', endDate: '', isOngoing: false
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isEdit) return;
    const fetchProject = async () => {
      try {
        const res = await portfolioApi.getMyProject(projectId);
        if (res.success) {
          setProject(res.data);
          setForm({
            title: res.data.title || '',
            shortDescription: res.data.shortDescription || '',
            detailedDescription: res.data.detailedDescription || '',
            projectType: res.data.projectType || '',
            roleOrContribution: res.data.roleOrContribution || '',
            technologies: res.data.technologies || [],
            liveUrl: res.data.liveUrl || '',
            repositoryUrl: res.data.repositoryUrl || '',
            videoUrl: res.data.videoUrl || '',
            showLiveUrl: res.data.showLiveUrl !== false,
            showRepositoryUrl: res.data.showRepositoryUrl !== false,
            showVideoUrl: res.data.showVideoUrl !== false,
            startDate: res.data.startDate || '',
            endDate: res.data.endDate || '',
            isOngoing: res.data.isOngoing || false
          });
        }
      } catch (err) { toast.error(portfolioApi.getErrorMessage(err)); }
      finally { setLoading(false); }
    };
    fetchProject();
  }, [isEdit, projectId]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setDirty(true);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    else if (form.title.trim().length > 120) e.title = 'Title must be 120 characters or fewer';
    if (form.shortDescription.length > 300) e.shortDescription = 'Max 300 characters';
    if (form.detailedDescription.length > 3000) e.detailedDescription = 'Max 3000 characters';
    if (form.technologies.length > 15) e.technologies = 'Max 15 technologies';
    if (form.liveUrl && !form.liveUrl.startsWith('https://')) e.liveUrl = 'Must be a valid HTTPS URL';
    if (form.repositoryUrl && !form.repositoryUrl.startsWith('https://')) e.repositoryUrl = 'Must be a valid HTTPS URL';
    if (form.videoUrl && !form.videoUrl.startsWith('https://')) e.videoUrl = 'Must be a valid HTTPS URL';
    if (form.videoUrl && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|loom\.com|www\.loom\.com)/.test(form.videoUrl)) {
      e.videoUrl = 'Must be YouTube, Vimeo, or Loom URL';
    }
    if (form.startDate && form.endDate && form.startDate > form.endDate) e.endDate = 'End date must be after start date';
    if (form.isOngoing && form.endDate) e.endDate = 'Remove end date when ongoing';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { toast.error('Please fix the validation errors'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        const fields = {};
        if (form.title.trim() !== project.title) fields.title = form.title.trim();
        if (form.shortDescription !== (project.shortDescription || '')) fields.shortDescription = form.shortDescription;
        if (form.detailedDescription !== (project.detailedDescription || '')) fields.detailedDescription = form.detailedDescription;
        if (form.projectType !== (project.projectType || null)) fields.projectType = form.projectType || null;
        if (form.roleOrContribution !== (project.roleOrContribution || '')) fields.roleOrContribution = form.roleOrContribution;
        if (JSON.stringify(form.technologies) !== JSON.stringify(project.technologies || [])) fields.technologies = form.technologies;
        if (form.liveUrl !== (project.liveUrl || '')) fields.liveUrl = form.liveUrl || null;
        if (form.repositoryUrl !== (project.repositoryUrl || '')) fields.repositoryUrl = form.repositoryUrl || null;
        if (form.videoUrl !== (project.videoUrl || '')) fields.videoUrl = form.videoUrl || null;
        if (form.showLiveUrl !== (project.showLiveUrl !== false)) fields.showLiveUrl = form.showLiveUrl;
        if (form.showRepositoryUrl !== (project.showRepositoryUrl !== false)) fields.showRepositoryUrl = form.showRepositoryUrl;
        if (form.showVideoUrl !== (project.showVideoUrl !== false)) fields.showVideoUrl = form.showVideoUrl;
        if (form.startDate !== (project.startDate || '')) fields.startDate = form.startDate || null;
        if (form.endDate !== (project.endDate || '')) fields.endDate = form.endDate || null;
        if (form.isOngoing !== (project.isOngoing || false)) fields.isOngoing = form.isOngoing;

        if (Object.keys(fields).length === 0) { toast.success('No changes to save'); setSaving(false); return; }
        const res = await portfolioApi.updateProject(projectId, fields, project.version);
        if (res.success) {
          setProject(res.data);
          setDirty(false);
          toast.success('Changes saved');
        }
      } else {
        const res = await portfolioApi.createProject(form.title.trim(), idempotencyKeyRef.current);
        if (res.success) {
          setDirty(false);
          toast.success('Project created');
          onNavigate('edit', res.data.projectId);
        }
      }
    } catch (err) {
      const errType = portfolioApi.classifyError(err);
      if (errType === 'version_conflict') {
        toast.error('This project was updated elsewhere. Refreshing...');
        if (isEdit) {
          const res = await portfolioApi.getMyProject(projectId);
          if (res.success) setProject(res.data);
        }
      } else { toast.error(portfolioApi.getErrorMessage(err)); }
    } finally { setSaving(false); }
  };

  const handleBack = () => {
    if (dirty && !window.confirm('You have unsaved changes. Leave anyway?')) return;
    onNavigate('dashboard');
  };

  const refreshProject = useCallback(async () => {
    if (!isEdit) return;
    try {
      const res = await portfolioApi.getMyProject(projectId);
      if (res.success) setProject(res.data);
    } catch (err) { /* silent refresh */ }
  }, [isEdit, projectId]);

  if (loading) {
    return (
      <div className="pf-editor-page">
        <div className="pf-skeleton" style={{ width: 200, height: 28, marginBottom: 24 }} />
        {[1,2,3].map(i => <div key={i} className="pf-skeleton" style={{ height: 180, marginBottom: 16 }} />)}
      </div>
    );
  }

  return (
    <div className="pf-editor-page">
      {/* Editor Header */}
      <div className="pf-editor-header">
        <div className="pf-editor-header-left">
          <button className="pf-back-btn" onClick={handleBack} aria-label="Back to portfolio"><FiArrowLeft /></button>
          <h1>{isEdit ? 'Edit Project' : 'Add New Project'}</h1>
        </div>
        <div className="pf-editor-actions">
          <button className="pf-btn pf-btn-primary" onClick={handleSave} disabled={saving}>
            <FiSave /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Section 1: Basics */}
      <div className="pf-section-card">
        <h3 className="pf-section-title"><FiFileText className="icon" /> Project Basics</h3>
        <div className="pf-form-group">
          <label className="pf-label">Title <span className="required">*</span></label>
          <input className={`pf-input ${errors.title ? 'error' : ''}`} value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="e.g., E-commerce Dashboard" maxLength={120} />
          <div className="pf-char-count">{form.title.length}/120</div>
          {errors.title && <div className="pf-error-text">{errors.title}</div>}
        </div>
        <div className="pf-form-group">
          <label className="pf-label">Short Description</label>
          <textarea className={`pf-textarea ${errors.shortDescription ? 'error' : ''}`} value={form.shortDescription} onChange={e => updateField('shortDescription', e.target.value)} placeholder="Brief overview of the project" maxLength={300} rows={2} />
          <div className="pf-char-count">{form.shortDescription.length}/300</div>
        </div>
        <div className="pf-form-group">
          <label className="pf-label">Project Type</label>
          <select className="pf-select" style={{ width: '100%' }} value={form.projectType} onChange={e => updateField('projectType', e.target.value)}>
            <option value="">Select type</option>
            <option value="personal">Personal</option>
            <option value="client">Client</option>
            <option value="open-source">Open Source</option>
            <option value="academic">Academic</option>
            <option value="freelance">Freelance</option>
          </select>
        </div>
        <div className="pf-form-group">
          <label className="pf-label">Role / Contribution</label>
          <input className="pf-input" value={form.roleOrContribution} onChange={e => updateField('roleOrContribution', e.target.value)} placeholder="e.g., Full Stack Developer" maxLength={100} />
        </div>
      </div>

      {/* Section 2: Story */}
      <div className="pf-section-card">
        <h3 className="pf-section-title"><FiFileText className="icon" /> Project Story</h3>
        <div className="pf-form-group">
          <label className="pf-label">Detailed Description</label>
          <textarea className={`pf-textarea ${errors.detailedDescription ? 'error' : ''}`} value={form.detailedDescription} onChange={e => updateField('detailedDescription', e.target.value)} placeholder="Describe the project in detail - goals, challenges, outcomes..." maxLength={3000} rows={6} />
          <div className={`pf-char-count ${form.detailedDescription.length > 2700 ? 'warning' : ''} ${form.detailedDescription.length > 3000 ? 'over' : ''}`}>
            {form.detailedDescription.length}/3000
          </div>
        </div>
      </div>

      {/* Section 3: Technologies */}
      <div className="pf-section-card">
        <h3 className="pf-section-title"><FiCpu className="icon" /> Skills & Technologies</h3>
        <TechnologyInput
          technologies={form.technologies}
          onChange={techs => updateField('technologies', techs)}
          error={errors.technologies}
        />
      </div>

      {/* Section 4: Links */}
      <div className="pf-section-card">
        <h3 className="pf-section-title"><FiLink className="icon" /> Project Links</h3>
        <div className="pf-form-group">
          <label className="pf-label">Live Project URL</label>
          <input className={`pf-input ${errors.liveUrl ? 'error' : ''}`} value={form.liveUrl} onChange={e => updateField('liveUrl', e.target.value)} placeholder="https://..." />
          {errors.liveUrl && <div className="pf-error-text">{errors.liveUrl}</div>}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '0.8rem', color: 'var(--pf-text-secondary)' }}>
            <input type="checkbox" checked={form.showLiveUrl} onChange={e => updateField('showLiveUrl', e.target.checked)} /> Show on profile
          </label>
        </div>
        <div className="pf-form-group">
          <label className="pf-label">Repository URL</label>
          <input className={`pf-input ${errors.repositoryUrl ? 'error' : ''}`} value={form.repositoryUrl} onChange={e => updateField('repositoryUrl', e.target.value)} placeholder="https://github.com/..." />
          {errors.repositoryUrl && <div className="pf-error-text">{errors.repositoryUrl}</div>}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '0.8rem', color: 'var(--pf-text-secondary)' }}>
            <input type="checkbox" checked={form.showRepositoryUrl} onChange={e => updateField('showRepositoryUrl', e.target.checked)} /> Show on profile
          </label>
        </div>
        <div className="pf-form-group">
          <label className="pf-label">Video URL</label>
          <input className={`pf-input ${errors.videoUrl ? 'error' : ''}`} value={form.videoUrl} onChange={e => updateField('videoUrl', e.target.value)} placeholder="https://youtube.com/..." />
          {errors.videoUrl && <div className="pf-error-text">{errors.videoUrl}</div>}
          <span className="pf-helper">YouTube, Vimeo, or Loom links</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: '0.8rem', color: 'var(--pf-text-secondary)' }}>
            <input type="checkbox" checked={form.showVideoUrl} onChange={e => updateField('showVideoUrl', e.target.checked)} /> Show on profile
          </label>
        </div>
      </div>

      {/* Section 5: Timeline */}
      <div className="pf-section-card">
        <h3 className="pf-section-title"><FiCalendar className="icon" /> Timeline</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="pf-form-group">
            <label className="pf-label">Start Date</label>
            <input className="pf-input" type="date" value={form.startDate} onChange={e => updateField('startDate', e.target.value)} />
          </div>
          <div className="pf-form-group">
            <label className="pf-label">End Date</label>
            <input className={`pf-input ${errors.endDate ? 'error' : ''}`} type="date" value={form.endDate} onChange={e => updateField('endDate', e.target.value)} disabled={form.isOngoing} />
            {errors.endDate && <div className="pf-error-text">{errors.endDate}</div>}
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--pf-text-secondary)' }}>
          <input type="checkbox" checked={form.isOngoing} onChange={e => { updateField('isOngoing', e.target.checked); if (e.target.checked) updateField('endDate', ''); }} />
          This project is ongoing
        </label>
      </div>

      {/* Section 6: Media (only in edit mode when projectId exists) */}
      {isEdit && project && (
        <div className="pf-section-card">
          <h3 className="pf-section-title"><FiImage className="icon" /> Media</h3>
          <div className="pf-form-group">
            <label className="pf-label">Cover Image</label>
            <CoverUploader project={project} onUploaded={refreshProject} />
          </div>
          <div className="pf-form-group">
            <label className="pf-label">Gallery Images <span className="pf-helper">(max 6)</span></label>
            <GalleryUploader project={project} onUpdated={refreshProject} />
          </div>
        </div>
      )}

      {!isEdit && (
        <div className="pf-section-card" style={{ background: 'var(--pf-primary-light)', borderColor: 'rgba(72,99,247,0.15)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--pf-primary)', margin: 0 }}>
            💡 Save your project first, then you can add cover and gallery images.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectEditor;
