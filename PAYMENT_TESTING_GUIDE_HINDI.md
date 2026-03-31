# 🧪 Payment Testing Guide (Hindi)

## ✅ Backend Already Complete Hai

Aapka backend payment system **100% ready** hai:
- ✅ Razorpay service configured
- ✅ Payment models created
- ✅ Payment controllers implemented
- ✅ Payment routes registered
- ✅ Course enrollment mein payment check integrated
- ✅ Webhook configured

## 💰 Paisa Ka Flow

```
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Student Course Enroll Karta Hai                    │
│  Student → "Enroll Now" button click                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Backend Check Karta Hai                            │
│  - Kya course paid hai?                                     │
│  - Kya student ne already pay kiya?                         │
│  - Agar nahi, toh 402 error with requiresPayment: true     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Frontend "Pay Now" Button Dikhata Hai              │
│  Student → "Pay ₹5000" button click                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Payment Order Create Hota Hai                      │
│  POST /api/payments/create-order                            │
│  Backend → Razorpay API call → Order ID milta hai           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Razorpay Checkout Modal Khulta Hai                 │
│  Student apna payment method select karta hai:              │
│  - Credit/Debit Card                                        │
│  - UPI                                                      │
│  - Net Banking                                              │
│  - Wallets                                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: PAISA STUDENT KE ACCOUNT SE KATEGA                 │
│  Student ka Bank/Card → Razorpay Account                    │
│  (Razorpay temporarily hold karta hai)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 7: Payment Verification                               │
│  POST /api/payments/verify                                  │
│  - Razorpay signature verify hota hai                       │
│  - Transaction database mein save hota hai                  │
│  - Status: "completed"                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 8: Course Access Milta Hai                            │
│  - Student automatically enroll ho jata hai                 │
│  - Course content unlock ho jata hai                        │
│  - Success message dikhta hai                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  STEP 9: Settlement (2-3 Days Baad)                         │
│  Razorpay → Institute Bank Account (90%)                    │
│  Razorpay → Platform Account (10% fee)                      │
└─────────────────────────────────────────────────────────────┘
```

## 🏦 Paisa Kahan Jayega?

### Test Mode (Abhi):
```
Student ka Test Card
        ↓
Razorpay Test Account (fake money)
        ↓
Koi real paisa nahi katega
```

### Production Mode (Live):
```
Student ka Real Bank Account
        ↓
Razorpay Account (2-3 days hold)
        ↓
Institute ka Bank Account (90% = ₹4500)
Platform Account (10% = ₹500)
```

## 🧪 Test Kaise Karein?

### 1. Backend Start Karein
```bash
cd Backend
npm start
```

### 2. Frontend Integration (Abhi Karna Hai)

**Option A: InstituteDashboard mein integrate karein**

Course enrollment button ke paas payment button add karein:

```javascript
import PaymentButton from '../Payment/PaymentButton';

// Course enrollment logic mein
if (course.mode === 'Online' && course.fees > 0) {
  // Check if already paid
  const paymentStatus = await checkPaymentStatus(course.courseId, token);
  
  if (!paymentStatus.hasPaid) {
    // Show payment button
    return (
      <PaymentButton
        course={course}
        user={currentUser}
        token={token}
        onPaymentSuccess={(response) => {
          // Enrollment automatically ho jayega
          // Course list refresh karein
          fetchCourses();
        }}
      />
    );
  }
}
```

### 3. Test Cards Use Karein

**Success Card (Payment Success Hoga):**
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: 12/25
Name: Test User
```

**Failure Card (Payment Fail Hoga):**
```
Card Number: 4111 1111 1111 1112
CVV: 123
Expiry: 12/25
```

**Test UPI:**
```
UPI ID: success@razorpay
(Automatically success)
```

### 4. Testing Steps

1. **Institute Dashboard Open Karein**
2. **Paid Online Course Create Karein**
   - Mode: Online
   - Fees: 5000
3. **Student Login Karein**
4. **Course Enroll Karne Ki Try Karein**
5. **"Pay Now" Button Dikhega**
6. **Test Card Details Dalein**
7. **Payment Success Hoga**
8. **Course Access Mil Jayega**

## 📊 Payment Verify Kaise Karein?

### Database Check:
```javascript
// DynamoDB Console mein dekho
Table: payment-transactions

Fields:
- transactionId
- userId
- courseId
- amount
- paymentStatus: "completed"
- razorpayPaymentId
- razorpayOrderId
```

### API Check:
```bash
# User ki transactions dekho
GET /api/payments/user/transactions
Authorization: Bearer <token>

# Payment status check karo
GET /api/payments/status/:courseId
Authorization: Bearer <token>
```

## 🔍 Troubleshooting

### Payment Button Nahi Dikh Raha?
- Check: Course mode "Online" hai?
- Check: Course fees > 0 hai?
- Check: User already paid nahi kiya?

### Payment Fail Ho Raha Hai?
- Check: Razorpay key correct hai?
- Check: Backend running hai?
- Check: Network console mein errors dekho

### Enrollment Nahi Ho Raha?
- Check: Payment verification successful tha?
- Check: Database mein transaction "completed" hai?
- Check: Backend logs dekho

## 📝 Next Steps

1. ✅ Backend complete hai
2. ⏳ Frontend integration karna hai:
   - `paymentUtils.js` already created
   - `PaymentButton.jsx` already created
   - InstituteDashboard mein integrate karna hai
3. ⏳ Test cards se testing karni hai
4. ⏳ Production mein live karna hai

## 🚀 Production Mein Kaise Deploy Karein?

### 1. Live Razorpay Account Banao
- https://dashboard.razorpay.com
- KYC complete karo
- Bank details add karo

### 2. Live Keys Use Karo
```env
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXX
RAZORPAY_KEY_SECRET=your_live_secret
```

### 3. Webhook Update Karo
```
Production URL: https://staffinn.com/api/payments/webhook
```

### 4. Settlement Configure Karo
- Razorpay dashboard → Settings → Settlements
- Bank account verify karo
- Auto settlement enable karo (T+2 days)

## 💡 Important Notes

1. **Test Mode Mein Koi Real Paisa Nahi Katega**
2. **Production Mein Real Paisa Katega**
3. **Settlement 2-3 Days Mein Hota Hai**
4. **Platform Fee 10% Automatically Deduct Hoga**
5. **Refund Bhi Possible Hai (API already implemented)**

## 📞 Support

Agar koi issue aaye toh:
1. Backend logs check karo
2. Frontend console check karo
3. Razorpay dashboard mein payment status dekho
4. Database mein transaction check karo
