const cashfreeService = require('../services/cashfreeService');
const paymentTransactionModel = require('../models/paymentTransactionModel');
const instituteBankDetailsModel = require('../models/instituteBankDetailsModel');
const dynamoService = require('../services/dynamoService');

const COURSES_TABLE = 'staffinn-courses';
const COURSE_ENROLLMENTS_TABLE = 'course-enrolled-user';

/**
 * Create Payment Order (Cashfree)
 * POST /api/payment/create-order
 * Supports: individual enrollment (default) OR license purchase (purchaseType='license' + quantity)
 */
const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId, purchaseType, quantity } = req.body;

    console.log('📦 Creating payment order for:', { userId, courseId, purchaseType, quantity });

    if (!courseId) {
      return res.status(400).json({ success: false, message: 'Course ID is required' });
    }

    // Get course details
    const course = await dynamoService.getItem(COURSES_TABLE, { coursesId: courseId });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    console.log('📚 Course:', { courseName: course.courseName, fees: course.fees });

    const baseAmount = parseFloat(course.fees) || 0;
    if (baseAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid course fee amount' });
    }

    // ─── LICENSE PURCHASE FLOW ─────────────────────────────────────────
    if (purchaseType === 'license') {
      const seatCount = parseInt(quantity) || 1;
      if (seatCount < 1 || seatCount > 500) {
        return res.status(400).json({ success: false, message: 'Quantity must be between 1 and 500' });
      }

      const totalAmount = baseAmount * seatCount;
      const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 10;
      const platformFee = (totalAmount * platformFeePercentage) / 100;
      const instituteAmount = totalAmount - platformFee;

      const orderId = `license_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      const orderResult = await cashfreeService.createOrder({
        orderId,
        amount: totalAmount,
        currency: 'INR',
        customerDetails: {
          customer_id: userId,
          customer_name: req.user.name || req.user.fullName || 'Customer',
          customer_email: req.user.email || '',
          customer_phone: req.user.phone || '9999999999'
        },
        orderMeta: {
          return_url: `${process.env.FRONTEND_URL || 'https://staffinn.com'}/payment/callback?order_id={order_id}`,
          notify_url: `${process.env.API_BASE_URL || 'https://api.staffinn.com'}/api/v1/payments/webhook`
        },
        orderNote: JSON.stringify({ courseId, courseName: course.courseName, userId, instituteId: course.instituteId, purchaseType: 'license', quantity: seatCount })
      });

      if (!orderResult.success) {
        return res.status(500).json({ success: false, message: orderResult.message || 'Failed to create payment order' });
      }

      // Create transaction record
      const transaction = await paymentTransactionModel.createTransaction({
        userId,
        instituteId: course.instituteId,
        courseId,
        courseName: course.courseName,
        amount: totalAmount,
        currency: 'INR',
        razorpayOrderId: orderId,
        paymentStatus: 'pending',
        platformFee,
        instituteAmount,
        metadata: {
          courseName: course.courseName,
          instructor: course.instructor,
          duration: course.duration,
          paymentGateway: 'cashfree',
          purchaseType: 'license',
          quantity: seatCount,
          pricePerSeat: baseAmount
        }
      });

      return res.status(200).json({
        success: true,
        message: 'License payment order created',
        data: {
          orderId: orderResult.data.orderId,
          paymentSessionId: orderResult.data.paymentSessionId,
          amount: totalAmount,
          quantity: seatCount,
          pricePerSeat: baseAmount,
          currency: 'INR',
          transactionId: transaction.transactionId,
          purchaseType: 'license',
          courseDetails: { courseId, courseName: course.courseName },
          cfAppId: process.env.CASHFREE_APP_ID
        }
      });
    }

    // ─── INDIVIDUAL ENROLLMENT FLOW (existing, unchanged) ──────────────
    // Check duplicate payment
    const hasPaid = await paymentTransactionModel.hasUserPaidForCourse(userId, courseId);
    if (hasPaid) {
      return res.status(400).json({ success: false, message: 'You have already purchased this course' });
    }

    // Check existing enrollment
    const enrollmentParams = {
      FilterExpression: 'userId = :userId AND courseId = :courseId',
      ExpressionAttributeValues: { ':userId': userId, ':courseId': courseId }
    };
    const existingEnrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, enrollmentParams);
    if (existingEnrollments && existingEnrollments.length > 0) {
      return res.status(400).json({ success: false, message: 'You are already enrolled in this course' });
    }

    const amount = baseAmount;
    }

    // Calculate platform fee
    const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 10;
    const platformFee = (amount * platformFeePercentage) / 100;
    const instituteAmount = amount - platformFee;

    console.log('💰 Payment calculation:', { amount, platformFee, instituteAmount });

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

    // Create Cashfree order
    const orderResult = await cashfreeService.createOrder({
      orderId,
      amount,
      currency: 'INR',
      customerDetails: {
        customer_id: userId,
        customer_name: req.user.name || req.user.fullName || 'Customer',
        customer_email: req.user.email || '',
        customer_phone: req.user.phone || '9999999999'
      },
      orderMeta: {
        return_url: `${process.env.FRONTEND_URL || 'https://staffinn.com'}/payment/callback?order_id={order_id}`,
        notify_url: `${process.env.API_BASE_URL || 'https://api.staffinn.com'}/api/v1/payments/webhook`
      },
      orderNote: JSON.stringify({ courseId, courseName: course.courseName, userId, instituteId: course.instituteId })
    });

    if (!orderResult.success) {
      console.error('❌ Cashfree order creation failed:', orderResult.message);
      return res.status(500).json({ success: false, message: orderResult.message || 'Failed to create payment order' });
    }

    // Create transaction record in DB
    const transaction = await paymentTransactionModel.createTransaction({
      userId,
      instituteId: course.instituteId,
      courseId,
      courseName: course.courseName,
      amount,
      currency: 'INR',
      razorpayOrderId: orderId, // Keep field name for backward compat with DB
      paymentStatus: 'pending',
      platformFee,
      instituteAmount,
      metadata: {
        courseName: course.courseName,
        instructor: course.instructor,
        duration: course.duration,
        paymentGateway: 'cashfree'
      }
    });

    console.log('✅ Payment order created:', orderId);

    res.status(200).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: orderResult.data.orderId,
        paymentSessionId: orderResult.data.paymentSessionId,
        amount,
        currency: 'INR',
        transactionId: transaction.transactionId,
        courseDetails: {
          courseId,
          courseName: course.courseName,
          instructor: course.instructor,
          duration: course.duration
        },
        cfAppId: process.env.CASHFREE_APP_ID
      }
    });
  } catch (error) {
    console.error('❌ Error creating payment order:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
};

/**
 * Verify Payment (after Cashfree redirect/callback)
 * POST /api/payment/verify
 */
const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { orderId } = req.body;

    console.log('🔐 Verifying payment:', { userId, orderId });

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    // Fetch order status from Cashfree
    const orderStatus = await cashfreeService.getOrderStatus(orderId);
    if (!orderStatus.success) {
      return res.status(500).json({ success: false, message: 'Failed to verify payment with Cashfree' });
    }

    const order = orderStatus.data;
    console.log('📋 Cashfree order status:', { orderId, status: order.order_status });

    // Get transaction from DB
    const transaction = await paymentTransactionModel.getTransactionByOrderId(orderId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Verify user owns this transaction
    if (transaction.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to transaction' });
    }

    // Check if payment is successful
    if (order.order_status !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Current status: ${order.order_status}`
      });
    }

    // Get payment details
    const paymentsResult = await cashfreeService.getPaymentsForOrder(orderId);
    const paymentInfo = paymentsResult.success && paymentsResult.data?.length > 0 ? paymentsResult.data[0] : null;

    // Update transaction status
    await paymentTransactionModel.updateTransactionStatus(transaction.transactionId, {
      paymentStatus: 'success',
      razorpayPaymentId: paymentInfo?.cf_payment_id?.toString() || orderId,
      razorpaySignature: 'cashfree_verified',
      paymentMethod: paymentInfo?.payment_group || 'online',
      metadata: {
        ...transaction.metadata,
        cfPaymentId: paymentInfo?.cf_payment_id,
        paymentMethod: paymentInfo?.payment_group,
        paymentTime: paymentInfo?.payment_time,
        bankReference: paymentInfo?.bank_reference
      }
    });

    // ─── LICENSE PURCHASE: create license instead of enrollment ──────────
    if (transaction.metadata?.purchaseType === 'license') {
      const courseLicenseModel = require('../models/courseLicenseModel');
      const license = await courseLicenseModel.createLicense({
        recruiterId: userId,
        courseId: transaction.courseId,
        courseName: transaction.courseName,
        instituteId: transaction.instituteId,
        quantityPurchased: transaction.metadata.quantity,
        pricePerSeat: transaction.metadata.pricePerSeat,
        totalAmount: transaction.amount,
        transactionId: transaction.transactionId,
        paymentStatus: 'success'
      });
      console.log('✅ License created:', license.licenseId, 'Seats:', license.quantityPurchased);

      return res.status(200).json({
        success: true,
        message: `Payment verified! ${license.quantityPurchased} course seat(s) purchased successfully.`,
        data: {
          transactionId: transaction.transactionId,
          courseId: transaction.courseId,
          courseName: transaction.courseName,
          licenseId: license.licenseId,
          quantityPurchased: license.quantityPurchased,
          purchaseType: 'license'
        }
      });
    }

    // ─── INDIVIDUAL ENROLLMENT (existing flow) ──────────────────────────
    const { v4: uuidv4 } = require('uuid');
    const enrollment = {
      enrolledID: uuidv4(),
      userId,
      courseId: transaction.courseId,
      courseName: transaction.courseName,
      instituteId: transaction.instituteId,
      enrollmentDate: new Date().toISOString(),
      enrollmentSource: 'individual',
      progressPercentage: 0,
      status: 'active',
      paymentStatus: 'paid',
      transactionId: transaction.transactionId,
      amountPaid: transaction.amount
    };

    await dynamoService.putItem(COURSE_ENROLLMENTS_TABLE, enrollment);
    console.log('✅ User enrolled:', enrollment.enrolledID);

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully. You are now enrolled in the course!',
      data: {
        transactionId: transaction.transactionId,
        courseId: transaction.courseId,
        courseName: transaction.courseName,
        enrollmentId: enrollment.enrolledID
      }
    });
  } catch (error) {
    console.error('❌ Error verifying payment:', error.message);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};

/**
 * Handle Cashfree Webhook
 * POST /api/payment/webhook
 */
const handleWebhook = async (req, res) => {
  try {
    const timestamp = req.headers['x-webhook-timestamp'];
    const signature = req.headers['x-webhook-signature'];
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    console.log('📨 Received Cashfree webhook:', req.body?.type || 'unknown');

    // Verify webhook signature
    if (signature && timestamp) {
      const isValid = cashfreeService.verifyWebhookSignature(rawBody, timestamp, signature);
      if (!isValid) {
        console.error('❌ Webhook signature verification failed');
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    const webhookData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const eventType = webhookData.type;
    const orderData = webhookData.data?.order;
    const paymentData = webhookData.data?.payment;

    console.log('Processing webhook event:', eventType, 'Order:', orderData?.order_id);

    switch (eventType) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        await handlePaymentSuccess(orderData, paymentData);
        break;
      case 'PAYMENT_FAILED_WEBHOOK':
        await handlePaymentFailure(orderData, paymentData);
        break;
      default:
        console.log('Unhandled webhook event:', eventType);
    }

    // Always respond 200 to Cashfree
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error.message);
    // Still respond 200 to prevent retries for parsing errors
    res.status(200).json({ success: true });
  }
};

/**
 * Handle Payment Success (webhook)
 */
const handlePaymentSuccess = async (orderData, paymentData) => {
  try {
    const orderId = orderData?.order_id;
    if (!orderId) return;

    console.log('✅ Processing successful payment:', orderId);

    const transaction = await paymentTransactionModel.getTransactionByOrderId(orderId);
    if (!transaction) {
      console.error('Transaction not found for order:', orderId);
      return;
    }

    if (transaction.paymentStatus !== 'success') {
      await paymentTransactionModel.updateTransactionStatus(transaction.transactionId, {
        paymentStatus: 'success',
        razorpayPaymentId: paymentData?.cf_payment_id?.toString() || orderId,
        paymentMethod: paymentData?.payment_group || 'online'
      });

      // Auto-enroll if not already enrolled
      const enrollmentParams = {
        FilterExpression: 'userId = :userId AND courseId = :courseId',
        ExpressionAttributeValues: { ':userId': transaction.userId, ':courseId': transaction.courseId }
      };
      const existing = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, enrollmentParams);

      if (!existing || existing.length === 0) {
        const { v4: uuidv4 } = require('uuid');
        await dynamoService.putItem(COURSE_ENROLLMENTS_TABLE, {
          enrolledID: uuidv4(),
          userId: transaction.userId,
          courseId: transaction.courseId,
          courseName: transaction.courseName,
          instituteId: transaction.instituteId,
          enrollmentDate: new Date().toISOString(),
          enrollmentSource: 'individual',
          progressPercentage: 0,
          status: 'active',
          paymentStatus: 'paid',
          transactionId: transaction.transactionId,
          amountPaid: transaction.amount
        });
        console.log('✅ Auto-enrolled via webhook:', orderId);
      }
    }
  } catch (error) {
    console.error('Error in handlePaymentSuccess:', error.message);
  }
};

/**
 * Handle Payment Failure (webhook)
 */
const handlePaymentFailure = async (orderData, paymentData) => {
  try {
    const orderId = orderData?.order_id;
    if (!orderId) return;

    console.log('❌ Processing failed payment:', orderId);

    const transaction = await paymentTransactionModel.getTransactionByOrderId(orderId);
    if (!transaction) {
      console.error('Transaction not found for order:', orderId);
      return;
    }

    await paymentTransactionModel.updateTransactionStatus(transaction.transactionId, {
      paymentStatus: 'failed',
      razorpayPaymentId: paymentData?.cf_payment_id?.toString() || '',
      failureReason: paymentData?.payment_message || 'Payment failed'
    });

    console.log('Payment failure recorded via webhook:', orderId);
  } catch (error) {
    console.error('Error in handlePaymentFailure:', error.message);
  }
};

/**
 * Get User Transaction History
 * GET /api/payment/transactions
 */
const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const transactions = await paymentTransactionModel.getUserTransactions(userId);
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    console.error('Error getting user transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to get transaction history' });
  }
};

/**
 * Get Institute Transaction History
 * GET /api/payment/institute/transactions
 */
const getInstituteTransactions = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    const transactions = await paymentTransactionModel.getInstituteTransactions(instituteId);
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    console.error('Error getting institute transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to get transaction history' });
  }
};

/**
 * Check Payment Status for Course
 * GET /api/payment/check-status/:courseId
 */
const checkPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    const hasPaid = await paymentTransactionModel.hasUserPaidForCourse(userId, courseId);
    res.status(200).json({ success: true, data: { hasPaid, courseId } });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ success: false, message: 'Failed to check payment status' });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  getUserTransactions,
  getInstituteTransactions,
  checkPaymentStatus
};
