const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

const PAYMENT_TRANSACTIONS_TABLE = 'payment-transactions';

/**
 * Create Payment Transaction
 */
const createTransaction = async (transactionData) => {
  try {
    const transaction = {
      transactionId: uuidv4(),
      userId: transactionData.userId,
      instituteId: transactionData.instituteId,
      courseId: transactionData.courseId,
      courseName: transactionData.courseName,
      amount: transactionData.amount, // Amount in rupees
      currency: transactionData.currency || 'INR',
      razorpayOrderId: transactionData.razorpayOrderId,
      razorpayPaymentId: transactionData.razorpayPaymentId || null,
      razorpaySignature: transactionData.razorpaySignature || null,
      paymentStatus: transactionData.paymentStatus || 'pending', // pending, success, failed, refunded
      paymentMethod: transactionData.paymentMethod || null,
      platformFee: transactionData.platformFee || 0, // Your platform commission
      instituteAmount: transactionData.instituteAmount || transactionData.amount, // Amount to be transferred to institute
      failureReason: transactionData.failureReason || null,
      metadata: transactionData.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoService.putItem(PAYMENT_TRANSACTIONS_TABLE, transaction);
    console.log('Payment transaction created:', transaction.transactionId);
    
    return transaction;
  } catch (error) {
    console.error('Error creating payment transaction:', error);
    throw error;
  }
};

/**
 * Update Transaction Status
 */
const updateTransactionStatus = async (transactionId, updateData) => {
  try {
    console.log('💾 Updating transaction:', transactionId);
    
    const updates = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    if (updateData.paymentStatus) {
      updates.push('#paymentStatus = :paymentStatus');
      expressionAttributeNames['#paymentStatus'] = 'paymentStatus';
      expressionAttributeValues[':paymentStatus'] = updateData.paymentStatus;
    }
    
    if (updateData.razorpayPaymentId) {
      updates.push('#razorpayPaymentId = :razorpayPaymentId');
      expressionAttributeNames['#razorpayPaymentId'] = 'razorpayPaymentId';
      expressionAttributeValues[':razorpayPaymentId'] = updateData.razorpayPaymentId;
    }
    
    if (updateData.razorpaySignature) {
      updates.push('#razorpaySignature = :razorpaySignature');
      expressionAttributeNames['#razorpaySignature'] = 'razorpaySignature';
      expressionAttributeValues[':razorpaySignature'] = updateData.razorpaySignature;
    }
    
    if (updateData.paymentMethod) {
      updates.push('#paymentMethod = :paymentMethod');
      expressionAttributeNames['#paymentMethod'] = 'paymentMethod';
      expressionAttributeValues[':paymentMethod'] = updateData.paymentMethod;
    }
    
    if (updateData.failureReason) {
      updates.push('#failureReason = :failureReason');
      expressionAttributeNames['#failureReason'] = 'failureReason';
      expressionAttributeValues[':failureReason'] = updateData.failureReason;
    }
    
    if (updateData.metadata) {
      updates.push('#metadata = :metadata');
      expressionAttributeNames['#metadata'] = 'metadata';
      expressionAttributeValues[':metadata'] = updateData.metadata;
    }

    // Always update updatedAt
    updates.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const params = {
      UpdateExpression: 'SET ' + updates.join(', '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    // Use correct function signature: updateItem(tableName, key, params)
    const result = await dynamoService.updateItem(
      PAYMENT_TRANSACTIONS_TABLE,
      { transactionId }, // Key object
      params // Update params
    );
    
    console.log('✅ Transaction updated successfully');
    return result;
  } catch (error) {
    console.error('❌ Error updating transaction:', error);
    throw error;
  }
};

/**
 * Get Transaction by ID
 */
const getTransactionById = async (transactionId) => {
  try {
    const transaction = await dynamoService.getItem(PAYMENT_TRANSACTIONS_TABLE, {
      transactionId
    });
    return transaction;
  } catch (error) {
    console.error('Error getting transaction:', error);
    throw error;
  }
};

/**
 * Get Transaction by Razorpay Order ID
 */
const getTransactionByOrderId = async (razorpayOrderId) => {
  try {
    console.log('🔍 Searching transaction by order ID:', razorpayOrderId);
    
    const params = {
      FilterExpression: 'razorpayOrderId = :orderId',
      ExpressionAttributeValues: {
        ':orderId': razorpayOrderId
      }
    };
    
    const result = await dynamoService.scanItems(PAYMENT_TRANSACTIONS_TABLE, params);
    console.log('📊 Transactions found:', result?.length || 0);
    
    return result && result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('❌ Error getting transaction by order ID:', error);
    throw error;
  }
};

/**
 * Get User Transactions
 */
const getUserTransactions = async (userId) => {
  try {
    const params = {
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false // Sort by createdAt descending
    };
    
    const transactions = await dynamoService.queryItems(PAYMENT_TRANSACTIONS_TABLE, params);
    return transactions || [];
  } catch (error) {
    console.error('Error getting user transactions:', error);
    throw error;
  }
};

/**
 * Get Institute Transactions
 */
const getInstituteTransactions = async (instituteId) => {
  try {
    const params = {
      IndexName: 'instituteId-index',
      KeyConditionExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': instituteId
      },
      ScanIndexForward: false // Sort by createdAt descending
    };
    
    const transactions = await dynamoService.queryItems(PAYMENT_TRANSACTIONS_TABLE, params);
    return transactions || [];
  } catch (error) {
    console.error('Error getting institute transactions:', error);
    throw error;
  }
};

/**
 * Get Course Transactions
 */
const getCourseTransactions = async (courseId) => {
  try {
    const params = {
      IndexName: 'courseId-index',
      KeyConditionExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    };
    
    const transactions = await dynamoService.queryItems(PAYMENT_TRANSACTIONS_TABLE, params);
    return transactions || [];
  } catch (error) {
    console.error('Error getting course transactions:', error);
    throw error;
  }
};

/**
 * Get Transactions by Status
 */
const getTransactionsByStatus = async (status, startDate = null, endDate = null) => {
  try {
    const params = {
      IndexName: 'paymentStatus-index',
      KeyConditionExpression: 'paymentStatus = :status',
      ExpressionAttributeValues: {
        ':status': status
      },
      ScanIndexForward: false
    };
    
    if (startDate && endDate) {
      params.KeyConditionExpression += ' AND createdAt BETWEEN :startDate AND :endDate';
      params.ExpressionAttributeValues[':startDate'] = startDate;
      params.ExpressionAttributeValues[':endDate'] = endDate;
    }
    
    const transactions = await dynamoService.queryItems(PAYMENT_TRANSACTIONS_TABLE, params);
    return transactions || [];
  } catch (error) {
    console.error('Error getting transactions by status:', error);
    throw error;
  }
};

/**
 * Check if User has Paid for Course
 */
const hasUserPaidForCourse = async (userId, courseId) => {
  try {
    console.log('🔍 Checking payment for:', { userId, courseId });
    
    const params = {
      FilterExpression: 'userId = :userId AND courseId = :courseId AND paymentStatus = :status',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':courseId': courseId,
        ':status': 'success'
      }
    };
    
    const transactions = await dynamoService.scanItems(PAYMENT_TRANSACTIONS_TABLE, params);
    console.log('💳 Payment transactions found:', transactions?.length || 0);
    
    return transactions && transactions.length > 0;
  } catch (error) {
    console.error('❌ Error checking user payment:', error);
    throw error;
  }
};

module.exports = {
  createTransaction,
  updateTransactionStatus,
  getTransactionById,
  getTransactionByOrderId,
  getUserTransactions,
  getInstituteTransactions,
  getCourseTransactions,
  getTransactionsByStatus,
  hasUserPaidForCourse
};
