import React, { useState, useEffect, useRef } from 'react';
import {
  FiArrowLeft, FiArrowRight, FiSend, FiCalendar, FiUsers, FiBriefcase,
  FiDollarSign, FiFileText, FiCheck, FiX, FiBook, FiClock, FiLock,
  FiAlertCircle, FiAward, FiMonitor, FiWifi, FiLayers, FiCheckCircle
} from 'react-icons/fi';
import apiService from '../../services/api';
import './RecruiterCampusInviteModal.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

const formatDateDisplay = (key) => {
  const d = new Date(key + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const TIME_SLOT_OPTIONS = [
  '10:00 AM – 1:00 PM',
  '2:00 PM – 5:00 PM',
  'Full Day',
  'Custom Time',
];

const SELECTION_PROCESS_OPTIONS = ['Aptitude Test', 'GD', 'Technical Interview', 'HR Interview'];

const STEPS = [
  { label: 'Courses & Date', icon: FiBook },
  { label: 'Hiring Details', icon: FiBriefcase },
  { label: 'Requirements', icon: FiFileText },
  { label: 'Review & Send', icon: FiSend },
];

const RecruiterCampusInviteModal = ({ institute, onClose, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [availableCourses, setAvailableCourses] = useState([]);
  const [plannerDates, setPlannerDates] = useState([]);
  const [slotAvailability, setSlotAvailability] = useState({});

  const bodyRef = useRef(null);
  const overlayRef = useRef(null);

  const [form, setForm] = useState({
    selectedCourses: [],
    preferredDate: '',
    preferredTimeSlot: '',
    jobRoles: '',
    numberOfVacancies: '',
    salaryStipend: '',
    eligibilityCriteria: '',
    selectionProcess: [],
    systemRequirement: '',
    internetRequirement: '',
    setupRequirement: '',
    otherInstructions: ''
  });

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');

    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove('modal-open');
    };
  }, []);

  // Load institute's courses and planner dates
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [coursesRes, plannerRes] = await Promise.all([
          apiService.getInstituteCourses(institute.id),
          apiService.getInstitutePlanner(institute.id)
        ]);

        if (coursesRes.success && coursesRes.data) {
          setAvailableCourses(coursesRes.data);
        }

        if (plannerRes.success && plannerRes.data?.selectedDates) {
          const today = new Date().toISOString().split('T')[0];
          const future = plannerRes.data.selectedDates.filter(d => d >= today).sort();
          setPlannerDates(future);
        }
      } catch (e) {
        console.error('Load data error:', e);
        setError('Failed to load institute data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [institute.id]);

  // Load slot availability when dates are loaded
  useEffect(() => {
    if (plannerDates.length > 0) {
      loadSlotAvailability();
    }
  }, [plannerDates]);

  const loadSlotAvailability = async () => {
    try {
      const res = await apiService.getCampusSlotAvailability(institute.id);
      if (res.success && res.data) {
        setSlotAvailability(res.data);
      }
    } catch (e) {
      console.error('Load slot availability error:', e);
    }
  };

  const getSlotStatus = (date, slot) => {
    const key = `${date}::${slot}`;
    const booking = slotAvailability[key];
    return booking?.status || null;
  };

  const toggleCourse = (course) => {
    setForm(prev => {
      const exists = prev.selectedCourses.find(c => c.id === course.id);
      return {
        ...prev,
        selectedCourses: exists
          ? prev.selectedCourses.filter(c => c.id !== course.id)
          : [...prev.selectedCourses, { id: course.id, name: course.name }]
      };
    });
  };

  const toggleSelectionProcess = (item) => {
    setForm(prev => ({
      ...prev,
      selectionProcess: prev.selectionProcess.includes(item)
        ? prev.selectionProcess.filter(s => s !== item)
        : [...prev.selectionProcess, item]
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = () => {
    setError('');
    if (step === 0) {
      if (form.selectedCourses.length === 0) {
        setError('Please select at least one course');
        return false;
      }
      if (!form.preferredDate) {
        setError('Please select a preferred date');
        return false;
      }
      if (!form.preferredTimeSlot) {
        setError('Please select a time slot');
        return false;
      }
      const slotStatus = getSlotStatus(form.preferredDate, form.preferredTimeSlot);
      if (slotStatus === 'Confirmed') {
        setError('This slot is already booked. Please select another.');
        return false;
      }
    }
    if (step === 1) {
      if (!form.jobRoles.trim()) {
        setError('Job Role(s) is required');
        return false;
      }
      if (!form.numberOfVacancies) {
        setError('Number of Vacancies is required');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) setStep(s => s + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(s => s - 1);
  };

  const handleSend = async () => {
    setSending(true);
    setError('');
    try {
      const res = await apiService.sendRecruiterCampusInvite(institute.id, form);
      if (res.success) {
        onSuccess && onSuccess();
      } else {
        setError(res.message || 'Failed to send invite');
      }
    } catch (e) {
      setError('An error occurred. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rcim-overlay" ref={overlayRef} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rcim-modal">
        {/* Header */}
        <div className="rcim-header">
          <div className="rcim-header-info">
            <div className="rcim-institute-avatar">
              {institute.profileImage
                ? <img src={institute.profileImage} alt={institute.name} />
                : <span>{institute.name[0].toUpperCase()}</span>
              }
            </div>
            <div>
              <p className="rcim-header-label">Campus Drive Invitation to</p>
              <h2 className="rcim-title">{institute.name}</h2>
            </div>
          </div>
          <button className="rcim-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Step indicator */}
        <div className="rcim-steps">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`rcim-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
                <div className="rcim-step-circle">
                  {i < step ? <FiCheck size={14} /> : <Icon size={14} />}
                </div>
                <span className="rcim-step-label">{s.label}</span>
                {i < STEPS.length - 1 && <div className="rcim-step-line" />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="rcim-body" ref={bodyRef}>
          {loading ? (
            <div className="rcim-loading">
              <div className="rcim-spinner" />
              <p>Loading institute data...</p>
            </div>
          ) : (
            <>
              {/* STEP 0: Courses & Date */}
              {step === 0 && (
                <div className="rcim-step-content">
                  <div className="rcim-step-heading">
                    <div className="rcim-step-icon-wrap"><FiBook /></div>
                    <div>
                      <h3 className="rcim-step-title">Select Courses & Date</h3>
                      <p className="rcim-step-desc">Choose the courses and preferred campus drive date</p>
                    </div>
                  </div>

                  {/* Courses */}
                  <div className="rcim-field rcim-field-full">
                    <label>Course(s) <span className="rcim-req">*</span></label>
                    <p className="rcim-field-hint">Select from the institute's On-Campus courses</p>
                    {availableCourses.length === 0 ? (
                      <div className="rcim-no-data">
                        <FiBook size={32} />
                        <p>No On-Campus courses available</p>
                      </div>
                    ) : (
                      <div className="rcim-courses-grid">
                        {availableCourses.map(course => {
                          const selected = form.selectedCourses.find(c => c.id === course.id);
                          return (
                            <div
                              key={course.id}
                              className={`rcim-course-chip ${selected ? 'selected' : ''}`}
                              onClick={() => toggleCourse(course)}
                            >
                              <span className="rcim-course-check">
                                {selected ? <FiCheck /> : <FiBook />}
                              </span>
                              <span className="rcim-course-name">{course.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Date Selection */}
                  <div className="rcim-field rcim-field-full">
                    <label>Preferred Campus Drive Date <span className="rcim-req">*</span></label>
                    <p className="rcim-field-hint">Select from institute's placement planner</p>
                    {plannerDates.length === 0 ? (
                      <div className="rcim-no-data">
                        <FiCalendar size={32} />
                        <p>No available dates in institute's planner</p>
                      </div>
                    ) : (
                      <div className="rcim-dates-grid">
                        {plannerDates.map(key => {
                          const d = new Date(key + 'T00:00:00');
                          const selected = form.preferredDate === key;
                          return (
                            <div
                              key={key}
                              className={`rcim-date-card ${selected ? 'selected' : ''}`}
                              onClick={() => setForm(p => ({ ...p, preferredDate: key }))}
                            >
                              <div className="rcim-date-day">{DAYS_SHORT[d.getDay()]}</div>
                              <div className="rcim-date-num">{d.getDate()}</div>
                              <div className="rcim-date-month">{MONTHS[d.getMonth()]}</div>
                              <div className="rcim-date-year">{d.getFullYear()}</div>
                              {selected && <div className="rcim-date-check"><FiCheck /></div>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Time Slot */}
                  {form.preferredDate && (
                    <div className="rcim-field rcim-field-full">
                      <label>Preferred Time Slot <span className="rcim-req">*</span></label>
                      <div className="rcim-timeslots-grid">
                        {TIME_SLOT_OPTIONS.map(slot => {
                          const slotStatus = getSlotStatus(form.preferredDate, slot);
                          const isBooked = slotStatus === 'Confirmed';
                          const isTentative = slotStatus === 'Tentative';
                          const isActive = form.preferredTimeSlot === slot;
                          return (
                            <button
                              key={slot}
                              type="button"
                              className={`rcim-timeslot-chip ${isActive && !isBooked ? 'selected' : ''} ${isBooked ? 'booked' : ''} ${isTentative ? 'tentative' : ''}`}
                              disabled={isBooked}
                              onClick={() => !isBooked && setForm(p => ({ ...p, preferredTimeSlot: slot }))}
                            >
                              {isBooked ? <FiLock size={12} /> : isTentative ? <FiAlertCircle size={12} /> : <FiClock size={12} />}
                              {' '}{slot}
                              {isBooked && <span className="rcim-slot-badge booked">🔴 Booked</span>}
                              {isTentative && <span className="rcim-slot-badge tentative">🟡 Tentative</span>}
                              {!isBooked && !isTentative && <span className="rcim-slot-badge available">🟢</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 1: Hiring Details */}
              {step === 1 && (
                <div className="rcim-step-content">
                  <div className="rcim-step-heading">
                    <div className="rcim-step-icon-wrap"><FiBriefcase /></div>
                    <div>
                      <h3 className="rcim-step-title">Hiring Details</h3>
                      <p className="rcim-step-desc">Provide job roles and requirements</p>
                    </div>
                  </div>

                  <div className="rcim-form-grid">
                    <div className="rcim-field">
                      <label>Job Role(s) <span className="rcim-req">*</span></label>
                      <input
                        name="jobRoles"
                        value={form.jobRoles}
                        onChange={handleChange}
                        placeholder="e.g. Software Engineer, Data Analyst"
                      />
                    </div>
                    <div className="rcim-field">
                      <label>Number of Vacancies <span className="rcim-req">*</span></label>
                      <input
                        type="number"
                        name="numberOfVacancies"
                        value={form.numberOfVacancies}
                        onChange={handleChange}
                        placeholder="e.g. 20"
                        min="1"
                      />
                    </div>
                    <div className="rcim-field">
                      <label>Salary / Stipend</label>
                      <input
                        name="salaryStipend"
                        value={form.salaryStipend}
                        onChange={handleChange}
                        placeholder="e.g. ₹5 LPA / ₹15,000/month"
                      />
                    </div>
                    <div className="rcim-field rcim-field-full">
                      <label>Eligibility Criteria</label>
                      <textarea
                        name="eligibilityCriteria"
                        value={form.eligibilityCriteria}
                        onChange={handleChange}
                        placeholder="e.g. 60%+ aggregate, No backlogs, B.Tech CS/IT"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Selection Process */}
                  <div className="rcim-field rcim-field-full">
                    <label>Selection Process</label>
                    <div className="rcim-selection-chips">
                      {SELECTION_PROCESS_OPTIONS.map(opt => {
                        const on = form.selectionProcess.includes(opt);
                        return (
                          <div
                            key={opt}
                            className={`rcim-selection-chip ${on ? 'on' : ''}`}
                            onClick={() => toggleSelectionProcess(opt)}
                          >
                            {on ? <FiCheck size={12} /> : <FiAward size={12} />} {opt}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Requirements */}
              {step === 2 && (
                <div className="rcim-step-content">
                  <div className="rcim-step-heading">
                    <div className="rcim-step-icon-wrap"><FiFileText /></div>
                    <div>
                      <h3 className="rcim-step-title">Additional Requirements</h3>
                      <p className="rcim-step-desc">Specify setup and infrastructure needs</p>
                    </div>
                  </div>

                  <div className="rcim-form-grid">
                    <div className="rcim-field">
                      <label><FiMonitor size={12} /> System Requirement</label>
                      <textarea
                        name="systemRequirement"
                        value={form.systemRequirement}
                        onChange={handleChange}
                        placeholder="e.g. Laptops with specific software..."
                        rows={2}
                      />
                    </div>
                    <div className="rcim-field">
                      <label><FiWifi size={12} /> Internet Requirement</label>
                      <textarea
                        name="internetRequirement"
                        value={form.internetRequirement}
                        onChange={handleChange}
                        placeholder="e.g. High-speed Wi-Fi, 50 Mbps..."
                        rows={2}
                      />
                    </div>
                    <div className="rcim-field">
                      <label><FiLayers size={12} /> Setup Requirement</label>
                      <textarea
                        name="setupRequirement"
                        value={form.setupRequirement}
                        onChange={handleChange}
                        placeholder="e.g. Projector, whiteboard, seating..."
                        rows={2}
                      />
                    </div>
                    <div className="rcim-field">
                      <label><FiFileText size={12} /> Other Instructions</label>
                      <textarea
                        name="otherInstructions"
                        value={form.otherInstructions}
                        onChange={handleChange}
                        placeholder="Any other instructions..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Review & Send */}
              {step === 3 && (
                <div className="rcim-step-content">
                  <div className="rcim-step-heading">
                    <div className="rcim-step-icon-wrap"><FiSend /></div>
                    <div>
                      <h3 className="rcim-step-title">Review Your Invite</h3>
                      <p className="rcim-step-desc">Please review all details before sending</p>
                    </div>
                  </div>

                  <div className="rcim-review-grid">
                    <div className="rcim-review-section">
                      <h4><FiBook /> Selected Courses</h4>
                      <div className="rcim-review-chips">
                        {form.selectedCourses.map(c => (
                          <span key={c.id} className="rcim-review-chip">{c.name}</span>
                        ))}
                      </div>
                    </div>

                    <div className="rcim-review-section">
                      <h4><FiCalendar /> Preferred Date & Time</h4>
                      <p><strong>Date:</strong> {formatDateDisplay(form.preferredDate)}</p>
                      <p><strong>Time:</strong> {form.preferredTimeSlot}</p>
                    </div>

                    <div className="rcim-review-section">
                      <h4><FiBriefcase /> Hiring Details</h4>
                      <p><strong>Job Roles:</strong> {form.jobRoles}</p>
                      <p><strong>Vacancies:</strong> {form.numberOfVacancies}</p>
                      {form.salaryStipend && <p><strong>Salary/Stipend:</strong> {form.salaryStipend}</p>}
                      {form.eligibilityCriteria && <p><strong>Eligibility:</strong> {form.eligibilityCriteria}</p>}
                    </div>

                    {form.selectionProcess.length > 0 && (
                      <div className="rcim-review-section">
                        <h4><FiAward /> Selection Process</h4>
                        <div className="rcim-review-chips">
                          {form.selectionProcess.map(s => (
                            <span key={s} className="rcim-review-chip">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="rcim-error" role="alert">
              <FiX className="rcim-error-icon" /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="rcim-footer">
          {step > 0 && (
            <button className="rcim-btn-back" onClick={prevStep} disabled={sending || loading}>
              <FiArrowLeft /> Back
            </button>
          )}
          <div className="rcim-footer-right">
            <button className="rcim-btn-cancel" onClick={onClose} disabled={sending || loading}>
              Cancel
            </button>
            {step < STEPS.length - 1 ? (
              <button className="rcim-btn-next" onClick={nextStep} disabled={loading}>
                Next <FiArrowRight />
              </button>
            ) : (
              <button className="rcim-btn-send" onClick={handleSend} disabled={sending || loading}>
                {sending ? <><span className="rcim-spinner" /> Sending...</> : <><FiSend /> Send Invite</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterCampusInviteModal;
