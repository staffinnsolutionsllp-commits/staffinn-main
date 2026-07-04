import React, { useState, useEffect, useRef } from 'react';
import {
  FiCalendar, FiBook, FiMapPin, FiPhone, FiUser, FiFileText,
  FiBriefcase, FiUsers, FiExternalLink, FiCheckCircle, FiXCircle,
  FiClock, FiMail, FiCheck, FiSave, FiAlertCircle, FiAward,
  FiMonitor, FiWifi, FiLayers, FiHome, FiGlobe, FiZap,
  FiTrendingUp, FiStar, FiEdit, FiX, FiInfo, FiArrowRight, FiLock
} from 'react-icons/fi';
import apiService from '../../services/api';
import useCampusSlotAvailability from '../../hooks/useCampusSlotAvailability';
import './CampusInviteEnvelope.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const formatDate = (key) => {
  if (!key) return '';
  const d = new Date(key + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const formatTimestamp = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const FACILITIES_META = {
  seminar_hall:   { label: 'Seminar Hall',    icon: FiUsers },
  interview_room: { label: 'Interview Room',  icon: FiUser },
  computer_lab:   { label: 'Computer Lab',    icon: FiMonitor },
  wifi:           { label: 'Wi-Fi',           icon: FiWifi },
  projector:      { label: 'Projector',       icon: FiLayers },
  gd_room:        { label: 'GD Room',         icon: FiUsers },
  other:          { label: 'Other Facilities',icon: FiHome },
};

const SELECTION_PROCESS_OPTIONS = ['Aptitude Test', 'GD', 'Technical Interview', 'HR Interview'];
const TIME_SLOT_OPTIONS = ['10:00 AM – 1:00 PM', '2:00 PM – 5:00 PM', 'Full Day', 'Custom Time'];

const STATUS_CONFIG = {
  pending:   { color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: FiClock,        label: 'Pending' },
  accepted:  { color: '#059669', bg: '#d1fae5', border: '#a7f3d0', icon: FiCheckCircle,  label: 'Accepted' },
  tentative: { color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd', icon: FiAlertCircle,  label: 'Tentative' },
  declined:  { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: FiXCircle,      label: 'Declined' },
  rejected:  { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: FiXCircle,      label: 'Declined' },
  confirmed: { color: '#059669', bg: '#d1fae5', border: '#a7f3d0', icon: FiCheckCircle,  label: 'Confirmed' },
};

/* ─── Info Row helper ─────────────────────────────────────────── */
const InfoRow = ({ icon: Icon, label, value, fullWidth }) => {
  if (!value) return null;
  return (
    <div className={`cie-info-row ${fullWidth ? 'cie-info-row-full' : ''}`}>
      <div className="cie-info-icon-wrap"><Icon size={13} /></div>
      <div className="cie-info-content">
        <span className="cie-info-label">{label}</span>
        <strong className="cie-info-value">{value}</strong>
      </div>
    </div>
  );
};

/* ─── Section Header helper ───────────────────────────────────── */
const SectionHead = ({ icon: Icon, title, color = '#2563eb' }) => (
  <div className="cie-modal-section-head" style={{ '--sh-color': color }}>
    <div className="cie-modal-section-icon"><Icon size={14} /></div>
    <span>{title}</span>
  </div>
);

/* ─── Recruiter Response Form (inside modal) ──────────────────── */
const RecruiterResponseForm = ({ request, onSaved, bodyRef }) => {
  const [participationStatus, setParticipationStatus] = useState(
    request.recruiterResponse?.participationStatus || ''
  );
  const [preferredDate, setPreferredDate]       = useState(request.recruiterResponse?.preferredDate || '');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState(request.recruiterResponse?.preferredTimeSlot || '');
  const [hiringDetails, setHiringDetails] = useState({
    jobRoles:           request.recruiterResponse?.hiringDetails?.jobRoles || '',
    numberOfVacancies:  request.recruiterResponse?.hiringDetails?.numberOfVacancies || '',
    salaryStipend:      request.recruiterResponse?.hiringDetails?.salaryStipend || '',
    eligibilityCriteria:request.recruiterResponse?.hiringDetails?.eligibilityCriteria || '',
  });
  const [selectionProcess, setSelectionProcess] = useState(request.recruiterResponse?.selectionProcess || []);
  const [systemRequirement,   setSystemRequirement]   = useState(request.recruiterResponse?.systemRequirement || '');
  const [internetRequirement, setInternetRequirement] = useState(request.recruiterResponse?.internetRequirement || '');
  const [setupRequirement,    setSetupRequirement]    = useState(request.recruiterResponse?.setupRequirement || '');
  const [otherInstructions,   setOtherInstructions]   = useState(request.recruiterResponse?.otherInstructions || '');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const datePickerRef = useRef(null);
  const availableDates = request.selectedDates || [];
  const availableTimeSlots = request.availableTimeSlots || [];

  // Slot availability for this institute — always fresh when form opens
  const { getSlotStatus, isDateFullyBooked, loading: availLoading, refresh: refreshAvail } =
    useCampusSlotAvailability(request.instituteId);

  // Refresh availability as soon as the response form mounts
  useEffect(() => { refreshAvail(); }, []);

  // Auto-scroll to date picker when Accept is selected
  const handleStatusSelect = (status) => {
    setParticipationStatus(status);
    if (status === 'Accept') {
      setTimeout(() => {
        if (datePickerRef.current && bodyRef?.current) {
          datePickerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 80);
    }
  };

  const toggleSP = (item) =>
    setSelectionProcess(prev => prev.includes(item) ? prev.filter(s => s !== item) : [...prev, item]);

  const buildData = () => ({
    participationStatus, preferredDate, preferredTimeSlot,
    hiringDetails, selectionProcess,
    systemRequirement, internetRequirement, setupRequirement, otherInstructions,
  });

  const handleDraft = async () => {
    if (!participationStatus) { setError('Please select a participation status.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await apiService.respondToCampusRequest(request.campusreq, buildData(), true);
      if (res.success) { setSuccess('Draft saved.'); onSaved && onSaved(res.data); }
      else setError(res.message || 'Failed to save draft.');
    } catch { setError('An error occurred.'); } finally { setSaving(false); }
  };

  const handleConfirm = async () => {
    if (!participationStatus) { setError('Please select a participation status.'); return; }
    if (participationStatus === 'Accept') {
      if (!preferredDate)                  { setError('Please select a preferred date.'); return; }
      if (!preferredTimeSlot)              { setError('Please select a preferred time slot.'); return; }
      // Double-check slot is still available
      const currentStatus = getSlotStatus(preferredDate, preferredTimeSlot);
      if (currentStatus === 'Confirmed') {
        setError('This slot has just been booked by another recruiter. Please select a different date or time slot.');
        return;
      }
      if (!hiringDetails.jobRoles.trim())  { setError('Job Role(s) is required.'); return; }
      if (!hiringDetails.numberOfVacancies){ setError('Number of Vacancies is required.'); return; }
    }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await apiService.respondToCampusRequest(request.campusreq, buildData(), false);
      if (res.success) {
        setSuccess(participationStatus === 'Accept' ? '✅ Campus Drive Confirmed!' : 'Response submitted.');
        setTimeout(() => onSaved && onSaved(res.data), 1200);
      } else setError(res.message || 'Failed to submit.');
    } catch { setError('An error occurred.'); } finally { setSaving(false); }
  };

  const handleDecline = async () => {
    setSaving(true); setError('');
    try {
      const res = await apiService.respondToCampusRequest(
        request.campusreq, { ...buildData(), participationStatus: 'Decline' }, false
      );
      if (res.success) onSaved && onSaved(res.data);
      else setError(res.message || 'Failed to decline.');
    } catch { setError('An error occurred.'); } finally { setSaving(false); }
  };

  return (
    <div className="cie-rf">
      <SectionHead icon={FiEdit} title="Your Response" color="#2563eb" />

      {/* Status selector */}
      <div className="cie-rf-field">
        <label className="cie-rf-label">Participation Status <span className="cie-req">*</span></label>
        <div className="cie-status-pills">
          {[
            { key: 'Accept',    icon: FiCheckCircle, cls: 'accept' },
            { key: 'Decline',   icon: FiXCircle,     cls: 'decline' },
          ].map(({ key, icon: Icon, cls }) => (
            <button key={key} type="button"
              className={`cie-status-pill cie-status-pill-${cls} ${participationStatus === key ? 'active' : ''}`}
              onClick={() => handleStatusSelect(key)}>
              <Icon size={15} /> {key}
            </button>
          ))}
        </div>
      </div>

      {participationStatus === 'Accept' && (
        <>
          {/* Date picker */}
          <div className="cie-rf-field" ref={datePickerRef}>
            <label className="cie-rf-label">
              <FiCalendar size={13} style={{ marginRight: 5 }} />
              Preferred Campus Drive Date <span className="cie-req">*</span>
            </label>
            <p className="cie-rf-hint">Select from the dates proposed by the institute.</p>
            {availLoading && <p className="cie-avail-loading">Checking availability…</p>}
            <div className="cie-dp-grid">
              {availableDates.sort().map(key => {
                const d = new Date(key + 'T00:00:00');
                const sel = preferredDate === key;
                // Check if ALL slots on this date are confirmed-booked
                const fullyBooked = isDateFullyBooked(key, availableTimeSlots);
                const dateSlotStatus = fullyBooked ? 'Confirmed' : null;

                return (
                  <div key={key} role="radio" aria-checked={sel} tabIndex={fullyBooked ? -1 : 0}
                    className={`cie-dp-card ${sel ? 'selected' : ''} ${fullyBooked ? 'cie-dp-card-booked' : ''}`}
                    onClick={() => !fullyBooked && setPreferredDate(key)}
                    onKeyDown={e => e.key === 'Enter' && !fullyBooked && setPreferredDate(key)}>
                    <span className="cie-dp-dow">{DAYS[d.getDay()]}</span>
                    <span className="cie-dp-num">{d.getDate()}</span>
                    <span className="cie-dp-mon">{MONTHS[d.getMonth()]}</span>
                    <span className="cie-dp-yr">{d.getFullYear()}</span>
                    {sel && !fullyBooked && <span className="cie-dp-tick"><FiCheck size={10} /></span>}
                    {fullyBooked && (
                      <span className="cie-dp-status cie-dp-status-booked">
                        <FiLock size={9} /> Full
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time slot */}
          <div className="cie-rf-field">
            <label className="cie-rf-label">
              <FiClock size={13} style={{ marginRight: 5 }} />
              Preferred Time Slot <span className="cie-req">*</span>
            </label>
            <div className="cie-ts-pills">
              {TIME_SLOT_OPTIONS.map(slot => {
                const slotStatus = preferredDate ? getSlotStatus(preferredDate, slot) : null;
                const isBooked    = slotStatus === 'Confirmed';
                const isTentative = slotStatus === 'Tentative';
                const isActive    = preferredTimeSlot === slot;

                let pillClass = `cie-ts-pill`;
                if (isActive && !isBooked) pillClass += ' active';
                if (isBooked)    pillClass += ' cie-ts-pill-booked';
                if (isTentative) pillClass += ' cie-ts-pill-tentative';

                return (
                  <button key={slot} type="button"
                    className={pillClass}
                    disabled={isBooked}
                    onClick={() => !isBooked && setPreferredTimeSlot(slot)}>
                    {isBooked    ? <FiLock size={12} />    :
                     isTentative ? <FiAlertCircle size={12} /> :
                     <FiClock size={12} />}
                    {' '}{slot}
                    {isBooked    && <span className="cie-slot-badge cie-slot-booked">🔴 Booked</span>}
                    {isTentative && <span className="cie-slot-badge cie-slot-tentative">🟡 Tentative</span>}
                    {!isBooked && !isTentative && <span className="cie-slot-badge cie-slot-available">🟢</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hiring details */}
          <div className="cie-rf-box">
            <SectionHead icon={FiBriefcase} title="Hiring Details" color="#7c3aed" />
            <div className="cie-rf-grid">
              <div className="cie-rf-field">
                <label className="cie-rf-label"><FiBriefcase size={12} /> Job Role(s) <span className="cie-req">*</span></label>
                <div className="cie-rf-input-wrap">
                  <FiBriefcase className="cie-rf-input-icon" size={14} />
                  <input value={hiringDetails.jobRoles}
                    onChange={e => setHiringDetails(p => ({ ...p, jobRoles: e.target.value }))}
                    placeholder="e.g. Software Engineer, Data Analyst" />
                </div>
              </div>
              <div className="cie-rf-field">
                <label className="cie-rf-label"><FiUsers size={12} /> Vacancies <span className="cie-req">*</span></label>
                <div className="cie-rf-input-wrap">
                  <FiUsers className="cie-rf-input-icon" size={14} />
                  <input type="number" min="1" value={hiringDetails.numberOfVacancies}
                    onChange={e => setHiringDetails(p => ({ ...p, numberOfVacancies: e.target.value }))}
                    placeholder="e.g. 20" />
                </div>
              </div>
              <div className="cie-rf-field">
                <label className="cie-rf-label"><FiTrendingUp size={12} /> Salary / Stipend</label>
                <div className="cie-rf-input-wrap">
                  <FiTrendingUp className="cie-rf-input-icon" size={14} />
                  <input value={hiringDetails.salaryStipend}
                    onChange={e => setHiringDetails(p => ({ ...p, salaryStipend: e.target.value }))}
                    placeholder="e.g. ₹5 LPA / ₹15,000/month" />
                </div>
              </div>
              <div className="cie-rf-field cie-rf-field-full">
                <label className="cie-rf-label"><FiInfo size={12} /> Eligibility Criteria</label>
                <textarea rows={2} value={hiringDetails.eligibilityCriteria}
                  onChange={e => setHiringDetails(p => ({ ...p, eligibilityCriteria: e.target.value }))}
                  placeholder="e.g. 60%+ aggregate, No backlogs, B.Tech CS/IT" />
              </div>
            </div>
          </div>

          {/* Selection process */}
          <div className="cie-rf-box">
            <SectionHead icon={FiAward} title="Selection Process" color="#059669" />
            <div className="cie-sp-chips">
              {SELECTION_PROCESS_OPTIONS.map(opt => {
                const on = selectionProcess.includes(opt);
                return (
                  <div key={opt} role="checkbox" aria-checked={on} tabIndex={0}
                    className={`cie-sp-chip ${on ? 'on' : ''}`}
                    onClick={() => toggleSP(opt)}
                    onKeyDown={e => e.key === 'Enter' && toggleSP(opt)}>
                    {on ? <FiCheck size={12} /> : <FiZap size={12} />} {opt}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional requirements */}
          <div className="cie-rf-box">
            <SectionHead icon={FiFileText} title="Additional Requirements" color="#d97706" />
            <div className="cie-rf-grid">
              {[
                { label: 'System Requirement',   icon: FiMonitor, val: systemRequirement,   set: setSystemRequirement,   ph: 'e.g. Laptops with specific software...' },
                { label: 'Internet Requirement', icon: FiWifi,    val: internetRequirement, set: setInternetRequirement, ph: 'e.g. High-speed Wi-Fi, 50 Mbps...' },
                { label: 'Setup Requirement',    icon: FiLayers,  val: setupRequirement,    set: setSetupRequirement,    ph: 'e.g. Projector, whiteboard, seating...' },
                { label: 'Other Instructions',   icon: FiFileText,val: otherInstructions,   set: setOtherInstructions,   ph: 'Any other instructions...' },
              ].map(({ label, icon: Icon, val, set, ph }) => (
                <div key={label} className="cie-rf-field">
                  <label className="cie-rf-label"><Icon size={12} /> {label}</label>
                  <textarea rows={2} value={val} onChange={e => set(e.target.value)} placeholder={ph} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {error   && <div className="cie-rf-error"><FiXCircle size={14} /> {error}</div>}
      {success && <div className="cie-rf-success"><FiCheckCircle size={14} /> {success}</div>}

      <div className="cie-rf-actions">
        {participationStatus !== 'Decline' && (
          <button className="cie-rf-btn cie-rf-btn-draft" onClick={handleDraft} disabled={saving}>
            <FiSave size={14} /> Save Draft
          </button>
        )}
        {participationStatus === 'Decline' ? (
          <button className="cie-rf-btn cie-rf-btn-decline" onClick={handleDecline} disabled={saving}>
            {saving ? <span className="cie-spin" /> : <FiXCircle size={14} />} Decline Invitation
          </button>
        ) : (
          <button className="cie-rf-btn cie-rf-btn-confirm" onClick={handleConfirm} disabled={saving}>
            {saving ? <span className="cie-spin" /> : <FiCheckCircle size={14} />}
            {participationStatus === 'Accept' ? ' Confirm Campus Drive' : ' Submit Response'}
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Invite Detail Modal ─────────────────────────────────────── */
const InviteModal = ({ request, onClose, onRefresh }) => {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const overlayRef      = useRef(null);
  const bodyRef         = useRef(null);
  const responseSectionRef = useRef(null);

  const status = request.status || 'pending';
  const cfg    = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  const isActionable = status === 'pending' || status === 'tentative';
  const isConfirmed  = status === 'confirmed';
  const isDeclined   = status === 'declined' || status === 'rejected';
  const rr = request.recruiterResponse || {};

  // Close on overlay click (only the overlay itself, not the panel)
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll + stop Lenis while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    const el = bodyRef.current;
    const trapScroll = (e) => {
      if (!el) return;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const atTop    = scrollTop <= 0 && e.deltaY < 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;
      if (atTop || atBottom) e.preventDefault();
    };

    el?.addEventListener('wheel', trapScroll, { passive: false });

    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove('modal-open');
      el?.removeEventListener('wheel', trapScroll);
    };
  }, []);

  // Block wheel on the overlay backdrop itself
  useEffect(() => {
    const overlay = overlayRef.current;
    const blockScroll = (e) => {
      if (e.target === overlay) e.preventDefault();
    };
    overlay?.addEventListener('wheel', blockScroll, { passive: false });
    return () => overlay?.removeEventListener('wheel', blockScroll);
  }, []);

  // Auto-scroll to response form when it opens
  useEffect(() => {
    if (showResponseForm && responseSectionRef.current && bodyRef.current) {
      setTimeout(() => {
        responseSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }, [showResponseForm]);

  const openResponseForm = () => {
    setShowResponseForm(true);
  };

  const handleSaved = (data) => {
    setShowResponseForm(false);
    onRefresh && onRefresh();
  };

  return (
    <div className="cie-modal-overlay" ref={overlayRef} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="cie-modal-panel">

        {/* ── Modal Header ── */}
        <div className="cie-modal-header">
          <div className="cie-modal-header-glow" />
          <div className="cie-modal-header-inner">
            <div className="cie-modal-seal">
              <FiHome size={22} />
            </div>
            <div className="cie-modal-header-text">
              <p className="cie-modal-from-label">Campus Drive Invitation from</p>
              <h2 className="cie-modal-institute">{request.instituteName}</h2>
              <p className="cie-modal-meta">
                <FiCalendar size={11} /> Received {formatTimestamp(request.createdAt)}
                {request.instituteEmail && <><FiMail size={11} style={{ marginLeft: 8 }} /> {request.instituteEmail}</>}
              </p>
            </div>
            <div className="cie-modal-status-badge"
              style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
              <StatusIcon size={13} /> {cfg.label}
            </div>
          </div>
          <button className="cie-modal-close" onClick={onClose} aria-label="Close modal">
            <FiX size={18} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="cie-modal-body" ref={bodyRef}>

          {/* Coordinator */}
          {(request.tpoName || request.contactPerson) && (
            <div className="cie-modal-section">
              <SectionHead icon={FiUser} title="Placement Coordinator" />
              <div className="cie-info-grid">
                <InfoRow icon={FiUser}  label="Name"    value={request.tpoName || request.contactPerson} />
                <InfoRow icon={FiPhone} label="Contact" value={request.contactNumber || request.contactPhone} />
                <InfoRow icon={FiMail}  label="Email"   value={request.officialEmail || request.instituteEmail} />
              </div>
            </div>
          )}

          {/* Courses */}
          {(request.coursesForRecruitment?.length > 0 || request.courseName) && (
            <div className="cie-modal-section">
              <SectionHead icon={FiBook} title="Courses Available for Recruitment" />
              {request.coursesForRecruitment?.length > 0 ? (
                <div className="cie-tag-row">
                  {request.coursesForRecruitment.map(c => (
                    <span key={c.id} className="cie-tag cie-tag-blue">
                      <FiBook size={11} /> {c.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="cie-info-grid">
                  <InfoRow icon={FiBook} label="Course" value={request.courseName} />
                </div>
              )}
            </div>
          )}

          {/* Students */}
          <div className="cie-modal-section">
            <SectionHead icon={FiUsers} title="Student Details" />
            <div className="cie-info-grid">
              <InfoRow icon={FiUsers}    label="Eligible Students"      value={request.totalEligibleStudents || request.numberOfStudents} />
              <InfoRow icon={FiFileText} label="Qualification Criteria" value={request.studentQualificationCriteria} fullWidth />
            </div>
          </div>

          {/* Venue */}
          <div className="cie-modal-section">
            <SectionHead icon={FiMapPin} title="Venue & Infrastructure" />
            <div className="cie-info-grid">
              <InfoRow icon={FiGlobe}  label="Drive Mode" value={request.driveMode || request.campusDriveMode} />
              <InfoRow icon={FiMapPin} label="Venue"      value={request.venueDetails || request.campusLocation} fullWidth />
            </div>
            {request.availableFacilities?.length > 0 && (
              <div className="cie-tag-row" style={{ marginTop: 10 }}>
                {request.availableFacilities.map(fid => {
                  const meta = FACILITIES_META[fid];
                  const Icon = meta?.icon || FiHome;
                  return (
                    <span key={fid} className="cie-tag cie-tag-green">
                      <Icon size={11} /> {meta?.label || fid}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Time Slots */}
          {request.availableTimeSlots?.length > 0 && (
            <div className="cie-modal-section">
              <SectionHead icon={FiClock} title="Available Time Slots" />
              <div className="cie-tag-row">
                {request.availableTimeSlots.map(s => (
                  <span key={s} className="cie-tag cie-tag-purple">
                    <FiClock size={11} /> {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Proposed Dates */}
          {request.selectedDates?.length > 0 && (
            <div className="cie-modal-section">
              <SectionHead icon={FiCalendar} title="Proposed Campus Drive Dates" />
              <div className="cie-date-pills">
                {request.selectedDates.sort().map(key => (
                  <div key={key} className="cie-date-pill">
                    <FiCalendar size={11} />
                    <span>{formatDate(key)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Response Summary */}
          {rr.participationStatus && !showResponseForm && (
            <div className="cie-modal-section cie-modal-response-section">
              <SectionHead icon={FiCheckCircle} title="Recruiter Response" color="#059669" />
              <div className="cie-info-grid">
                <InfoRow icon={FiStar}       label="Status"        value={rr.participationStatus} />
                <InfoRow icon={FiCalendar}   label="Preferred Date" value={rr.preferredDate ? formatDate(rr.preferredDate) : null} />
                <InfoRow icon={FiClock}      label="Time Slot"     value={rr.preferredTimeSlot} />
                <InfoRow icon={FiBriefcase}  label="Job Roles"     value={rr.hiringDetails?.jobRoles} />
                <InfoRow icon={FiUsers}      label="Vacancies"     value={rr.hiringDetails?.numberOfVacancies} />
                <InfoRow icon={FiTrendingUp} label="Salary/Stipend" value={rr.hiringDetails?.salaryStipend} />
                <InfoRow icon={FiInfo}       label="Eligibility"   value={rr.hiringDetails?.eligibilityCriteria} fullWidth />
              </div>
              {rr.selectionProcess?.length > 0 && (
                <div className="cie-tag-row" style={{ marginTop: 10 }}>
                  {rr.selectionProcess.map(s => (
                    <span key={s} className="cie-tag cie-tag-blue"><FiAward size={11} /> {s}</span>
                  ))}
                </div>
              )}
              {(rr.systemRequirement || rr.internetRequirement || rr.setupRequirement || rr.otherInstructions) && (
                <div className="cie-req-notes">
                  {rr.systemRequirement   && <div><FiMonitor  size={12} /> <strong>System:</strong> {rr.systemRequirement}</div>}
                  {rr.internetRequirement && <div><FiWifi     size={12} /> <strong>Internet:</strong> {rr.internetRequirement}</div>}
                  {rr.setupRequirement    && <div><FiLayers   size={12} /> <strong>Setup:</strong> {rr.setupRequirement}</div>}
                  {rr.otherInstructions   && <div><FiFileText size={12} /> <strong>Other:</strong> {rr.otherInstructions}</div>}
                </div>
              )}
              {isActionable && (
                <button className="cie-edit-btn" onClick={() => setShowResponseForm(true)}>
                  <FiEdit size={13} /> Edit Response
                </button>
              )}
            </div>
          )}

          {/* Response Form */}
          {showResponseForm && (
            <div className="cie-modal-section" ref={responseSectionRef}>
              <RecruiterResponseForm request={request} onSaved={handleSaved} bodyRef={bodyRef} />
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="cie-modal-footer">
          {isActionable && !showResponseForm && !rr.participationStatus && (
            <button className="cie-modal-btn cie-modal-btn-respond" onClick={openResponseForm}>
              <FiArrowRight size={15} /> Respond to Invite
            </button>
          )}
          {isConfirmed && !showResponseForm && (
            <div className="cie-modal-confirmed">
              <FiCheckCircle size={15} /> Campus Drive Confirmed
            </div>
          )}
          {isDeclined && (
            <div className="cie-modal-declined">
              <FiXCircle size={15} /> Invitation Declined
            </div>
          )}
          <button className="cie-modal-btn cie-modal-btn-view"
            onClick={() => window.open(`/institute/${request.instituteId}`, '_blank')}>
            <FiExternalLink size={14} /> View Institute
          </button>
          <button className="cie-modal-btn cie-modal-btn-close" onClick={onClose}>
            <FiX size={14} /> Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Envelope Card (closed state → click → modal) ──────── */
const CampusInviteEnvelope = ({ request, onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const status = request.status || 'pending';
  const cfg    = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  const isConfirmed = status === 'confirmed';
  const isDeclined  = status === 'declined' || status === 'rejected';

  return (
    <>
      {/* ── Envelope Card ── */}
      <div
        className={`cie-env-card cie-env-card-${status}`}
        onClick={() => setModalOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={`Open campus invite from ${request.instituteName}`}
        onKeyDown={e => e.key === 'Enter' && setModalOpen(true)}
      >
        {/* Decorative flap */}
        <div className="cie-env-flap">
          <div className="cie-env-flap-triangle" />
        </div>

        {/* Wax seal */}
        <div className="cie-env-wax-seal">
          <FiHome size={18} />
        </div>

        {/* Envelope body */}
        <div className="cie-env-body">
          {/* From label */}
          <div className="cie-env-from-row">
            <div className="cie-env-from-icon">
              <FiMail size={14} />
            </div>
            <div>
              <p className="cie-env-from-label">Campus Drive Invitation from</p>
              <h3 className="cie-env-institute">{request.instituteName}</h3>
            </div>
          </div>

          {/* Meta row */}
          <div className="cie-env-meta-row">
            <span className="cie-env-date">
              <FiCalendar size={11} /> {formatTimestamp(request.createdAt)}
            </span>
            {(request.driveMode || request.campusDriveMode) && (
              <span className="cie-env-mode">
                <FiGlobe size={11} /> {request.driveMode || request.campusDriveMode}
              </span>
            )}
            {(request.totalEligibleStudents || request.numberOfStudents) && (
              <span className="cie-env-students">
                <FiUsers size={11} /> {request.totalEligibleStudents || request.numberOfStudents} students
              </span>
            )}
          </div>

          {/* Course chips preview */}
          {request.coursesForRecruitment?.length > 0 && (
            <div className="cie-env-courses">
              {request.coursesForRecruitment.slice(0, 2).map(c => (
                <span key={c.id} className="cie-env-course-chip">
                  <FiBook size={10} /> {c.name}
                </span>
              ))}
              {request.coursesForRecruitment.length > 2 && (
                <span className="cie-env-course-chip cie-env-course-more">
                  +{request.coursesForRecruitment.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Status + CTA */}
        <div className="cie-env-footer">
          <div className="cie-env-status-badge"
            style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
            <StatusIcon size={12} /> {cfg.label}
          </div>
          <div className="cie-env-open-cta">
            Open <FiArrowRight size={12} />
          </div>
        </div>

        {/* Confirmed ribbon */}
        {isConfirmed && <div className="cie-env-ribbon">Confirmed</div>}
      </div>

      {/* ── Modal ── */}
      {modalOpen && (
        <InviteModal
          request={request}
          onClose={() => setModalOpen(false)}
          onRefresh={() => { setModalOpen(false); onRefresh && onRefresh(); }}
        />
      )}
    </>
  );
};

export default CampusInviteEnvelope;
