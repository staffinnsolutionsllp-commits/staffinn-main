/**
 * InstituteResponseSection
 * Shows institute responses to campus invites sent by the recruiter.
 * Flow: Recruiter → Institute (RECRUITER_TO_INSTITUTE direction)
 * Data source: GET /api/recruiter-campus-invites/sent
 */
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FiCalendar, FiClock, FiBook, FiUsers, FiBriefcase,
  FiCheckCircle, FiXCircle, FiAlertCircle, FiPhone, FiMail,
  FiMapPin, FiUser, FiGlobe, FiMonitor, FiWifi, FiLayers,
  FiFileText, FiHome, FiAward, FiInfo, FiX, FiRefreshCw,
  FiArrowRight, FiInbox
} from 'react-icons/fi';
import apiService from '../../services/api';
import './InstituteResponseSection.css';

/* ── Helpers ──────────────────────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatDate = (str) => {
  if (!str) return '—';
  const d = new Date(str.includes('T') ? str : str + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const formatTs = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const FACILITY_LABELS = {
  seminar_hall:   'Seminar Hall',
  interview_room: 'Interview Room',
  computer_lab:   'Computer Lab',
  wifi:           'Wi-Fi',
  projector:      'Projector',
  gd_room:        'GD Room',
};

const STATUS_CFG = {
  pending:  { color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: FiAlertCircle, label: 'Pending' },
  accepted: { color: '#059669', bg: '#d1fae5', border: '#a7f3d0', icon: FiCheckCircle,  label: 'Accepted' },
  declined: { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: FiXCircle,      label: 'Declined' },
};

/* ── Full-detail Modal ────────────────────────────────────────── */
const ResponseDetailModal = ({ invite, onClose }) => {
  const overlayRef = useRef(null);
  const bodyRef    = useRef(null);
  const ir         = invite.instituteResponse || {};
  const cfg        = STATUS_CFG[invite.status] || STATUS_CFG.pending;
  const StatusIcon = cfg.icon;

  /* Lock body scroll */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', esc); };
  }, [onClose]);

  /* Trap wheel inside modal body */
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const trap = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if ((scrollTop <= 0 && e.deltaY < 0) || (scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0)) {
        e.preventDefault();
      }
      e.stopPropagation();
    };
    el.addEventListener('wheel', trap, { passive: false });
    return () => el.removeEventListener('wheel', trap);
  }, []);

  const Row = ({ icon: Icon, label, value, full }) => {
    if (!value) return null;
    return (
      <div className={`irs-info-row${full ? ' irs-info-row-full' : ''}`}>
        <div className="irs-info-icon"><Icon size={13} /></div>
        <div>
          <span className="irs-info-label">{label}</span>
          <strong className="irs-info-value">{value}</strong>
        </div>
      </div>
    );
  };

  const Section = ({ icon: Icon, title, color, children }) => (
    <div className="irs-modal-section">
      <div className="irs-modal-section-head" style={{ '--irs-sh': color || '#2563eb' }}>
        <div className="irs-sh-icon"><Icon size={14} /></div>
        <span>{title}</span>
      </div>
      {children}
    </div>
  );

  return createPortal(
    <div
      className="irs-overlay"
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="irs-modal">
        {/* Header */}
        <div className="irs-modal-header">
          <div className="irs-modal-header-glow" />
          <div className="irs-modal-header-inner">
            <div className="irs-modal-seal"><FiHome size={22} /></div>
            <div className="irs-modal-header-text">
              <p className="irs-modal-from-label">Institute Response to your Campus Invite</p>
              <h2 className="irs-modal-institute">{invite.instituteName}</h2>
              <p className="irs-modal-meta">
                <FiCalendar size={11} /> Sent {formatTs(invite.createdAt)}
                {invite.instituteEmail && (
                  <><FiMail size={11} style={{ marginLeft: 8 }} /> {invite.instituteEmail}</>
                )}
              </p>
            </div>
            <div
              className="irs-modal-status"
              style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
            >
              <StatusIcon size={13} /> {cfg.label}
            </div>
          </div>
          <button className="irs-modal-close" onClick={onClose} aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="irs-modal-body" ref={bodyRef}>

          {/* ── Your Invite Details ── */}
          <Section icon={FiBriefcase} title="Your Invite Details" color="#7c3aed">
            <div className="irs-info-grid">
              <Row icon={FiBriefcase} label="Job Roles"       value={invite.jobRoles} />
              <Row icon={FiUsers}     label="Vacancies"       value={invite.numberOfVacancies} />
              <Row icon={FiInfo}      label="Salary/Stipend"  value={invite.salaryStipend} />
              <Row icon={FiCalendar}  label="Preferred Date"  value={formatDate(invite.preferredDate)} />
              <Row icon={FiClock}     label="Time Slot"       value={invite.preferredTimeSlot} />
              <Row icon={FiInfo}      label="Eligibility"     value={invite.eligibilityCriteria} full />
            </div>
          </Section>

          {/* Selected Courses */}
          {invite.selectedCourses?.length > 0 && (
            <Section icon={FiBook} title="Selected Courses" color="#2563eb">
              <div className="irs-tag-row">
                {invite.selectedCourses.map(c => (
                  <span key={c.id} className="irs-tag irs-tag-blue">
                    <FiBook size={11} /> {c.name}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Selection Process */}
          {invite.selectionProcess?.length > 0 && (
            <Section icon={FiAward} title="Selection Process" color="#059669">
              <div className="irs-tag-row">
                {invite.selectionProcess.map(s => (
                  <span key={s} className="irs-tag irs-tag-purple">
                    <FiAward size={11} /> {s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* ── Institute Response ── */}
          {invite.status === 'accepted' && ir.tpoName ? (
            <>
              <div className="irs-response-divider">
                <span>Institute Response</span>
              </div>

              {/* Placement Coordinator */}
              <Section icon={FiUser} title="Placement Coordinator" color="#059669">
                <div className="irs-info-grid">
                  <Row icon={FiUser}  label="TPO Name"       value={ir.tpoName} />
                  <Row icon={FiPhone} label="Contact Number" value={ir.contactNumber} />
                  <Row icon={FiMail}  label="Official Email" value={ir.officialEmail} />
                </div>
              </Section>

              {/* Student Details */}
              <Section icon={FiUsers} title="Student Details" color="#2563eb">
                <div className="irs-info-grid">
                  <Row icon={FiUsers}    label="Total Eligible Students"      value={ir.totalEligibleStudents} />
                  <Row icon={FiFileText} label="Qualification Criteria"       value={ir.studentQualificationCriteria} full />
                </div>
              </Section>

              {/* Venue & Infrastructure */}
              <Section icon={FiMapPin} title="Venue & Infrastructure" color="#d97706">
                <div className="irs-info-grid">
                  <Row icon={FiGlobe}  label="Drive Mode" value={ir.driveMode} />
                  <Row icon={FiMapPin} label="Venue"      value={ir.venueDetails} full />
                </div>
                {ir.availableFacilities?.length > 0 && (
                  <div className="irs-tag-row" style={{ marginTop: 10 }}>
                    {ir.availableFacilities.map(fid => (
                      <span key={fid} className="irs-tag irs-tag-green">
                        <FiHome size={11} /> {FACILITY_LABELS[fid] || fid}
                      </span>
                    ))}
                  </div>
                )}
              </Section>

              {/* Available Time Slots */}
              {ir.availableTimeSlots?.length > 0 && (
                <Section icon={FiClock} title="Available Time Slots" color="#7c3aed">
                  <div className="irs-tag-row">
                    {ir.availableTimeSlots.map(s => (
                      <span key={s} className="irs-tag irs-tag-purple">
                        <FiClock size={11} /> {s}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Courses for Recruitment */}
              {ir.coursesForRecruitment?.length > 0 && (
                <Section icon={FiBook} title="Courses for Recruitment" color="#2563eb">
                  <div className="irs-tag-row">
                    {ir.coursesForRecruitment.map((c, i) => (
                      <span key={c.id || i} className="irs-tag irs-tag-blue">
                        <FiBook size={11} /> {c.name || c}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {ir.respondedAt && (
                <p className="irs-responded-at">
                  <FiCheckCircle size={12} /> Responded on {formatTs(ir.respondedAt)}
                </p>
              )}
            </>
          ) : invite.status === 'declined' ? (
            <div className="irs-no-response irs-declined-note">
              <FiXCircle size={28} />
              <p>The institute declined this campus drive invitation.</p>
            </div>
          ) : (
            <div className="irs-no-response">
              <FiAlertCircle size={28} />
              <p>Awaiting response from the institute.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="irs-modal-footer">
          {invite.status === 'accepted' && (
            <div className="irs-footer-confirmed">
              <FiCheckCircle size={15} /> Campus Drive Confirmed
            </div>
          )}
          {invite.status === 'declined' && (
            <div className="irs-footer-declined">
              <FiXCircle size={15} /> Invite Declined
            </div>
          )}
          <button className="irs-footer-close" onClick={onClose}>
            <FiX size={14} /> Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ── Response Card ────────────────────────────────────────────── */
const ResponseCard = ({ invite }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const cfg        = STATUS_CFG[invite.status] || STATUS_CFG.pending;
  const StatusIcon = cfg.icon;
  const ir         = invite.instituteResponse || {};
  const hasResponse = invite.status === 'accepted' && ir.tpoName;

  return (
    <>
      <div className={`irs-card irs-card-${invite.status}`}>
        {/* Top accent bar via CSS class */}

        {/* Card header */}
        <div className="irs-card-header">
          <div className="irs-card-seal"><FiHome size={18} /></div>
          <div className="irs-card-title-block">
            <p className="irs-card-from-label">Campus Drive Invite to</p>
            <h3 className="irs-card-institute">{invite.instituteName}</h3>
          </div>
          <div
            className="irs-card-status"
            style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
          >
            <StatusIcon size={12} /> {cfg.label}
          </div>
        </div>

        {/* Meta row */}
        <div className="irs-card-meta">
          <span><FiCalendar size={11} /> Sent {formatTs(invite.createdAt)}</span>
          {invite.preferredDate && (
            <span><FiCalendar size={11} /> Drive: {formatDate(invite.preferredDate)}</span>
          )}
          {invite.preferredTimeSlot && (
            <span><FiClock size={11} /> {invite.preferredTimeSlot}</span>
          )}
        </div>

        {/* Hiring summary */}
        <div className="irs-card-hiring">
          {invite.jobRoles && (
            <span className="irs-card-chip irs-chip-role">
              <FiBriefcase size={11} /> {invite.jobRoles}
            </span>
          )}
          {invite.numberOfVacancies && (
            <span className="irs-card-chip irs-chip-count">
              <FiUsers size={11} /> {invite.numberOfVacancies} positions
            </span>
          )}
        </div>

        {/* Course chips */}
        {invite.selectedCourses?.length > 0 && (
          <div className="irs-card-courses">
            {invite.selectedCourses.slice(0, 2).map(c => (
              <span key={c.id} className="irs-card-course-chip">
                <FiBook size={10} /> {c.name}
              </span>
            ))}
            {invite.selectedCourses.length > 2 && (
              <span className="irs-card-course-chip irs-chip-more">
                +{invite.selectedCourses.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Response preview (only when accepted) */}
        {hasResponse && (
          <div className="irs-card-response-preview">
            <FiCheckCircle size={12} color="#059669" />
            <span>
              <strong>{ir.tpoName}</strong> · {ir.contactNumber}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="irs-card-footer">
          <button className="irs-view-btn" onClick={() => setModalOpen(true)}>
            View Details <FiArrowRight size={12} />
          </button>
          {invite.status === 'accepted' && (
            <span className="irs-card-ribbon">Confirmed</span>
          )}
        </div>
      </div>

      {modalOpen && (
        <ResponseDetailModal
          invite={invite}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};

/* ── Main Section ─────────────────────────────────────────────── */
const InstituteResponseSection = () => {
  const [invites, setInvites]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all'); // all | pending | accepted | declined

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiService.getRecruiterSentInvites();
      if (res.success) {
        // Sort newest first
        const sorted = (res.data || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setInvites(sorted);
      }
    } catch (err) {
      console.error('Failed to load sent invites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? invites : invites.filter(i => i.status === filter);

  const counts = {
    all:      invites.length,
    pending:  invites.filter(i => i.status === 'pending').length,
    accepted: invites.filter(i => i.status === 'accepted').length,
    declined: invites.filter(i => i.status === 'declined').length,
  };

  return (
    <div className="irs-container">
      {/* Page header */}
      <div className="irs-page-header">
        <div>
          <h1 className="irs-page-title">Institute Responses</h1>
          <p className="irs-page-subtitle">
            Responses from institutes to campus drive invites you sent
          </p>
        </div>
        <button className="irs-refresh-btn" onClick={load} disabled={loading}>
          <FiRefreshCw size={15} className={loading ? 'irs-spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="irs-stats-bar">
        {[
          { key: 'all',      label: 'All',      color: '#475569' },
          { key: 'pending',  label: 'Pending',  color: '#d97706' },
          { key: 'accepted', label: 'Accepted', color: '#059669' },
          { key: 'declined', label: 'Declined', color: '#dc2626' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            className={`irs-stat-btn${filter === key ? ' active' : ''}`}
            style={filter === key ? { borderColor: color, color } : {}}
            onClick={() => setFilter(key)}
          >
            <span className="irs-stat-count" style={filter === key ? { color } : {}}>
              {counts[key]}
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="irs-loading">
          <div className="irs-spinner" />
          <p>Loading institute responses…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="irs-empty">
          <FiInbox size={52} />
          <h3>{filter === 'all' ? 'No Campus Invites Sent Yet' : `No ${filter} invites`}</h3>
          <p>
            {filter === 'all'
              ? 'Invites you send to institutes will appear here along with their responses.'
              : `No invites with status "${filter}" found.`}
          </p>
        </div>
      ) : (
        <div className="irs-grid">
          {filtered.map(invite => (
            <ResponseCard key={invite.inviteId} invite={invite} />
          ))}
        </div>
      )}
    </div>
  );
};

export default InstituteResponseSection;
