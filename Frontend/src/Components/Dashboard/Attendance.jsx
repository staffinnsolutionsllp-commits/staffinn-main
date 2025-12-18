import React, { useState, useEffect } from 'react';
import './FacultyList.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

const Attendance = () => {
  const [trainingCentres, setTrainingCentres] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [selectedTrainingCentre, setSelectedTrainingCentre] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [existingAttendance, setExistingAttendance] = useState(null);

  useEffect(() => {
    fetchTrainingCentres();
  }, []);

  useEffect(() => {
    if (selectedTrainingCentre) {
      fetchCourses();
      setSelectedCourse('');
      setSelectedFaculty('');
      setSelectedBatch('');
    }
  }, [selectedTrainingCentre]);

  useEffect(() => {
    if (selectedCourse) {
      fetchFaculty();
      setSelectedFaculty('');
      setSelectedBatch('');
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedFaculty) {
      fetchBatches();
      setSelectedBatch('');
    }
  }, [selectedFaculty]);

  useEffect(() => {
    if (selectedBatch) {
      fetchStudents();
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (selectedBatch && attendanceDate) {
      fetchExistingAttendance();
    }
  }, [selectedBatch, attendanceDate]);

  const fetchTrainingCentres = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/training-centers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setTrainingCentres(data.data);
    } catch (error) {
      console.error('Error fetching training centres:', error);
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
          course.trainingCentres && course.trainingCentres.includes(selectedTrainingCentre)
        );
        setCourses(filteredCourses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchFaculty = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/faculty-list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const filteredFaculty = data.data.filter(f => 
          f.selectedCourses && f.selectedCourses.includes(selectedCourse)
        );
        setFaculty(filteredFaculty);
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
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
          batch.status === 'Approved' && 
          batch.trainingCentreId === selectedTrainingCentre &&
          batch.courseId === selectedCourse
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
      const response = await fetch(`${API_URL}/mis-students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        const batch = batches.find(b => b.batchId === selectedBatch);
        if (batch && batch.selectedStudents) {
          const batchStudents = data.data.filter(student => 
            batch.selectedStudents.includes(student.studentsId)
          );
          setStudents(batchStudents);
          
          // Initialize attendance state
          const initialAttendance = {};
          batchStudents.forEach(student => {
            initialAttendance[student.studentsId] = 'Present';
          });
          setAttendance(initialAttendance);
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/attendance?batchId=${selectedBatch}&attendanceDate=${attendanceDate}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setExistingAttendance(data.data);
        // Update attendance state with existing data
        const existingAttendanceMap = {};
        data.data.studentAttendance.forEach(student => {
          existingAttendanceMap[student.studentId] = student.status;
        });
        setAttendance(existingAttendanceMap);
      } else {
        setExistingAttendance(null);
      }
    } catch (error) {
      console.error('Error fetching existing attendance:', error);
      setExistingAttendance(null);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmit = async () => {
    if (!selectedBatch || !attendanceDate || students.length === 0) {
      alert('Please select all required fields and ensure students are loaded');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const studentAttendance = students.map(student => ({
        studentId: student.studentsId,
        studentName: student.fatherName || student.name || 'Unknown',
        status: attendance[student.studentsId] || 'Present'
      }));

      const response = await fetch(`${API_URL}/attendance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          batchId: selectedBatch,
          trainingCentreId: selectedTrainingCentre,
          courseId: selectedCourse,
          facultyId: selectedFaculty,
          attendanceDate,
          studentAttendance
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Attendance marked successfully!');
        fetchExistingAttendance();
      } else {
        alert(result.message || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    }
    setLoading(false);
  };

  const downloadAttendance = () => {
    if (!existingAttendance) {
      alert('No attendance data to download');
      return;
    }

    const csvContent = [
      ['Student ID', 'Student Name', 'Status'],
      ...existingAttendance.studentAttendance.map(student => [
        student.studentId,
        student.studentName,
        student.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${selectedBatch}_${attendanceDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="faculty-list-container">
      <div className="faculty-header">Attendance Management</div>

      <div className="form-grid" style={{ maxWidth: '1000px', marginBottom: '30px' }}>
        <div className="form-field">
          <label>Training Centre *</label>
          <select value={selectedTrainingCentre} onChange={(e) => setSelectedTrainingCentre(e.target.value)} required>
            <option value="">Select Training Centre</option>
            {trainingCentres.map(centre => (
              <option key={centre.id} value={centre.id}>{centre.trainingCentreName}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Course *</label>
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} required disabled={!selectedTrainingCentre}>
            <option value="">Select Course</option>
            {courses.map(course => (
              <option key={course.id || course.miscourses} value={course.id || course.miscourses}>{course.course}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Faculty *</label>
          <select value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)} required disabled={!selectedCourse}>
            <option value="">Select Faculty</option>
            {faculty.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Approved Batch *</label>
          <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} required disabled={!selectedFaculty}>
            <option value="">Select Batch</option>
            {batches.map(batch => (
              <option key={batch.batchId} value={batch.batchId}>{batch.batchId} - {batch.courseName}</option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label>Attendance Date *</label>
          <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} required />
        </div>
      </div>

      {students.length > 0 && (
        <div className="faculty-list-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>Student Attendance - {attendanceDate}</h3>
            <div>
              {existingAttendance && (
                <button onClick={downloadAttendance} className="save-btn" style={{ marginRight: '10px', backgroundColor: '#28a745' }}>
                  Download Attendance
                </button>
              )}
              <button onClick={handleSubmit} className="save-btn" disabled={loading}>
                {loading ? 'Saving...' : 'Mark Attendance'}
              </button>
            </div>
          </div>

          {existingAttendance && (
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px', color: '#155724' }}>
              Attendance already marked for this date. You can update it below.
              <br />Present: {existingAttendance.presentCount} | Absent: {existingAttendance.absentCount} | Total: {existingAttendance.totalStudents}
            </div>
          )}

          <table className="faculty-table">
            <thead>
              <tr style={{ backgroundColor: '#dc3545', color: 'black' }}>
                <th>S.No</th>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Present</th>
                <th>Absent</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.studentsId}>
                  <td>{index + 1}</td>
                  <td>{student.studentsId}</td>
                  <td>{student.fatherName || student.name || 'Unknown'}</td>
                  <td>
                    <input 
                      type="radio" 
                      name={`attendance_${student.studentsId}`}
                      checked={attendance[student.studentsId] === 'Present'}
                      onChange={() => handleAttendanceChange(student.studentsId, 'Present')}
                    />
                  </td>
                  <td>
                    <input 
                      type="radio" 
                      name={`attendance_${student.studentsId}`}
                      checked={attendance[student.studentsId] === 'Absent'}
                      onChange={() => handleAttendanceChange(student.studentsId, 'Absent')}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Attendance;