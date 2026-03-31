const razorpayService = require('../services/razorpayService');
const paymentTransactionModel = require('../models/paymentTransactionModel');
const instituteBankDetailsModel = require('../models/instituteBankDetailsModel');
const dynamoService = require('../services/dynamoService');

const COURSES_TABLE = 'staffinn-courses';
const COURSE_ENROLLMENTS_TABLE = 'course-enrolled-user';

/**
 * Create Payment Order
 * POST /api/payment/create-order
 */
const createPaymentOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.body;

    console.log('📦 Creating payment order for:', { userId, courseId });

    // Validate courseId
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Get course details
    const course = await dynamoService.getItem(COURSES_TABLE, {
      coursesId: courseId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    console.log('📚 Course details:', { courseName: course.courseName, mode: course.mode, fees: course.fees });

    // Check if course is online (only online courses require payment)
    if (course.mode !== 'Online') {
      return res.status(400).json({
        success: false,
        message: 'Payment is only required for online courses'
      });
    }

    // Check if user has already paid for this course
    const hasPaid = await paymentTransactionModel.hasUserPaidForCourse(userId, courseId);
    if (hasPaid) {
      return res.status(400).json({
        success: false,
        message: 'You have already purchased this course'
      });
    }

    // Check if user is already enrolled (shouldn't happen, but double-check)
    const enrollmentParams = {
      FilterExpression: 'userId = :userId AND courseId = :courseId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':courseId': courseId
      }
    };
    const existingEnrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, enrollmentParams);
    if (existingEnrollments && existingEnrollments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    const amount = parseFloat(course.fees) || 0;

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course fee amount'
      });
    }

    // Calculate platform fee (e.g., 10% commission)
    const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE) || 10;
    const platformFee = (amount * platformFeePercentage) / 100;
    const instituteAmount = amount - platformFee;

    console.log('💰 Payment calculation:', { amount, platformFee, instituteAmount });

    // Create Razorpay order
    const orderResult = await razorpayService.createOrder(amount, 'INR', {
      courseId: courseId,
      courseName: course.courseName,
      userId: userId,
      instituteId: course.instituteId
    });

    if (!orderResult.success) {
      console.error('❌ Razorpay order creation failed:', orderResult.message);
      return res.status(500).json({
        success: false,
        message: orderResult.message || 'Failed to create payment order'
      });
    }

    // Create transaction record
    const transaction = await paymentTransactionModel.createTransaction({
      userId: userId,
      instituteId: course.instituteId,
      courseId: courseId,
      courseName: course.courseName,
      amount: amount,
      currency: 'INR',
      razorpayOrderId: orderResult.data.id,
      paymentStatus: 'pending',
      platformFee: platformFee,
      instituteAmount: instituteAmount,
      metadata: {
        courseName: course.courseName,
        instructor: course.instructor,
        duration: course.duration
      }
    });

    console.log('✅ Payment order created successfully:', orderResult.data.id);

    res.status(200).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: orderResult.data.id,
        amount: amount,
        currency: 'INR',
        transactionId: transaction.transactionId,
        courseDetails: {
          courseId: courseId,
          courseName: course.courseName,
          instructor: course.instructor,
          duration: course.duration
        },
        razorpayKeyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('❌ Error creating payment order:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
};

/**
 * Verify Payment
 * POST /api/payment/verify
 */
const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    console.log('🔐 Verifying payment:', { 
      userId,
      razorpayOrderId, 
      razorpayPaymentId,
      hasSignature: !!razorpaySignature 
    });

    // Validate required fields
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      console.error('❌ Missing payment verification details:', {
        hasOrderId: !!razorpayOrderId,
        hasPaymentId: !!razorpayPaymentId,
        hasSignature: !!razorpaySignature
      });
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details'
      });
    }

    // Verify signature
    console.log('🔍 Verifying signature...');
    const isValid = razorpayService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      console.error('❌ Payment signature verification failed');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.'
      });
    }
    console.log('✅ Signature verified successfully');

    // Get transaction by order ID
    console.log('🔍 Fetching transaction for order:', razorpayOrderId);
    const transaction = await paymentTransactionModel.getTransactionByOrderId(razorpayOrderId);

    if (!transaction) {
      console.error('❌ Transaction not found for order:', razorpayOrderId);
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    console.log('✅ Transaction found:', transaction.transactionId);

    // Verify user owns this transaction
    if (transaction.userId !== userId) {
      console.error('❌ User mismatch:', { transactionUserId: transaction.userId, requestUserId: userId });
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to transaction'
      });
    }

    // Fetch payment details from Razorpay
    console.log('🔍 Fetching payment details from Razorpay...');
    const paymentDetails = await razorpayService.fetchPaymentDetails(razorpayPaymentId);

    if (!paymentDetails.success) {
      console.error('❌ Failed to fetch payment details:', paymentDetails.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payment details from Razorpay'
      });
    }
    console.log('✅ Payment details fetched successfully');

    const payment = paymentDetails.data;

    // Update transaction status
    console.log('💾 Updating transaction status...');
    await paymentTransactionModel.updateTransactionStatus(transaction.transactionId, {
      paymentStatus: 'success',
      razorpayPaymentId: razorpayPaymentId,
      razorpaySignature: razorpaySignature,
      paymentMethod: payment.method,
      metadata: {
        ...transaction.metadata,
        paymentEmail: payment.email,
        paymentContact: payment.contact,
        paymentCard: payment.card ? {
          last4: payment.card.last4,
          network: payment.card.network
        } : null
      }
    });
    console.log('✅ Transaction status updated');

    // Enroll user in course
    console.log('📚 Enrolling user in course...');
    const { v4: uuidv4 } = require('uuid');
    const enrollment = {
      enrolledID: uuidv4(),
      userId: userId,
      courseId: transaction.courseId,
      courseName: transaction.courseName,
      instituteId: transaction.instituteId,
      enrollmentDate: new Date().toISOString(),
      progressPercentage: 0,
      status: 'active',
      paymentStatus: 'paid',
      transactionId: transaction.transactionId,
      amountPaid: transaction.amount
    };

    await dynamoService.putItem(COURSE_ENROLLMENTS_TABLE, enrollment);
    console.log('✅ User enrolled successfully:', enrollment.enrolledID);

    console.log('🎉 Payment verified and user enrolled successfully');

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
    console.error('❌ Error verifying payment:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
};

/**
 * Handle Payment Webhook
 * POST /api/payment/webhook
 */
const handleWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);

    console.log('Received webhook:', req.body.event);

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(webhookBody, webhookSignature);

    if (!isValid) {
      console.error('Webhook signature verification failed');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const event = req.body.event;
    const payload = req.body.payload.payment || req.body.payload.order;

    console.log('Processing webhook event:', event);

    switch (event) {
      case 'payment.captured':
      case 'payment.authorized':
        await handlePaymentSuccess(payload);
        break;

      case 'payment.failed':
        await handlePaymentFailure(payload);
        break;

      case 'order.paid':
        console.log('Order paid event received:', payload.entity.id);
        break;

      case 'refund.created':
      case 'refund.processed':
        await handleRefund(payload);
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

/**
 * Handle Payment Success (from webhook)
 */
const handlePaymentSuccess = async (payment) => {
  try {
    console.log('Processing successful payment:', payment.entity.id);

    const orderId = payment.entity.order_id;
    const paymentId = payment.entity.id;

    // Get transaction
    const transaction = await paymentTransactionModel.getTransactionByOrderId(orderId);

    if (!transaction) {
      console.error('Transaction not found for order:', orderId);
      return;
    }

    // Update transaction if not already updated
    if (transaction.paymentStatus !== 'success') {
      await paymentTransactionModel.updateTransactionStatus(transaction.transactionId, {
        paymentStatus: 'success',
        razorpayPaymentId: paymentId,
        paymentMethod: payment.entity.method
      });

      console.log('Payment success processed via webhook');
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
};

/**
 * Handle Payment Failure (from webhook)
 */
const handlePaymentFailure = async (payment) => {
  try {
    console.log('Processing failed payment:', payment.entity.id);

    const orderId = payment.entity.order_id;

    // Get transaction
    const transaction = await paymentTransactionModel.getTransactionByOrderId(orderId);

    if (!transaction) {
      console.error('Transaction not found for order:', orderId);
      return;
    }

    // Update transaction
    await paymentTransactionModel.updateTransactionStatus(transaction.transactionId, {
      paymentStatus: 'failed',
      razorpayPaymentId: payment.entity.id,
      failureReason: payment.entity.error_description || 'Payment failed'
    });

    console.log('Payment failure processed via webhook');
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
};

/**
 * Handle Refund (from webhook)
 */
const handleRefund = async (refund) => {
  try {
    console.log('Processing refund:', refund.entity.id);

    const paymentId = refund.entity.payment_id;

    // Find transaction by payment ID
    const params = {
      FilterExpression: 'razorpayPaymentId = :paymentId',
      ExpressionAttributeValues: {
        ':paymentId': paymentId
      }
    };

    const transactions = await dynamoService.scanItems('payment-transactions', params);

    if (transactions && transactions.length > 0) {
      const transaction = transactions[0];

      await paymentTransactionModel.updateTransactionStatus(transaction.transactionId, {
        paymentStatus: 'refunded',
        metadata: {
          ...transaction.metadata,
          refundId: refund.entity.id,
          refundAmount: refund.entity.amount / 100,
          refundReason: refund.entity.notes?.reason || 'Refund processed'
        }
      });

      console.log('Refund processed via webhook');
    }
  } catch (error) {
    console.error('Error handling refund:', error);
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

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error getting user transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction history'
    });
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

    res.status(200).json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error getting institute transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction history'
    });
  }
};

/**
 * Check Payment Status for Course
 * GET /api/payment/status/:courseId
 */
const checkPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;

    const hasPaid = await paymentTransactionModel.hasUserPaidForCourse(userId, courseId);

    res.status(200).json({
      success: true,
      data: {
        hasPaid: hasPaid,
        courseId: courseId
      }
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status'
    });
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
