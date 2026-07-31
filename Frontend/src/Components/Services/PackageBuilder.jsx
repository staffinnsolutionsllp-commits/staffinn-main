/* eslint-disable react/prop-types */
import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiCheck } from 'react-icons/fi';

const DEFAULT_PACKAGE = { key: '', displayName: '', title: '', description: '', price: '', deliveryValue: '', deliveryUnit: 'days', revisions: '', unlimitedRevisions: false, features: [], active: true, recommended: false };

const PackageBuilder = ({ packages, pricingMode, onChange }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (pricingMode !== 'tiered') {
    return (
      <div>
        <h2 className="sv-step-title">Packages</h2>
        <p className="sv-step-desc">Packages are available only when pricing model is set to "Tiered Packages". Change your pricing model in the Pricing step.</p>
      </div>
    );
  }

  const addPackage = () => {
    if (packages.length >= 3) return;
    const keys = ['basic', 'standard', 'premium'];
    const labels = ['Basic', 'Standard', 'Premium'];
    const idx = packages.length;
    onChange([...packages, { ...DEFAULT_PACKAGE, key: keys[idx] || `pkg_${idx}`, displayName: labels[idx] || `Package ${idx + 1}` }]);
    setActiveTab(idx);
  };

  const updatePackage = (index, field, value) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removePackage = (index) => {
    const updated = packages.filter((_, i) => i !== index);
    onChange(updated);
    setActiveTab(Math.max(0, activeTab - 1));
  };

  const addFeature = (pkgIndex) => {
    const updated = [...packages];
    updated[pkgIndex] = { ...updated[pkgIndex], features: [...(updated[pkgIndex].features || []), { label: '', included: true, value: '' }] };
    onChange(updated);
  };

  const updateFeature = (pkgIndex, featureIndex, field, value) => {
    const updated = [...packages];
    const features = [...(updated[pkgIndex].features || [])];
    features[featureIndex] = { ...features[featureIndex], [field]: value };
    updated[pkgIndex] = { ...updated[pkgIndex], features };
    onChange(updated);
  };

  const removeFeature = (pkgIndex, featureIndex) => {
    const updated = [...packages];
    updated[pkgIndex] = { ...updated[pkgIndex], features: updated[pkgIndex].features.filter((_, i) => i !== featureIndex) };
    onChange(updated);
  };

  const currentPkg = packages[activeTab];

  return (
    <div>
      <h2 className="sv-step-title">Packages</h2>
      <p className="sv-step-desc">Define your Basic, Standard, and Premium packages.</p>

      {/* Package Tabs */}
      <div className="sv-pkg-tabs">
        {packages.map((pkg, i) => (
          <button key={i} className={`sv-pkg-tab ${i === activeTab ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
            {pkg.displayName || `Package ${i + 1}`}
            {pkg.recommended && <FiCheck size={11} />}
          </button>
        ))}
        {packages.length < 3 && (
          <button className="sv-pkg-tab sv-pkg-tab-add" onClick={addPackage}><FiPlus size={13} /> Add</button>
        )}
      </div>

      {/* Package Editor */}
      {currentPkg && (
        <div className="sv-pkg-editor">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="pf-form-group">
              <label className="pf-label">Display Name</label>
              <input className="pf-input" value={currentPkg.displayName || ''} onChange={e => updatePackage(activeTab, 'displayName', e.target.value)} placeholder="e.g., Starter" />
            </div>
            <div className="pf-form-group">
              <label className="pf-label">Title</label>
              <input className="pf-input" value={currentPkg.title || ''} onChange={e => updatePackage(activeTab, 'title', e.target.value)} placeholder="e.g., Basic Website" />
            </div>
          </div>
          <div className="pf-form-group">
            <label className="pf-label">Description</label>
            <textarea className="pf-textarea" rows={2} value={currentPkg.description || ''} onChange={e => updatePackage(activeTab, 'description', e.target.value)} placeholder="What's included in this package" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div className="pf-form-group">
              <label className="pf-label">Price (₹)</label>
              <input className="pf-input" type="number" value={currentPkg.price || ''} onChange={e => updatePackage(activeTab, 'price', e.target.value)} min={0} />
            </div>
            <div className="pf-form-group">
              <label className="pf-label">Delivery</label>
              <input className="pf-input" type="number" value={currentPkg.deliveryValue || ''} onChange={e => updatePackage(activeTab, 'deliveryValue', e.target.value)} min={1} placeholder="7" />
            </div>
            <div className="pf-form-group">
              <label className="pf-label">Revisions</label>
              <input className="pf-input" type="number" value={currentPkg.revisions || ''} onChange={e => updatePackage(activeTab, 'revisions', e.target.value)} min={0} disabled={currentPkg.unlimitedRevisions} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
            <label className="sv-check-label"><input type="checkbox" checked={currentPkg.unlimitedRevisions || false} onChange={e => updatePackage(activeTab, 'unlimitedRevisions', e.target.checked)} /> Unlimited revisions</label>
            <label className="sv-check-label"><input type="checkbox" checked={currentPkg.recommended || false} onChange={e => updatePackage(activeTab, 'recommended', e.target.checked)} /> Recommended</label>
          </div>

          {/* Features */}
          <div className="sv-pkg-features">
            <label className="pf-label">What's Included</label>
            {(currentPkg.features || []).map((f, fi) => (
              <div key={fi} className="sv-pkg-feature-row">
                <input type="checkbox" checked={f.included !== false} onChange={e => updateFeature(activeTab, fi, 'included', e.target.checked)} />
                <input className="pf-input" style={{ flex: 1 }} value={f.label || ''} onChange={e => updateFeature(activeTab, fi, 'label', e.target.value)} placeholder="Feature name" />
                <input className="pf-input" style={{ width: 80 }} value={f.value || ''} onChange={e => updateFeature(activeTab, fi, 'value', e.target.value)} placeholder="Qty" />
                <button className="pf-btn pf-btn-ghost pf-btn-sm" onClick={() => removeFeature(activeTab, fi)} aria-label="Remove"><FiTrash2 size={12} /></button>
              </div>
            ))}
            <button className="pf-btn pf-btn-ghost pf-btn-sm" style={{ marginTop: 8 }} onClick={() => addFeature(activeTab)}><FiPlus size={12} /> Add Feature</button>
          </div>

          {/* Remove Package */}
          {packages.length > 1 && (
            <button className="pf-btn pf-btn-ghost pf-btn-sm" style={{ color: 'var(--pf-destructive)', marginTop: 16 }} onClick={() => removePackage(activeTab)}>
              <FiTrash2 size={12} /> Remove Package
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PackageBuilder;
