/* eslint-disable react/prop-types */
import React, { useState, useEffect, useCallback } from 'react';
import { FiArrowLeft, FiSave, FiCheck, FiPackage, FiMapPin, FiDollarSign, FiClock, FiTag, FiFileText, FiHelpCircle, FiImage, FiCalendar, FiEye } from 'react-icons/fi';
import { toast } from 'sonner';
import * as serviceApi from '../../services/serviceApi';
import { getSectors, getRolesForSector } from '../../utils/sectorRoleData';
import PackageBuilder from './PackageBuilder';
import FAQBuilder from './FAQBuilder';
import './services.css';

const STEPS = [
  { key: 'overview', label: 'Overview', icon: <FiPackage size={14} /> },
  { key: 'category', label: 'Category', icon: <FiTag size={14} /> },
  { key: 'workmode', label: 'Work Mode', icon: <FiMapPin size={14} /> },
  { key: 'pricing', label: 'Pricing', icon: <FiDollarSign size={14} /> },
  { key: 'packages', label: 'Packages', icon: <FiPackage size={14} /> },
  { key: 'description', label: 'Description', icon: <FiFileText size={14} /> },
  { key: 'faqs', label: 'FAQs', icon: <FiHelpCircle size={14} /> },
  { key: 'delivery', label: 'Delivery', icon: <FiClock size={14} /> },
];

const PRICING_MODES = [
  { value: 'fixed', label: 'Fixed Price' }, { value: 'tiered', label: 'Tiered Packages' },
  { value: 'hourly', label: 'Hourly' }, { value: 'daily', label: 'Daily' },
  { value: 'per_visit', label: 'Per Visit' }, { value: 'per_session', label: 'Per Session' },
  { value: 'per_item', label: 'Per Item' }, { value: 'monthly', label: 'Monthly' },
  { value: 'custom_quote', label: 'Custom Quote Only' }
];
const WORK_MODES = [{ value: 'remote', label: 'Remote' }, { value: 'on_site', label: 'On-Site' }, { value: 'hybrid', label: 'Hybrid' }];

const ServiceBuilder = ({ serviceId, onNavigate }) => {
  const isEdit = Boolean(serviceId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState({
    title: '', shortDescription: '', detailedDescription: '',
    sector: '', category: '', workMode: 'remote',
    pricingMode: 'fixed', startingPrice: '', currency: 'INR',
    customQuoteEnabled: false, deliveryTime: '', deliveryUnit: 'days',
    location: '', serviceRadius: '', tags: [],
    packages: [], faqs: []
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
            tags: res.data.tags || [], packages: res.data.packages || [], faqs: res.data.faqs || []
          });
        }
      } catch { toast.error('Failed to load service'); }
      finally { setLoading(false); }
    };
    load();
  }, [isEdit, serviceId]);

  const updateField = (field, value) => { setForm(prev => ({ ...prev, [field]: value })); setDirty(true); if (errors[field]) setErrors(prev => ({ ...prev, [field]: null })); };
  const addTag = (val) => { const t = val.trim(); if (!t || form.tags.includes(t) || form.tags.length >= 10) return; updateField('tags', [...form.tags, t]); setTagInput(''); };
  const removeTag = (tag) => { updateField('tags', form.tags.filter(t => t !== tag)); };

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) { setErrors({ title: 'Title is required' }); setCurrentStep(0); toast.error('Title is required'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        const fields = {};
        const compare = (key, formVal, svcVal) => { if (JSON.stringify(formVal) !== JSON.stringify(svcVal)) fields[key] = formVal; };
        compare('title', form.title.trim(), service.title);
        compare('shortDescription', form.shortDescription, service.shortDescription || '');
        compare('detailedDescription', form.detailedDescription, service.detailedDescription || '');
        compare('sector', form.sector || null, service.sector);
        compare('category', form.category || null, service.category);
        compare('workMode', form.workMode, service.workMode);
        compare('pricingMode', form.pricingMode, service.pricingMode);
        compare('startingPrice', form.startingPrice ? Number(form.startingPrice) : null, service.startingPrice);
        compare('currency', form.currency, service.currency);
        compare('customQuoteEnabled', form.customQuoteEnabled, service.customQuoteEnabled);
        compare('deliveryTime', form.deliveryTime ? Number(form.deliveryTime) : null, service.deliveryTime);
        compare('deliveryUnit', form.deliveryUnit, service.deliveryUnit);
        compare('location', form.location || null, service.location);
        compare('serviceRadius', form.serviceRadius ? Number(form.serviceRadius) : null, service.serviceRadius);
        compare('tags', form.tags, service.tags || []);
        if (Object.keys(fields).length === 0 && JSON.stringify(form.packages) === JSON.stringify(service.packages || []) && JSON.stringify(form.faqs) === JSON.stringify(service.faqs || [])) {
          toast.success('No changes to save'); setSaving(false); return;
        }
        // Save main fields
        if (Object.keys(fields).length > 0) {
          const res = await serviceApi.updateService(serviceId, fields, service.version);
          if (res.success) setService(res.data);
        }
        // Save packages if changed
        if (JSON.stringify(form.packages) !== JSON.stringify(service.packages || [])) {
          const currentVersion = service.version + (Object.keys(fields).length > 0 ? 1 : 0);
          const res = await serviceApi.updatePackages(serviceId, form.packages, currentVersion);
          if (res.success) setService(res.data);
        }
        // Save FAQs if changed
        if (JSON.stringify(form.faqs) !== JSON.stringify(service.faqs || [])) {
          const latestService = await serviceApi.getMyService(serviceId);
          if (latestService.success) {
            await serviceApi.updateFaqs(serviceId, form.faqs, latestService.data.version);
            setService(latestService.data);
          }
        }
        setDirty(false); toast.success('Service saved');
        // Refresh
        const refreshed = await serviceApi.getMyService(serviceId);
        if (refreshed.success) setService(refreshed.data);
      } else {
        const res = await serviceApi.createService({ title: form.title.trim(), shortDescription: form.shortDescription, sector: form.sector || null, category: form.category || null, workMode: form.workMode, pricingMode: form.pricingMode, startingPrice: form.startingPrice ? Number(form.startingPrice) : null, currency: form.currency, deliveryTime: form.deliveryTime ? Number(form.deliveryTime) : null, deliveryUnit: form.deliveryUnit, tags: form.tags });
        if (res.success) { setDirty(false); toast.success('Service created'); onNavigate('edit', res.data.serviceId); }
      }
    } catch (err) {
      if (err.code === 'VERSION_CONFLICT') { toast.error('Service updated elsewhere. Refreshing...'); const r = await serviceApi.getMyService(serviceId); if (r.success) setService(r.data); }
      else toast.error(err.message || 'Save failed');
    } finally { setSaving(false); }
  }, [form, service, isEdit, serviceId, onNavigate]);

  const handleBack = () => { if (dirty && !window.confirm('You have unsaved changes. Leave anyway?')) return; onNavigate('dashboard'); };

  if (loading) return (<div className="pf-editor-page"><div className="pf-skeleton" style={{ width: 200, height: 28, marginBottom: 24 }} />{[1,2,3].map(i => <div key={i} className="pf-skeleton" style={{ height: 160, marginBottom: 16 }} />)}</div>);

  return (
    <div className="sv-builder">
      {/* Header */}
      <div className="sv-builder-header">
        <div className="sv-builder-header-left">
          <button className="pf-back-btn" onClick={handleBack} aria-label="Back"><FiArrowLeft /></button>
          <div>
            <h1 className="sv-builder-title">{isEdit ? 'Edit Service' : 'Create Service'}</h1>
            {service && <span className="sv-builder-status">{service.status} · v{service.version}</span>}
          </div>
        </div>
        <div className="sv-builder-header-actions">
          <button className="pf-btn pf-btn-primary" onClick={handleSave} disabled={saving}><FiSave size={14} /> {saving ? 'Saving...' : 'Save Draft'}</button>
        </div>
      </div>

      <div className="sv-builder-layout">
        {/* Step Navigation */}
        <nav className="sv-builder-steps" aria-label="Builder steps">
          {STEPS.map((step, idx) => (
            <button key={step.key} className={`sv-step ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`} onClick={() => setCurrentStep(idx)} aria-current={idx === currentStep ? 'step' : undefined}>
              <span className="sv-step-icon">{idx < currentStep ? <FiCheck size={12} /> : step.icon}</span>
              <span className="sv-step-label">{step.label}</span>
            </button>
          ))}
        </nav>

        {/* Step Content */}
        <div className="sv-builder-content">
          {currentStep === 0 && <StepOverview form={form} errors={errors} updateField={updateField} tagInput={tagInput} setTagInput={setTagInput} addTag={addTag} removeTag={removeTag} />}
          {currentStep === 1 && <StepCategory form={form} updateField={updateField} sectors={sectors} roles={roles} />}
          {currentStep === 2 && <StepWorkMode form={form} updateField={updateField} />}
          {currentStep === 3 && <StepPricing form={form} updateField={updateField} errors={errors} />}
          {currentStep === 4 && <PackageBuilder packages={form.packages} pricingMode={form.pricingMode} onChange={pkgs => updateField('packages', pkgs)} />}
          {currentStep === 5 && <StepDescription form={form} updateField={updateField} />}
          {currentStep === 6 && <FAQBuilder faqs={form.faqs} onChange={faqs => updateField('faqs', faqs)} />}
          {currentStep === 7 && <StepDelivery form={form} updateField={updateField} />}

          {/* Navigation */}
          <div className="sv-builder-nav">
            {currentStep > 0 && <button className="pf-btn pf-btn-secondary" onClick={() => setCurrentStep(s => s - 1)}>Previous</button>}
            {currentStep < STEPS.length - 1 && <button className="pf-btn pf-btn-primary" onClick={() => setCurrentStep(s => s + 1)}>Continue</button>}
            {currentStep === STEPS.length - 1 && <button className="pf-btn pf-btn-primary" onClick={handleSave} disabled={saving}><FiSave size={14} /> {saving ? 'Saving...' : 'Save Service'}</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Steps ────────────────────────────────────────────────────────────

const StepOverview = ({ form, errors, updateField, tagInput, setTagInput, addTag, removeTag }) => (
  <div><h2 className="sv-step-title">Service Overview</h2><p className="sv-step-desc">Describe what you offer clearly and concisely.</p>
    <div className="pf-form-group"><label className="pf-label">Service Title <span className="required">*</span></label><input className={`pf-input ${errors.title ? 'error' : ''}`} value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="e.g., Professional Website Development" maxLength={150} /><div className="pf-char-count">{form.title.length}/150</div>{errors.title && <div className="pf-error-text">{errors.title}</div>}</div>
    <div className="pf-form-group"><label className="pf-label">Short Description</label><textarea className="pf-textarea" value={form.shortDescription} onChange={e => updateField('shortDescription', e.target.value)} placeholder="Brief summary visible in search and cards" maxLength={300} rows={3} /><div className="pf-char-count">{form.shortDescription.length}/300</div></div>
    <div className="pf-form-group"><label className="pf-label">Search Tags</label><div className="pf-tags-container">{form.tags.map(t => <span key={t} className="pf-tag">{t}<button className="pf-tag-remove" onClick={() => removeTag(t)}>×</button></span>)}<input className="pf-tag-input" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); } }} onBlur={() => { if (tagInput.trim()) addTag(tagInput); }} placeholder={form.tags.length === 0 ? 'Press Enter to add...' : ''} disabled={form.tags.length >= 10} /></div><div className="pf-helper">{form.tags.length}/10</div></div>
  </div>
);

const StepCategory = ({ form, updateField, sectors, roles }) => (
  <div><h2 className="sv-step-title">Category</h2><p className="sv-step-desc">Choose the sector and category that best describes your service.</p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div className="pf-form-group"><label className="pf-label">Sector</label><select className="pf-select" style={{ width: '100%' }} value={form.sector} onChange={e => { updateField('sector', e.target.value); updateField('category', ''); }}><option value="">Select sector</option>{sectors.map(s => <option key={s} value={s}>{s}</option>)}</select></div><div className="pf-form-group"><label className="pf-label">Category</label><select className="pf-select" style={{ width: '100%' }} value={form.category} onChange={e => updateField('category', e.target.value)} disabled={!form.sector}><option value="">Select category</option>{roles.map(r => <option key={r} value={r}>{r}</option>)}</select></div></div>
  </div>
);

const StepWorkMode = ({ form, updateField }) => (
  <div><h2 className="sv-step-title">Work Mode & Location</h2><p className="sv-step-desc">How and where do you deliver this service?</p>
    <div className="pf-form-group"><label className="pf-label">Work Mode</label><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{WORK_MODES.map(m => <label key={m.value} className={`sv-mode-option ${form.workMode === m.value ? 'active' : ''}`}><input type="radio" name="workMode" value={m.value} checked={form.workMode === m.value} onChange={e => updateField('workMode', e.target.value)} />{m.label}</label>)}</div></div>
    {form.workMode !== 'remote' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div className="pf-form-group"><label className="pf-label">Location</label><input className="pf-input" value={form.location} onChange={e => updateField('location', e.target.value)} placeholder="e.g., Delhi NCR" /></div><div className="pf-form-group"><label className="pf-label">Radius (km)</label><input className="pf-input" type="number" value={form.serviceRadius} onChange={e => updateField('serviceRadius', e.target.value)} min={0} /></div></div>}
  </div>
);

const StepPricing = ({ form, updateField, errors }) => (
  <div><h2 className="sv-step-title">Pricing</h2><p className="sv-step-desc">Choose how you charge for this service.</p>
    <div className="pf-form-group"><label className="pf-label">Pricing Model</label><select className="pf-select" style={{ width: '100%' }} value={form.pricingMode} onChange={e => updateField('pricingMode', e.target.value)}>{PRICING_MODES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
    {form.pricingMode !== 'custom_quote' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div className="pf-form-group"><label className="pf-label">Starting Price (₹)</label><input className={`pf-input ${errors.startingPrice ? 'error' : ''}`} type="number" value={form.startingPrice} onChange={e => updateField('startingPrice', e.target.value)} min={0} /></div><div className="pf-form-group"><label className="pf-label">Currency</label><select className="pf-select" style={{ width: '100%' }} value={form.currency} onChange={e => updateField('currency', e.target.value)}><option value="INR">₹ INR</option><option value="USD">$ USD</option></select></div></div>}
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--pf-text-secondary)', marginTop: 12 }}><input type="checkbox" checked={form.customQuoteEnabled} onChange={e => updateField('customQuoteEnabled', e.target.checked)} /> Also accept custom quote requests</label>
  </div>
);

const StepDescription = ({ form, updateField }) => (
  <div><h2 className="sv-step-title">Description</h2><p className="sv-step-desc">Provide a detailed description of your service.</p>
    <div className="pf-form-group"><label className="pf-label">Full Description</label><textarea className="pf-textarea" style={{ minHeight: 200 }} value={form.detailedDescription} onChange={e => updateField('detailedDescription', e.target.value)} placeholder="Describe what's included, your process, tools used, deliverables..." /></div>
  </div>
);

const StepDelivery = ({ form, updateField }) => (
  <div><h2 className="sv-step-title">Delivery</h2><p className="sv-step-desc">How long does it take to complete this service?</p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}><div className="pf-form-group"><label className="pf-label">Delivery Time</label><input className="pf-input" type="number" value={form.deliveryTime} onChange={e => updateField('deliveryTime', e.target.value)} placeholder="e.g., 7" min={1} /></div><div className="pf-form-group"><label className="pf-label">Unit</label><select className="pf-select" style={{ width: '100%' }} value={form.deliveryUnit} onChange={e => updateField('deliveryUnit', e.target.value)}><option value="hours">Hours</option><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option></select></div></div>
  </div>
);

export default ServiceBuilder;
