const dynamoService = require('../services/dynamoService');

const INSTITUTE_BANK_DETAILS_TABLE = 'institute-bank-details';

/**
 * Save or Update Institute Bank Details
 */
const saveBankDetails = async (instituteId, bankData) => {
  try {
    const bankDetails = {
      instituteId,
      accountHolderName: bankData.accountHolderName,
      accountNumber: bankData.accountNumber,
      ifscCode: bankData.ifscCode,
      bankName: bankData.bankName,
      branchName: bankData.branchName,
      accountType: bankData.accountType || 'savings', // savings, current
      panNumber: bankData.panNumber, // Required for tax purposes
      gstNumber: bankData.gstNumber || null, // Optional
      razorpayAccountId: bankData.razorpayAccountId || null, // Razorpay linked account ID
      isVerified: bankData.isVerified || 'pending', // pending, verified, rejected
      verificationNotes: bankData.verificationNotes || null,
      createdAt: bankData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoService.putItem(INSTITUTE_BANK_DETAILS_TABLE, bankDetails);
    console.log('Bank details saved for institute:', instituteId);
    
    return bankDetails;
  } catch (error) {
    console.error('Error saving bank details:', error);
    throw error;
  }
};

/**
 * Get Institute Bank Details
 */
const getBankDetails = async (instituteId) => {
  try {
    const bankDetails = await dynamoService.getItem(INSTITUTE_BANK_DETAILS_TABLE, {
      instituteId
    });
    return bankDetails;
  } catch (error) {
    console.error('Error getting bank details:', error);
    throw error;
  }
};

/**
 * Update Verification Status
 */
const updateVerificationStatus = async (instituteId, status, notes = null) => {
  try {
    const params = {
      Key: { instituteId },
      UpdateExpression: 'SET isVerified = :status, verificationNotes = :notes, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':status': status,
        ':notes': notes,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoService.updateItem(INSTITUTE_BANK_DETAILS_TABLE, params);
    console.log('Bank verification status updated:', instituteId, status);
    
    return result.Attributes;
  } catch (error) {
    console.error('Error updating verification status:', error);
    throw error;
  }
};

/**
 * Update Razorpay Account ID
 */
const updateRazorpayAccountId = async (instituteId, razorpayAccountId) => {
  try {
    const params = {
      Key: { instituteId },
      UpdateExpression: 'SET razorpayAccountId = :accountId, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':accountId': razorpayAccountId,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoService.updateItem(INSTITUTE_BANK_DETAILS_TABLE, params);
    console.log('Razorpay account ID updated:', instituteId);
    
    return result.Attributes;
  } catch (error) {
    console.error('Error updating Razorpay account ID:', error);
    throw error;
  }
};

/**
 * Get All Pending Verifications
 */
const getPendingVerifications = async () => {
  try {
    const params = {
      IndexName: 'isVerified-index',
      KeyConditionExpression: 'isVerified = :status',
      ExpressionAttributeValues: {
        ':status': 'pending'
      }
    };
    
    const result = await dynamoService.queryItems(INSTITUTE_BANK_DETAILS_TABLE, params);
    return result || [];
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    throw error;
  }
};

/**
 * Get All Verified Institutes
 */
const getVerifiedInstitutes = async () => {
  try {
    const params = {
      IndexName: 'isVerified-index',
      KeyConditionExpression: 'isVerified = :status',
      ExpressionAttributeValues: {
        ':status': 'verified'
      }
    };
    
    const result = await dynamoService.queryItems(INSTITUTE_BANK_DETAILS_TABLE, params);
    return result || [];
  } catch (error) {
    console.error('Error getting verified institutes:', error);
    throw error;
  }
};

/**
 * Delete Bank Details
 */
const deleteBankDetails = async (instituteId) => {
  try {
    await dynamoService.deleteItem(INSTITUTE_BANK_DETAILS_TABLE, { instituteId });
    console.log('Bank details deleted for institute:', instituteId);
    return true;
  } catch (error) {
    console.error('Error deleting bank details:', error);
    throw error;
  }
};

module.exports = {
  saveBankDetails,
  getBankDetails,
  updateVerificationStatus,
  updateRazorpayAccountId,
  getPendingVerifications,
  getVerifiedInstitutes,
  deleteBankDetails
};
