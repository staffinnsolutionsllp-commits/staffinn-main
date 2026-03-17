# Institute Course Enrollment - Frontend Implementation Guide

## ✅ COMPLETED COMPONENTS

### 1. Student Enrollment Modal
**Location:** `Frontend/src/Components/Modals/StudentEnrollmentModal.jsx`
**Features:**
- Multi-select student list with search
- Student cards with avatars
- Real-time enrollment summary
- Payment calculation
- Success/error handling
- Fully styled with responsive design

### 2. API Integration
**Location:** `Frontend/src/services/api.js`
**New Endpoints Added:**
- `enrollStudentsInCourse()` - Enroll multiple students
- `getEnrollmentHistory()` - Get enrollment history
- `getCourseEnrollmentTracking()` - Get tracking data
- `getEnrollmentDetails()` - Get enrollment details
- `getAvailableStudentsForEnrollment()` - Get student list

---

## 🔧 REMAINING TASKS

### Task 1: Update InstitutePage.jsx to Show Enrollment Modal

**File:** `Frontend/src/Components/Pages/InstitutePage.jsx`

**Changes Needed:**

1. **Import the modal at the top:**
```javascript
import StudentEnrollmentModal from '../Modals/StudentEnrollmentModal';
```

2. **Add state for enrollment modal:**
```javascript
const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState(null);
const [userProfile, setUserProfile] = useState(null);
```

3. **Add function to check if user is Staffinn Partner:**
```javascript
useEffect(() => {
  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      const response = await apiService.getProfile();
      if (response.success) {
        setUserProfile(response.data);
      }
    }
  };
  fetchUserProfile();
}, []);

const isStaffinnPartner = () => {
  return userProfile?.role === 'institute' && userProfile?.instituteType === 'staffinn_partner';
};
```

4. **Update the "View Details" button for On-Campus courses:**

Find this section (around line 800-850):
```javascript
<button 
  className="view-details-button"
  onClick={() => {
    // Check authentication first
    if (!isLoggedIn) {
      onShowLogin();
      return;
    }
    // Navigate to course details page instead of opening modal
    navigate(`/course/${courseId}?preview=true&institute=${id}`);
  }}
>
  View Details
</button>
```

Replace with:
```javascript
<div className="course-action-buttons">
  <button 
    className="view-details-button"
    onClick={() => {
      if (!isLoggedIn) {
        onShowLogin();
        return;
      }
      navigate(`/course/${courseId}?preview=true&institute=${id}`);
    }}
  >
    View Details
  </button>
  
  {isStaffinnPartner() && course.mode === 'On Campus' && (
    <button 
      className="enroll-students-button"
      onClick={(e) => {
        e.stopPropagation();
        if (!isLoggedIn) {
          onShowLogin();
          return;
        }
        setSelectedCourseForEnrollment(course);
        setShowEnrollmentModal(true);
      }}
    >
      Enroll Students
    </button>
  )}
</div>
```

5. **Add the modal at the end of the component (before closing div):**
```javascript
{/* Student Enrollment Modal */}
{showEnrollmentModal && selectedCourseForEnrollment && (
  <StudentEnrollmentModal
    isOpen={showEnrollmentModal}
    onClose={() => {
      setShowEnrollmentModal(false);
      setSelectedCourseForEnrollment(null);
    }}
    course={selectedCourseForEnrollment}
    instituteId={id}
  />
)}
```

6. **Add CSS for the new button:**
Add to `InstitutePage.css`:
```css
.course-action-buttons {
  display: flex;
  gap: 8px;
  flex-direction: column;
}

.enroll-students-button {
  padding: 10px 16px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.enroll-students-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}
```

---

### Task 2: Create Course Enrollment History Dashboard Component

**File:** `Frontend/src/Components/Dashboard/CourseEnrollmentHistory.jsx`

Create this new component to show enrollment tracking in the institute dashboard.

**Full Component Code:**
```javascript
import React, { useState, useEffect } from 'react';
import './CourseEnrollmentHistory.css';
import apiService from '../../services/api';

const CourseEnrollmentHistory = () => {
  const [trackingData, setTrackingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchTrackingData();
  }, []);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCourseEnrollmentTracking();
      if (response.success) {
        setTrackingData(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (enrollmentId) => {
    try {
      const response = await apiService.getEnrollmentDetails(enrollmentId);
      if (response.success) {
        setSelectedEnrollment(response.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching enrollment details:', error);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading enrollment data...</div>;
  }

  return (
    <div className="course-enrollment-history">
      <div className="page-header">
        <h2>Course Enrollment Tracking</h2>
        <p>Track who has enrolled in your courses</p>
      </div>

      {trackingData.length === 0 ? (
        <div className="empty-state">
          <p>No enrollment data available yet</p>
        </div>
      ) : (
        <div className="courses-list">
          {trackingData.map(course => (
            <div key={course.courseId} className="course-tracking-card">
              <div className="course-header">
                <h3>{course.courseName}</h3>
                <div className="course-meta">
                  <span className="course-mode">{course.courseMode}</span>
                  <span className="course-duration">{course.courseDuration}</span>
                  <span className="course-fees">₹{course.courseFees}</span>
                </div>
              </div>

              <div className="enrollment-stats">
                <div className="stat-item">
                  <span className="stat-value">{course.totalIndividualEnrollments}</span>
                  <span className="stat-label">Individual Enrollments</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{course.totalInstituteEnrollments}</span>
                  <span className="stat-label">Institute Enrollments</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{course.totalStudentsFromInstitutes}</span>
                  <span className="stat-label">Students from Institutes</span>
                </div>
              </div>

              {/* Individual Enrollments */}
              {course.individualEnrollments.length > 0 && (
                <div className="enrollment-section">
                  <h4>Individual Enrollments</h4>
                  <table className="enrollment-table">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email</th>
                        <th>Enrollment Date</th>
                        <th>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.individualEnrollments.map(enrollment => (
                        <tr key={enrollment.enrolledID}>
                          <td>{enrollment.userName}</td>
                          <td>{enrollment.userEmail}</td>
                          <td>{new Date(enrollment.enrollmentDate).toLocaleDateString()}</td>
                          <td>{enrollment.progressPercentage || 0}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Institute Enrollments */}
              {course.instituteEnrollments.length > 0 && (
                <div className="enrollment-section">
                  <h4>Institute Enrollments</h4>
                  <div className="institute-enrollments-grid">
                    {course.instituteEnrollments.map(enrollment => (
                      <div key={enrollment.enrollmentId} className="institute-enrollment-card">
                        <div className="card-header">
                          <h5>{enrollment.enrollingInstituteName}</h5>
                          <span className="student-count">
                            {enrollment.totalStudentsEnrolled} Students
                          </span>
                        </div>
                        <div className="card-body">
                          <p className="enrollment-date">
                            Enrolled on: {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                          </p>
                          <p className="payment-status">
                            Payment: <span className={`status-${enrollment.paymentStatus}`}>
                              {enrollment.paymentStatus}
                            </span>
                          </p>
                          <p className="total-amount">
                            Total: ₹{enrollment.totalAmount.toLocaleString()}
                          </p>
                        </div>
                        <button 
                          className="view-details-btn"
                          onClick={() => handleViewDetails(enrollment.enrollmentId)}
                        >
                          View Student List
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedEnrollment && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Enrolled Students</h3>
              <button onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="enrollment-info">
                <p><strong>Institute:</strong> {selectedEnrollment.enrollingInstituteDetails?.instituteName}</p>
                <p><strong>Course:</strong> {selectedEnrollment.courseDetails?.courseName}</p>
                <p><strong>Total Students:</strong> {selectedEnrollment.totalStudentsEnrolled}</p>
              </div>
              <table className="students-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Enrollment Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEnrollment.enrolledStudents.map(student => (
                    <tr key={student.studentId}>
                      <td>{student.studentName}</td>
                      <td>{student.studentEmail}</td>
                      <td>{new Date(student.enrollmentDate).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge status-${student.status}`}>
                          {student.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseEnrollmentHistory;
```

---

### Task 3: Create CSS for Course Enrollment History

**File:** `Frontend/src/Components/Dashboard/CourseEnrollmentHistory.css`

```css
.course-enrollment-history {
  padding: 24px;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h2 {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.page-header p {
  color: #6b7280;
  font-size: 14px;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.course-tracking-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.course-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.course-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.course-mode,
.course-duration,
.course-fees {
  padding: 4px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  font-size: 13px;
  color: #4b5563;
}

.enrollment-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin: 24px 0;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: #4863f7;
  margin-bottom: 4px;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
}

.enrollment-section {
  margin-top: 24px;
}

.enrollment-section h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.enrollment-table {
  width: 100%;
  border-collapse: collapse;
}

.enrollment-table th,
.enrollment-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.enrollment-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #4b5563;
  font-size: 13px;
}

.enrollment-table td {
  font-size: 14px;
  color: #1f2937;
}

.institute-enrollments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.institute-enrollment-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.institute-enrollment-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.institute-enrollment-card h5 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.student-count {
  background: #4863f7;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.institute-enrollment-card .card-body {
  margin-bottom: 12px;
}

.institute-enrollment-card p {
  margin: 6px 0;
  font-size: 13px;
  color: #6b7280;
}

.payment-status .status-completed {
  color: #10b981;
  font-weight: 600;
}

.payment-status .status-pending {
  color: #f59e0b;
  font-weight: 600;
}

.total-amount {
  font-weight: 600;
  color: #1f2937;
}

.view-details-btn {
  width: 100%;
  padding: 8px 16px;
  background: #4863f7;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.view-details-btn:hover {
  background: #3a4fd8;
}

.details-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.details-modal .modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.details-modal .modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.details-modal .modal-header button {
  background: none;
  border: none;
  font-size: 28px;
  color: #6b7280;
  cursor: pointer;
}

.details-modal .modal-content {
  padding: 24px;
}

.enrollment-info {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.enrollment-info p {
  margin: 8px 0;
  font-size: 14px;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
}

.students-table th,
.students-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.students-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #4b5563;
  font-size: 13px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-completed {
  background: #dbeafe;
  color: #1e40af;
}

.status-dropped {
  background: #fee2e2;
  color: #991b1b;
}
```

---

### Task 4: Add Route to Institute Dashboard

**File:** `Frontend/src/Components/Dashboard/InstituteDashboard.jsx`

Add the new component to the sidebar menu and routing:

1. Import the component
2. Add menu item under "My Courses" section
3. Add route to display the component

---

## 📝 SUMMARY

**Completed:**
- ✅ Backend API (models, controllers, routes)
- ✅ Student Enrollment Modal component
- ✅ API service integration

**Remaining:**
- 🔧 Update InstitutePage to show enrollment button for Staffinn Partners
- 🔧 Create CourseEnrollmentHistory dashboard component
- 🔧 Add routing in InstituteDashboard
- 🔧 Test end-to-end workflow

**Estimated Time:** 2-3 hours for remaining tasks
