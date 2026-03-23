import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import apiService from '../../services/api';
import './StudentTracking.css';
import { FaSearch, FaFilter, FaEye, FaCheckCircle, FaClock, FaBook, FaCalendar, FaUser, FaGraduationCap } from 'react-icons/fa';

const StudentTracking = () => {
  const [enrollmentHistory, setEnrollmentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchEnrollmentHistory();
    const interval = setInterval(fetchEnrollmentHistory, 30000);
    return () => clearInterval(interval);
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

  const ModalPortal = ({ children }) => {
    const modalRoot = document.getElementById('modal-root') || document.body;
    return ReactDOM.createPortal(children, modalRoot);
  };

  const fetchEnrollmentHistory = async () => {
    try {
      setLoading(true);
      console.log('📚 Fetching enrollment history...');
      const response = await apiService.getEnrollmentHistory();
      console.log('📊 Enrollment history response:', response);
      
      if (response.success && response.data) {
        setEnrollmentHistory(response.data);
      } else {
        console.error('Failed to fetch enrollment history:', response.message);
      }
    } catch (error) {
      console.error('Error fetching enrollment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowDetailsModal(true);
  };

  const filteredEnrollments = enrollmentHistory.filter(enrollment => {
    const matchesSearch = 
      enrollment.courseDetails?.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.enrolledStudents?.some(student => 
        student.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesFilter = filterStatus === 'all' || enrollment.paymentStatus === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: '#10b981', icon: <FaCheckCircle />, text: 'Completed' },
      pending: { color: '#f59e0b', icon: <FaClock />, text: 'Pending' },
      failed: { color: '#ef4444', icon: <FaClock />, text: 'Failed' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className="status-badge" style={{ backgroundColor: config.color }}>
        {config.icon} {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="student-tracking-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading enrollment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-tracking-container">
      <div className="tracking-header">
        <div className="header-content">
          <h1><FaGraduationCap /> Student Enrollment Tracking</h1>
          <p>Track all your student enrollments in real-time</p>
        </div>
        <button className="refresh-button" onClick={fetchEnrollmentHistory}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#3b82f6' }}>
            <FaBook />
          </div>
          <div className="stat-content">
            <h3>{enrollmentHistory.length}</h3>
            <p>Total Enrollments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#10b981' }}>
            <FaCheckCircle />
          </div>
          <div className="stat-content">
            <h3>
              {enrollmentHistory.filter(e => e.paymentStatus === 'completed').length}
            </h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f59e0b' }}>
            <FaClock />
          </div>
          <div className="stat-content">
            <h3>
              {enrollmentHistory.filter(e => e.paymentStatus === 'pending').length}
            </h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#8b5cf6' }}>
            <FaUser />
          </div>
          <div className="stat-content">
            <h3>
              {enrollmentHistory.reduce((sum, e) => sum + (e.totalStudentsEnrolled || 0), 0)}
            </h3>
            <p>Total Students</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="search-filter-section">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Search by course name or student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <FaFilter />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Enrollments List */}
      <div className="enrollments-section">
        {filteredEnrollments.length === 0 ? (
          <div className="empty-state">
            <FaBook className="empty-icon" />
            <h3>No Enrollments Found</h3>
            <p>
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Start enrolling students in courses to see them here'}
            </p>
          </div>
        ) : (
          <div className="enrollments-grid">
            {filteredEnrollments.map((enrollment) => (
              <div key={enrollment.enrollmentsId} className="enrollment-card">
                <div className="enrollment-header">
                  <div className="course-info">
                    <h3>{enrollment.courseDetails?.courseName || 'Course Name'}</h3>
                    <p className="institute-name">
                      {enrollment.courseInstituteDetails?.instituteName || 'Institute'}
                    </p>
                  </div>
                  {getStatusBadge(enrollment.paymentStatus)}
                </div>

                <div className="enrollment-details">
                  <div className="detail-row">
                    <span className="detail-label">
                      <FaCalendar /> Enrollment Date:
                    </span>
                    <span className="detail-value">
                      {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">
                      <FaUser /> Students Enrolled:
                    </span>
                    <span className="detail-value">
                      {enrollment.totalStudentsEnrolled || 0}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">
                      <FaBook /> Course Duration:
                    </span>
                    <span className="detail-value">
                      {enrollment.courseDetails?.duration || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">💰 Total Amount:</span>
                    <span className="detail-value amount">
                      ₹{enrollment.totalAmount?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>

                <div className="enrolled-students-preview">
                  <h4>Enrolled Students:</h4>
                  <div className="students-list">
                    {enrollment.enrolledStudents?.slice(0, 3).map((student, index) => (
                      <div key={index} className="student-chip">
                        <div className="student-avatar">
                          {student.studentName?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <span>{student.studentName || 'Student'}</span>
                      </div>
                    ))}
                    {enrollment.enrolledStudents?.length > 3 && (
                      <div className="more-students">
                        +{enrollment.enrolledStudents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>

                <button
                  className="view-details-btn"
                  onClick={() => handleViewDetails(enrollment)}
                >
                  <FaEye /> View Full Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedEnrollment && (
        <ModalPortal>
          <div 
            className="modal-overlay"
            onClick={() => setShowDetailsModal(false)}
          >
            <div 
              className="details-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Enrollment Details</h2>
                <button className="close-btn" onClick={() => setShowDetailsModal(false)}>
                  ×
                </button>
              </div>

              <div className="modal-content">
                <div className="modal-section">
                  <h3>Course Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Course Name:</span>
                      <span className="value">
                        {selectedEnrollment.courseDetails?.courseName}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Institute:</span>
                      <span className="value">
                        {selectedEnrollment.courseInstituteDetails?.instituteName}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Duration:</span>
                      <span className="value">
                        {selectedEnrollment.courseDetails?.duration}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Mode:</span>
                      <span className="value">
                        {selectedEnrollment.courseDetails?.mode}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-section">
                  <h3>Payment Information</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Status:</span>
                      {getStatusBadge(selectedEnrollment.paymentStatus)}
                    </div>
                    <div className="info-item">
                      <span className="label">Total Amount:</span>
                      <span className="value amount">
                        ₹{selectedEnrollment.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Enrollment Date:</span>
                      <span className="value">
                        {new Date(selectedEnrollment.enrollmentDate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="modal-section">
                  <h3>Enrolled Students ({selectedEnrollment.totalStudentsEnrolled})</h3>
                  <div className="students-table">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student Name</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Enrollment Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEnrollment.enrolledStudents?.map((student, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>
                              <div className="student-cell">
                                <div className="student-avatar-small">
                                  {student.studentName?.charAt(0).toUpperCase() || 'S'}
                                </div>
                                {student.studentName || 'N/A'}
                              </div>
                            </td>
                            <td>{student.studentEmail || 'N/A'}</td>
                            <td>
                              <span className="status-badge" style={{ backgroundColor: '#10b981' }}>
                                {student.status || 'Active'}
                              </span>
                            </td>
                            <td>
                              {student.enrollmentDate
                                ? new Date(student.enrollmentDate).toLocaleDateString()
                                : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="close-modal-btn" onClick={() => setShowDetailsModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default StudentTracking;
