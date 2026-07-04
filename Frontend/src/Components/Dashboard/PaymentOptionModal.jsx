import React, { useState, useEffect } from 'react';
import './PaymentOptionModal.css';

const PaymentOptionModal = ({ course, onClose, onPayHere, onPayAtInstitute }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);

  // ── Scroll lock — stops Lenis and locks body while modal is open ──
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = scrollbarWidth + 'px';
    document.body.classList.add('modal-open'); // Lenis watches this class

    // Block wheel events from reaching Lenis when outside the modal
    const handleWheel = (e) => {
      const modal = document.querySelector('.pom-box');
      if (!modal || !modal.contains(e.target)) e.stopPropagation();
    };
    const handleTouchMove = (e) => {
      const modal = document.querySelector('.pom-box');
      if (!modal || !modal.contains(e.target)) e.preventDefault();
    };

    document.addEventListener('wheel', handleWheel, { capture: true });
    document.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = '';
      document.body.classList.remove('modal-open');
      document.removeEventListener('wheel', handleWheel, { capture: true });
      document.removeEventListener('touchmove', handleTouchMove, { capture: true });
    };
  }, []);

  const handleContinue = async () => {
    if (!selectedOption) return;
    setLoading(true);
    if (selectedOption === 'payHere') {
      onPayHere();
    } else if (selectedOption === 'payAtInstitute') {
      await onPayAtInstitute();
    }
    setLoading(false);
  };

  const courseName = course.courseName || course.name || 'Course';

  return (
    <div className="pom-overlay" onClick={onClose}>
      <div className="pom-box" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="pom-header">
          <div className="pom-header-left">
            <div className="pom-header-icon">💳</div>
            <div>
              <h2 className="pom-title">Choose Payment Method</h2>
              <p className="pom-subtitle">Select how you'd like to pay for this course</p>
            </div>
          </div>
          <button className="pom-close" onClick={onClose} title="Close">✕</button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="pom-body">

          {/* Course summary pill */}
          <div className="pom-course-card">
            <div className="pom-course-name">{courseName}</div>
            <div className="pom-course-meta">
              {course.mode && (
                <span className="pom-tag pom-tag--mode">📍 {course.mode}</span>
              )}
              {course.duration && (
                <span className="pom-tag pom-tag--duration">⏱ {course.duration}</span>
              )}
              {course.fees && (
                <span className="pom-tag pom-tag--fees">₹{course.fees}</span>
              )}
            </div>
          </div>

          {/* Section label */}
          <p className="pom-section-label">Select Payment Method</p>

          {/* ── Pay Online card ── */}
          <div
            className={`pom-option ${selectedOption === 'payHere' ? 'pom-option--selected' : ''}`}
            onClick={() => setSelectedOption('payHere')}
          >
            <div className="pom-option-radio">
              <div className={`pom-radio-dot ${selectedOption === 'payHere' ? 'pom-radio-dot--on' : ''}`} />
            </div>
            <div className="pom-option-icon pom-option-icon--online">💳</div>
            <div className="pom-option-body">
              <h4 className="pom-option-title">Pay Here <span className="pom-badge pom-badge--blue">Online</span></h4>
              <p className="pom-option-desc">Pay securely using Razorpay</p>
              <ul className="pom-perks">
                <li><span className="pom-check">✓</span> Instant enrollment confirmation</li>
                <li><span className="pom-check">✓</span> Secure payment gateway</li>
                <li><span className="pom-check">✓</span> Multiple payment options (UPI, card, net banking)</li>
                <li><span className="pom-check">✓</span> Immediate access to course details</li>
              </ul>
            </div>
          </div>

          {/* ── Pay at Institute card ── */}
          <div
            className={`pom-option ${selectedOption === 'payAtInstitute' ? 'pom-option--selected pom-option--campus' : ''}`}
            onClick={() => setSelectedOption('payAtInstitute')}
          >
            <div className="pom-option-radio">
              <div className={`pom-radio-dot ${selectedOption === 'payAtInstitute' ? 'pom-radio-dot--on' : ''}`} />
            </div>
            <div className="pom-option-icon pom-option-icon--campus">🏫</div>
            <div className="pom-option-body">
              <h4 className="pom-option-title">Pay at Institute <span className="pom-badge pom-badge--orange">In-Person</span></h4>
              <p className="pom-option-desc">Pay directly at the institute campus</p>
              <ul className="pom-perks">
                <li><span className="pom-check">✓</span> Pay in cash or card at campus</li>
                <li><span className="pom-check">✓</span> Get receipt from institute</li>
                <li><span className="pom-check">✓</span> Enrollment pending until payment verified</li>
                <li><span className="pom-check">✓</span> Institute will be notified immediately</li>
              </ul>
            </div>
          </div>

          {/* Important note */}
          <div className="pom-note">
            <span className="pom-note-icon">📌</span>
            <span>
              For on-campus courses, you need to visit the institute for classes.
              {selectedOption === 'payAtInstitute' && (
                <strong> The institute will contact you with further instructions after receiving your enrollment request.</strong>
              )}
            </span>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="pom-footer">
          <button className="pom-btn pom-btn--cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={`pom-btn pom-btn--continue ${!selectedOption ? 'pom-btn--disabled' : ''}`}
            onClick={handleContinue}
            disabled={loading || !selectedOption}
          >
            {loading ? (
              <span className="pom-spinner">⏳ Processing…</span>
            ) : (
              <>Continue <span className="pom-arrow">→</span></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentOptionModal;
