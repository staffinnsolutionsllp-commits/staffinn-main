const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create Razorpay Order
 * @param {number} amount - Amount in rupees (will be converted to paise)
 * @param {string} currency - Currency code (default: INR)
 * @param {object} notes - Additional notes/metadata
 * @returns {Promise<object>} - Razorpay order object
 */
const createOrder = async (amount, currency = 'INR', notes = {}) => {
  try {
    console.log('🔑 Razorpay credentials check:', {
      hasKeyId: !!process.env.RAZORPAY_KEY_ID,
      hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
      keyIdPrefix: process.env.RAZORPAY_KEY_ID?.substring(0, 8)
    });
    
    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);
    
    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      notes: notes,
      payment_capture: 1 // Auto capture payment
    };
    
    console.log('📦 Creating Razorpay order with options:', { ...options, notes: '...' });
    
    const order = await razorpayInstance.orders.create(options);
    console.log('✅ Razorpay order created:', order.id);
    
    return {
      success: true,
      data: order
    };
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', {
      message: error.message,
      description: error.error?.description,
      code: error.error?.code,
      statusCode: error.statusCode
    });
    return {
      success: false,
      message: error.error?.description || error.message || 'Failed to create payment order'
    };
  }
};

/**
 * Verify Razorpay Payment Signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} - True if signature is valid
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');
    
    const isValid = generatedSignature === signature;
    console.log('Payment signature verification:', isValid ? 'SUCCESS' : 'FAILED');
    
    return isValid;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};

/**
 * Verify Webhook Signature
 * @param {string} webhookBody - Raw webhook body
 * @param {string} webhookSignature - Razorpay webhook signature from header
 * @returns {boolean} - True if webhook signature is valid
 */
const verifyWebhookSignature = (webhookBody, webhookSignature) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest('hex');
    
    const isValid = expectedSignature === webhookSignature;
    console.log('Webhook signature verification:', isValid ? 'SUCCESS' : 'FAILED');
    
    return isValid;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
};

/**
 * Fetch Payment Details
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<object>} - Payment details
 */
const fetchPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpayInstance.payments.fetch(paymentId);
    return {
      success: true,
      data: payment
    };
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch payment details'
    };
  }
};

/**
 * Fetch Order Details
 * @param {string} orderId - Razorpay order ID
 * @returns {Promise<object>} - Order details
 */
const fetchOrderDetails = async (orderId) => {
  try {
    const order = await razorpayInstance.orders.fetch(orderId);
    return {
      success: true,
      data: order
    };
  } catch (error) {
    console.error('Error fetching order details:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch order details'
    };
  }
};

/**
 * Create Refund
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Refund amount in paise (optional, full refund if not provided)
 * @returns {Promise<object>} - Refund details
 */
const createRefund = async (paymentId, amount = null) => {
  try {
    const options = {};
    if (amount) {
      options.amount = amount;
    }
    
    const refund = await razorpayInstance.payments.refund(paymentId, options);
    console.log('Refund created:', refund.id);
    
    return {
      success: true,
      data: refund
    };
  } catch (error) {
    console.error('Error creating refund:', error);
    return {
      success: false,
      message: error.message || 'Failed to create refund'
    };
  }
};

/**
 * Fetch All Payments for an Order
 * @param {string} orderId - Razorpay order ID
 * @returns {Promise<object>} - List of payments
 */
const fetchOrderPayments = async (orderId) => {
  try {
    const payments = await razorpayInstance.orders.fetchPayments(orderId);
    return {
      success: true,
      data: payments
    };
  } catch (error) {
    console.error('Error fetching order payments:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch order payments'
    };
  }
};

/**
 * Create Transfer to Institute Account (Route/Linked Account)
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} accountId - Institute's Razorpay account ID
 * @param {number} amount - Transfer amount in paise
 * @returns {Promise<object>} - Transfer details
 */
const createTransfer = async (paymentId, accountId, amount) => {
  try {
    const transfer = await razorpayInstance.payments.transfer(paymentId, {
      transfers: [
        {
          account: accountId,
          amount: amount,
          currency: 'INR',
          notes: {
            transfer_type: 'course_payment'
          }
        }
      ]
    });
    
    console.log('Transfer created:', transfer);
    
    return {
      success: true,
      data: transfer
    };
  } catch (error) {
    console.error('Error creating transfer:', error);
    return {
      success: false,
      message: error.message || 'Failed to create transfer'
    };
  }
};

module.exports = {
  razorpayInstance,
  createOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  fetchPaymentDetails,
  fetchOrderDetails,
  createRefund,
  fetchOrderPayments,
  createTransfer
};
