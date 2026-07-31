/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiSave, FiPackage, FiMapPin, FiDollarSign, FiClock, FiTag } from 'react-icons/fi';
import { toast } from 'sonner';
import * as serviceApi from '../../services/serviceApi';
import { getSectors, getRolesForSector } from '../../utils/sectorRoleData';
import './services.css';

const PRICING_MODES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'tiered', label: 'Tiered Packages' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'per_visit', label: 'Per Visit' },
  { value: 'per_session', label: 'Per Session' },
  { value: 'per_item', label: 'Per Item' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom_quote', label: 'Custom Quote Only' }
];

const WORK_MODES = [
  { value: 'remote', label: 'Remote' },
  { value: 'on_site', label: 'On-Site' },
  { value: 'hybrid', label: 'Hybrid' }
];

const ServiceEditor = ({ serviceId, onNavigate }) => {
  const isEdit = Boolean(serviceId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState(null);
  const [dirty, setDirty] = useState(false);

  const [form, setForm] = useState({
    title: '', shortDescription: '', detailedDescription: '',
    sector: '', category: '', workMode: 'remote',
    pricingMode: 'fixed', startingPrice: '', currency: 'INR',
    customQuoteEnabled: false, deliveryTime: '', deliveryUnit: 'days',
    location: '', serviceRadius: '', tags: []
  });
  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  const sectors = getSectors();
  const roles = form.sector ? getRolesForSector(form.sector) : [];

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await serviceApi.getMyService(serviceId);
        if (res.success) {
          setService(res.data);
          setForm({
            title: res.data.title || '', shortDescription: res.data.shortDescription || '',
            detailedDescription: res.data.detailedDescription || '',
            sector: res.data.sector || '', category: res.data.category || '',
            workMode: res.data.workMode || 'remote', pricingMode: res.data.pricingMode || 'fixed',
            startingPrice: res.data.startingPrice || '', currency: res.data.currency || 'INR',
            customQuoteEnabled: res.data.customQuoteEnabled || false,
            deliveryTime: res.data.deliveryTime || '', deliveryUnit: res.data.deliveryUnit || 'days',
            location: res.data.location || '', serviceRadius: res.data.serviceRadius || '',
            tags: res.data.tags || []
          });
        }
      } catch (err) { toast.error('Failed to load service'); }
      finally { setLoading(false); }
    };
    load();
  }, [isEdit, serviceId]);

  const updateField = (field, value) => { setForm(prev => ({ ...prev, [field]: value })); setDirty(true); if (errors[field]) setErrors(prev => ({ ...prev, [field]: null })); };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    else if (form.title.length > 150) e.title = 'Max 150 characters';
    if (form.shortDescription.length > 300) e.shortDescription = 'Max 300 characters';
    if (form.startingPrice && (isNaN(form.startingPrice) || Number(form.startingPrice) < 0)) e.startingPrice = 'Must be a valid positive number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { toast.error('Please fix validation errors'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        const fields = {};
        if (form.title.trim() !== (service.title || '')) fields.title = form.title.trim();
        if (form.shortDescription !== (service.shortDescription || '')) fields.shortDescription = form.shortDescription;
        if (form.detailedDescription !== (service.detailedDescription || '')) fields.detailedDescription = form.detailedDescription;
        if (form.sector !== (service.sector || '')) fields.sector = form.sector || null;
        if (form.category !== (service.category || '')) fields.category = form.category || null;
        if (form.workMode !== (service.workMode || 'remote')) fields.workMode = form.workMode;
        if (form.pricingMode !== (service.pricingMode || 'fixed')) fields.pricingMode = form.pricingMode;
        if (String(form.startingPrice) !== String(service.startingPrice || '')) fields.startingPrice = form.startingPrice ? Number(form.startingPrice) : null;
        if (form.currency !== (service.currency || 'INR')) fields.currency = form.currency;
        if (form.customQuoteEnabled !== (service.customQuoteEnabled || false)) fields.customQuoteEnabled = form.customQuoteEnabled;
        if (String(form.deliveryTime) !== String(service.deliveryTime || '')) fields.deliveryTime = form.deliveryTime ? Number(form.deliveryTime) : null;
        if (form.deliveryUnit !== (service.deliveryUnit || 'days')) fields.deliveryUnit = form.deliveryUnit;
        if (form.location !== (service.location || '')) fields.location = form.location || null;
        if (String(form.serviceRadius) !== String(service.serviceRadius || '')) fields.serviceRadius = form.serviceRadius ? Number(form.serviceRadius) : null;
        if (JSON.stringify(form.tags) !== JSON.stringify(service.tags || [])) fields.tags = form.tags;

        if (Object.keys(fields).length === 0) { toast.success('No changes to save'); setSaving(false); return; }
        const res = await serviceApi.updateService(serviceId, fields, service.version);
        if (res.success) { setService(res.data); setDirty(false); toast.success('Service saved'); }
      } else {
        const res = await serviceApi.createService({
          title: form.title.trim(), shortDescription: form.shortDescription,
          sector: form.sector || null, category: form.category || null,
          workMode: form.workMode, pricingMode: form.pricingMode,
          startingPrice: form.startingPrice ? Number(form.startingPrice) : null,
          currency: form.currency, deliveryTime: form.deliveryTime ? Number(form.deliveryTime) : null,
          deliveryUnit: form.deliveryUnit, tags: form.tags
        });
        if (res.success) { setDirty(false); toast.success('Service created'); onNavigate('edit', res.data.serviceId); }
      }
    } catch (err) {
      if (err.code === 'VERSION_CONFLICT') { toast.error('Service updated elsewhere. Refreshing...'); if (isEdit) { const r = await serviceApi.getMyService(serviceId); if (r.success) setService(r.data); } }
      else toast.error(err.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleBack = () => { if (dirty && !window.confirm('You have unsaved changes. Leave anyway?')) return; onNavigate('dashboard'); };
  const addTag = (val) => { const t = val.trim(); if (!t || form.tags.includes(t) || form.tags.length >= 10) return; setForm(prev => ({ ...prev, tags: [...prev.tags, t] })); setDirty(true); setTagInput(''); };
  const removeTag = (tag) => { setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) })); setDirty(true); };

  if (loading) {
    return (<div className="pf-editor-page"><div className="pf-skeleton" style={{ width: 200, height: 28, marginBottom: 24 }} />{[1,2,3].map(i => <div key={i} className="pf-skeleton" style={{ height: 160, marginBottom: 16 }} />)}</div>);
  }

  return (
    <div className="pf-editor-page">
      <div className="pf-editor-header">
        <div className="pf-editor-header-left">
          <button className="pf-back-btn" onClick={handleBack} aria-label="Back"><FiArrowLeft /></button>
          <h1>{isEdit ? 'Edit Service' : 'Add New Service'}</h1>
        </div>
        <div className="pf-editor-actions">
          <button className="pf-btn pf-btn-primary" onClick={handleSave} disabled={saving}><FiSave /> {saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>

      {/* Section 1: Overview */}
      <div className="pf-section-card">
        <h3 className="pf-section-title"><FiPackage className="icon" /> Service Overview</h3>
        <div className="pf-form-group">
          <label className="pf-label">Service Title <span className="required">*</span></label>
          <input className={`pf-input ${errors.title ? 'error' : ''}`} value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="e.g., Professional Website Development" maxLength={150} />
          <div className="pf-char-count">{form.title.length}/150</div>
          {errors.title && <div className="pf-error-text">{errors.title}</div>}
        </div>
        <div className="pf-form-group">
          <label className="pf-label">Short Description</label>
          <textarea className="pf-textarea" value={form.shortDescription} onChange={e => updateField('shortDescription', e.target.value)} placeholder="Brief summary of what you offer" maxLength={300} rows={2} />
          <div className="pf-char-count">{form.shortDescription.length}/300</div>
        </div>
        <div className="pf-form-group">
          <label className="pf-label">Detailed Description</label>
          <textarea className="pf-textarea" value={form.detailedDescription} onChange={e => updateField('detailedDescription', e.target.value)} placeholder="What's included, work process, and what clients can expect..." rows={5} />
        </div>
      </div>

      {/* Section 2: Category */}
      <div className="pf-section-card">
        <h3 className="pf-section-title"><FiTag className="icon" /> Category & Tags</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="pf-form-group">
            <label className="pf-label">Sector</label>
            <select className="pf-select" style={{ width: '100%' }} value={form.sector} onChange={e => { updateField('sector', e.target.value); updateField('category', ''); }}>
              <option value="">Select sector</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="pf-form-group">
            <label className="pf-label">Category / Role</label>
            <select className="pf-select" style={{ width: '100%' }} value={form.category} onChange={e => updateField('category', e.target.value)} disabled={!form.sector}>
              <option value="">Select category</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="pf-form-group">
          <label className="pf-label">Search Tags</label>
          <div className="pf-tags-container" onClick={() => document.getElementById('sv-tag-input')?.focus()}>
            {form.tags.map(tag => (<span key={tag} className="pf-tag">{tag}<button className="pf-tag-remove" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>×</button></span>))}
            <input id="sv-tag-input" className="pf-tag-input" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); } }} onBlur={() => { if (tagInput.trim()) addTag(tagInput); }} placeholder={form.tags.length === 0 ? 'Type and press Enter...' : ''} disabled={form.tags.length >= 10} />
          </div>
          <div className="pf-helper">{form.tags.length}/10 tags</div>
        </div>
      </div>

      {/* Section 3: Work Mode & Location */}
      <div className="pf-section-card">
        <h3 className="pf-section-title"><FiMapPin className="icon" /> Work Mode & Location</h3>
        <div className="pf-form-group">
          <label className="pf-label">Work Mode</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {WORK_MODES.map(m => (
              <label key={m.value} className={`sv-mode-option ${form.workMode === m.value ? 'active' : ''}`}>
                <input type="radio" name="workMode" value={m.value} checked={form.workMode === m.value} onChange={e => updateField('workMode', e.target.value)} />
                {m.label}
              </label>
            ))}
          </div>
        </div>
        {form.workMode !== 'remote' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="pf-form-group">
              <label className="pf-label">Service Location</label>
              <input className="pf-input" value={form.location} onChange={e => updateField('location', e.target.value)} placeholder="e.g., Delhi NCR" />
            </div>
            <div className="pf-form-group">
              <label className="pf-label">Service Radius (km)</label>
              <input className="pf-input" type="number" value={form.serviceRadius} onChange={e => updateField('serviceRadius', e.target.value)} placeholder="e.g., 25" min={0} />
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Pricing */}
      <div className="pf-section-card">
        <h3 className="pf-section-title"><FiDollarSign className="icon" /> Pricing</h3>
        <div className="pf-form-group">
          <label className="pf-label">Pricing Model</label>
          <select className="pf-select" style={{ width: '100%' }} value={form.pricingMode} onChange={e => updateField('pricingMode', e.target.value)}>
            {PRICING_MODES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        {form.pricingMode !== 'custom_quote' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="pf-form-group">
              <label className="pf-label">Starting Price (₹)</label>
              <input className={`pf-input ${errors.startingPrice ? 'error' : ''}`} type="number" value={form.startingPrice} onChange={e => updateField('startingPrice', e.target.value)} placeholder="e.g., 5000" min={0} />
              {errors.startingPrice && <div className="pf-error-text">{errors.startingPrice}</div>}
            </div>
            <div className="pf-form-group">
              <label className="pf-label">Currency</label>
              <select className="pf-select" style={{ width: '100%' }} value={form.currency} onChange={e => updateField('currency', e.target.value)}>
                <option value="INR">₹ INR</option>
                <option value="USD">$ USD</option>
              </select>
            </div>
          </div>
        )}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--pf-text-secondary)', marginTop: 8 }}>
          <input type="checkbox" checked={form.customQuoteEnabled} onChange={e => updateField('customQuoteEnabled', e.target.checked)} />
          Also accept custom quote requests
        </label>
      </div>

      {/* Section 5: Delivery */}
      <div className="pf-section-card">
        <h3 className="pf-section-title"><FiClock className="icon" /> Delivery</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="pf-form-group">
            <label className="pf-label">Delivery Time</label>
            <input className="pf-input" type="number" value={form.deliveryTime} onChange={e => updateField('deliveryTime', e.target.value)} placeholder="e.g., 7" min={1} />
          </div>
          <div className="pf-form-group">
            <label className="pf-label">Unit</label>
            <select className="pf-select" style={{ width: '100%' }} value={form.deliveryUnit} onChange={e => updateField('deliveryUnit', e.target.value)}>
              <option value="hours">Hours</option>
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceEditor;
