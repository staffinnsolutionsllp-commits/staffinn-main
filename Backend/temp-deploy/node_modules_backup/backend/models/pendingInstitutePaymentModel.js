const { scanTable, putItem, updateItem, getItem } = require('../config/dynamoDB');
const { v4: uuidv4 } = require('uuid');

const PENDING_PAYMENTS_TABLE = 'staffinn-pending-institute-payments';

const createPendingPayment = async (paymentData) => {
  const enrollmentId = uuidv4();
  const payment = {
    enrollmentId: enrollmentId, // Primary key for DynamoDB table
    pendingPaymentId: enrollmentId, // Keep for backward compatibility
    userId: paymentData.userId,
    studentId: paymentData.userId, // For GSI
    userName: paymentData.userName,
    userEmail: paymentData.userEmail,
    courseId: paymentData.courseId,
    courseName: paymentData.courseName,
    instituteId: paymentData.instituteId,
    instituteName: paymentData.instituteName,
    amount: paymentData.amount,
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await putItem(PENDING_PAYMENTS_TABLE, payment);
  return payment;
};

const getPendingPaymentsByInstitute = async (instituteId, status = null) => {
  let params = {
    TableName: PENDING_PAYMENTS_TABLE,
    FilterExpression: 'instituteId = :instituteId',
    ExpressionAttributeValues: {
      ':instituteId': instituteId
    }
  };
  
  if (status) {
    params.FilterExpression += ' AND paymentStatus = :status';
    params.ExpressionAttributeValues[':status'] = status;
  }

  return await scanTable(params);
};

const getPendingPaymentById = async (pendingPaymentId) => {
  return await getItem(PENDING_PAYMENTS_TABLE, { enrollmentId: pendingPaymentId });
};

const updatePaymentStatus = async (pendingPaymentId, status, verifiedBy = null, notes = null) => {
  let updateExpression = 'SET paymentStatus = :status, updatedAt = :updatedAt';
  let expressionValues = {
    ':status': status,
    ':updatedAt': new Date().toISOString()
  };
  
  if (verifiedBy) {
    updateExpression += ', verifiedBy = :verifiedBy';
    expressionValues[':verifiedBy'] = verifiedBy;
  }
  
  if (notes) {
    updateExpression += ', notes = :notes';
    expressionValues[':notes'] = notes;
  }
  
  if (status === 'paid') {
    updateExpression += ', paidAt = :paidAt';
    expressionValues[':paidAt'] = new Date().toISOString();
  }
  
  const params = {
    TableName: PENDING_PAYMENTS_TABLE,
    Key: { enrollmentId: pendingPaymentId }, // Use enrollmentId as primary key
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionValues,
    ReturnValues: 'ALL_NEW'
  };

  return await updateItem(params);
};

const hasPendingPayment = async (courseId, userId) => {
  const params = {
    TableName: PENDING_PAYMENTS_TABLE,
    FilterExpression: 'courseId = :courseId AND userId = :userId AND paymentStatus = :status',
    ExpressionAttributeValues: {
      ':courseId': courseId,
      ':userId': userId,
      ':status': 'pending'
    }
  };

  const results = await scanTable(params);
  return results && results.length > 0;
};

const approvePayment = async (pendingPaymentId, instituteId, notes = '') => {
  try {
    console.log('✅ Model: Approving payment:', pendingPaymentId);
    
    // Get payment details
    const payment = await getPendingPaymentById(pendingPaymentId);
    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }
    
    // Verify institute owns this payment
    if (payment.instituteId !== instituteId) {
      return { success: false, message: 'Unauthorized to approve this payment' };
    }
    
    // Update payment status to paid
    const updated = await updatePaymentStatus(pendingPaymentId, 'paid', instituteId, notes);
    
    // Create enrollment in course-enrolled-user table
    const enrollmentData = {
      enrolledID: uuidv4(),
      courseId: payment.courseId,
      userId: payment.userId,
      userName: payment.userName,
      userEmail: payment.userEmail,
      enrolledAt: new Date().toISOString(),
      paymentStatus: 'paid',
      paymentMethod: 'pay_at_institute',
      verifiedBy: instituteId,
      progressPercentage: 0
    };
    
    await putItem('course-enrolled-user', enrollmentData);
    console.log('✅ Enrollment created:', enrollmentData.enrolledID);
    
    return { success: true, data: updated };
  } catch (error) {
    console.error('❌ Model: Approve payment error:', error);
    return { success: false, message: error.message };
  }
};

const rejectPayment = async (pendingPaymentId, instituteId, notes) => {
  try {
    console.log('❌ Model: Rejecting payment:', pendingPaymentId);
    
    // Get payment details
    const payment = await getPendingPaymentById(pendingPaymentId);
    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }
    
    // Verify institute owns this payment
    if (payment.instituteId !== instituteId) {
      return { success: false, message: 'Unauthorized to reject this payment' };
    }
    
    // Update payment status to rejected
    const updated = await updatePaymentStatus(pendingPaymentId, 'rejected', instituteId, notes);
    
    console.log('✅ Payment rejected successfully');
    return { success: true, data: updated };
  } catch (error) {
    console.error('❌ Model: Reject payment error:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  createPendingPayment,
  getPendingPaymentsByInstitute,
  getPendingPaymentById,
  updatePaymentStatus,
  hasPendingPayment,
  approvePayment,
  rejectPayment
};
