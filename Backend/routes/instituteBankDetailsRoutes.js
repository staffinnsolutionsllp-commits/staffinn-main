const express = require('express');
const router = express.Router();
const instituteBankDetailsController = require('../controllers/instituteBankDetailsController');
const { protect } = require('../middleware/auth');

// Institute routes (protected)
router.post('/bank-details', protect, instituteBankDetailsController.saveBankDetails);
router.get('/bank-details', protect, instituteBankDetailsController.getBankDetails);
router.delete('/bank-details', protect, instituteBankDetailsController.deleteBankDetails);

// Admin routes (protected - add admin middleware if available)
router.put('/bank-details/:instituteId/verify', protect, instituteBankDetailsController.updateVerificationStatus);
router.get('/bank-details/pending', protect, instituteBankDetailsController.getPendingVerifications);
router.get('/bank-details/verified', protect, instituteBankDetailsController.getVerifiedInstitutes);

module.exports = router;
