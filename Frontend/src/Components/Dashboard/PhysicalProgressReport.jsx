import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const PhysicalProgressReport = () => {
  const [centers, setCenters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  
  const [reportData, setReportData] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTrainingCenters();
      if (response.success) {
        setCenters(response.data || []);
      }
    } catch (error) {
      console.error('Error loading centers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async (centerId) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1'}/placement/center-courses/${centerId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await response.json();
      if (result.success) {
        setCourses(result.data || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async (centerId, courseId) => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1'}/placement/center-course-batches/${centerId}/${courseId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await response.json();
      if (result.success) {
        setBatches(result.data || []);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (batchId) => {
    try {
      setLoading(true);
      console.log('Loading real students for batch:', batchId);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1'}/placement/batch-real-students/${batchId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const result = await response.json();
      console.log('Real students response:', result);
      if (result.success) {
        setStudents(result.data || []);
        console.log('Real students loaded:', result.data?.length || 0);
      }
    } catch (error) {
      console.error('Error loading real students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCenterChange = (e) => {
    const centerId = e.target.value;
    setSelectedCenter(centerId);
    setSelectedCourse('');
    setSelectedBatch('');
    setCourses([]);
    setBatches([]);
    setStudents([]);
    if (centerId) {
      loadCourses(centerId);
    }
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    setSelectedBatch('');
    setBatches([]);
    setStudents([]);
    if (courseId && selectedCenter) {
      loadBatches(selectedCenter, courseId);
    }
  };

  const handleBatchChange = (e) => {
    const batchId = e.target.value;
    setSelectedBatch(batchId);
    setStudents([]);
    if (batchId) {
      loadStudents(batchId);
    }
  };

  const handleFileUpload = async (studentId, file) => {
    if (!file) return;
    
    try {
      setUploadingFiles(prev => ({ ...prev, [studentId]: true }));
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('studentId', studentId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1'}/upload/report`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      
      const result = await response.json();
      if (result.success) {
        setReportData(prev => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            reportUrl: result.data.fileUrl,
            reportFileName: file.name
          }
        }));
      } else {
        alert('Failed to upload report');
      }
    } catch (error) {
      console.error('Error uploading report:', error);
      alert('Failed to upload report');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const handleCertifiedChange = (studentId, certified) => {
    setReportData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        certified
      }
    }));
  };

  const handleSaveReport = async () => {
    try {
      setLoading(true);
      
      const reportPayload = {
        centerId: selectedCenter,
        courseId: selectedCourse,
        batchId: selectedBatch,
        reportType: 'physical-progress',
        studentReports: students.map(student => ({
          studentId: student.studentId,
          reportUrl: reportData[student.studentId]?.reportUrl || null,
          certified: reportData[student.studentId]?.certified || false
        }))
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1'}/reports/save-physical-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reportPayload)
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Report saved successfully!');
        setReportData({});
      } else {
        alert('Failed to save report');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="physical-progress-report">
      <h3>Physical Progress Report</h3>
      
      <div className="report-filters" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div>
          <label>Select Center:</label>
          <select value={selectedCenter} onChange={handleCenterChange} disabled={loading}>
            <option value="">Choose Center</option>
            {centers.map(center => (
              <option key={center.id || center.TrainingCenterFormId} value={center.id || center.TrainingCenterFormId}>
                {center.name || center.trainingCentreName || 'Unnamed Center'}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label>Select Course:</label>
          <select value={selectedCourse} onChange={handleCourseChange} disabled={!selectedCenter || loading}>
            <option value="">Choose Course</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label>Select Batch:</label>
          <select value={selectedBatch} onChange={handleBatchChange} disabled={!selectedCourse || loading}>
            <option value="">Choose Batch</option>
            {batches.map(batch => (
              <option key={batch.id} value={batch.id}>{batch.name}</option>
            ))}
          </select>
        </div>
      </div>

      {students.length > 0 && (
        <div className="students-table">
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>Student Name</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>Email</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>Phone</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>Qualification</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>Report Upload</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6' }}>Certified</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.studentId}>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{student.studentName}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{student.email}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{student.phone}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>{student.qualification}</td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    {uploadingFiles[student.studentId] ? (
                      <span>Uploading...</span>
                    ) : reportData[student.studentId]?.reportUrl ? (
                      <div>
                        <span style={{ color: 'green' }}>✓ {reportData[student.studentId]?.reportFileName}</span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileUpload(student.studentId, e.target.files[0])}
                          style={{ marginLeft: '10px', fontSize: '12px' }}
                        />
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(student.studentId, e.target.files[0])}
                      />
                    )}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                    <button
                      onClick={() => handleCertifiedChange(student.studentId, true)}
                      style={{
                        backgroundColor: reportData[student.studentId]?.certified === true ? '#28a745' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        marginRight: '5px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleCertifiedChange(student.studentId, false)}
                      style={{
                        backgroundColor: reportData[student.studentId]?.certified === false ? '#dc3545' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '4px',
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
          
          <button
            onClick={handleSaveReport}
            disabled={loading}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            {loading ? 'Saving...' : 'Save Report'}
          </button>
        </div>
      )}
      
      {loading && <div>Loading...</div>}
    </div>
  );
};

export default PhysicalProgressReport;