// Frontend Payment Integration Utility - Cashfree
// Location: Frontend/src/utils/paymentUtils.js

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.staffinn.com/api/v1';

// Load Cashfree JS SDK
export const loadCashfreeScript = () => {
  return new Promise((resolve) => {
    if (window.Cashfree) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Create payment order via backend
export const createPaymentOrder = async (courseId, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payments/create-order`,
      { courseId },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Verify payment after completion
export const verifyPayment = async (paymentData, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/payments/verify`,
      paymentData,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
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
      `${API_BASE_URL}/payments/check-status/${courseId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Main payment handler - Cashfree Drop-in Checkout
export const handlePayment = async (courseData, userData, token, onSuccess, onFailure) => {
  try {
    // Load Cashfree SDK
    const scriptLoaded = await loadCashfreeScript();
    if (!scriptLoaded) {
      throw new Error('Cashfree SDK failed to load');
    }

    // Create order via backend
    const orderData = await createPaymentOrder(courseData.courseId, token);

    if (!orderData.success || !orderData.data?.paymentSessionId) {
      throw new Error(orderData.message || 'Failed to create payment order');
    }

    const { paymentSessionId, orderId } = orderData.data;

    // Initialize Cashfree checkout
    const cashfree = window.Cashfree({ mode: 'production' });

    const checkoutOptions = {
      paymentSessionId: paymentSessionId,
      redirectTarget: '_modal'
    };

    // Open Cashfree checkout
    const result = await cashfree.checkout(checkoutOptions);

    if (result.error) {
      console.error('Cashfree checkout error:', result.error);
      onFailure(new Error(result.error.message || 'Payment failed'));
      return;
    }

    if (result.redirect) {
      // Payment was redirected (UPI intent, etc.) - verification will happen on return
      console.log('Payment redirected, waiting for callback...');
      return;
    }

    if (result.paymentDetails) {
      // Payment completed in modal
      console.log('Payment completed:', result.paymentDetails);

      // Verify with backend
      const verifyResponse = await verifyPayment({ orderId }, token);

      if (verifyResponse.success) {
        onSuccess(verifyResponse);
      } else {
        onFailure(new Error(verifyResponse.message || 'Payment verification failed'));
      }
    }
  } catch (error) {
    console.error('Payment error:', error);
    onFailure(error);
  }
};

// Legacy exports for backward compatibility
export const loadRazorpayScript = loadCashfreeScript;
