const instituteBankDetailsModel = require('../models/instituteBankDetailsModel');

/**
 * Save or Update Institute Bank Details
 */
const saveBankDetails = async (req, res) => {
  try {
    const instituteId = req.user.userId; // From auth middleware
    const bankData = req.body;

    // Validate required fields
    if (!bankData.accountHolderName || !bankData.accountNumber || !bankData.ifscCode || !bankData.bankName || !bankData.panNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: accountHolderName, accountNumber, ifscCode, bankName, panNumber'
      });
    }

    const savedDetails = await instituteBankDetailsModel.saveBankDetails(instituteId, bankData);

    res.status(200).json({
      success: true,
      message: 'Bank details saved successfully. Verification pending.',
      data: savedDetails
    });
  } catch (error) {
    console.error('Error saving bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save bank details',
      error: error.message
    });
  }
};

/**
 * Get Institute Bank Details
 */
const getBankDetails = async (req, res) => {
  try {
    const instituteId = req.user.userId;

    const bankDetails = await instituteBankDetailsModel.getBankDetails(instituteId);

    if (!bankDetails) {
      return res.status(404).json({
        success: false,
        message: 'Bank details not found'
      });
    }

    res.status(200).json({
      success: true,
      data: bankDetails
    });
  } catch (error) {
    console.error('Error fetching bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank details',
      error: error.message
    });
  }
};

/**
 * Update Verification Status (Admin Only)
 */
const updateVerificationStatus = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const { status, notes } = req.body;

    // Validate status
    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: pending, verified, or rejected'
      });
    }

    const updatedDetails = await instituteBankDetailsModel.updateVerificationStatus(instituteId, status, notes);

    res.status(200).json({
      success: true,
      message: 'Verification status updated successfully',
      data: updatedDetails
    });
  } catch (error) {
    console.error('Error updating verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update verification status',
      error: error.message
    });
  }
};

/**
 * Get All Pending Verifications (Admin Only)
 */
const getPendingVerifications = async (req, res) => {
  try {
    const pendingVerifications = await instituteBankDetailsModel.getPendingVerifications();

    res.status(200).json({
      success: true,
      count: pendingVerifications.length,
      data: pendingVerifications
    });
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending verifications',
      error: error.message
    });
  }
};

/**
 * Get All Verified Institutes (Admin Only)
 */
const getVerifiedInstitutes = async (req, res) => {
  try {
    const verifiedInstitutes = await instituteBankDetailsModel.getVerifiedInstitutes();

    res.status(200).json({
      success: true,
      count: verifiedInstitutes.length,
      data: verifiedInstitutes
    });
  } catch (error) {
    console.error('Error fetching verified institutes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verified institutes',
      error: error.message
    });
  }
};

/**
 * Delete Bank Details
 */
const deleteBankDetails = async (req, res) => {
  try {
    const instituteId = req.user.userId;

    await instituteBankDetailsModel.deleteBankDetails(instituteId);

    res.status(200).json({
      success: true,
      message: 'Bank details deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bank details',
      error: error.message
    });
  }
};

module.exports = {
  saveBankDetails,
  getBankDetails,
  updateVerificationStatus,
  getPendingVerifications,
  getVerifiedInstitutes,
  deleteBankDetails
};
