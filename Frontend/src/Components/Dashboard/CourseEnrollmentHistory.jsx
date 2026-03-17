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

              {course.instituteEnrollments.length > 0 && (
                <div className="enrollment-section">
                  <h4>Institute Enrollments</h4>
                  <div className="institute-enrollments-grid">
                    {course.instituteEnrollments.map(enrollment => (
                      <div key={enrollment.enrollmentsId} className="institute-enrollment-card">
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
                          onClick={() => handleViewDetails(enrollment.enrollmentsId)}
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
