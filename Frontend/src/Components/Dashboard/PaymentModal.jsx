import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './PaymentModal.css';

const PaymentModal = ({ course, onClose, onSuccess, purchaseType, quantity }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load Cashfree JS SDK
    if (!window.Cashfree) {
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      document.body.appendChild(script);
      return () => { document.body.removeChild(script); };
    }
  }, []);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('💳 Initiating payment for course:', course.coursesId, 'purchaseType:', purchaseType, 'quantity:', quantity);

      // Create order via backend (pass purchaseType and quantity for license purchases)
      const orderResponse = await apiService.createPaymentOrder(course.coursesId, purchaseType, quantity);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      const { paymentSessionId, orderId } = orderResponse.data;

      if (!paymentSessionId) {
        throw new Error('Payment session not created. Please try again.');
      }

      console.log('✅ Order created:', orderId, orderResponse.data.purchaseType ? `(License: ${orderResponse.data.quantity} seats)` : '');

      // Initialize Cashfree
      const cashfree = window.Cashfree({ mode: 'production' });

      // Open Cashfree checkout
      const result = await cashfree.checkout({ paymentSessionId, redirectTarget: '_modal' });

      if (result.error) {
        console.error('❌ Cashfree error:', result.error);
        setError(result.error.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (result.redirect) {
        console.log('Payment redirected...');
        return;
      }

      if (result.paymentDetails) {
        console.log('✅ Payment completed:', result.paymentDetails);

        // Verify payment with backend
        const verifyResponse = await apiService.verifyPayment({ orderId });

        if (verifyResponse.success) {
          if (verifyResponse.data?.purchaseType === 'license') {
            alert(`Payment successful! ${verifyResponse.data.quantityPurchased} course seat(s) purchased. Manage assignments from your Dashboard → Course Licenses.`);
          } else {
            alert('Payment successful! You are now enrolled in the course.');
          }
          onSuccess();
          onClose();
        } else {
          throw new Error(verifyResponse.message || 'Payment verification failed');
        }
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      setError(error.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h2>Complete Payment</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="payment-modal-body">
          <div className="course-details">
            <h3>{course.courseName || course.name}</h3>
            <p className="instructor">Instructor: {course.instructor}</p>
            <p className="duration">Duration: {course.duration}</p>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          <div className="payment-amount">
            <span className="label">Amount to Pay:</span>
            <span className="amount">₹{course.fees}</span>
          </div>

          <div className="payment-info">
            <p>✓ Secure payment powered by Cashfree</p>
            <p>✓ Instant course access after payment</p>
            <p>✓ UPI, Cards, Net Banking supported</p>
          </div>
        </div>

        <div className="payment-modal-footer">
          <button className="cancel-button" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="pay-button" onClick={handlePayment} disabled={loading}>
            {loading ? 'Processing...' : `Pay ₹${course.fees}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
