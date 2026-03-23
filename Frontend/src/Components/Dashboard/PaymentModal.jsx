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

      const { orderId, amount, currency, keyId, courseName, courseInstructor } = orderResponse.data;

      // Razorpay options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Staffinn',
        description: `Course: ${courseName}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            console.log('✅ Payment successful:', response);

            // Verify payment
            const verifyResponse = await apiService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              courseId: course.coursesId
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
          courseName: courseName
        },
        theme: {
          color: '#3399cc'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user');
            setLoading(false);
            
            // Record payment failure
            apiService.handlePaymentFailure({
              orderId: orderId,
              error: 'Payment cancelled by user'
            });
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', async function (response) {
        console.error('❌ Payment failed:', response.error);
        setError(response.error.description || 'Payment failed');
        setLoading(false);
        
        // Record payment failure
        await apiService.handlePaymentFailure({
          orderId: orderId,
          error: response.error.description
        });
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
