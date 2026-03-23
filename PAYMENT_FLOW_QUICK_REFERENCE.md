# Razorpay Payment Flow - Quick Reference

## Payment Flow Diagram

```
User Clicks "Buy Course"
         ↓
Frontend: PaymentModal Opens
         ↓
API Call: POST /payments/create-order
         ↓
Backend: Creates Razorpay Order
         ↓
Backend: Saves transaction (status: 'created')
         ↓
Frontend: Opens Razorpay Checkout
         ↓
User: Completes Payment
         ↓
Razorpay: Returns payment details
         ↓
Frontend: Calls verify API
         ↓
API Call: POST /payments/verify
         ↓
Backend: Verifies signature
         ↓
Backend: Updates transaction (status: 'completed')
         ↓
Backend: Creates enrollment record
         ↓
Frontend: Shows success message
         ↓
User: Redirected to course content
```

## Key Files Created

### Backend
1. **controllers/paymentController.js** - Payment logic
2. **routes/paymentRoutes.js** - Payment endpoints
3. **scripts/createPaymentTransactionsTable.js** - DB setup

### Frontend
1. **Components/Dashboard/PaymentModal.jsx** - Payment UI
2. **Components/Dashboard/PaymentModal.css** - Payment styles
3. **Components/Pages/CourseDetailPage.jsx** - Course detail with payment
4. **Components/Pages/CourseDetailPage.css** - Course detail styles
5. **services/api.js** - Updated with payment methods

## Environment Variables Required

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
```

## Quick Setup Commands

```bash
# 1. Install dependencies (if not already installed)
cd Backend
npm install razorpay

# 2. Create payment transactions table
node scripts/createPaymentTransactionsTable.js

# 3. Add payment routes to server.js
# (Manual step - see guide)

# 4. Restart backend
npm start

# 5. Test payment flow
# (Use test credentials from Razorpay)
```

## Test Credentials

### Test Card
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
```

### Test UPI
```
UPI ID: success@razorpay
```

## API Quick Reference

### Create Order
```javascript
POST /api/v1/payments/create-order
Headers: { Authorization: 'Bearer <token>' }
Body: { courseId: 'course-id' }

Response: {
  success: true,
  data: {
    orderId: 'order_xxx',
    amount: 50000,
    currency: 'INR',
    keyId: 'rzp_test_xxx'
  }
}
```

### Verify Payment
```javascript
POST /api/v1/payments/verify
Headers: { Authorization: 'Bearer <token>' }
Body: {
  razorpay_order_id: 'order_xxx',
  razorpay_payment_id: 'pay_xxx',
  razorpay_signature: 'signature_xxx',
  courseId: 'course-id'
}

Response: {
  success: true,
  message: 'Payment verified and enrollment completed',
  data: {
    enrollmentId: 'enrollment-id',
    paymentId: 'pay_xxx'
  }
}
```

## Common Issues & Solutions

### Issue: Payment modal not opening
**Solution:** Check if Razorpay script is loaded
```javascript
// Check in browser console
console.log(window.Razorpay);
```

### Issue: Signature verification failed
**Solution:** Ensure Key Secret is correct in .env
```bash
# Check .env file
cat Backend/.env | grep RAZORPAY
```

### Issue: Enrollment not created
**Solution:** Check payment verification logs
```javascript
// In paymentController.js
console.log('Payment verification:', { isAuthentic, transaction });
```

## Payment Status Flow

```
created → User initiated payment
   ↓
completed → Payment successful, enrollment created
   ↓
failed → Payment failed, no enrollment
```

## Security Checklist

- [x] API keys in .env (not in code)
- [x] Signature verification on backend
- [x] HTTPS in production
- [x] Amount validation
- [x] User authentication required
- [x] Transaction logging

## Next Steps After Setup

1. Test with Razorpay test keys
2. Verify payment flow end-to-end
3. Check enrollment creation
4. Test payment failure scenarios
5. Switch to live keys for production
6. Monitor transactions in Razorpay dashboard

## Support

- Razorpay Docs: https://razorpay.com/docs/
- Razorpay Support: support@razorpay.com
- Dashboard: https://dashboard.razorpay.com

---

**Last Updated:** January 2025
**Version:** 1.0
