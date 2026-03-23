# Razorpay Payment Integration - Setup Guide

## Overview
This guide will help you integrate Razorpay payment gateway into your Staffinn course platform, enabling real-time payment processing for course purchases.

## Features Implemented
✅ Razorpay payment gateway integration
✅ Secure payment verification
✅ Real-time course enrollment after payment
✅ Payment transaction tracking
✅ Institute earnings dashboard
✅ Payment history for users
✅ Support for both free and paid courses
✅ Payment failure handling

---

## Prerequisites

### 1. Razorpay Account Setup
1. Go to [https://razorpay.com](https://razorpay.com)
2. Sign up for a Razorpay account
3. Complete KYC verification
4. Navigate to Settings → API Keys
5. Generate API Keys (Key ID and Key Secret)

### 2. Install Required Dependencies

#### Backend
```bash
cd Backend
npm install razorpay
```

The `razorpay` package is already included in your package.json, but if not:
```bash
npm install razorpay --save
```

---

## Backend Setup

### Step 1: Environment Variables

Add the following to your `Backend/.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
```

**Important:** 
- Use **Test Keys** for development
- Use **Live Keys** only in production
- Never commit these keys to version control

### Step 2: Create Payment Transactions Table

Run the DynamoDB table creation script:

```bash
cd Backend
node scripts/createPaymentTransactionsTable.js
```

This creates the `payment-transactions` table with the following structure:
- Primary Key: `transactionId`
- GSI: `UserIdIndex`, `InstituteIdIndex`, `OrderIdIndex`

### Step 3: Register Payment Routes

Update your `Backend/server.js` to include payment routes:

```javascript
// Add this import
const paymentRoutes = require('./routes/paymentRoutes');

// Add this route registration (after other routes)
app.use('/api/v1/payments', paymentRoutes);
```

### Step 4: Restart Backend Server

```bash
cd Backend
npm start
```

---

## Frontend Setup

### Step 1: No Additional Dependencies Needed
The Razorpay checkout script is loaded dynamically via CDN in the PaymentModal component.

### Step 2: Update Course Display Components

The following components have been created/updated:
- `PaymentModal.jsx` - Handles payment UI
- `CourseDetailPage.jsx` - Shows course details with payment option
- API service updated with payment methods

### Step 3: Add Route for Course Detail Page

Update your `Frontend/src/App.jsx` to include the course detail route:

```javascript
import CourseDetailPage from './Components/Pages/CourseDetailPage';

// Add this route in your Routes
<Route path="/course/:courseId" element={<CourseDetailPage />} />
```

---

## Testing the Integration

### Test Mode (Development)

1. **Use Razorpay Test Keys**
   - Test Key ID starts with `rzp_test_`
   - Test Key Secret is different from live

2. **Test Card Details**
   ```
   Card Number: 4111 1111 1111 1111
   CVV: Any 3 digits
   Expiry: Any future date
   ```

3. **Test UPI**
   ```
   UPI ID: success@razorpay
   ```

4. **Test Netbanking**
   - Select any bank
   - Use credentials provided by Razorpay test mode

### Testing Flow

1. **Create a Paid Course**
   - Login as Institute
   - Go to "My Courses"
   - Create a course with fees > 0

2. **Purchase Course**
   - Login as Staff/Recruiter/Institute
   - Browse courses
   - Click on a paid course
   - Click "Buy Now"
   - Complete payment using test credentials

3. **Verify Enrollment**
   - After successful payment, user should be enrolled
   - Check "My Enrollments" section
   - User should be able to access course content

4. **Check Payment Records**
   - Institute can view earnings in dashboard
   - User can view payment history

---

## Production Deployment

### Step 1: Switch to Live Keys

1. Complete Razorpay KYC verification
2. Activate your Razorpay account
3. Generate Live API Keys
4. Update `.env` with live keys:

```env
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_live_secret_key
```

### Step 2: Enable Webhooks (Optional but Recommended)

1. Go to Razorpay Dashboard → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/v1/payments/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Save webhook secret in `.env`:

```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### Step 3: Implement Payment Transfers (Advanced)

For transferring payments to institute accounts:

1. **Enable Razorpay Route**
   - Contact Razorpay support to enable Route feature
   - This allows splitting payments to multiple accounts

2. **Create Linked Accounts for Institutes**
   ```javascript
   // Add this to instituteController.js
   const createLinkedAccount = async (instituteData) => {
     const account = await razorpay.accounts.create({
       email: instituteData.email,
       phone: instituteData.phone,
       type: 'route',
       legal_business_name: instituteData.instituteName,
       business_type: 'educational_institution'
     });
     return account;
   };
   ```

3. **Transfer Payment to Institute**
   ```javascript
   // In paymentController.js verifyPayment function
   const transfer = await razorpay.transfers.create({
     account: instituteLinkedAccountId,
     amount: amountInPaise,
     currency: 'INR',
     notes: {
       courseId: courseId,
       studentId: userId
     }
   });
   ```

---

## API Endpoints

### Payment Endpoints

#### 1. Create Payment Order
```
POST /api/v1/payments/create-order
Authorization: Bearer <token>
Body: { "courseId": "course-id" }
```

#### 2. Verify Payment
```
POST /api/v1/payments/verify
Authorization: Bearer <token>
Body: {
  "razorpay_order_id": "order_id",
  "razorpay_payment_id": "payment_id",
  "razorpay_signature": "signature",
  "courseId": "course-id"
}
```

#### 3. Get Payment History
```
GET /api/v1/payments/history
Authorization: Bearer <token>
```

#### 4. Get Institute Earnings
```
GET /api/v1/payments/institute-earnings
Authorization: Bearer <token>
```

#### 5. Handle Payment Failure
```
POST /api/v1/payments/failure
Authorization: Bearer <token>
Body: { "orderId": "order_id", "error": "error_message" }
```

---

## Database Schema

### payment-transactions Table

```javascript
{
  transactionId: String (Primary Key),
  orderId: String (Razorpay Order ID),
  paymentId: String (Razorpay Payment ID),
  signature: String (Payment Signature),
  userId: String (Buyer ID),
  courseId: String,
  instituteId: String (Course Creator),
  amount: Number (in INR),
  currency: String (default: 'INR'),
  status: String ('created', 'completed', 'failed'),
  errorMessage: String (if failed),
  createdAt: String (ISO timestamp),
  updatedAt: String (ISO timestamp)
}
```

---

## Security Best Practices

1. **Never expose API keys in frontend**
   - Keys are only in backend .env file
   - Frontend only receives Key ID for checkout

2. **Always verify payment signature**
   - Signature verification prevents payment tampering
   - Done on backend using HMAC SHA256

3. **Use HTTPS in production**
   - Razorpay requires HTTPS for live mode
   - Ensure SSL certificate is valid

4. **Implement rate limiting**
   - Prevent abuse of payment endpoints
   - Use express-rate-limit middleware

5. **Log all transactions**
   - Keep audit trail of all payments
   - Monitor for suspicious activity

---

## Troubleshooting

### Common Issues

#### 1. Payment Modal Not Opening
- Check if Razorpay script is loaded
- Verify Key ID is correct
- Check browser console for errors

#### 2. Payment Verification Failed
- Ensure Key Secret is correct
- Check signature calculation
- Verify order ID matches

#### 3. Enrollment Not Created
- Check if payment verification succeeded
- Verify course exists
- Check DynamoDB permissions

#### 4. Amount Mismatch
- Ensure amount is in paise (multiply by 100)
- Check currency is set to 'INR'

### Debug Mode

Enable detailed logging:

```javascript
// In paymentController.js
console.log('Payment Debug:', {
  orderId,
  paymentId,
  signature,
  expectedSignature
});
```

---

## Support & Resources

### Razorpay Documentation
- [Payment Gateway Integration](https://razorpay.com/docs/payments/)
- [Route (Payment Transfers)](https://razorpay.com/docs/route/)
- [Webhooks](https://razorpay.com/docs/webhooks/)

### Razorpay Support
- Email: support@razorpay.com
- Dashboard: https://dashboard.razorpay.com

### Test Credentials
- [Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
- [Test UPI](https://razorpay.com/docs/payments/payments/test-upi-details/)

---

## Next Steps

1. ✅ Complete Razorpay KYC
2. ✅ Test payment flow in development
3. ✅ Implement webhook handlers (optional)
4. ✅ Set up payment transfers to institutes
5. ✅ Add refund functionality (if needed)
6. ✅ Deploy to production with live keys
7. ✅ Monitor transactions in Razorpay dashboard

---

## Additional Features (Future Enhancements)

### 1. Subscription Plans
- Monthly/Yearly course subscriptions
- Recurring payments using Razorpay Subscriptions

### 2. Discount Coupons
- Apply coupon codes before payment
- Percentage or fixed amount discounts

### 3. Bulk Purchase
- Institute purchasing multiple courses
- Volume discounts

### 4. Payment Analytics
- Revenue charts
- Payment success rate
- Popular courses by revenue

### 5. Refund Management
- Automated refund processing
- Partial refunds
- Refund approval workflow

---

## Conclusion

Your Razorpay payment integration is now complete! Users can purchase courses with real payments, and the money will be tracked in your system. For production deployment, make sure to:

1. Switch to live Razorpay keys
2. Enable HTTPS
3. Complete KYC verification
4. Test thoroughly before going live

For any issues or questions, refer to the Razorpay documentation or contact their support team.

**Happy Coding! 🚀**
