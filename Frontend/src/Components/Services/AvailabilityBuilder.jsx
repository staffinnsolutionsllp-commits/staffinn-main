/* eslint-disable react/prop-types */
import React from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AvailabilityBuilder = ({ availability = {}, onChange }) => {
  const update = (field, value) => onChange({ ...availability, [field]: value });
  const toggleDay = (day) => {
    const days = availability.workingDays || [];
    const updated = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
    update('workingDays', updated);
  };

  return (
    <div>
      <h2 className="sv-step-title">Availability & Capacity</h2>
      <p className="sv-step-desc">Let clients know when you're available and how much work you can handle.</p>

      <div className="pf-form-group">
        <label className="sv-check-label" style={{ fontSize: '0.9rem' }}>
          <input type="checkbox" checked={availability.acceptingOrders !== false} onChange={e => update('acceptingOrders', e.target.checked)} />
          <strong>Currently accepting new work</strong>
        </label>
      </div>

      <div className="pf-form-group">
        <label className="pf-label">Working Days</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {DAYS.map(day => (
            <label key={day} className={`sv-mode-option ${(availability.workingDays || []).includes(day) ? 'active' : ''}`} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
              <input type="checkbox" checked={(availability.workingDays || []).includes(day)} onChange={() => toggleDay(day)} style={{ display: 'none' }} />
              {day.slice(0, 3)}
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="pf-form-group">
          <label className="pf-label">Start Time</label>
          <input className="pf-input" type="time" value={availability.startTime || '09:00'} onChange={e => update('startTime', e.target.value)} />
        </div>
        <div className="pf-form-group">
          <label className="pf-label">End Time</label>
          <input className="pf-input" type="time" value={availability.endTime || '18:00'} onChange={e => update('endTime', e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="pf-form-group">
          <label className="pf-label">Time Zone</label>
          <select className="pf-select" style={{ width: '100%' }} value={availability.timeZone || 'Asia/Kolkata'} onChange={e => update('timeZone', e.target.value)}>
            <option value="Asia/Kolkata">IST (Asia/Kolkata)</option>
            <option value="America/New_York">EST (New York)</option>
            <option value="Europe/London">GMT (London)</option>
            <option value="America/Los_Angeles">PST (Los Angeles)</option>
          </select>
        </div>
        <div className="pf-form-group">
          <label className="pf-label">Max Concurrent Orders</label>
          <input className="pf-input" type="number" value={availability.queueLimit || ''} onChange={e => update('queueLimit', e.target.value)} min={1} placeholder="e.g., 3" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="pf-form-group">
          <label className="pf-label">Booking Notice (days)</label>
          <input className="pf-input" type="number" value={availability.bookingNotice || ''} onChange={e => update('bookingNotice', e.target.value)} min={0} placeholder="e.g., 2" />
        </div>
        <div className="pf-form-group">
          <label className="pf-label">Response Time Target</label>
          <select className="pf-select" style={{ width: '100%' }} value={availability.responseTime || ''} onChange={e => update('responseTime', e.target.value)}>
            <option value="">Select</option>
            <option value="1h">Within 1 hour</option>
            <option value="4h">Within 4 hours</option>
            <option value="24h">Within 24 hours</option>
            <option value="48h">Within 48 hours</option>
          </select>
        </div>
      </div>

      <div className="pf-form-group" style={{ marginTop: 16 }}>
        <label className="sv-check-label">
          <input type="checkbox" checked={availability.holidayMode || false} onChange={e => update('holidayMode', e.target.checked)} />
          Holiday Mode (temporarily not accepting work)
        </label>
      </div>

      {availability.holidayMode && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="pf-form-group">
            <label className="pf-label">Holiday Start</label>
            <input className="pf-input" type="date" value={availability.holidayStart || ''} onChange={e => update('holidayStart', e.target.value)} />
          </div>
          <div className="pf-form-group">
            <label className="pf-label">Holiday End</label>
            <input className="pf-input" type="date" value={availability.holidayEnd || ''} onChange={e => update('holidayEnd', e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityBuilder;
