import React, { useState, useEffect, useRef } from 'react';
import {
  FiArrowLeft, FiArrowRight, FiSend, FiCalendar, FiUsers, FiMapPin,
  FiPhone, FiUser, FiFileText, FiBriefcase, FiCheckCircle, FiMail,
  FiBook, FiMonitor, FiWifi, FiCpu, FiCheck, FiX, FiLock, FiAlertCircle
} from 'react-icons/fi';
import apiService from '../../services/api';
import useCampusSlotAvailability from '../../hooks/useCampusSlotAvailability';
import './CampusInviteModal.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const toKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
};

const formatDateDisplay = (key) => {
  const d = new Date(key + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const FACILITIES_OPTIONS = [
  { id: 'seminar_hall', label: 'Seminar Hall', icon: '🏛️' },
  { id: 'interview_room', label: 'Interview Room', icon: '🚪' },
  { id: 'computer_lab', label: 'Computer Lab', icon: '💻' },
  { id: 'wifi', label: 'Wi-Fi', icon: '📶' },
  { id: 'projector', label: 'Projector', icon: '📽️' },
  { id: 'gd_room', label: 'GD Room', icon: '👥' },
  { id: 'other', label: 'Other Facilities', icon: '🏢' },
];

const TIME_SLOT_OPTIONS = [
  '10:00 AM – 1:00 PM',
  '2:00 PM – 5:00 PM',
  'Full Day',
  'Custom Slot',
];

const DRIVE_MODES = ['Offline', 'Virtual', 'Hybrid'];

const STEPS = [
  { label: 'Coordinator', icon: FiUser },
  { label: 'Courses & Students', icon: FiBook },
  { label: 'Venue & Schedule', icon: FiMapPin },
  { label: 'Review & Send', icon: FiSend },
];

const CampusInviteModal = ({ recruiter, onClose, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [plannerDates, setPlannerDates] = useState([]);
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [loadingDates, setLoadingDates] = useState(true);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bodyRef = useRef(null);

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

  // Block wheel on overlay backdrop
  const overlayRef = useRef(null);
  useEffect(() => {
    const overlay = overlayRef.current;
    const blockScroll = (e) => { if (e.target === overlay) e.preventDefault(); };
    overlay?.addEventListener('wheel', blockScroll, { passive: false });
    return () => overlay?.removeEventListener('wheel', blockScroll);
  }, []);

  // Get the logged-in institute's own ID from localStorage (stored as 'currentUser')
  const myInstituteId = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return u.userId || u.id || null;
    } catch { return null; }
  })();

  // Slot availability — fetch once on mount, refresh when dates/slots change
  const {
    getSlotStatus: getMySlotStatus,
    isDateFullyBooked: isMyDateFullyBooked,
    loading: availLoading,
    refresh: refreshAvailability
  } = useCampusSlotAvailability(myInstituteId);

  const [form, setForm] = useState({
    // Step 0 — Coordinator
    tpoName: '',
    contactNumber: '',
    officialEmail: '',

    // Step 1 — Courses & Students
    coursesForRecruitment: [],   // array of { id, name }
    totalEligibleStudents: '',
    studentQualificationCriteria: '',

    // Step 2 — Venue & Schedule
    venueDetails: '',
    availableFacilities: [],
    availableTimeSlots: [],
    driveMode: 'Offline',
  });

  // Load planner dates and On-Campus courses on mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingDates(true);
      setLoadingCourses(true);
      try {
        const [plannerRes, coursesRes] = await Promise.all([
          apiService.getCampusPlanner(),
          apiService.getInstituteCampusCourses()
        ]);

        if (plannerRes.success && plannerRes.data?.selectedDates) {
          const today = toKey(new Date());
          const future = plannerRes.data.selectedDates.filter(d => d >= today).sort();
          setPlannerDates(future);
        }

        if (coursesRes.success && coursesRes.data) {
          setAvailableCourses(coursesRes.data);
        }
      } catch (e) {
        console.error('Load data error:', e);
      } finally {
        setLoadingDates(false);
        setLoadingCourses(false);
      }
    };
    loadData();
  }, []);

  const toggleDate = (key) => {
    setSelectedDates(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  };

  const toggleCourse = (course) => {
    setForm(prev => {
      const exists = prev.coursesForRecruitment.find(c => c.id === course.id);
      return {
        ...prev,
        coursesForRecruitment: exists
          ? prev.coursesForRecruitment.filter(c => c.id !== course.id)
          : [...prev.coursesForRecruitment, { id: course.id, name: course.name }]
      };
    });
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = () => {
    setError('');
    if (step === 0) {
      if (!form.tpoName.trim()) { setError('TPO / Placement Coordinator Name is required.'); return false; }
      if (!form.contactNumber.trim()) { setError('Contact Number is required.'); return false; }
      if (!/^\+?[\d\s\-()]{7,15}$/.test(form.contactNumber.trim())) {
        setError('Please enter a valid contact number.'); return false;
      }
      if (!form.officialEmail.trim()) { setError('Official Email ID is required.'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.officialEmail.trim())) {
        setError('Please enter a valid email address.'); return false;
      }
    }
    if (step === 1) {
      if (form.coursesForRecruitment.length === 0) {
        setError('Please select at least one course for recruitment.'); return false;
      }
      if (!form.totalEligibleStudents) { setError('Total eligible students is required.'); return false; }
      if (isNaN(Number(form.totalEligibleStudents)) || Number(form.totalEligibleStudents) < 1) {
        setError('Please enter a valid number of eligible students.'); return false;
      }
    }
    if (step === 2) {
      if (selectedDates.size === 0) { setError('Please select at least one campus drive date.'); return false; }
      if (!form.venueDetails.trim() && form.driveMode !== 'Virtual') {
        setError('Venue details are required for Offline/Hybrid drives.'); return false;
      }
      if (form.availableTimeSlots.length === 0) {
        setError('Please select at least one available time slot.'); return false;
      }
    }
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
  const prevStep = () => { setError(''); setStep(s => s - 1); };

  // Refresh availability whenever the user reaches Step 2 (venue/schedule)
  useEffect(() => {
    if (step === 2 && myInstituteId) refreshAvailability();
  }, [step, myInstituteId]);

  const handleSend = async () => {
    setSending(true);
    setError('');
    try {
      const res = await apiService.sendCampusRequest(
        recruiter.id,
        Array.from(selectedDates),
        form
      );
      if (res.success) {
        onSuccess && onSuccess();
      } else {
        setError(res.message || 'Failed to send invite. Please try again.');
      }
    } catch (e) {
      setError('An error occurred. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="cim-overlay" ref={overlayRef} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cim-modal cim-modal-v2">

        {/* Header */}
        <div className="cim-header cim-header-v2">
          <div className="cim-header-info">
            <div className="cim-company-avatar">
              {(recruiter.profileImage || recruiter.logo || recruiter.profilePhoto)
                ? <img src={recruiter.profileImage || recruiter.logo || recruiter.profilePhoto} alt={recruiter.companyName || recruiter.name} />
                : <span>{(recruiter.companyName || recruiter.name || recruiter.recruiterName || 'R')[0].toUpperCase()}</span>
              }
            </div>
            <div>
              <p className="cim-header-label">Campus Drive Invitation to</p>
              <h2 className="cim-title">{recruiter.companyName || recruiter.name || recruiter.recruiterName || 'Recruiter'}</h2>
            </div>
          </div>
          <button className="cim-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Step indicator */}
        <div className="cim-steps cim-steps-v2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`cim-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                <div className="cim-step-circle">
                  {i < step ? <FiCheck size={14} /> : <Icon size={14} />}
                </div>
                <span className="cim-step-label">{s.label}</span>
                {i < STEPS.length - 1 && <div className="cim-step-line" />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="cim-body cim-body-v2" ref={bodyRef}>

          {/* ── STEP 0: Coordinator Info ── */}
          {step === 0 && (
            <div className="cim-step-content">
              <div className="cim-step-heading">
                <div className="cim-step-icon-wrap"><FiUser /></div>
                <div>
                  <h3 className="cim-step-title">TPO / Placement Coordinator Details</h3>
                  <p className="cim-step-desc">Provide the contact details of the placement coordinator for this drive.</p>
                </div>
              </div>
              <div className="cim-form-grid">
                <div className="cim-field cim-field-full">
                  <label>TPO / Placement Coordinator Name <span className="cim-req">*</span></label>
                  <div className="cim-input-wrap">
                    <FiUser className="cim-input-icon" />
                    <input
                      name="tpoName"
                      value={form.tpoName}
                      onChange={handleChange}
                      placeholder="Full name of the placement coordinator"
                    />
                  </div>
                </div>
                <div className="cim-field">
                  <label>Contact Number <span className="cim-req">*</span></label>
                  <div className="cim-input-wrap">
                    <FiPhone className="cim-input-icon" />
                    <input
                      name="contactNumber"
                      value={form.contactNumber}
                      onChange={handleChange}
                      placeholder="+91 XXXXX XXXXX"
                      type="tel"
                    />
                  </div>
                  <span className="cim-field-hint">Include country code (e.g. +91)</span>
                </div>
                <div className="cim-field">
                  <label>Official Email ID <span className="cim-req">*</span></label>
                  <div className="cim-input-wrap">
                    <FiMail className="cim-input-icon" />
                    <input
                      name="officialEmail"
                      value={form.officialEmail}
                      onChange={handleChange}
                      placeholder="placement@institute.edu"
                      type="email"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1: Courses & Students ── */}
          {step === 1 && (
            <div className="cim-step-content">
              <div className="cim-step-heading">
                <div className="cim-step-icon-wrap"><FiBook /></div>
                <div>
                  <h3 className="cim-step-title">Courses & Student Details</h3>
                  <p className="cim-step-desc">Select the On-Campus courses available for recruitment and provide student eligibility details.</p>
                </div>
              </div>

              {/* Courses multi-select */}
              <div className="cim-field cim-field-full">
                <label>Course(s) Available for Recruitment <span className="cim-req">*</span></label>
                <p className="cim-field-hint">Only your On-Campus courses are shown below.</p>
                {loadingCourses ? (
                  <div className="cim-loading"><div className="cim-spinner" /><p>Loading your courses...</p></div>
                ) : availableCourses.length === 0 ? (
                  <div className="cim-no-dates">
                    <div className="cim-no-dates-icon">📚</div>
                    <h4>No On-Campus Courses Found</h4>
                    <p>Go to <strong>My Courses → Course Management</strong> and add On-Campus courses first.</p>
                  </div>
                ) : (
                  <div className="cim-courses-grid">
                    {availableCourses.map(course => {
                      const selected = form.coursesForRecruitment.find(c => c.id === course.id);
                      return (
                        <div
                          key={course.id}
                          className={`cim-course-chip ${selected ? 'selected' : ''}`}
                          onClick={() => toggleCourse(course)}
                          role="checkbox"
                          aria-checked={!!selected}
                          tabIndex={0}
                          onKeyDown={e => e.key === 'Enter' && toggleCourse(course)}
                        >
                          <span className="cim-course-check">{selected ? <FiCheck /> : <FiBook />}</span>
                          <span className="cim-course-name">{course.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {form.coursesForRecruitment.length > 0 && (
                  <div className="cim-selected-summary">
                    <strong>{form.coursesForRecruitment.length} course{form.coursesForRecruitment.length > 1 ? 's' : ''} selected:</strong>{' '}
                    {form.coursesForRecruitment.map(c => c.name).join(', ')}
                  </div>
                )}
              </div>

              <div className="cim-form-grid">
                <div className="cim-field">
                  <label>Total No. of Eligible Students <span className="cim-req">*</span></label>
                  <div className="cim-input-wrap">
                    <FiUsers className="cim-input-icon" />
                    <input
                      type="number"
                      name="totalEligibleStudents"
                      value={form.totalEligibleStudents}
                      onChange={handleChange}
                      placeholder="e.g. 120"
                      min="1"
                    />
                  </div>
                </div>
                <div className="cim-field cim-field-full">
                  <label>Student Qualification Criteria</label>
                  <textarea
                    name="studentQualificationCriteria"
                    value={form.studentQualificationCriteria}
                    onChange={handleChange}
                    placeholder="e.g. Minimum 60% aggregate, No active backlogs, B.Tech / BCA / MCA, Skills: Java, Python..."
                    rows={3}
                  />
                  <span className="cim-field-hint">Minimum percentage, backlog criteria, degree requirements, skills required, etc.</span>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Venue & Schedule ── */}
          {step === 2 && (
            <div className="cim-step-content">
              <div className="cim-step-heading">
                <div className="cim-step-icon-wrap"><FiMapPin /></div>
                <div>
                  <h3 className="cim-step-title">Venue, Schedule & Drive Mode</h3>
                  <p className="cim-step-desc">Specify the venue, available facilities, time slots, and how the drive will be conducted.</p>
                </div>
              </div>

              {/* Drive Mode */}
              <div className="cim-field cim-field-full">
                <label>Drive Mode <span className="cim-req">*</span></label>
                <div className="cim-mode-toggle cim-mode-toggle-v2">
                  {DRIVE_MODES.map(mode => (
                    <button
                      key={mode}
                      type="button"
                      className={`cim-mode-btn ${form.driveMode === mode ? 'active' : ''}`}
                      onClick={() => setForm(p => ({ ...p, driveMode: mode }))}
                    >
                      {mode === 'Offline' ? '🏫' : mode === 'Virtual' ? '💻' : '🔀'} {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Venue Details */}
              {form.driveMode !== 'Virtual' && (
                <div className="cim-field cim-field-full">
                  <label>Venue Details {form.driveMode !== 'Virtual' && <span className="cim-req">*</span>}</label>
                  <div className="cim-input-wrap">
                    <FiMapPin className="cim-input-icon" />
                    <input
                      name="venueDetails"
                      value={form.venueDetails}
                      onChange={handleChange}
                      placeholder="Full address / building / hall name of the campus venue"
                    />
                  </div>
                </div>
              )}

              {/* Available Facilities */}
              <div className="cim-field cim-field-full">
                <label>Available Facilities</label>
                <div className="cim-facilities-grid">
                  {FACILITIES_OPTIONS.map(f => {
                    const checked = form.availableFacilities.includes(f.id);
                    return (
                      <div
                        key={f.id}
                        className={`cim-facility-chip ${checked ? 'selected' : ''}`}
                        onClick={() => toggleFacility(f.id)}
                        role="checkbox"
                        aria-checked={checked}
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && toggleFacility(f.id)}
                      >
                        <span className="cim-facility-icon">{f.icon}</span>
                        <span>{f.label}</span>
                        {checked && <FiCheck className="cim-facility-check" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Available Time Slots */}
              <div className="cim-field cim-field-full">
                <label>Available Time Slots <span className="cim-req">*</span></label>
                <div className="cim-timeslots-grid">
                  {TIME_SLOT_OPTIONS.map(slot => {
                    const checked = form.availableTimeSlots.includes(slot);
                    // Check if this slot is booked on ANY of the selected dates
                    const bookedOnAnyDate = Array.from(selectedDates).some(
                      date => getMySlotStatus(date, slot) === 'Confirmed'
                    );
                    const tentativeOnAnyDate = !bookedOnAnyDate && Array.from(selectedDates).some(
                      date => getMySlotStatus(date, slot) === 'Tentative'
                    );
                    return (
                      <div
                        key={slot}
                        className={`cim-timeslot-chip ${checked ? 'selected' : ''} ${bookedOnAnyDate ? 'cim-timeslot-booked' : ''} ${tentativeOnAnyDate ? 'cim-timeslot-tentative' : ''}`}
                        onClick={() => !bookedOnAnyDate && toggleTimeSlot(slot)}
                        role="checkbox"
                        aria-checked={checked}
                        aria-disabled={bookedOnAnyDate}
                        tabIndex={bookedOnAnyDate ? -1 : 0}
                        onKeyDown={e => e.key === 'Enter' && !bookedOnAnyDate && toggleTimeSlot(slot)}
                        title={bookedOnAnyDate ? 'This slot is already booked on one of your selected dates' : ''}
                      >
                        {bookedOnAnyDate
                          ? <FiLock className="cim-timeslot-icon" />
                          : tentativeOnAnyDate
                            ? <FiAlertCircle className="cim-timeslot-icon" />
                            : <FiCalendar className="cim-timeslot-icon" />
                        }
                        <span>{slot}</span>
                        {bookedOnAnyDate    && <span className="cim-slot-status-badge cim-slot-booked">🔴 Booked</span>}
                        {tentativeOnAnyDate && <span className="cim-slot-status-badge cim-slot-tentative">🟡 Tentative</span>}
                        {!bookedOnAnyDate && !tentativeOnAnyDate && checked && <FiCheck className="cim-timeslot-check" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Date Selection */}
              <div className="cim-field cim-field-full">
                <label>Select Campus Drive Date(s) <span className="cim-req">*</span></label>
                <p className="cim-field-hint">Dates from your Placement Planner. Add more dates in Campus Drive → Placement Planner.</p>
                {loadingDates ? (
                  <div className="cim-loading"><div className="cim-spinner" /><p>Loading planner dates...</p></div>
                ) : plannerDates.length === 0 ? (
                  <div className="cim-no-dates">
                    <div className="cim-no-dates-icon">📅</div>
                    <h4>No Dates in Planner</h4>
                    <p>Go to <strong>Campus Drive → Placement Planner</strong> to add your available dates first.</p>
                  </div>
                ) : (
                  <div className="cim-dates-grid">
                    {plannerDates.map(key => {
                      const d = new Date(key + 'T00:00:00');
                      const isSelected = selectedDates.has(key);
                      // Check if all offered slots on this date are fully booked
                      const fullyBooked = isMyDateFullyBooked(key, form.availableTimeSlots);
                      return (
                        <div
                          key={key}
                          className={`cim-date-card ${isSelected ? 'selected' : ''} ${fullyBooked ? 'cim-date-card-booked' : ''}`}
                          onClick={() => !fullyBooked && toggleDate(key)}
                          role="checkbox"
                          aria-checked={isSelected}
                          aria-disabled={fullyBooked}
                          tabIndex={fullyBooked ? -1 : 0}
                          onKeyDown={e => e.key === 'Enter' && !fullyBooked && toggleDate(key)}
                          title={fullyBooked ? 'All slots on this date are fully booked' : ''}
                        >
                          <div className="cim-date-day">{DAYS_SHORT[d.getDay()]}</div>
                          <div className="cim-date-num">{d.getDate()}</div>
                          <div className="cim-date-month">{MONTHS[d.getMonth()]}</div>
                          <div className="cim-date-year">{d.getFullYear()}</div>
                          {isSelected && !fullyBooked && <div className="cim-date-check"><FiCheck /></div>}
                          {fullyBooked && (
                            <div className="cim-date-booked-badge"><FiLock size={9} /> Full</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedDates.size > 0 && (
                  <div className="cim-selected-summary">
                    <strong>{selectedDates.size} date{selectedDates.size > 1 ? 's' : ''} selected:</strong>{' '}
                    {Array.from(selectedDates).sort().map(k => formatDateDisplay(k)).join(', ')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: Review & Send ── */}
          {step === 3 && (
            <div className="cim-step-content">
              <div className="cim-step-heading">
                <div className="cim-step-icon-wrap"><FiSend /></div>
                <div>
                  <h3 className="cim-step-title">Review Your Campus Invite</h3>
                  <p className="cim-step-desc">Please review all details before sending the invite to <strong>{recruiter.companyName || recruiter.name}</strong>.</p>
                </div>
              </div>

              <div className="cim-review-grid">
                {/* Coordinator */}
                <div className="cim-review-section">
                  <h4><FiUser /> Placement Coordinator</h4>
                  <div className="cim-review-rows">
                    <div className="cim-review-row"><span>Name</span><strong>{form.tpoName}</strong></div>
                    <div className="cim-review-row"><span>Contact</span><strong>{form.contactNumber}</strong></div>
                    <div className="cim-review-row"><span>Email</span><strong>{form.officialEmail}</strong></div>
                  </div>
                </div>

                {/* Courses & Students */}
                <div className="cim-review-section">
                  <h4><FiBook /> Courses & Students</h4>
                  <div className="cim-review-rows">
                    <div className="cim-review-row cim-review-row-wrap">
                      <span>Courses</span>
                      <div className="cim-review-chips">
                        {form.coursesForRecruitment.map(c => (
                          <span key={c.id} className="cim-review-chip">{c.name}</span>
                        ))}
                      </div>
                    </div>
                    <div className="cim-review-row"><span>Eligible Students</span><strong>{form.totalEligibleStudents}</strong></div>
                    {form.studentQualificationCriteria && (
                      <div className="cim-review-row cim-review-row-wrap">
                        <span>Qualification Criteria</span>
                        <strong>{form.studentQualificationCriteria}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Venue & Schedule */}
                <div className="cim-review-section">
                  <h4><FiMapPin /> Venue & Schedule</h4>
                  <div className="cim-review-rows">
                    <div className="cim-review-row"><span>Drive Mode</span>
                      <strong className={`cim-mode-badge cim-mode-${form.driveMode?.toLowerCase()}`}>
                        {form.driveMode === 'Offline' ? '🏫' : form.driveMode === 'Virtual' ? '💻' : '🔀'} {form.driveMode}
                      </strong>
                    </div>
                    {form.venueDetails && <div className="cim-review-row"><span>Venue</span><strong>{form.venueDetails}</strong></div>}
                    {form.availableFacilities.length > 0 && (
                      <div className="cim-review-row cim-review-row-wrap">
                        <span>Facilities</span>
                        <div className="cim-review-chips">
                          {form.availableFacilities.map(fid => {
                            const f = FACILITIES_OPTIONS.find(o => o.id === fid);
                            return f ? <span key={fid} className="cim-review-chip">{f.icon} {f.label}</span> : null;
                          })}
                        </div>
                      </div>
                    )}
                    {form.availableTimeSlots.length > 0 && (
                      <div className="cim-review-row cim-review-row-wrap">
                        <span>Time Slots</span>
                        <div className="cim-review-chips">
                          {form.availableTimeSlots.map(s => (
                            <span key={s} className="cim-review-chip">🕐 {s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Dates */}
                <div className="cim-review-section">
                  <h4><FiCalendar /> Campus Drive Dates</h4>
                  <div className="cim-review-dates">
                    {Array.from(selectedDates).sort().map(k => (
                      <span key={k} className="cim-review-date-chip">{formatDateDisplay(k)}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="cim-error" role="alert">
              <FiX className="cim-error-icon" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="cim-footer cim-footer-v2">
          {step > 0 && (
            <button className="cim-btn-back" onClick={prevStep} disabled={sending}>
              <FiArrowLeft /> Back
            </button>
          )}
          <div className="cim-footer-right">
            <button className="cim-btn-cancel" onClick={onClose} disabled={sending}>Cancel</button>
            {step < STEPS.length - 1 ? (
              <button className="cim-btn-next" onClick={nextStep}>
                Next <FiArrowRight />
              </button>
            ) : (
              <button className="cim-btn-send" onClick={handleSend} disabled={sending}>
                {sending
                  ? <><span className="cim-spinner" /> Sending...</>
                  : <><FiSend /> Send Campus Invite</>
                }
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusInviteModal;
