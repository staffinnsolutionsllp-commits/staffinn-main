import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './PaymentModal.css';

const PaymentModal = ({ course, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('💳 Initiating payment for course:', course.coursesId);

      // Create order
      const orderResponse = await apiService.createPaymentOrder(course.coursesId);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      const { orderId, amount, currency, razorpayKeyId, courseDetails } = orderResponse.data;

      console.log('🔑 Razorpay Key ID:', razorpayKeyId);

      // Razorpay options
      const options = {
        key: razorpayKeyId,
        amount: amount,
        currency: currency,
        name: 'Staffinn',
        description: `Course: ${courseDetails.courseName}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            console.log('✅ Payment successful:', response);

            // Verify payment with correct field names
            const verifyResponse = await apiService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            if (verifyResponse.success) {
              alert('Payment successful! You are now enrolled in the course.');
              onSuccess();
              onClose();
            } else {
              throw new Error(verifyResponse.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('❌ Payment verification error:', error);
            setError(error.message || 'Payment verification failed');
            setLoading(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        notes: {
          courseId: course.coursesId,
          courseName: courseDetails.courseName
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user');
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        console.error('❌ Payment failed:', response.error);
        setError(response.error.description || 'Payment failed');
        setLoading(false);
      });

      razorpay.open();
    } catch (error) {
      console.error('❌ Payment initiation error:', error);
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

          <div className="payment-amount">
            <span className="label">Amount to Pay:</span>
            <span className="amount">₹{course.fees}</span>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          <div className="payment-info">
            <p>✓ Secure payment powered by Razorpay</p>
            <p>✓ Instant course access after payment</p>
            <p>✓ Payment goes directly to course creator</p>
          </div>
        </div>

        <div className="payment-modal-footer">
          <button 
            className="cancel-button" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="pay-button" 
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Pay ₹${course.fees}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
