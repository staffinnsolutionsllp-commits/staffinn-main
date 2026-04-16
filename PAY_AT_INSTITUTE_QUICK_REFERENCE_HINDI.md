# Pay at Institute - Quick Reference (Hindi)

## 🎯 Kya Implement Hua Hai?

On-campus courses ke liye students ab **2 payment options** choose kar sakte hain:
1. **Pay Here** - Online payment (Razorpay)
2. **Pay at Institute** - Baad mein institute pe jaake payment

---

## ✅ Complete Implementation

### Backend Files Created:

1. **Table Script**: `Backend/scripts/createPendingInstitutePaymentsTable.js`
   - DynamoDB table banane ke liye
   - Already run ho chuka hai ✅

2. **Model**: `Backend/models/pendingInstitutePaymentModel.js`
   - Pending payments ko manage karne ke liye
   - Functions: create, get, update, delete

3. **Controller**: `Backend/controllers/pendingPaymentController.js`
   - 5 endpoints handle karta hai
   - Institute dashboard ke liye

4. **Routes**: `Backend/routes/pendingPaymentRoutes.js`
   - API endpoints define karta hai

5. **Updated**: `Backend/controllers/instituteCourseController.js`
   - Naya function: `enrollInCoursePayAtInstitute`

6. **Updated**: `Backend/routes/instituteRoutes.js`
   - Naya route add kiya

7. **Updated**: `Backend/server.js`
   - Routes register kiye

---

## 📊 Database Table

**Table Name**: `staffinn-pending-institute-payments`

**Kya Store Hota Hai**:
- Student ki details (name, email, ID)
- Course details (name, ID, fees)
- Institute ID
- Payment status (PENDING/PAID/CANCELLED)
- Verification details (kon verify kiya, kab kiya)

---

## 🔌 API Endpoints

### 1. Student Enrollment (Pay at Institute)
```
POST /api/v1/institutes/courses/:courseId/enroll-pay-at-institute
```
**Kya Karta Hai**: Student enroll hota hai, payment pending mark hota hai

---

### 2. Institute - Pending Payments List
```
GET /api/v1/institute/pending-payments
```
**Kya Karta Hai**: Institute ke saare pending payments dikhata hai

---

### 3. Institute - Payment Statistics
```
GET /api/v1/institute/pending-payments/stats
```
**Kya Karta Hai**: Total pending, paid, cancelled payments ka count

---

### 4. Institute - Payment Details
```
GET /api/v1/institute/pending-payments/:enrollmentId
```
**Kya Karta Hai**: Ek specific payment ki details

---

### 5. Institute - Verify Payment
```
POST /api/v1/institute/pending-payments/:enrollmentId/verify
```
**Kya Karta Hai**: Payment verify karta hai, enrollment activate karta hai

---

### 6. Institute - Reject Payment
```
POST /api/v1/institute/pending-payments/:enrollmentId/reject
```
**Kya Karta Hai**: Payment cancel karta hai

---

## 🔄 Complete Workflow

### Student Side:
1. Student course detail page pe jata hai
2. "Enroll Now" button click karta hai
3. Modal open hota hai with 2 options
4. "Pay at Institute" select karta hai
5. Enrollment create hota hai (status: pending_payment)
6. Student ko message milta hai: "Institute pe jaake payment karo"

### Institute Side:
1. Institute dashboard mein "Pending Payments" section
2. Saare pending payments ki list dikhti hai
3. Student aata hai aur payment karta hai
4. Admin "Verify Payment" button click karta hai
5. Notes add kar sakta hai (optional)
6. Confirm karta hai
7. Automatically:
   - Payment status: PENDING → PAID
   - Enrollment status: pending_payment → active
   - Student ab course access kar sakta hai

---

## 🧪 Testing Kaise Karein

### Step 1: Student Login
```bash
POST /api/v1/auth/login
Body: {
  "email": "student@example.com",
  "password": "password"
}
```

### Step 2: Enroll with Pay at Institute
```bash
POST /api/v1/institutes/courses/{courseId}/enroll-pay-at-institute
Headers: {
  "Authorization": "Bearer {token}"
}
```

### Step 3: Institute Login
```bash
POST /api/v1/auth/login
Body: {
  "email": "institute@example.com",
  "password": "password"
}
```

### Step 4: View Pending Payments
```bash
GET /api/v1/institute/pending-payments
Headers: {
  "Authorization": "Bearer {institute-token}"
}
```

### Step 5: Verify Payment
```bash
POST /api/v1/institute/pending-payments/{enrollmentId}/verify
Headers: {
  "Authorization": "Bearer {institute-token}"
}
Body: {
  "notes": "Cash payment received"
}
```

---

## 📝 Frontend TODO

Institute Dashboard mein ye pages banana hai:

### 1. Pending Payments List Page
- Table with all pending payments
- Filter by status
- Search by student name
- Verify/Reject buttons

### 2. Payment Verification Modal
- Student details show kare
- Notes add karne ka option
- Verify button

### 3. Dashboard Widget
- Pending payments count
- Total pending amount
- Quick link to view all

---

## 🎯 Key Points

1. **Backend Complete**: ✅ Sab kuch ready hai
2. **Frontend Partial**: ✅ Enrollment flow ready, ❌ Institute dashboard pending
3. **Database**: ✅ Table create ho gaya
4. **API**: ✅ Saare endpoints working
5. **Testing**: ✅ Postman se test kar sakte ho

---

## 🚀 Next Steps

1. **Institute Dashboard UI** banana hai:
   - Pending Payments page
   - Verification modal
   - Statistics widget

2. **Notifications** add karna hai:
   - Student ko email/SMS jab payment verify ho
   - Institute ko notification jab naya pending payment aaye

3. **Reports** banana hai:
   - Payment collection reports
   - Pending vs Paid analysis

---

## 📞 Important Files

### Backend:
- `Backend/models/pendingInstitutePaymentModel.js` - Database operations
- `Backend/controllers/pendingPaymentController.js` - Business logic
- `Backend/routes/pendingPaymentRoutes.js` - API routes
- `Backend/controllers/instituteCourseController.js` - Enrollment logic

### Frontend:
- `Frontend/src/Components/Dashboard/PaymentOptionModal.jsx` - Payment selection
- `Frontend/src/services/api.js` - API calls
- `Frontend/src/Components/Pages/CourseDetailPage.jsx` - Enrollment trigger

---

## ✅ Summary

**Backend Implementation**: 100% Complete ✅
- Table created
- Model ready
- Controller ready
- Routes registered
- API working

**Frontend Implementation**: 60% Complete
- ✅ Student enrollment flow
- ✅ Payment option modal
- ❌ Institute dashboard (TODO)

**Ready for Testing**: YES! 🚀

Bas Institute Dashboard UI banana baaki hai, baaki sab kaam kar raha hai!
