import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './CourseEnrollmentHistory.css?v=3.0';
import apiService from '../../services/api';

const CourseEnrollmentHistory = () => {
  const [trackingData, setTrackingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('online'); // 'online' or 'oncampus'
  const [selectedCourse, setSelectedCourse] = useState('all'); // 'all' or specific courseId

  const ModalPortal = ({ children }) => {
    const modalRoot = document.getElementById('modal-root') || document.body;
    return ReactDOM.createPortal(children, modalRoot);
  };

  useEffect(() => {
    fetchTrackingData();
  }, []);

  useEffect(() => {
    if (showDetailsModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDetailsModal]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      console.log('🔍 [FRONTEND] Fetching enrollment tracking data...');
      
      const response = await apiService.getCourseEnrollmentTracking();
      console.log('📦 [FRONTEND] API Response:', response);
      
      if (response.success) {
        console.log('✅ [FRONTEND] Success! Data received:', response.data);
        console.log('📊 [FRONTEND] Number of courses:', response.data?.length || 0);
        
        if (response.data && response.data.length > 0) {
          console.log('📚 [FRONTEND] First course:', response.data[0]);
        }
        
        setTrackingData(response.data || []);
      } else {
        console.error('❌ [FRONTEND] API returned success=false:', response);
        setTrackingData([]);
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error fetching tracking data:', error);
      setTrackingData([]);
    } finally {
      setLoading(false);
      console.log('🏁 [FRONTEND] Fetch complete. Loading state:', false);
    }
  };

  const handleViewDetails = (enrollment) => {
    console.log('📋 [FRONTEND] Opening student list for enrollment:', enrollment);
    console.log('📋 [FRONTEND] Students array:', enrollment.students);
    
    // Create the enrollment details object from the enrollment data we already have
    const enrollmentDetails = {
      enrollingInstituteDetails: {
        instituteName: enrollment.enrollingInstituteName
      },
      courseDetails: {
        courseName: trackingData.find(c => c.instituteEnrollments?.some(e => e.enrollmentsId === enrollment.enrollmentsId))?.courseName || 'Unknown Course'
      },
      totalStudentsEnrolled: enrollment.totalStudentsEnrolled,
      enrolledStudents: (enrollment.students || []).map(student => {
        console.log('📊 [FRONTEND] Processing student:', student);
        return {
          ...student,
          paymentStatus: student.paymentStatus || enrollment.paymentStatus || 'completed'
        };
      })
    };
    
    console.log('📊 [FRONTEND] Final enrollment details:', enrollmentDetails);
    console.log('📊 [FRONTEND] Enrolled students:', enrollmentDetails.enrolledStudents);
    setSelectedEnrollment(enrollmentDetails);
    setShowDetailsModal(true);
  };

  // Separate courses by mode
  const onlineCourses = trackingData.filter(course => course.courseMode === 'Online');
  const onCampusCourses = trackingData.filter(course => course.courseMode === 'On Campus');

  console.log('📊 [FRONTEND] Rendering component...');
  console.log('📊 [FRONTEND] Total tracking data:', trackingData.length);
  console.log('📊 [FRONTEND] Online courses:', onlineCourses.length);
  console.log('📊 [FRONTEND] On-Campus courses:', onCampusCourses.length);
  console.log('📊 [FRONTEND] Loading state:', loading);
  console.log('📊 [FRONTEND] Active tab:', activeTab);

  // Get courses based on active tab and filter
  let displayCourses = activeTab === 'online' ? onlineCourses : onCampusCourses;
  if (selectedCourse !== 'all') {
    displayCourses = displayCourses.filter(course => String(course.courseId) === String(selectedCourse));
  }

  // Debug logging
  console.log('🔍 [FILTER DEBUG] Selected course:', selectedCourse);
  console.log('🔍 [FILTER DEBUG] Display courses count:', displayCourses.length);
  if (selectedCourse !== 'all' && displayCourses.length > 0) {
    console.log('🔍 [FILTER DEBUG] First filtered course ID:', displayCourses[0].courseId, 'Type:', typeof displayCourses[0].courseId);
  }

  if (loading) {
    return <div className="loading-state">Loading enrollment data...</div>;
  }

  const renderCourseCard = (course) => (
    <div key={course.courseId} className="admission-tracking-card" style={{display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '0'}}>
      <div className="admission-card-header" style={{textAlign: 'center', alignItems: 'center'}}>
        <h3 style={{textAlign: 'center', width: '100%'}}>{course.courseName}</h3>
        <div className="admission-course-meta" style={{display: 'flex', flexDirection: 'row', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap'}}>
          <span className="admission-course-mode">{course.courseMode}</span>
          <span className="admission-course-duration">{course.courseDuration}</span>
          <span className="admission-course-fees">₹{course.courseFees}</span>
        </div>
      </div>

      <div className="admission-enrollment-stats">
        <div className="admission-stat-item">
          <span className="admission-stat-value">{course.totalIndividualEnrollments}</span>
          <span className="admission-stat-label">Individual Enrollments</span>
        </div>
        <div className="admission-stat-item">
          <span className="admission-stat-value">{course.totalInstituteEnrollments}</span>
          <span className="admission-stat-label">Institute Enrollments</span>
        </div>
        <div className="admission-stat-item">
          <span className="admission-stat-value">{course.totalStudentsFromInstitutes}</span>
          <span className="admission-stat-label">Students from Institutes</span>
        </div>
      </div>

      {course.individualEnrollments && course.individualEnrollments.length > 0 && (
        <div className="admission-enrollment-section">
          <h4>Individual Enrollments</h4>
          <table className="admission-enrollment-table">
            <colgroup>
              <col style={{width: '20%'}} />
              <col style={{width: '25%'}} />
              <col style={{width: '18%'}} />
              <col style={{width: '12%'}} />
              <col style={{width: '25%'}} />
            </colgroup>
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email</th>
                <th>Enrollment Date</th>
                <th>Progress</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {course.individualEnrollments.map(enrollment => {
                console.log('🔍 [FRONTEND] Rendering individual enrollment:', JSON.stringify(enrollment, null, 2));
                console.log('   - userName:', enrollment.userName);
                console.log('   - userEmail:', enrollment.userEmail);
                console.log('   - paymentStatus:', enrollment.paymentStatus);
                console.log('   - enrolledID:', enrollment.enrolledID);
                console.log('   - userId:', enrollment.userId);
                
                const paymentStatus = (enrollment.paymentStatus || 'completed').toLowerCase().trim();
                const displayStatus = paymentStatus === 'pending' ? 'Pending' : 'Completed';
                
                console.log('   - Processed paymentStatus:', paymentStatus);
                console.log('   - Display status:', displayStatus);
                console.log('   - Badge background:', paymentStatus === 'pending' ? '#fef3c7' : '#d1fae5');
                console.log('   - Badge color:', paymentStatus === 'pending' ? '#92400e' : '#065f46');
                
                return (
                  <tr key={enrollment.enrolledID}>
                    <td>{enrollment.userName}</td>
                    <td>{enrollment.userEmail}</td>
                    <td>{new Date(enrollment.enrollmentDate).toLocaleDateString()}</td>
                    <td>{enrollment.progressPercentage || 0}%</td>
                    <td style={{textAlign: 'center', padding: '1rem'}}>
                      <span 
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '16px',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          display: 'inline-block',
                          background: paymentStatus === 'pending' ? '#fef3c7' : '#d1fae5',
                          color: paymentStatus === 'pending' ? '#92400e' : '#065f46',
                          whiteSpace: 'nowrap',
                          minWidth: '90px',
                          textAlign: 'center'
                        }}
                      >
                        {displayStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {course.instituteEnrollments && course.instituteEnrollments.length > 0 && (
        <div className="admission-enrollment-section">
          <h4>Institute Enrollments</h4>
          <div className="admission-institute-grid" style={{display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%'}}>
            {course.instituteEnrollments.map(enrollment => (
              <div key={enrollment.enrollmentsId} className="admission-institute-card">
                <div className="admission-card-header-inner">
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <h5>{enrollment.enrollingInstituteName}</h5>
                    {enrollment.enrollingInstituteDetails?.verified && (
                      <span 
                        style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: '#10b981',
                          color: 'white',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Verified Institute"
                      >
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    {enrollment.studentType && (
                      <span 
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: enrollment.studentType === 'mis' ? '#10b981' : '#3b82f6',
                          color: 'white'
                        }}
                      >
                        {enrollment.studentType === 'mis' ? '📊 MIS' : '🏫 Institute'}
                      </span>
                    )}
                    <span className="admission-student-count">
                      {enrollment.totalStudentsEnrolled} Students
                    </span>
                  </div>
                </div>
                <div className="admission-card-body">
                  <p className="admission-enrollment-date">
                    Enrolled on: {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                  </p>
                  <p className="admission-payment-status">
                    Payment: <span className={`status-${enrollment.paymentStatus}`}>
                      {enrollment.paymentStatus}
                    </span>
                  </p>
                  <p className="admission-total-amount">
                    Total: ₹{enrollment.totalAmount.toLocaleString()}
                  </p>
                </div>
                {enrollment.totalStudentsEnrolled > 0 && (
                  <button 
                    className="admission-view-details-btn"
                    onClick={() => handleViewDetails(enrollment)}
                  >
                    View Student List
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="course-enrollment-history">
      <div className="page-header">
        <h2>Admission Tracking</h2>
        <p>Track who has enrolled in your courses</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'online' ? 'active' : ''}`}
          onClick={() => { setActiveTab('online'); setSelectedCourse('all'); }}
        >
          <span className="tab-text">Online Courses</span>
          <span className="tab-count">{onlineCourses.length}</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'oncampus' ? 'active' : ''}`}
          onClick={() => { setActiveTab('oncampus'); setSelectedCourse('all'); }}
        >
          <span className="tab-text">On-Campus Courses</span>
          <span className="tab-count">{onCampusCourses.length}</span>
        </button>
      </div>

      {/* Course Filter */}
      {(activeTab === 'online' ? onlineCourses : onCampusCourses).length > 0 && (
        <div style={{marginBottom: '20px'}}>
          <label htmlFor="course-filter" style={{marginRight: '10px', fontWeight: '500'}}>Filter by Course:</label>
          <select 
            id="course-filter"
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '14px',
              minWidth: '200px',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Courses</option>
            {(activeTab === 'online' ? onlineCourses : onCampusCourses).map(course => (
              <option key={course.courseId} value={course.courseId}>
                {course.courseName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Content Area */}
      {trackingData.length === 0 ? (
        <div className="empty-state">
          <p>No enrollment data available yet</p>
        </div>
      ) : displayCourses.length === 0 ? (
        <div className="empty-state">
          <p>No {activeTab === 'online' ? 'online' : 'on-campus'} courses with enrollments found</p>
        </div>
      ) : (
        <div className="admission-courses-list" style={{display: 'flex', flexDirection: 'column', width: '100%', gap: '2.5rem'}}>
          <div className="admission-courses-grid" style={{display: 'flex', flexDirection: 'column', width: '100%', gap: '2.5rem'}}>
            {displayCourses.map(course => renderCourseCard(course))}
          </div>
        </div>
      )}

      {showDetailsModal && selectedEnrollment && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Enrolled Students</h3>
                <button 
                  className="modal-close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailsModal(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '28px',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '0',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f0f0f0';
                    e.target.style.color = '#333';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = '#666';
                  }}
                >
                  ×
                </button>
              </div>
              <div className="modal-content">
                <div className="enrollment-info">
                  <p><strong>Institute:</strong> {selectedEnrollment.enrollingInstituteDetails?.instituteName}</p>
                  <p><strong>Course:</strong> {selectedEnrollment.courseDetails?.courseName}</p>
                  <p><strong>Total Students:</strong> {selectedEnrollment.totalStudentsEnrolled}</p>
                </div>
                {selectedEnrollment.enrolledStudents && selectedEnrollment.enrolledStudents.length > 0 ? (
                  <table className="students-table">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email</th>
                        <th>Enrollment Date</th>
                        <th>Payment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEnrollment.enrolledStudents.map((student, index) => {
                        const paymentStatus = (student.paymentStatus || 'completed').toLowerCase().trim();
                        console.log('🔍 Rendering row for:', student.userName, 'Payment:', paymentStatus);
                        const displayStatus = paymentStatus === 'pending' ? 'Pending' : 'Completed';
                        return (
                          <tr key={student.enrolledID || index}>
                            <td>{student.userName || student.studentName || 'N/A'}</td>
                            <td>{student.userEmail || student.studentEmail || 'N/A'}</td>
                            <td>{new Date(student.enrollmentDate).toLocaleDateString()}</td>
                            <td>
                              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', minHeight: '40px' }}>
                                <span 
                                  className={`status-badge status-${paymentStatus}`}
                                  style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    fontSize: '0.85rem',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    display: 'inline-block',
                                    background: paymentStatus === 'pending' ? '#fef3c7' : '#d1fae5',
                                    color: paymentStatus === 'pending' ? '#92400e' : '#065f46',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {displayStatus}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p style={{textAlign: 'center', padding: '20px', color: '#666'}}>No students enrolled yet</p>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default CourseEnrollmentHistory;
