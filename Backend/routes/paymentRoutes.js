const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// Create payment order
router.post('/create-order', authenticate, paymentController.createOrder);

// Verify payment
router.post('/verify', authenticate, paymentController.verifyPayment);

// Get payment history
router.get('/history', authenticate, paymentController.getPaymentHistory);

// Get institute earnings
router.get('/institute-earnings', authenticate, paymentController.getInstituteEarnings);

// Handle payment failure
router.post('/failure', authenticate, paymentController.handlePaymentFailure);

module.exports = router;
