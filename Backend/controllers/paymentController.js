const Razorpay = require('razorpay');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

const PAYMENT_TRANSACTIONS_TABLE = 'payment-transactions';
const COURSES_TABLE = 'staffinn-courses';
const COURSE_ENROLLMENTS_TABLE = 'course-enrolled-user';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create Razorpay order for course purchase
 */
const createOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.body;

    console.log('💳 Creating payment order:', { userId, courseId });

    // Get course details
    const course = await dynamoService.getItem(COURSES_TABLE, { coursesId: courseId });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.fees || course.fees <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Course is free or has invalid pricing'
      });
    }

    // Check if already enrolled
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
        message: 'Already enrolled in this course'
      });
    }

    // Create Razorpay order
    const amount = Math.round(course.fees * 100); // Convert to paise
    const options = {
      amount,
      currency: 'INR',
      receipt: `course_${courseId}_${Date.now()}`,
      notes: {
        courseId,
        courseName: course.courseName,
        userId,
        instituteId: course.instituteId
      }
    };

    const order = await razorpay.orders.create(options);
    console.log('✅ Razorpay order created:', order.id);

    // Save transaction record
    const transactionId = uuidv4();
    const transaction = {
      transactionId,
      orderId: order.id,
      userId,
      courseId,
      instituteId: course.instituteId,
      amount: course.fees,
      currency: 'INR',
      status: 'created',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoService.putItem(PAYMENT_TRANSACTIONS_TABLE, transaction);

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        courseName: course.courseName,
        courseInstructor: course.instructor
      }
    });
  } catch (error) {
    console.error('❌ Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
};

/**
 * Verify payment signature and complete enrollment
 */
const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      courseId 
    } = req.body;

    console.log('🔐 Verifying payment:', { razorpay_order_id, razorpay_payment_id });

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error('❌ Invalid payment signature');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Get transaction record
    const transactionParams = {
      FilterExpression: 'orderId = :orderId',
      ExpressionAttributeValues: {
        ':orderId': razorpay_order_id
      }
    };
    const transactions = await dynamoService.scanItems(PAYMENT_TRANSACTIONS_TABLE, transactionParams);
    const transaction = transactions && transactions.length > 0 ? transactions[0] : null;

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Get course details
    const course = await dynamoService.getItem(COURSES_TABLE, { coursesId: courseId });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Update transaction status
    const updateParams = {
      UpdateExpression: 'SET #status = :status, paymentId = :paymentId, signature = :signature, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'completed',
        ':paymentId': razorpay_payment_id,
        ':signature': razorpay_signature,
        ':updatedAt': new Date().toISOString()
      }
    };
    await dynamoService.updateItem(PAYMENT_TRANSACTIONS_TABLE, { transactionId: transaction.transactionId }, updateParams);

    // Create enrollment
    const enrollmentId = uuidv4();
    const enrollment = {
      enrolledID: enrollmentId,
      userId,
      courseId,
      courseName: course.courseName,
      instituteId: course.instituteId,
      enrollmentDate: new Date().toISOString(),
      progressPercentage: 0,
      status: 'active',
      paymentStatus: 'paid',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      amountPaid: transaction.amount
    };

    await dynamoService.putItem(COURSE_ENROLLMENTS_TABLE, enrollment);
    console.log('✅ Enrollment created successfully');

    // TODO: Implement transfer to institute account using Razorpay Route/Transfer API
    // This requires setting up linked accounts for institutes in Razorpay

    res.status(200).json({
      success: true,
      message: 'Payment verified and enrollment completed',
      data: {
        enrollmentId,
        paymentId: razorpay_payment_id
      }
    });
  } catch (error) {
    console.error('❌ Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    });
  }
};

/**
 * Get payment history for user
 */
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const params = {
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };

    const transactions = await dynamoService.scanItems(PAYMENT_TRANSACTIONS_TABLE, params);

    // Enrich with course details
    const enrichedTransactions = await Promise.all(
      (transactions || []).map(async (transaction) => {
        const course = await dynamoService.getItem(COURSES_TABLE, { coursesId: transaction.courseId });
        return {
          ...transaction,
          courseName: course?.courseName || 'Unknown Course',
          courseInstructor: course?.instructor || 'Unknown'
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enrichedTransactions
    });
  } catch (error) {
    console.error('❌ Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history'
    });
  }
};

/**
 * Get institute earnings
 */
const getInstituteEarnings = async (req, res) => {
  try {
    const instituteId = req.user.userId;

    const params = {
      FilterExpression: 'instituteId = :instituteId AND #status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':instituteId': instituteId,
        ':status': 'completed'
      }
    };

    const transactions = await dynamoService.scanItems(PAYMENT_TRANSACTIONS_TABLE, params);

    const totalEarnings = (transactions || []).reduce((sum, t) => sum + (t.amount || 0), 0);
    const transactionCount = transactions?.length || 0;

    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        transactionCount,
        transactions: transactions || []
      }
    });
  } catch (error) {
    console.error('❌ Get institute earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get earnings'
    });
  }
};

/**
 * Handle payment failure
 */
const handlePaymentFailure = async (req, res) => {
  try {
    const { orderId, error } = req.body;

    console.log('❌ Payment failed:', { orderId, error });

    // Update transaction status
    const transactionParams = {
      FilterExpression: 'orderId = :orderId',
      ExpressionAttributeValues: {
        ':orderId': orderId
      }
    };
    const transactions = await dynamoService.scanItems(PAYMENT_TRANSACTIONS_TABLE, transactionParams);
    const transaction = transactions && transactions.length > 0 ? transactions[0] : null;

    if (transaction) {
      const updateParams = {
        UpdateExpression: 'SET #status = :status, errorMessage = :error, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'failed',
          ':error': error || 'Payment failed',
          ':updatedAt': new Date().toISOString()
        }
      };
      await dynamoService.updateItem(PAYMENT_TRANSACTIONS_TABLE, { transactionId: transaction.transactionId }, updateParams);
    }

    res.status(200).json({
      success: true,
      message: 'Payment failure recorded'
    });
  } catch (error) {
    console.error('❌ Handle payment failure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle payment failure'
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getPaymentHistory,
  getInstituteEarnings,
  handlePaymentFailure
};
