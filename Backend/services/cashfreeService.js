/**
 * Cashfree Payment Gateway Service
 * Replaces Razorpay for payment processing.
 * Uses Cashfree PG API v2023-08-01
 */

const crypto = require('crypto');
const axios = require('axios');

const CASHFREE_API_URL = process.env.CASHFREE_API_URL || 'https://api.cashfree.com/pg';
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

/**
 * Get Cashfree API headers
 */
const getHeaders = () => ({
  'x-client-id': CASHFREE_APP_ID,
  'x-client-secret': CASHFREE_SECRET_KEY,
  'x-api-version': '2023-08-01',
  'Content-Type': 'application/json'
});

/**
 * Create a Cashfree Payment Order
 * @param {object} params
 * @param {string} params.orderId - Unique order ID
 * @param {number} params.amount - Amount in rupees
 * @param {string} params.currency - Currency (INR)
 * @param {object} params.customerDetails - { customer_id, customer_name, customer_email, customer_phone }
 * @param {object} params.orderMeta - { return_url, notify_url }
 * @param {object} params.orderNote - Additional notes
 * @returns {Promise<object>}
 */
const createOrder = async ({ orderId, amount, currency = 'INR', customerDetails, orderMeta, orderNote }) => {
  try {
    console.log('🔑 Cashfree credentials check:', {
      hasAppId: !!CASHFREE_APP_ID,
      hasSecretKey: !!CASHFREE_SECRET_KEY,
      appIdPrefix: CASHFREE_APP_ID?.substring(0, 10)
    });

    const payload = {
      order_id: orderId,
      order_amount: parseFloat(amount),
      order_currency: currency,
      customer_details: {
        customer_id: customerDetails.customer_id,
        customer_name: customerDetails.customer_name || 'Customer',
        customer_email: customerDetails.customer_email,
        customer_phone: customerDetails.customer_phone || '9999999999'
      },
      order_meta: {
        return_url: orderMeta?.return_url || `${process.env.FRONTEND_URL || 'https://staffinn.com'}/payment/callback?order_id={order_id}`,
        notify_url: orderMeta?.notify_url || `${process.env.API_BASE_URL || 'https://api.staffinn.com'}/api/v1/payments/webhook`
      },
      order_note: orderNote || ''
    };

    console.log('📦 Creating Cashfree order:', { orderId, amount, currency });

    const response = await axios.post(`${CASHFREE_API_URL}/orders`, payload, {
      headers: getHeaders()
    });

    console.log('✅ Cashfree order created:', response.data.order_id);

    return {
      success: true,
      data: {
        orderId: response.data.order_id,
        orderStatus: response.data.order_status,
        paymentSessionId: response.data.payment_session_id,
        orderAmount: response.data.order_amount,
        orderCurrency: response.data.order_currency
      }
    };
  } catch (error) {
    const errMsg = error.response?.data?.message || error.message;
    console.error('❌ Cashfree order creation failed:', {
      status: error.response?.status,
      message: errMsg,
      details: error.response?.data
    });
    return {
      success: false,
      message: errMsg || 'Failed to create payment order'
    };
  }
};

/**
 * Fetch Order/Payment status from Cashfree
 * @param {string} orderId - Cashfree order ID
 * @returns {Promise<object>}
 */
const getOrderStatus = async (orderId) => {
  try {
    const response = await axios.get(`${CASHFREE_API_URL}/orders/${orderId}`, {
      headers: getHeaders()
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error fetching order status:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

/**
 * Fetch payments for an order
 * @param {string} orderId - Cashfree order ID
 * @returns {Promise<object>}
 */
const getPaymentsForOrder = async (orderId) => {
  try {
    const response = await axios.get(`${CASHFREE_API_URL}/orders/${orderId}/payments`, {
      headers: getHeaders()
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error fetching payments:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

/**
 * Verify Cashfree Webhook Signature
 * Uses the timestamp from header + raw body + secret key
 * @param {string} rawBody - Raw request body string
 * @param {string} timestamp - x-webhook-timestamp header
 * @param {string} signature - x-webhook-signature header
 * @returns {boolean}
 */
const verifyWebhookSignature = (rawBody, timestamp, signature) => {
  try {
    const signatureData = timestamp + rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', CASHFREE_SECRET_KEY)
      .update(signatureData)
      .digest('base64');

    const isValid = expectedSignature === signature;
    console.log('Webhook signature verification:', isValid ? 'SUCCESS' : 'FAILED');
    return isValid;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

/**
 * Create Refund
 * @param {string} orderId - Cashfree order ID
 * @param {number} refundAmount - Amount to refund in rupees
 * @param {string} refundNote - Reason for refund
 * @returns {Promise<object>}
 */
const createRefund = async (orderId, refundAmount, refundNote = 'Refund processed') => {
  try {
    const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const payload = {
      refund_amount: parseFloat(refundAmount),
      refund_id: refundId,
      refund_note: refundNote
    };

    const response = await axios.post(`${CASHFREE_API_URL}/orders/${orderId}/refunds`, payload, {
      headers: getHeaders()
    });

    console.log('✅ Refund created:', response.data.refund_id);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error creating refund:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

/**
 * Get Refund Status
 * @param {string} orderId
 * @param {string} refundId
 * @returns {Promise<object>}
 */
const getRefundStatus = async (orderId, refundId) => {
  try {
    const response = await axios.get(`${CASHFREE_API_URL}/orders/${orderId}/refunds/${refundId}`, {
      headers: getHeaders()
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error fetching refund:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
};

module.exports = {
  createOrder,
  getOrderStatus,
  getPaymentsForOrder,
  verifyWebhookSignature,
  createRefund,
  getRefundStatus
};
