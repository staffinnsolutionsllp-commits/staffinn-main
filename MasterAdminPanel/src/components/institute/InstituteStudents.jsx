import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import StudentProfileModal from './StudentProfileModal';
import './InstituteStudents.css';

const InstituteStudents = () => {
  const [students, setStudents] = useState([]);
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [selectedInstitute]);

  const loadInitialData = async () => {
    try {
      // Load institutes for the dropdown
      const institutesResponse = await adminAPI.getAllInstitutes();
      if (institutesResponse.success) {
        setInstitutes(institutesResponse.data);
      }
    } catch (error) {
      console.error('Error loading institutes:', error);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllStudents(selectedInstitute || null);
      
      if (response.success) {
        setStudents(response.data);
      }
    } catch (error) {
      setError(error.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (studentId) => {
    try {
      const response = await adminAPI.getStudentProfileForAdmin(studentId);
      
      if (response.success) {
        setSelectedStudent(response.data);
        setShowProfileModal(true);
      }
    } catch (error) {
      alert('Failed to load student profile: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Filter students based on search and status
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      (student.fullName && student.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.course && student.course.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'hired' && student.isHired) ||
      (statusFilter === 'not-hired' && !student.isHired);
    
    return matchesSearch && matchesStatus;
  });

  // Calculate summary stats for selected institute
  const summaryStats = {
    totalStudents: filteredStudents.length,
    hiredStudents: filteredStudents.filter(s => s.isHired).length
  };

  if (loading) {
    return (
      <div className="institute-students-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading students...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="institute-students-container">
        <div className="error-message">
          <h3>Error Loading Students</h3>
          <p>{error}</p>
          <button onClick={loadStudents} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="institute-students-container">
      <div className="page-header">
        <h1 className="page-title">Student Management</h1>
        <div className="header-controls">
          <div className="institute-selector">
            <label htmlFor="institute-select">Select Institute:</label>
            <select 
              id="institute-select"
              value={selectedInstitute}
              onChange={(e) => setSelectedInstitute(e.target.value)}
              className="institute-dropdown"
            >
              <option value="">All Institutes</option>
              {institutes.map((institute) => (
                <option key={institute.userId} value={institute.userId}>
                  {institute.name || institute.instituteName || 'Unknown Institute'}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {selectedInstitute && (
        <div className="summary-cards">
          <div className="summary-card total">
            <div className="summary-icon">
              <i className="fas fa-user-graduate"></i>
            </div>
            <div className="summary-content">
              <h3>Total Students</h3>
              <div className="summary-number">{summaryStats.totalStudents}</div>
            </div>
          </div>
          <div className="summary-card hired">
            <div className="summary-icon">
              <i className="fas fa-briefcase"></i>
            </div>
            <div className="summary-content">
              <h3>Hired Students</h3>
              <div className="summary-number">{summaryStats.hiredStudents}</div>
            </div>
          </div>
        </div>
      )}

      <div className="controls-section">
        <div className="search-filter-section">
          <div className="search-box">
            <i className="fas fa-search search-icon"></i>
            <input 
              type="text" 
              placeholder="Search students..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-dropdown">
            <select 
              className="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Students</option>
              <option value="hired">Hired</option>
              <option value="not-hired">Not Hired</option>
            </select>
          </div>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="no-data">
          <h3>No Students Found</h3>
          <p>
            {searchTerm || statusFilter !== 'all' 
              ? 'No students match your search criteria.' 
              : selectedInstitute 
                ? 'This institute has no students yet.'
                : 'No students have been added yet.'
            }
          </p>
        </div>
      ) : (
        <div className="modern-table-container">
          <div className="table-header">
            <div className="table-title">
              Students ({filteredStudents.length})
            </div>
            <div className="table-actions">
              <button className="export-btn">
                <i className="fas fa-download"></i>
                Export
              </button>
            </div>
          </div>
          
          <div className="table-content">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>COURSE & YEAR</th>
                  <th>CONTACT</th>
                  <th>STATUS</th>
                  <th>RECRUITER</th>
                  <th>APPLICATIONS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.studentId || student.instituteStudntsID} className="table-row">
                    <td>
                      <div className="student-info">
                        <div className="student-avatar">
                          {student.profilePhoto || student.photo ? (
                            <img src={student.profilePhoto || student.photo} alt="Student" />
                          ) : (
                            <div className="avatar-placeholder">
                              {(student.fullName || student.name || 'S').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="student-details">
                          <div className="student-name">
                            {student.fullName || student.name || 'Unknown Student'}
                          </div>
                          <div className="student-id">
                            ID: {student.studentId || student.instituteStudntsID || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="course-info">
                        <div className="course-name">
                          {student.course || student.program || 'Course not specified'}
                        </div>
                        <div className="year">
                          {student.year || student.currentYear || 'Year not specified'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="email">
                          {student.email || student.emailAddress || 'No email'}
                        </div>
                        <div className="phone">
                          {student.phone || student.phoneNumber || 'No phone'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${student.isHired ? 'hired' : 'not-hired'}`}>
                        {student.isHired ? 'Hired' : 'Not Hired'}
                      </span>
                    </td>
                    <td>
                      <div className="recruiter-info">
                        {student.recruiterInfo ? (
                          <>
                            <div className="recruiter-name">{student.recruiterInfo.name}</div>
                            <div className="company-name">{student.recruiterInfo.company}</div>
                          </>
                        ) : (
                          <span className="no-recruiter">Not hired</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="applications-count">
                        <span className="count-badge">
                          {student.totalApplications || 0}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="action-icons">
                        <button
                          className="icon-btn view-icon"
                          onClick={() => handleViewProfile(student.studentId || student.instituteStudntsID)}
                          title="View profile"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Profile Modal */}
      {showProfileModal && selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
};

export default InstituteStudents;