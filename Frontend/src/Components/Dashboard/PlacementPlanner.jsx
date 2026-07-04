import React, { useState, useEffect, useCallback } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiSave, FiTrash2, FiFileText, FiInfo, FiCheckSquare, FiSquare } from 'react-icons/fi';
import apiService from '../../services/api';
import './PlacementPlanner.css';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const today = new Date();
today.setHours(0,0,0,0);

const toKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
};

const PlacementPlanner = () => {
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [rangeStart, setRangeStart] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState('single'); // 'single' | 'range'

  // Load saved planner on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiService.getCampusPlanner();
        if (res.success && res.data) {
          const dates = new Set(res.data.selectedDates || []);
          setSelectedDates(dates);
          setNotes(res.data.notes || '');
        }
      } catch (e) {
        console.error('Load planner error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Build calendar grid for current month
  const buildCalendar = useCallback(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
    return cells;
  }, [viewYear, viewMonth]);

  const isInRange = (date) => {
    if (!rangeStart || !hoverDate || selectionMode !== 'range') return false;
    const d = date.getTime();
    const s = rangeStart.getTime();
    const e = hoverDate.getTime();
    return d >= Math.min(s, e) && d <= Math.max(s, e);
  };

  const handleDateClick = (date) => {
    if (!date) return;
    const key = toKey(date);

    if (selectionMode === 'single') {
      setSelectedDates(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    } else {
      // Range mode
      if (!rangeStart) {
        setRangeStart(date);
      } else {
        // Commit range
        const start = rangeStart < date ? rangeStart : date;
        const end = rangeStart < date ? date : rangeStart;
        const next = new Set(selectedDates);
        const cur = new Date(start);
        while (cur <= end) {
          next.add(toKey(cur));
          cur.setDate(cur.getDate() + 1);
        }
        setSelectedDates(next);
        setRangeStart(null);
        setHoverDate(null);
      }
    }
  };

  const clearAll = () => {
    setSelectedDates(new Set());
    setRangeStart(null);
    setHoverDate(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await apiService.saveCampusPlanner({
        selectedDates: Array.from(selectedDates),
        notes
      });
      if (res.success) {
        setSaveMsg('✅ Planner saved successfully!');
      } else {
        setSaveMsg('❌ Failed to save. Please try again.');
      }
    } catch (e) {
      setSaveMsg('❌ Error saving planner.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const cells = buildCalendar();
  const sortedDates = Array.from(selectedDates).sort();

  if (loading) {
    return (
      <div className="pp-loading">
        <div className="pp-spinner" />
        <p>Loading your planner...</p>
      </div>
    );
  }

  return (
    <div className="pp-container">
      {/* Header */}
      <div className="pp-header">
        <div className="pp-header-left">
          <div className="pp-icon-wrap">
            <FiCalendar />
          </div>
          <div>
            <h1 className="pp-title">Placement Planner</h1>
            <p className="pp-subtitle">Select your available campus drive dates</p>
          </div>
        </div>
        <div className="pp-header-actions">
          <div className="pp-mode-toggle">
            <button
              className={`pp-mode-btn ${selectionMode === 'single' ? 'active' : ''}`}
              onClick={() => { setSelectionMode('single'); setRangeStart(null); }}
            >
              <FiCheckSquare /> Single Date
            </button>
            <button
              className={`pp-mode-btn ${selectionMode === 'range' ? 'active' : ''}`}
              onClick={() => setSelectionMode('range')}
            >
              <FiSquare /> Date Range
            </button>
          </div>
        </div>
      </div>

      <div className="pp-body">
        {/* Calendar */}
        <div className="pp-calendar-card">
          {/* Month navigation */}
          <div className="pp-cal-nav">
            <button className="pp-nav-btn" onClick={prevMonth}><FiChevronLeft /></button>
            <h2 className="pp-month-label">{MONTHS[viewMonth]} {viewYear}</h2>
            <button className="pp-nav-btn" onClick={nextMonth}><FiChevronRight /></button>
          </div>

          {/* Day headers */}
          <div className="pp-day-headers">
            {DAYS.map(d => <div key={d} className="pp-day-header">{d}</div>)}
          </div>

          {/* Calendar grid */}
          <div className="pp-grid">
            {cells.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="pp-cell pp-cell-empty" />;
              const key = toKey(date);
              const isSelected = selectedDates.has(key);
              const isToday = date.getTime() === today.getTime();
              const isPast = date < today;
              const inRange = isInRange(date);
              const isRangeStart = rangeStart && toKey(rangeStart) === key;

              return (
                <div
                  key={key}
                  className={[
                    'pp-cell',
                    isSelected ? 'pp-cell-selected' : '',
                    isToday ? 'pp-cell-today' : '',
                    isPast ? 'pp-cell-past' : '',
                    inRange ? 'pp-cell-in-range' : '',
                    isRangeStart ? 'pp-cell-range-start' : '',
                    !isPast ? 'pp-cell-clickable' : ''
                  ].filter(Boolean).join(' ')}
                  onClick={() => !isPast && handleDateClick(date)}
                  onMouseEnter={() => rangeStart && setHoverDate(date)}
                  onMouseLeave={() => rangeStart && setHoverDate(null)}
                >
                  <span className="pp-date-num">{date.getDate()}</span>
                  {isSelected && <span className="pp-dot" />}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pp-legend">
            <span className="pp-legend-item"><span className="pp-legend-dot pp-legend-selected" />Selected</span>
            <span className="pp-legend-item"><span className="pp-legend-dot pp-legend-today" />Today</span>
            <span className="pp-legend-item"><span className="pp-legend-dot pp-legend-range" />Range</span>
          </div>
        </div>

        {/* Right panel */}
        <div className="pp-side-panel">
          {/* Selected dates list */}
          <div className="pp-selected-card">
            <div className="pp-selected-header">
              <h3>Selected Dates <span className="pp-count">{selectedDates.size}</span></h3>
              {selectedDates.size > 0 && (
                <button className="pp-clear-btn" onClick={clearAll}><FiTrash2 /> Clear</button>
              )}
            </div>
            <div className="pp-dates-list">
              {sortedDates.length === 0 ? (
                <p className="pp-empty-msg">No dates selected yet.<br />Click on calendar dates to select them.</p>
              ) : (
                sortedDates.map(dateKey => {
                  const d = new Date(dateKey + 'T00:00:00');
                  return (
                    <div key={dateKey} className="pp-date-chip">
                      <span className="pp-chip-day">{DAYS[d.getDay()]}</span>
                      <span className="pp-chip-date">
                        {d.getDate()} {MONTHS[d.getMonth()].slice(0,3)} {d.getFullYear()}
                      </span>
                      <button
                        className="pp-chip-remove"
                        onClick={() => setSelectedDates(prev => { const n = new Set(prev); n.delete(dateKey); return n; })}
                      >×</button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="pp-notes-card">
            <h3><FiFileText /> Planner Notes</h3>
            <textarea
              className="pp-notes-input"
              placeholder="Add notes about your placement schedule, requirements, or preferences..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Save button */}
          <button
            className={`pp-save-btn ${saving ? 'pp-saving' : ''}`}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <><span className="pp-btn-spinner" /> Saving...</>
            ) : (
              <><FiSave /> Save Planner</>
            )}
          </button>
          {saveMsg && <p className="pp-save-msg">{saveMsg}</p>}

          <div className="pp-tip">
            <FiInfo className="pp-tip-icon" />
            <p>These dates will appear when you send a Campus Invite to a recruiter from the Recruiter page.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementPlanner;
