import React, { useState, useEffect } from 'react';
import './StudentSelectionModal.css';
import apiWithLoading from '../../services/apiWithLoading';

const StudentApplicationModal = ({ 
  isOpen, 
  onClose, 
  jobTitle, 
  companyName, 
  selectedJob,
  selectedRecruiter,
  userProfile
}) => {
  const [showOptions, setShowOptions] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if institute is Staffinn Partner (has MIS access)
  // For now, show both options for all institutes to test the functionality
  // TODO: Update this logic based on actual backend implementation
  const isStaffinnPartner = true; // Temporarily set to true for testing
  
  // Uncomment and adjust this line when the backend properly returns MIS status:
  // const isStaffinnPartner = userProfile?.misStatus === 'approved' || 
  //                          userProfile?.isStaffinnPartner || 
  //                          userProfile?.staffinnPartner === true;

  useEffect(() => {
    if (isOpen) {
      console.log('StudentApplicationModal opened');
      console.log('User profile:', userProfile);
      console.log('Is Staffinn Partner:', isStaffinnPartner);
      setShowOptions(true);
      setSelectedType(null);
      setStudents([]);
      setSelectedStudents(new Set());
    }
  }, [isOpen, userProfile, isStaffinnPartner]);

  const handleOptionSelect = async (type) => {
    console.log('Selected student type:', type);
    setSelectedType(type);
    setShowOptions(false);
    setLoading(true);

    try {
      console.log('Fetching students for job:', selectedJob.id, 'type:', type);
      const response = await apiWithLoading.getStudentsApplicationStatus(selectedJob.id, type);
      console.log('Students response:', response);
      if (response.success) {
        setStudents(response.data || []);
      } else {
        console.error('Failed to get students:', response.message);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentToggle = (studentId, isDisabled) => {
    if (isDisabled) return;
    
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleApply = async () => {
    if (selectedStudents.size === 0) {
      alert('Please select at least one student to apply.');
      return;
    }

    console.log('Applying students:', {
      type: selectedType,
      jobId: selectedJob.id,
      recruiterId: selectedRecruiter.id,
      studentIds: Array.from(selectedStudents)
    });

    setIsSubmitting(true);
    try {
      let response;
      const selectedStudentIds = Array.from(selectedStudents);

      if (selectedType === 'mis') {
        console.log('Calling applyMisStudentsToJob');
        response = await apiWithLoading.applyMisStudentsToJob(
          selectedJob.id,
          selectedRecruiter.id,
          selectedStudentIds
        );
      } else {
        console.log('Calling applyStudentsToJob');
        response = await apiWithLoading.applyStudentsToJob(
          selectedJob.id,
          selectedRecruiter.id,
          selectedStudentIds
        );
      }

      console.log('Apply response:', response);
      if (response.success) {
        const studentTypeText = selectedType === 'mis' ? 'MIS students' : 'institute students';
        alert(`Successfully applied ${selectedStudents.size} ${studentTypeText} to ${selectedJob.title}!`);
        onClose();
      } else {
        alert('Failed to apply students: ' + response.message);
      }
    } catch (error) {
      console.error('Error applying students:', error);
      alert('Failed to apply students to job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setShowOptions(true);
    setSelectedType(null);
    setStudents([]);
    setSelectedStudents(new Set());
  };

  const availableStudents = students.filter(student => !student.hasApplied);
  const appliedStudents = students.filter(student => student.hasApplied);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="student-selection-modal">
        <div className="modal-header">
          <h2>Apply Students to Job</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="job-info">
          <h3>{jobTitle}</h3>
          <p>{companyName}</p>
        </div>

        <div className="modal-content">
          {showOptions ? (
            <div className="student-type-options">
              <h3>Select Student Type</h3>
              <div className="options-container">
                <button 
                  className="option-btn institute-btn"
                  onClick={() => handleOptionSelect('institute')}
                >
                  <div className="option-content">
                    <h4>Apply Students of Institute</h4>
                    <p>Apply students from your institute's regular programs</p>
                  </div>
                </button>
                
                {isStaffinnPartner && (
                  <button 
                    className="option-btn mis-btn"
                    onClick={() => handleOptionSelect('mis')}
                  >
                    <div className="option-content">
                      <h4>Apply Students of MIS</h4>
                      <p>Apply students from MIS (Management Information System)</p>
                    </div>
                  </button>
                )}
              </div>
              
              {!isStaffinnPartner && (
                <div className="mis-info">
                  <p><strong>Note:</strong> MIS student application is only available for Staffinn Partner institutes.</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="selected-type-header">
                <button className="back-btn" onClick={handleBack}>← Back</button>
                <h3>
                  {selectedType === 'mis' ? 'MIS Students' : 'Institute Students'}
                </h3>
              </div>

              {loading ? (
                <div className="loading-state">
                  <p>Loading students...</p>
                </div>
              ) : (
                <>
                  {students.length === 0 ? (
                    <div className="no-students">
                      <p>No students found in your {selectedType === 'mis' ? 'MIS' : 'Student Management'}.</p>
                      <p>Please add students first before applying to jobs.</p>
                    </div>
                  ) : (
                    <div className="students-container">
                      {appliedStudents.length > 0 && (
                        <div className="applied-students-section">
                          <h4>Already Applied Students</h4>
                          <div className="students-table">
                            <div className="table-header">
                              <div className="col-name">Student Name</div>
                              <div className="col-email">Email</div>
                              <div className="col-phone">Phone</div>
                              <div className="col-degree">Degree</div>
                              <div className="col-action">Status</div>
                            </div>
                            {appliedStudents.map(student => (
                              <div key={student.instituteStudntsID || student.id} className="table-row applied">
                                <div className="col-name">{student.studentName || student.fullName}</div>
                                <div className="col-email">{student.email}</div>
                                <div className="col-phone">{student.phoneNumber}</div>
                                <div className="col-degree">{student.degreeName}</div>
                                <div className="col-action">
                                  <span className="applied-badge">Applied</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {availableStudents.length > 0 && (
                        <div className="available-students-section">
                          <h4>Available Students ({availableStudents.length})</h4>
                          <div className="students-table">
                            <div className="table-header">
                              <div className="col-name">Student Name</div>
                              <div className="col-email">Email</div>
                              <div className="col-phone">Phone</div>
                              <div className="col-degree">Degree</div>
                              <div className="col-action">Select</div>
                            </div>
                            {availableStudents.map(student => (
                              <div key={student.instituteStudntsID || student.id} className="table-row">
                                <div className="col-name">{student.studentName || student.fullName}</div>
                                <div className="col-email">{student.email}</div>
                                <div className="col-phone">{student.phoneNumber}</div>
                                <div className="col-degree">{student.degreeName}</div>
                                <div className="col-action">
                                  <input
                                    type="checkbox"
                                    checked={selectedStudents.has(student.instituteStudntsID || student.id)}
                                    onChange={() => handleStudentToggle(student.instituteStudntsID || student.id, false)}
                                    className="student-checkbox"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {availableStudents.length === 0 && appliedStudents.length > 0 && (
                        <div className="no-available-students">
                          <p>All your {selectedType === 'mis' ? 'MIS' : 'institute'} students have already been applied to this job.</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          {!showOptions && (
            <button 
              className="apply-btn" 
              onClick={handleApply}
              disabled={isSubmitting || selectedStudents.size === 0 || availableStudents.length === 0}
            >
              {isSubmitting ? 'Applying...' : `Apply ${selectedStudents.size} Student${selectedStudents.size !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentApplicationModal;