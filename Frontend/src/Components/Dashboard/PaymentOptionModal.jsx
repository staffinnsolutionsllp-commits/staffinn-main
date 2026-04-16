import React, { useState } from 'react';
import './PaymentOptionModal.css';

const PaymentOptionModal = ({ course, onClose, onPayHere, onPayAtInstitute }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedOption) {
      alert('Please select a payment option');
      return;
    }

    setLoading(true);
    
    if (selectedOption === 'payHere') {
      onPayHere();
    } else if (selectedOption === 'payAtInstitute') {
      await onPayAtInstitute();
    }
    
    setLoading(false);
  };

  return (
    <div className="payment-option-modal-overlay" onClick={onClose}>
      <div className="payment-option-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="payment-option-modal-header">
          <h2>Choose Payment Method</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="payment-option-modal-body">
          <div className="course-info-section">
            <h3>{course.courseName || course.name}</h3>
            <div className="course-meta-info">
              <p><strong>Mode:</strong> {course.mode}</p>
              <p><strong>Duration:</strong> {course.duration}</p>
              <p><strong>Fees:</strong> ₹{course.fees}</p>
            </div>
          </div>

          <div className="payment-options-section">
            <h4>Select Payment Method:</h4>
            
            <div 
              className={`payment-option-card ${selectedOption === 'payHere' ? 'selected' : ''}`}
              onClick={() => setSelectedOption('payHere')}
            >
              <div className="option-icon">💳</div>
              <div className="option-content">
                <h5>Pay Here (Online)</h5>
                <p>Pay securely using Razorpay</p>
                <ul className="option-benefits">
                  <li>✓ Instant enrollment confirmation</li>
                  <li>✓ Secure payment gateway</li>
                  <li>✓ Multiple payment options</li>
                  <li>✓ Immediate access to course details</li>
                </ul>
              </div>
              <div className="option-radio">
                <input 
                  type="radio" 
                  name="paymentOption" 
                  checked={selectedOption === 'payHere'}
                  onChange={() => setSelectedOption('payHere')}
                />
              </div>
            </div>

            <div 
              className={`payment-option-card ${selectedOption === 'payAtInstitute' ? 'selected' : ''}`}
              onClick={() => setSelectedOption('payAtInstitute')}
            >
              <div className="option-icon">🏫</div>
              <div className="option-content">
                <h5>Pay at Institute</h5>
                <p>Pay directly at the institute campus</p>
                <ul className="option-benefits">
                  <li>✓ Pay in cash or card at campus</li>
                  <li>✓ Get receipt from institute</li>
                  <li>✓ Enrollment pending until payment</li>
                  <li>✓ Institute will be notified</li>
                </ul>
              </div>
              <div className="option-radio">
                <input 
                  type="radio" 
                  name="paymentOption" 
                  checked={selectedOption === 'payAtInstitute'}
                  onChange={() => setSelectedOption('payAtInstitute')}
                />
              </div>
            </div>
          </div>

          <div className="important-note">
            <strong>📌 Important:</strong> For on-campus courses, you need to visit the institute for classes. 
            {selectedOption === 'payAtInstitute' && (
              <span> The institute will contact you with further instructions after receiving your enrollment request.</span>
            )}
          </div>
        </div>

        <div className="payment-option-modal-footer">
          <button 
            className="cancel-button" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="continue-button" 
            onClick={handleContinue}
            disabled={loading || !selectedOption}
          >
            {loading ? 'Processing...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionModal;
