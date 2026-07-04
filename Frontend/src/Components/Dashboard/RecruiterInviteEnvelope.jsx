import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FiBriefcase, FiCalendar, FiClock, FiBook, FiUsers, FiCheck,
  FiX, FiUser, FiPhone, FiMail, FiMapPin, FiFileText, FiHome,
  FiArrowRight, FiGlobe, FiCheckCircle, FiXCircle, FiAward,
  FiInfo, FiMonitor, FiWifi, FiLayers, FiSave, FiEdit
} from 'react-icons/fi';
import apiService from '../../services/api';
import './RecruiterInviteEnvelope.css';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const formatTimestamp = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const STATUS_CONFIG = {
  pending:   { color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: FiClock, label: 'Pending' },
  accepted:  { color: '#059669', bg: '#d1fae5', border: '#a7f3d0', icon: FiCheckCircle, label: 'Accepted' },
  declined:  { color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: FiXCircle, label: 'Declined' },
};

const FACILITIES = [
  { id: 'seminar_hall', label: 'Seminar Hall' },
  { id: 'interview_room', label: 'Interview Room' },
  { id: 'computer_lab', label: 'Computer Lab' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'projector', label: 'Projector' },
  { id: 'gd_room', label: 'GD Room' }
];

const TIME_SLOTS = ['10:00 AM – 1:00 PM', '2:00 PM – 5:00 PM', 'Full Day', 'Custom Time'];

/* Detail Modal */
const InviteDetailModal = ({ invite, onClose, onRefresh }) => {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    tpoName: '',
    contactNumber: '',
    officialEmail: '',
    coursesForRecruitment: [],
    totalEligibleStudents: '',
    studentQualificationCriteria: '',
    venueDetails: '',
    availableFacilities: [],
    availableTimeSlots: [],
    driveMode: 'Offline'
  });

  const overlayRef = useRef(null);
  const bodyRef = useRef(null);
  const responseFormRef = useRef(null);

  const status = invite.status || 'pending';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  // Lock body scroll and stop Lenis
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    // Stop Lenis smooth scroll if it exists
    if (window.lenis) {
      window.lenis.stop();
    }

    // Close on Escape
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);

    // Prevent wheel events on overlay
    const preventScroll = (e) => {
      if (e.target === overlayRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', handleEsc);
      
      // Restart Lenis when modal closes
      if (window.lenis) {
        window.lenis.start();
      }

      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  // Handle modal body scroll independently
  useEffect(() => {
    const modalBody = bodyRef.current;
    if (!modalBody) return;

    const handleWheel = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = modalBody;
      const isAtTop = scrollTop === 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      // Prevent scroll chaining
      if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
        e.preventDefault();
      }
      e.stopPropagation();
    };

    modalBody.addEventListener('wheel', handleWheel, { passive: false });
    return () => modalBody.removeEventListener('wheel', handleWheel);
  }, []);

  // Auto-scroll to response form when Accept Invite is clicked
  useEffect(() => {
    if (showResponseForm && responseFormRef.current && bodyRef.current) {
      setTimeout(() => {
        responseFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [showResponseForm]);

  const handleDecline = async () => {
    if (!window.confirm('Are you sure you want to decline this invite?')) return;
    setLoading(true);
    try {
      const res = await apiService.updateRecruiterInviteStatus(invite.inviteId, 'declined');
      if (res.success) {
        alert('Invite declined');
        onRefresh && onRefresh();
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Failed to decline invite');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!form.tpoName || !form.contactNumber || !form.officialEmail) {
      setError('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.respondToRecruiterInvite(invite.inviteId, form);
      if (res.success) {
        alert('Campus drive confirmed!');
        onRefresh && onRefresh();
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Failed to accept invite');
    } finally {
      setLoading(false);
    }
  };

  const toggleFacility = (id) => {
    setForm(prev => ({
      ...prev,
      availableFacilities: prev.availableFacilities.includes(id)
        ? prev.availableFacilities.filter(f => f !== id)
        : [...prev.availableFacilities, id]
    }));
  };

  const toggleTimeSlot = (slot) => {
    setForm(prev => ({
      ...prev,
      availableTimeSlots: prev.availableTimeSlots.includes(slot)
        ? prev.availableTimeSlots.filter(s => s !== slot)
        : [...prev.availableTimeSlots, slot]
    }));
  };

  return createPortal(
    <div className="recruiter-inv-modal-overlay" ref={overlayRef} onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className="recruiter-inv-modal">
        {/* Header */}
        <div className="recruiter-inv-modal-header">
          <div className="recruiter-inv-modal-glow" />
          <div className="recruiter-inv-modal-inner">
            <div className="recruiter-inv-modal-seal">
              <FiBriefcase size={22} />
            </div>
            <div className="recruiter-inv-modal-text">
              <p className="recruiter-inv-modal-label">Campus Drive Invitation from</p>
              <h2 className="recruiter-inv-modal-name">{invite.recruiterName}</h2>
              <p className="recruiter-inv-modal-meta">
                <FiCalendar size={11} /> Received {formatTimestamp(invite.createdAt)}
                {invite.recruiterEmail && <><FiMail size={11} style={{ marginLeft: 8 }} /> {invite.recruiterEmail}</>}
              </p>
            </div>
            <div className="recruiter-inv-modal-status" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
              <StatusIcon size={13} /> {cfg.label}
            </div>
          </div>
          <button className="recruiter-inv-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        {/* Body */}
        <div className="recruiter-inv-modal-body" ref={bodyRef}>
          {/* Hiring Details */}
          <div className="recruiter-inv-section">
            <div className="recruiter-inv-section-title"><FiBriefcase size={14} /> Hiring Details</div>
            <div className="recruiter-inv-info-grid">
              <div className="recruiter-inv-info-row">
                <FiBriefcase size={13} />
                <div>
                  <span>Job Roles</span>
                  <strong>{invite.jobRoles}</strong>
                </div>
              </div>
              <div className="recruiter-inv-info-row">
                <FiUsers size={13} />
                <div>
                  <span>Vacancies</span>
                  <strong>{invite.numberOfVacancies}</strong>
                </div>
              </div>
              {invite.salaryStipend && (
                <div className="recruiter-inv-info-row">
                  <FiInfo size={13} />
                  <div>
                    <span>Salary/Stipend</span>
                    <strong>{invite.salaryStipend}</strong>
                  </div>
                </div>
              )}
              {invite.eligibilityCriteria && (
                <div className="recruiter-inv-info-row full">
                  <FiInfo size={13} />
                  <div>
                    <span>Eligibility</span>
                    <strong>{invite.eligibilityCriteria}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Courses */}
          {invite.selectedCourses?.length > 0 && (
            <div className="recruiter-inv-section">
              <div className="recruiter-inv-section-title"><FiBook size={14} /> Selected Courses</div>
              <div className="recruiter-inv-tags">
                {invite.selectedCourses.map(c => (
                  <span key={c.id} className="recruiter-inv-tag blue">
                    <FiBook size={11} /> {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Schedule */}
          <div className="recruiter-inv-section">
            <div className="recruiter-inv-section-title"><FiCalendar size={14} /> Preferred Schedule</div>
            <div className="recruiter-inv-info-grid">
              <div className="recruiter-inv-info-row">
                <FiCalendar size={13} />
                <div>
                  <span>Date</span>
                  <strong>{formatDate(invite.preferredDate)}</strong>
                </div>
              </div>
              <div className="recruiter-inv-info-row">
                <FiClock size={13} />
                <div>
                  <span>Time</span>
                  <strong>{invite.preferredTimeSlot}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Selection Process */}
          {invite.selectionProcess?.length > 0 && (
            <div className="recruiter-inv-section">
              <div className="recruiter-inv-section-title"><FiAward size={14} /> Selection Process</div>
              <div className="recruiter-inv-tags">
                {invite.selectionProcess.map(s => (
                  <span key={s} className="recruiter-inv-tag purple">
                    <FiAward size={11} /> {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {(invite.systemRequirement || invite.internetRequirement || invite.setupRequirement || invite.otherInstructions) && (
            <div className="recruiter-inv-section">
              <div className="recruiter-inv-section-title"><FiFileText size={14} /> Additional Requirements</div>
              <div className="recruiter-inv-requirements">
                {invite.systemRequirement && <div><FiMonitor size={12} /> <strong>System:</strong> {invite.systemRequirement}</div>}
                {invite.internetRequirement && <div><FiWifi size={12} /> <strong>Internet:</strong> {invite.internetRequirement}</div>}
                {invite.setupRequirement && <div><FiLayers size={12} /> <strong>Setup:</strong> {invite.setupRequirement}</div>}
                {invite.otherInstructions && <div><FiFileText size={12} /> <strong>Other:</strong> {invite.otherInstructions}</div>}
              </div>
            </div>
          )}

          {/* Response Form */}
          {showResponseForm && status === 'pending' && (
            <div className="recruiter-inv-section" ref={responseFormRef}>
              <div className="recruiter-inv-section-title"><FiEdit size={14} /> Your Response</div>
              <div className="recruiter-inv-form">
                <div className="recruiter-inv-form-grid">
                  <div className="recruiter-inv-field">
                    <label>TPO Name <span className="recruiter-inv-req">*</span></label>
                    <input value={form.tpoName} onChange={(e) => setForm({...form, tpoName: e.target.value})} />
                  </div>
                  <div className="recruiter-inv-field">
                    <label>Contact Number <span className="recruiter-inv-req">*</span></label>
                    <input value={form.contactNumber} onChange={(e) => setForm({...form, contactNumber: e.target.value})} />
                  </div>
                  <div className="recruiter-inv-field">
                    <label>Official Email <span className="recruiter-inv-req">*</span></label>
                    <input type="email" value={form.officialEmail} onChange={(e) => setForm({...form, officialEmail: e.target.value})} />
                  </div>
                  <div className="recruiter-inv-field">
                    <label>Total Eligible Students</label>
                    <input type="number" value={form.totalEligibleStudents} onChange={(e) => setForm({...form, totalEligibleStudents: e.target.value})} />
                  </div>
                  <div className="recruiter-inv-field full">
                    <label>Venue Details</label>
                    <input value={form.venueDetails} onChange={(e) => setForm({...form, venueDetails: e.target.value})} />
                  </div>
                  <div className="recruiter-inv-field full">
                    <label>Available Facilities</label>
                    <div className="recruiter-inv-checkbox-grid">
                      {FACILITIES.map(f => (
                        <label key={f.id} className="recruiter-inv-checkbox-item">
                          <input type="checkbox" checked={form.availableFacilities.includes(f.id)} onChange={() => toggleFacility(f.id)} />
                          {f.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="recruiter-inv-field full">
                    <label>Available Time Slots</label>
                    <div className="recruiter-inv-checkbox-grid">
                      {TIME_SLOTS.map(slot => (
                        <label key={slot} className="recruiter-inv-checkbox-item">
                          <input type="checkbox" checked={form.availableTimeSlots.includes(slot)} onChange={() => toggleTimeSlot(slot)} />
                          {slot}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="recruiter-inv-field">
                    <label>Drive Mode</label>
                    <select value={form.driveMode} onChange={(e) => setForm({...form, driveMode: e.target.value})}>
                      <option>Offline</option>
                      <option>Virtual</option>
                      <option>Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>
              {error && <div className="recruiter-inv-error"><FiXCircle size={14} /> {error}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="recruiter-inv-modal-footer">
          {status === 'pending' && !showResponseForm && (
            <>
              <button className="recruiter-inv-btn recruiter-inv-btn-decline" onClick={handleDecline} disabled={loading}>
                <FiX /> Decline
              </button>
              <button className="recruiter-inv-btn recruiter-inv-btn-accept" onClick={() => setShowResponseForm(true)}>
                <FiCheck /> Accept Invite
              </button>
            </>
          )}
          {showResponseForm && (
            <button className="recruiter-inv-btn recruiter-inv-btn-confirm" onClick={handleAccept} disabled={loading}>
              {loading ? 'Processing...' : <><FiCheckCircle size={14} /> Confirm Campus Drive</>}
            </button>
          )}
          {status === 'accepted' && (
            <div className="recruiter-inv-confirmed">
              <FiCheckCircle size={15} /> Campus Drive Confirmed
            </div>
          )}
          {status === 'declined' && (
            <div className="recruiter-inv-declined">
              <FiXCircle size={15} /> Invitation Declined
            </div>
          )}
          <button className="recruiter-inv-btn recruiter-inv-btn-close" onClick={onClose}>
            <FiX size={14} /> Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* Envelope Card */
const RecruiterInviteEnvelope = ({ invite, onRefresh }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const status = invite.status || 'pending';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  return (
    <>
      <div className="recruiter-inv-card" data-status={status} onClick={() => setModalOpen(true)}>
        {/* Flap */}
        <div className="recruiter-inv-flap" />

        {/* Wax seal */}
        <div className="recruiter-inv-seal">
          <FiBriefcase size={18} />
        </div>

        {/* Body */}
        <div className="recruiter-inv-body">
          <div className="recruiter-inv-from-row">
            <div className="recruiter-inv-from-icon">
              <FiMail size={14} />
            </div>
            <div>
              <p className="recruiter-inv-from-label">Campus Drive Invitation from</p>
              <h3 className="recruiter-inv-recruiter-name">{invite.recruiterName}</h3>
            </div>
          </div>

          <div className="recruiter-inv-meta">
            <span>
              <FiCalendar size={11} /> {formatTimestamp(invite.createdAt)}
            </span>
            {invite.numberOfVacancies && (
              <span>
                <FiUsers size={11} /> {invite.numberOfVacancies} positions
              </span>
            )}
          </div>

          {invite.selectedCourses?.length > 0 && (
            <div className="recruiter-inv-courses">
              {invite.selectedCourses.slice(0, 2).map(c => (
                <span key={c.id} className="recruiter-inv-course-chip">
                  <FiBook size={10} /> {c.name}
                </span>
              ))}
              {invite.selectedCourses.length > 2 && (
                <span className="recruiter-inv-course-chip recruiter-inv-course-more">
                  +{invite.selectedCourses.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="recruiter-inv-footer">
          <div className="recruiter-inv-status" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
            <StatusIcon size={12} /> {cfg.label}
          </div>
          <div className="recruiter-inv-cta">
            Open <FiArrowRight size={12} />
          </div>
        </div>

        {/* Confirmed ribbon */}
        {status === 'accepted' && <div className="recruiter-inv-ribbon">Confirmed</div>}
      </div>

      {modalOpen && (
        <InviteDetailModal
          invite={invite}
          onClose={() => setModalOpen(false)}
          onRefresh={() => { setModalOpen(false); onRefresh && onRefresh(); }}
        />
      )}
    </>
  );
};

export default RecruiterInviteEnvelope;
