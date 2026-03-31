// Sample Payment Button Component
// Location: Frontend/src/Components/Payment/PaymentButton.jsx

import React, { useState } from 'react';
import { handlePayment } from '../../utils/paymentUtils';
import { toast } from 'react-toastify';

const PaymentButton = ({ course, user, token, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);

  const initiatePayment = async () => {
    setLoading(true);

    const courseData = {
      courseId: course.courseId,
      courseName: course.courseName,
      amount: course.fees
    };

    const userData = {
      name: user.name,
      email: user.email,
      phone: user.phone
    };

    await handlePayment(
      courseData,
      userData,
      token,
      // Success callback
      (response) => {
        setLoading(false);
        toast.success('Payment successful! You are now enrolled in the course.');
        if (onPaymentSuccess) {
          onPaymentSuccess(response);
        }
      },
      // Failure callback
      (error) => {
        setLoading(false);
        toast.error(error.message || 'Payment failed. Please try again.');
        console.error('Payment error:', error);
      }
    );
  };

  return (
    <button
      onClick={initiatePayment}
      disabled={loading}
      className="payment-button"
      style={{
        padding: '12px 24px',
        backgroundColor: loading ? '#ccc' : '#3399cc',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease'
      }}
    >
      {loading ? 'Processing...' : `Pay ₹${course.fees}`}
    </button>
  );
};

export default PaymentButton;
