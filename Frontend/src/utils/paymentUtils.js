// Frontend Payment Integration Utility
// Location: Frontend/src/utils/paymentUtils.js

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Load Razorpay script
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Create payment order
export const createPaymentOrder = async (courseId, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payments/create-order`,
      { courseId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Verify payment
export const verifyPayment = async (paymentData, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payments/verify`,
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Check payment status
export const checkPaymentStatus = async (courseId, token) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/payments/status/${courseId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Main payment handler
export const handlePayment = async (courseData, userData, token, onSuccess, onFailure) => {
  try {
    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Razorpay SDK failed to load');
    }

    // Create order
    const orderData = await createPaymentOrder(courseData.courseId, token);

    // Razorpay options
    const options = {
      key: 'rzp_test_SX0XfakI5RoVzw', // Your test key
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Staffinn',
      description: `Payment for ${courseData.courseName}`,
      order_id: orderData.orderId,
      handler: async function (response) {
        try {
          // Verify payment
          const verificationData = {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            courseId: courseData.courseId
          };

          const verifyResponse = await verifyPayment(verificationData, token);
          
          if (verifyResponse.success) {
            onSuccess(verifyResponse);
          } else {
            onFailure(new Error('Payment verification failed'));
          }
        } catch (error) {
          onFailure(error);
        }
      },
      prefill: {
        name: userData.name,
        email: userData.email,
        contact: userData.phone || ''
      },
      theme: {
        color: '#3399cc'
      },
      modal: {
        ondismiss: function() {
          onFailure(new Error('Payment cancelled by user'));
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    onFailure(error);
  }
};
