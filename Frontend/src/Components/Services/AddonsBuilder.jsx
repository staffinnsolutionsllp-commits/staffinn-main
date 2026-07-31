/* eslint-disable react/prop-types */
import React from 'react';
import { FiPlus, FiTrash2, FiChevronUp, FiChevronDown } from 'react-icons/fi';

const AddonsBuilder = ({ addons = [], onChange }) => {
  const addAddon = () => {
    if (addons.length >= 10) return;
    onChange([...addons, { name: '', description: '', price: '', currency: 'INR', unit: 'per item', additionalDelivery: '', maxQuantity: '', active: true }]);
  };

  const updateAddon = (index, field, value) => {
    const updated = [...addons];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeAddon = (index) => { onChange(addons.filter((_, i) => i !== index)); };
  const moveUp = (i) => { if (i === 0) return; const u = [...addons]; [u[i-1], u[i]] = [u[i], u[i-1]]; onChange(u); };
  const moveDown = (i) => { if (i >= addons.length - 1) return; const u = [...addons]; [u[i], u[i+1]] = [u[i+1], u[i]]; onChange(u); };

  return (
    <div>
      <h2 className="sv-step-title">Add-Ons & Extras</h2>
      <p className="sv-step-desc">Optional upgrades clients can add to their order.</p>

      {addons.map((addon, i) => (
        <div key={i} className="sv-faq-item">
          <div className="sv-faq-item-header">
            <span className="sv-faq-num">#{i + 1}</span>
            <div className="sv-faq-item-actions">
              <button className="pf-btn pf-btn-ghost pf-btn-sm" onClick={() => moveUp(i)} disabled={i === 0} aria-label="Move up"><FiChevronUp size={13} /></button>
              <button className="pf-btn pf-btn-ghost pf-btn-sm" onClick={() => moveDown(i)} disabled={i >= addons.length - 1} aria-label="Move down"><FiChevronDown size={13} /></button>
              <button className="pf-btn pf-btn-ghost pf-btn-sm" style={{ color: 'var(--pf-destructive)' }} onClick={() => removeAddon(i)} aria-label="Remove"><FiTrash2 size={13} /></button>
            </div>
          </div>
          <div className="pf-form-group">
            <input className="pf-input" value={addon.name} onChange={e => updateAddon(i, 'name', e.target.value)} placeholder="Add-on name (e.g., Extra Revision, Source Files)" maxLength={100} />
          </div>
          <div className="pf-form-group">
            <input className="pf-input" value={addon.description || ''} onChange={e => updateAddon(i, 'description', e.target.value)} placeholder="Short description (optional)" maxLength={200} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="pf-form-group">
              <label className="pf-label">Price (₹)</label>
              <input className="pf-input" type="number" value={addon.price} onChange={e => updateAddon(i, 'price', e.target.value)} min={0} placeholder="500" />
            </div>
            <div className="pf-form-group">
              <label className="pf-label">Extra Delivery</label>
              <input className="pf-input" type="number" value={addon.additionalDelivery || ''} onChange={e => updateAddon(i, 'additionalDelivery', e.target.value)} min={0} placeholder="Days" />
            </div>
            <div className="pf-form-group">
              <label className="pf-label">Max Qty</label>
              <input className="pf-input" type="number" value={addon.maxQuantity || ''} onChange={e => updateAddon(i, 'maxQuantity', e.target.value)} min={1} placeholder="∞" />
            </div>
          </div>
        </div>
      ))}

      {addons.length < 10 && (
        <button className="pf-btn pf-btn-secondary" onClick={addAddon}><FiPlus size={14} /> Add Extra</button>
      )}
      <div className="pf-helper" style={{ marginTop: 8 }}>{addons.length}/10 add-ons</div>
    </div>
  );
};

export default AddonsBuilder;
