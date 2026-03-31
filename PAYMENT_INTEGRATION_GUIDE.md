# 🚀 Complete Razorpay Payment Integration Guide

## 📋 Table of Contents
1. [Environment Setup](#environment-setup)
2. [Database Setup](#database-setup)
3. [Backend Integration](#backend-integration)
4. [Frontend Integration](#frontend-integration)
5. [Testing](#testing)
6. [Production Deployment](#production-deployment)
7. [Security Best Practices](#security-best-practices)

---

## 1. Environment Setup

### Step 1.1: Add Razorpay Credentials to .env

Add these variables to your `Backend/.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Platform Configuration
PLATFORM_FEE_PERCENTAGE=10
```

### Step 1.2: Install Razorpay SDK

```bash
cd Backend
npm install razorpay
```

---

## 2. Database Setup

### Step 2.1: Create Payment Tables

Run the table creation script:

```bash
cd Backend
node scripts/createPaymentTables.js
```

This will create 3 tables:
- `payment-transactions` - Stores all payment records
- `institute-bank-details` - Stores institute bank account info
- `payment-settlements` - Tracks payouts to institutes

### Step 2.2: Verify Tables Created

Check AWS DynamoDB console to confirm tables are created with proper indexes.

---

## 3. Backend Integration

### Step 3.1: Register Payment Routes

Add to `Backend/server.js` or `Backend/app.js`:

```javascript
const paymentRoutes = require('./routes/paymentRoutes');

// Add this line with other route registrations
app.use('/api/payment', paymentRoutes);
```

### Step 3.2: Update Course Enrollment Logic

Modify `Backend/controllers/instituteCourseController.js`:

Find the `enrollInCourse` function and update it:

```javascript
const enrollInCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    
    console.log('Enrolling user in course:', { userId, courseId });
    
    // Get course details
    const course = await dynamoService.getItem(COURSES_TABLE, {
      coursesId: courseId
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // ✅ NEW: Check if course is Online and has fees
    if (course.mode === 'Online' && parseFloat(course.fees) > 0) {
      // Check if user has paid
      const paymentTransactionModel = require('../models/paymentTransactionModel');
      const hasPaid = await paymentTransactionModel.hasUserPaidForCourse(userId, courseId);
      
      if (!hasPaid) {
        return res.status(402).json({
          success: false,
          message: 'Payment required. Please complete payment to enroll in this course.',
          requiresPayment: true,
          courseDetails: {
            courseId: course.coursesId,
            courseName: course.courseName,
            fees: course.fees
          }
        });
      }
    }
    
    // Check if already enrolled
    const params = {
      FilterExpression: 'userId = :userId AND courseId = :courseId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':courseId': courseId
      }
    };
    
    const existingEnrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, params);
    
    if (existingEnrollments && existingEnrollments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }
    
    // Create enrollment
    const enrollmentId = uuidv4();
    const enrollment = {
      enrolledID: enrollmentId,
      userId: userId,
      courseId: courseId,
      courseName: course.courseName,
      instituteId: course.instituteId,
      enrollmentDate: new Date().toISOString(),
      progressPercentage: 0,
      status: 'active',
      paymentStatus: course.mode === 'Online' && parseFloat(course.fees) > 0 ? 'paid' : 'free'
    };
    
    await dynamoService.putItem(COURSE_ENROLLMENTS_TABLE, enrollment);
    
    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course'
    });
  }
};
```

### Step 3.3: Update Course Content Access

Modify `getCourseContent` function to check payment:

```javascript
const getCourseContent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    
    // Get course
    const course = await dynamoService.getItem(COURSES_TABLE, {
      coursesId: courseId
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // ✅ NEW: Check payment for online paid courses
    if (course.mode === 'Online' && parseFloat(course.fees) > 0) {
      const paymentTransactionModel = require('../models/paymentTransactionModel');
      const hasPaid = await paymentTransactionModel.hasUserPaidForCourse(userId, courseId);
      
      if (!hasPaid) {
        return res.status(402).json({
          success: false,
          message: 'Payment required to access course content',
          requiresPayment: true
        });
      }
    }
    
    // Check enrollment
    const params = {
      FilterExpression: 'userId = :userId AND courseId = :courseId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':courseId': courseId
      }
    };
    
    const enrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, params);
    const enrollment = enrollments && enrollments.length > 0 ? enrollments[0] : null;
    
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }
    
    // Return course content
    res.status(200).json({
      success: true,
      data: {
        ...course,
        enrollment
      }
    });
  } catch (error) {
    console.error('Error getting course content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course content'
    });
  }
};
```

---

## 4. Frontend Integration

### Step 4.1: Install Razorpay Checkout

Add Razorpay script to `Frontend/public/index.html`:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Step 4.2: Create Payment Service

Create `Frontend/src/services/paymentService.js`:

```javascript
import apiService from './api';

const paymentService = {
  // Create payment order
  createOrder: async (courseId) => {
    try {
      const response = await apiService.post('/payment/create-order', { courseId });
      return response;
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    try {
      const response = await apiService.post('/payment/verify', paymentData);
      return response;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  },

  // Check payment status
  checkPaymentStatus: async (courseId) => {
    try {
      const response = await apiService.get(`/payment/status/${courseId}`);
      return response;
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  },

  // Get transaction history
  getTransactions: async () => {
    try {
      const response = await apiService.get('/payment/transactions');
      return response;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  },

  // Initialize Razorpay payment
  initiatePayment: (orderData, onSuccess, onFailure) => {
    const options = {
      key: orderData.razorpayKeyId,
      amount: orderData.amount * 100, // Convert to paise
      currency: orderData.currency,
      name: 'Staffinn',
      description: `Payment for ${orderData.courseDetails.courseName}`,
      order_id: orderData.orderId,
      handler: function (response) {
        onSuccess({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        });
      },
      prefill: {
        name: orderData.userName || '',
        email: orderData.userEmail || '',
        contact: orderData.userPhone || ''
      },
      theme: {
        color: '#3399cc'
      },
      modal: {
        ondismiss: function() {
          onFailure('Payment cancelled by user');
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }
};

export default paymentService;
```

### Step 4.3: Update API Service

Add payment endpoints to `Frontend/src/services/api.js`:

```javascript
// Add these methods to your apiService object

// Payment APIs
createPaymentOrder: async (courseId) => {
  return await apiService.post('/payment/create-order', { courseId });
},

verifyPayment: async (paymentData) => {
  return await apiService.post('/payment/verify', paymentData);
},

checkPaymentStatus: async (courseId) => {
  return await apiService.get(`/payment/status/${courseId}`);
},

getUserTransactions: async () => {
  return await apiService.get('/payment/transactions');
},
```

### Step 4.4: Create Payment Component

Create `Frontend/src/Components/Payment/PaymentButton.jsx`:

```javascript
import React, { useState } from 'react';
import paymentService from '../../services/paymentService';
import './PaymentButton.css';

const PaymentButton = ({ course, onPaymentSuccess, onPaymentFailure }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Step 1: Create order
      const orderResponse = await paymentService.createOrder(course.coursesId);

      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create order');
      }

      const orderData = orderResponse.data;

      // Step 2: Open Razorpay checkout
      paymentService.initiatePayment(
        orderData,
        async (paymentResponse) => {
          // Step 3: Verify payment
          try {
            const verifyResponse = await paymentService.verifyPayment(paymentResponse);

            if (verifyResponse.success) {
              alert('Payment successful! You are now enrolled in the course.');
              if (onPaymentSuccess) {
                onPaymentSuccess(verifyResponse.data);
              }
            } else {
              throw new Error(verifyResponse.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
            if (onPaymentFailure) {
              onPaymentFailure(error.message);
            }
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Payment error:', error);
          alert('Payment failed or cancelled');
          if (onPaymentFailure) {
            onPaymentFailure(error);
          }
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert(error.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <button
      className="payment-button"
      onClick={handlePayment}
      disabled={loading}
    >
      {loading ? 'Processing...' : `Pay ₹${course.fees} & Enroll`}
    </button>
  );
};

export default PaymentButton;
```

### Step 4.5: Update Course Detail Page

Modify your course detail page to show payment button for paid courses:

```javascript
import PaymentButton from '../Payment/PaymentButton';

// In your course detail component:

const [hasPaid, setHasPaid] = useState(false);
const [checkingPayment, setCheckingPayment] = useState(true);

useEffect(() => {
  checkPaymentStatus();
}, [courseId]);

const checkPaymentStatus = async () => {
  try {
    const response = await paymentService.checkPaymentStatus(courseId);
    if (response.success) {
      setHasPaid(response.data.hasPaid);
    }
  } catch (error) {
    console.error('Error checking payment:', error);
  } finally {
    setCheckingPayment(false);
  }
};

// In your render:
{course.mode === 'Online' && parseFloat(course.fees) > 0 && !hasPaid && (
  <PaymentButton
    course={course}
    onPaymentSuccess={(data) => {
      setHasPaid(true);
      // Redirect to course content or refresh
      navigate(`/course/${courseId}/learn`);
    }}
    onPaymentFailure={(error) => {
      console.error('Payment failed:', error);
    }}
  />
)}

{hasPaid && (
  <button onClick={() => navigate(`/course/${courseId}/learn`)}>
    Start Learning
  </button>
)}
```

---

## 5. Testing

### Step 5.1: Test Mode Cards

Use these test cards in Razorpay test mode:

**Success:**
- Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

**Failure:**
- Card: 4000 0000 0000 0002
- CVV: Any 3 digits
- Expiry: Any future date

### Step 5.2: Test UPI

Use test UPI ID: `success@razorpay`

### Step 5.3: Testing Checklist

- [ ] Create payment order
- [ ] Complete payment with test card
- [ ] Verify payment signature
- [ ] Check enrollment created
- [ ] Access course content after payment
- [ ] Test payment failure scenario
- [ ] Test webhook delivery
- [ ] Check transaction records in database

---

## 6. Production Deployment

### Step 6.1: Switch to Live Mode

1. Get Live API keys from Razorpay dashboard
2. Update `.env` with live keys:
```env
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx
```

### Step 6.2: Update Webhook URL

Update webhook URL in Razorpay dashboard to production URL:
```
https://yourdomain.com/api/payment/webhook
```

### Step 6.3: Enable Payment Methods

Ensure all required payment methods are enabled in live mode.

---

## 7. Security Best Practices

### ✅ DO:
- Always verify payment signature on backend
- Use HTTPS for all payment endpoints
- Store Razorpay Key Secret securely (never expose in frontend)
- Validate webhook signatures
- Log all payment transactions
- Implement rate limiting on payment endpoints
- Use environment variables for sensitive data

### ❌ DON'T:
- Never expose Razorpay Key Secret in frontend code
- Don't trust payment status from frontend alone
- Don't skip signature verification
- Don't store card details (PCI compliance)
- Don't process payments without proper validation

---

## 8. Monitoring & Alerts

### Setup Alerts for:
- Failed payments
- Webhook failures
- Unusual payment patterns
- Refund requests

### Monitor:
- Payment success rate
- Average transaction value
- Failed payment reasons
- Settlement status

---

## 9. Support & Troubleshooting

### Common Issues:

**Issue: Payment succeeds but enrollment fails**
- Check webhook delivery
- Verify database connectivity
- Check transaction logs

**Issue: Signature verification fails**
- Verify Key Secret is correct
- Check signature generation logic
- Ensure order ID and payment ID are correct

**Issue: Webhook not received**
- Check webhook URL is accessible
- Verify webhook secret
- Check firewall settings

---

## 10. Next Steps

1. ✅ Run database setup script
2. ✅ Add environment variables
3. ✅ Register payment routes
4. ✅ Update course enrollment logic
5. ✅ Integrate frontend payment button
6. ✅ Test with test cards
7. ✅ Deploy to production
8. ✅ Switch to live mode

---

## Need Help?

- Razorpay Documentation: https://razorpay.com/docs/
- Razorpay Support: support@razorpay.com
- Test Dashboard: https://dashboard.razorpay.com/test/dashboard

---

**🎉 Congratulations! Your payment system is now ready!**
