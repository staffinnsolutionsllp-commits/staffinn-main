const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// User payment routes (require authentication)
router.post('/create-order', protect, paymentController.createPaymentOrder);
router.post('/verify', protect, paymentController.verifyPayment);
router.get('/transactions', protect, paymentController.getUserTransactions);
router.get('/check-status/:courseId', protect, paymentController.checkPaymentStatus);

// Institute payment routes (require authentication)
router.get('/institute/transactions', protect, paymentController.getInstituteTransactions);

// Webhook route (no authentication - verified by signature)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

module.exports = router;
