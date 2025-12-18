import React, { useState, useEffect } from 'react';
import './FacultyList.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

const Report = () => {
  const [activeTab, setActiveTab] = useState('physical');
  const [centers, setCenters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [studentReports, setStudentReports] = useState({});
  const [loading, setLoading] = useState(false);
  const [assessedBatches, setAssessedBatches] = useState([]);

  useEffect(() => {
    fetchCenters();
  }, []);

  useEffect(() => {
    if (selectedCenter) {
      fetchCourses();
    }
  }, [selectedCenter]);

  useEffect(() => {
    if (selectedCourse && selectedCenter) {
      fetchBatches();
    }
  }, [selectedCourse, selectedCenter]);

  useEffect(() => {
    if (selectedBatch) {
      fetchStudents();
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (activeTab === 'assessed') {
      fetchAssessedBatches();
    }
  }, [activeTab]);

  const fetchCenters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/training-centers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCenters(data.data);
      }
    } catch (error) {
      console.error('Error fetching centers:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/course-details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const filteredCourses = data.data.filter(course => 
          course.trainingCentres && course.trainingCentres.includes(selectedCenter)
        );
        setCourses(filteredCourses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/batches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const filteredBatches = data.data.filter(batch => 
          batch.trainingCentreId === selectedCenter && 
          batch.courseId === selectedCourse &&
          batch.status === 'Approved'
        );
        setBatches(filteredBatches);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/batches/${selectedBatch}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data.selectedStudents) {
        setStudents(data.data.selectedStudents);
        const initialReports = {};
        data.data.selectedStudents.forEach(student => {
          initialReports[student.id] = {
            reportFile: null,
            certified: null
          };
        });
        setStudentReports(initialReports);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchAssessedBatches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/batches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const approvedBatches = data.data.filter(b => b.status === 'Approved');
        setAssessedBatches(approvedBatches);
      }
    } catch (error) {
      console.error('Error fetching assessed batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (studentId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/upload/report`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const result = await response.json();
      if (result.success) {
        setStudentReports(prev => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            reportFile: result.data.fileUrl
          }
        }));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('File upload failed');
    }
  };

  const handleCertifiedChange = (studentId, value) => {
    setStudentReports(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        certified: value
      }
    }));
  };

  const handleSaveReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const reportData = {
        centerId: selectedCenter,
        courseId: selectedCourse,
        batchId: selectedBatch,
        students: students.map(student => ({
          studentId: student.id,
          studentName: student.name,
          reportFile: studentReports[student.id]?.reportFile,
          certified: studentReports[student.id]?.certified
        }))
      };

      const response = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });

      const result = await response.json();
      if (result.success) {
        alert('Report saved successfully!');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Failed to save report');
    }
  };

  return (
    <div className="faculty-list-container">
      <div className="faculty-header">Reports & Analytics</div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('physical')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: activeTab === 'physical' ? '#4863f7' : '#f8f9fa',
            color: activeTab === 'physical' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Physical Progress Report
        </button>
        <button 
          onClick={() => setActiveTab('assessed')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'assessed' ? '#4863f7' : '#f8f9fa',
            color: activeTab === 'assessed' ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Assessed Batches Report
        </button>
      </div>

      {activeTab === 'physical' && (
        <div className="faculty-list-section">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div>
              <label>Select Center:</label>
              <select 
                value={selectedCenter} 
                onChange={(e) => {
                  setSelectedCenter(e.target.value);
                  setSelectedCourse('');
                  setSelectedBatch('');
                  setCourses([]);
                  setBatches([]);
                  setStudents([]);
                }}
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              >
                <option value="">Choose Center</option>
                {centers.map(center => (
                  <option key={center.id} value={center.id}>{center.centerName}</option>
                ))}
              </select>
            </div>

            {selectedCenter && (
              <div>
                <label>Select Course:</label>
                <select 
                  value={selectedCourse} 
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setSelectedBatch('');
                    setBatches([]);
                    setStudents([]);
                  }}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                >
                  <option value="">Choose Course</option>
                  {courses.map(course => (
                    <option key={course.courseId} value={course.courseId}>{course.courseName}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedCourse && (
              <div>
                <label>Select Batch:</label>
                <select 
                  value={selectedBatch} 
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                >
                  <option value="">Choose Batch</option>
                  {batches.map(batch => (
                    <option key={batch.batchId} value={batch.batchId}>{batch.batchId}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {students.length > 0 && (
            <div>
              <table className="faculty-table">
                <thead>
                  <tr>
                    <th>S. No</th>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Report Upload</th>
                    <th>Certified</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.phone}</td>
                      <td>
                        <input 
                          type="file" 
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleFileUpload(student.id, file);
                          }}
                          style={{ width: '100%' }}
                        />
                        {studentReports[student.id]?.reportFile && (
                          <a href={studentReports[student.id].reportFile} target="_blank" rel="noopener noreferrer">
                            View Report
                          </a>
                        )}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleCertifiedChange(student.id, true)}
                          style={{
                            padding: '5px 10px',
                            marginRight: '5px',
                            backgroundColor: studentReports[student.id]?.certified === true ? '#28a745' : '#f8f9fa',
                            color: studentReports[student.id]?.certified === true ? 'white' : '#333',
                            border: '1px solid #ddd',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          Yes
                        </button>
                        <button 
                          onClick={() => handleCertifiedChange(student.id, false)}
                          style={{
                            padding: '5px 10px',
                            backgroundColor: studentReports[student.id]?.certified === false ? '#dc3545' : '#f8f9fa',
                            color: studentReports[student.id]?.certified === false ? 'white' : '#333',
                            border: '1px solid #ddd',
                            borderRadius: '3px',
                            cursor: 'pointer'
                          }}
                        >
                          No
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <button 
                  onClick={handleSaveReport}
                  style={{
                    padding: '12px 30px',
                    backgroundColor: '#4863f7',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Save Report
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'assessed' && (
        <div className="faculty-list-section">
          {loading ? (
            <p>Loading batches...</p>
          ) : (
            <div>
              {centers.map(center => {
                const centerBatches = assessedBatches.filter(batch => batch.trainingCentreId === center.id);
                if (centerBatches.length === 0) return null;
                
                return (
                  <div key={center.id} style={{ marginBottom: '30px' }}>
                    <h3>Training Center: {center.centerName}</h3>
                    <table className="faculty-table">
                      <thead>
                        <tr>
                          <th>Batch ID</th>
                          <th>Batch Date & Time</th>
                          <th>Course</th>
                          <th>Trainer Name</th>
                          <th>Total Students</th>
                          <th>Trained</th>
                          <th>Assessed</th>
                          <th>Certified</th>
                        </tr>
                      </thead>
                      <tbody>
                        {centerBatches.map(batch => (
                          <tr key={batch.batchId}>
                            <td>{batch.batchId}</td>
                            <td>
                              {batch.startDate} to {batch.endDate}
                              {batch.startTime && batch.endTime && (
                                <br />
                              )}
                              {batch.startTime && batch.endTime && 
                                `${batch.startTime}–${batch.endTime}`
                              }
                            </td>
                            <td>{batch.courseName}</td>
                            <td>{batch.trainerName}</td>
                            <td>{batch.selectedStudents?.length || 0}</td>
                            <td>{batch.selectedStudents?.length || 0}</td>
                            <td>{batch.selectedStudents?.length || 0}</td>
                            <td>{batch.selectedStudents?.length || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Report;