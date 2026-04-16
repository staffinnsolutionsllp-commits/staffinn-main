# Backend Implementation Requirements for On-Campus Course Enrollment

## Overview
This document outlines the backend changes required to support the new "Pay at Institute" workflow for on-campus courses.

## Frontend Changes (Already Completed)
✅ Created PaymentOptionModal component
✅ Updated CourseDetailPage to show payment options for on-campus courses
✅ Added API method: `enrollInCoursePayAtInstitute(courseId)`

---

## Backend Requirements

### 1. New API Endpoint Required

**Endpoint:** `POST /api/v1/institutes/courses/:courseId/enroll-pay-at-institute`

**Purpose:** Handle enrollment requests where student will pay at institute

**Request Headers:**
- Authorization: Bearer {token}
- Content-Type: application/json

**Request Body:** None (courseId from URL params, user info from token)

**Response:**
```json
{
  "success": true,
  "message": "Enrollment request submitted successfully",
  "data": {
    "enrollmentId": "uuid",
    "courseId": "uuid",
    "studentId": "uuid",
    "instituteId": "uuid",
    "paymentStatus": "pending",
    "enrollmentStatus": "pending",
    "createdAt": "timestamp"
  }
}
```

---

### 2. DynamoDB Table Requirements

⚠️ **IMPORTANT:** Please confirm if you want to create a new table or use existing tables.

**Option 1: New Table - `PendingCourseEnrollments`**

**Primary Key:**
- enrollmentId (String) - Partition Key

**Attributes:**
- enrollmentId: UUID
- courseId: String (GSI)
- courseName: String
- instituteId: String (GSI)
- instituteName: String
- studentId: String (GSI)
- studentName: String
- studentEmail: String
- studentPhone: String
- courseFees: Number
- paymentStatus: String (enum: 'pending', 'paid', 'cancelled')
- paymentMethod: String ('pay_at_institute', 'online')
- enrollmentStatus: String (enum: 'pending', 'approved', 'rejected')
- createdAt: String (ISO timestamp)
- updatedAt: String (ISO timestamp)
- paidAt: String (ISO timestamp - optional)
- markedPaidBy: String (Institute admin ID - optional)

**Global Secondary Indexes:**
1. instituteId-createdAt-index
   - Partition Key: instituteId
   - Sort Key: createdAt
   
2. studentId-createdAt-index
   - Partition Key: studentId
   - Sort Key: createdAt

3. courseId-createdAt-index
   - Partition Key: courseId
   - Sort Key: createdAt

**Option 2: Use Existing CourseEnrollments Table**
- Add new fields: paymentStatus, paymentMethod, enrollmentStatus
- Update existing enrollment logic

---

### 3. Notification System

**When student selects "Pay at Institute":**

1. **Create Notification for Institute**
   - Table: `Notifications` (or your existing notification table)
   - Notification Type: 'pending_payment'
   - Recipient: Institute (instituteId)
   - Message: "{studentName} has enrolled in {courseName} and will pay at institute. Amount: ₹{fees}"
   - Link: "/dashboard/courses/admission-tracking/on-campus"
   - Status: 'unread'

2. **Create Notification for Student**
   - Notification Type: 'enrollment_pending'
   - Recipient: Student (studentId)
   - Message: "Your enrollment request for {courseName} has been submitted. Please visit the institute to complete payment."
   - Status: 'unread'

---

### 4. Institute Dashboard - Admission Tracking

**Location:** Institute Dashboard → My Courses → Admission Tracking → On-Campus Courses

**Required API Endpoint:**
`GET /api/v1/institutes/pending-enrollments`

**Response:**
```json
{
  "success": true,
  "data": {
    "pendingPayments": [
      {
        "enrollmentId": "uuid",
        "studentName": "John Doe",
        "studentEmail": "john@example.com",
        "studentPhone": "+91 9876543210",
        "courseName": "Python Programming",
        "courseId": "uuid",
        "fees": 5000,
        "paymentStatus": "pending",
        "enrollmentDate": "2024-01-15T10:30:00Z"
      }
    ],
    "paidEnrollments": [
      {
        "enrollmentId": "uuid",
        "studentName": "Jane Smith",
        "courseName": "Data Science",
        "fees": 8000,
        "paymentStatus": "paid",
        "paidAt": "2024-01-16T14:20:00Z"
      }
    ]
  }
}
```

**Required API Endpoint for Marking Payment:**
`PUT /api/v1/institutes/enrollments/:enrollmentId/mark-paid`

**Request Body:**
```json
{
  "paymentStatus": "paid",
  "notes": "Paid in cash at campus"
}
```

---

### 5. Payment Flow Logic

**For "Pay Here" (Online Payment):**
1. Student clicks "Pay Here"
2. Razorpay payment gateway opens
3. Payment successful → enrollInCourse API called
4. Student enrolled immediately
5. Payment status: 'paid'
6. Enrollment status: 'approved'

**For "Pay at Institute":**
1. Student clicks "Pay at Institute"
2. enrollInCoursePayAtInstitute API called
3. Create pending enrollment record
4. Send notification to institute
5. Payment status: 'pending'
6. Enrollment status: 'pending'
7. Institute marks as paid manually
8. Update payment status to 'paid'
9. Update enrollment status to 'approved'
10. Send confirmation notification to student

---

### 6. Backend Route Implementation (Pseudo Code)

```javascript
// Route: POST /api/v1/institutes/courses/:courseId/enroll-pay-at-institute
router.post('/courses/:courseId/enroll-pay-at-institute', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    // Get course details
    const course = await getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Get student details
    const student = await getUserById(userId);
    
    // Create pending enrollment
    const enrollment = {
      enrollmentId: generateUUID(),
      courseId: course.coursesId,
      courseName: course.courseName,
      instituteId: course.instituteId,
      instituteName: course.instituteName,
      studentId: userId,
      studentName: student.fullName,
      studentEmail: student.email,
      studentPhone: student.phoneNumber,
      courseFees: course.fees,
      paymentStatus: 'pending',
      paymentMethod: 'pay_at_institute',
      enrollmentStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to DynamoDB
    await savePendingEnrollment(enrollment);
    
    // Create notification for institute
    await createNotification({
      notificationId: generateUUID(),
      recipientId: course.instituteId,
      recipientType: 'institute',
      type: 'pending_payment',
      title: 'New Pending Payment',
      message: `${student.fullName} has enrolled in ${course.courseName} and will pay at institute. Amount: ₹${course.fees}`,
      link: '/dashboard/courses/admission-tracking/on-campus',
      status: 'unread',
      createdAt: new Date().toISOString()
    });
    
    // Create notification for student
    await createNotification({
      notificationId: generateUUID(),
      recipientId: userId,
      recipientType: 'staff',
      type: 'enrollment_pending',
      title: 'Enrollment Request Submitted',
      message: `Your enrollment request for ${course.courseName} has been submitted. Please visit the institute to complete payment.`,
      status: 'unread',
      createdAt: new Date().toISOString()
    });
    
    return res.status(200).json({
      success: true,
      message: 'Enrollment request submitted successfully',
      data: enrollment
    });
    
  } catch (error) {
    console.error('Error in pay-at-institute enrollment:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
```

---

### 7. Institute Dashboard UI Requirements

**Admission Tracking Page - On-Campus Tab:**

Display two sections:
1. **Pending Payments** (Red/Orange indicator)
   - Student Name
   - Course Name
   - Fees Amount
   - Enrollment Date
   - Contact Info
   - Action: "Mark as Paid" button

2. **Paid Enrollments** (Green indicator)
   - Student Name
   - Course Name
   - Fees Amount
   - Payment Date
   - Status: "Paid"

---

## Summary of Changes Needed

### Frontend (✅ Completed):
- PaymentOptionModal component
- Updated CourseDetailPage
- API integration

### Backend (⚠️ Pending):
1. Create new API endpoint: `/enroll-pay-at-institute`
2. Decide on DynamoDB table structure
3. Implement notification system
4. Create institute dashboard APIs
5. Add payment status tracking
6. Implement "Mark as Paid" functionality

---

## Next Steps

1. **Confirm DynamoDB table structure** - Should we create a new table or modify existing?
2. **Implement backend endpoints** as specified above
3. **Test the complete flow** from student enrollment to institute payment marking
4. **Update Institute Dashboard UI** to show pending payments

---

## Questions for You

1. Should I create a new DynamoDB table `PendingCourseEnrollments` or use existing tables?
2. Do you have an existing notification system/table I should use?
3. What should be the exact table name and structure you prefer?
4. Should there be any approval workflow or just payment tracking?

Please confirm the table structure and I'll proceed with the backend implementation guidance.
