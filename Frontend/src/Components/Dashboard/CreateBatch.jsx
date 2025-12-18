import React, { useState, useEffect } from 'react';
import './FacultyList.css';
import BatchTable from './BatchTable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

const CreateBatch = () => {
  const [step, setStep] = useState(1);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [trainingCentres, setTrainingCentres] = useState([]);
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allBatches, setAllBatches] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);
  
  const [batchData, setBatchData] = useState({
    trainingCentreId: '',
    trainingCentreName: '',
    courseId: '',
    courseName: '',
    trainerId: '',
    trainerName: '',
    trainerCode: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchTrainingCentres();
    fetchCourses();
    fetchTrainers();
    fetchAllBatches();
  }, []);

  const fetchAllBatches = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching batches with token:', token ? 'exists' : 'missing');
      const response = await fetch(`${API_URL}/batches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Batches response:', data);
      if (data.success) {
        console.log('Setting batches:', data.data.length);
        setAllBatches(data.data);
      } else {
        console.error('Failed to fetch batches:', data.message);
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
      if (data.success) setStudents(data.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

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
      if (data.success) setCourses(data.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchTrainers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/faculty-list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setTrainers(data.data);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleCentreChange = (e) => {
    const centreId = e.target.value;
    const centre = trainingCentres.find(c => c.id === centreId);
    setBatchData({
      ...batchData,
      trainingCentreId: centreId,
      trainingCentreName: centre?.trainingCentreName || '',
      courseId: '',
      courseName: '',
      trainerId: '',
      trainerName: ''
    });
  };

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    const course = courses.find(c => (c.id || c.miscourses) === courseId);
    setBatchData({
      ...batchData,
      courseId,
      courseName: course?.course || '',
      trainerId: '',
      trainerName: ''
    });
  };

  const handleTrainerChange = (e) => {
    const trainerId = e.target.value;
    const trainer = trainers.find(t => t.id === trainerId);
    setBatchData({
      ...batchData,
      trainerId,
      trainerName: trainer?.name || '',
      trainerCode: trainer?.trainerCode || ''
    });
  };

  const handleEdit = (batch) => {
    setEditMode(true);
    setEditingBatchId(batch.batchId);
    setBatchData({
      trainingCentreId: batch.trainingCentreId,
      trainingCentreName: batch.trainingCentreName,
      courseId: batch.courseId,
      courseName: batch.courseName,
      trainerId: batch.trainerId,
      trainerName: batch.trainerName,
      trainerCode: batch.trainerCode,
      startDate: batch.startDate,
      endDate: batch.endDate,
      startTime: batch.startTime,
      endTime: batch.endTime
    });
    setSelectedStudents(batch.selectedStudents || []);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (selectedStudents.length < 5) {
      alert('Minimum 5 students required in batch');
      return;
    }
    if (selectedStudents.length > 30) {
      alert('Maximum 30 students allowed in batch');
      return;
    }
    if (!batchData.trainingCentreId || !batchData.courseId || !batchData.trainerId || !batchData.startDate || !batchData.endDate) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = editMode ? `${API_URL}/batches/${editingBatchId}` : `${API_URL}/batches`;
      const method = editMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...batchData,
          selectedStudents
        })
      });

      const result = await response.json();
      console.log('Batch result:', result);
      if (result.success) {
        alert(editMode ? 'Batch updated successfully!' : 'Batch created successfully!');
        // Reset form
        setStep(1);
        setSelectedStudents([]);
        setEditMode(false);
        setEditingBatchId(null);
        setBatchData({
          trainingCentreId: '',
          trainingCentreName: '',
          courseId: '',
          courseName: '',
          trainerId: '',
          trainerName: '',
          trainerCode: '',
          startDate: '',
          endDate: '',
          startTime: '',
          endTime: ''
        });
        await fetchAllBatches();
      } else {
        alert(result.message || `Failed to ${editMode ? 'update' : 'create'} batch`);
      }
    } catch (error) {
      console.error('Error with batch:', error);
      alert(`Failed to ${editMode ? 'update' : 'create'} batch`);
    }
    setLoading(false);
  };

  return (
    <div className="faculty-list-container">
      <div className="faculty-header">{editMode ? 'Edit Batch' : 'Create Batch'}</div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
        <p style={{ margin: '5px 0', color: '#856404', fontWeight: 'bold' }}>NOTE:</p>
        <p style={{ margin: '5px 0', color: '#856404' }}>1) Maximum 30 students and minimum 5 students in batch.</p>
        <p style={{ margin: '5px 0', color: '#856404' }}>2) Theory hours and Practical hours must be of 30:70 ratio of total hours.</p>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
        <div style={{ 
          padding: '10px 20px', 
          backgroundColor: step === 1 ? '#dc3545' : '#e9ecef',
          color: step === 1 ? '#fff' : '#6c757d',
          borderRadius: '5px',
          fontWeight: 'bold'
        }}>
          Step 1 - Candidate List
        </div>
        <div style={{ 
          padding: '10px 20px', 
          backgroundColor: step === 2 ? '#dc3545' : '#e9ecef',
          color: step === 2 ? '#fff' : '#6c757d',
          borderRadius: '5px',
          fontWeight: 'bold'
        }}>
          Step 2 - Batch Details
        </div>
      </div>

      {step === 1 && (
        <>
          <h3 style={{ color: '#dc3545', marginBottom: '15px' }}>Candidate List</h3>
          <p style={{ marginBottom: '15px' }}>Selected: {selectedStudents.length} students</p>
          
          {students.length === 0 ? (
            <p>No students available. Please add students first.</p>
          ) : (
            <table className="faculty-table">
              <thead>
                <tr style={{ backgroundColor: '#dc3545', color: '#fff' }}>
                  <th>S.No</th>
                  <th>Enrollment No</th>
                  <th>Name</th>
                  <th>DOB</th>
                  <th>Gender</th>
                  <th>Category</th>
                  <th>Mobile</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.studentsId}>
                    <td>{index + 1}</td>
                    <td>{student.studentsId || '-'}</td>
                    <td>{student.fatherName || '-'}</td>
                    <td>{student.dob || '-'}</td>
                    <td>{student.gender || '-'}</td>
                    <td>{student.category || '-'}</td>
                    <td>{student.mobile || '-'}</td>
                    <td>
                      <input 
                        type="checkbox"
                        checked={selectedStudents.includes(student.studentsId)}
                        onChange={() => handleStudentSelect(student.studentsId)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button 
              onClick={() => {
                if (selectedStudents.length < 5) {
                  alert('Please select at least 5 students');
                  return;
                }
                if (selectedStudents.length > 30) {
                  alert('Maximum 30 students allowed');
                  return;
                }
                setStep(2);
              }}
              className="save-btn"
              style={{ padding: '10px 30px' }}
            >
              Next →
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h3 style={{ color: '#dc3545', marginBottom: '15px' }}>Batch Details</h3>
          
          <div className="form-grid" style={{ maxWidth: '800px' }}>
            <div className="form-field">
              <label>Training Centre *</label>
              <select 
                value={batchData.trainingCentreId} 
                onChange={handleCentreChange}
                required
              >
                <option value="">Select Training Centre</option>
                {trainingCentres.map(centre => (
                  <option key={centre.id} value={centre.id}>
                    {centre.trainingCentreName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Course *</label>
              <select 
                value={batchData.courseId} 
                onChange={handleCourseChange}
                required
                disabled={!batchData.trainingCentreId}
              >
                <option value="">Select Course</option>
                {courses
                  .filter(course => 
                    course.trainingCentres && 
                    course.trainingCentres.includes(batchData.trainingCentreId)
                  )
                  .map(course => (
                    <option key={course.id || course.miscourses} value={course.id || course.miscourses}>
                      {course.course}
                    </option>
                  ))}
              </select>
              {batchData.trainingCentreId && courses.filter(c => c.trainingCentres && c.trainingCentres.includes(batchData.trainingCentreId)).length === 0 && (
                <small style={{color: '#dc3545', fontSize: '11px', display: 'block', marginTop: '5px'}}>
                  No courses available for this training centre
                </small>
              )}
            </div>

            <div className="form-field">
              <label>Trainer *</label>
              <select 
                value={batchData.trainerId} 
                onChange={handleTrainerChange}
                required
                disabled={!batchData.courseId}
              >
                <option value="">Select Trainer</option>
                {trainers
                  .filter(trainer => 
                    trainer.selectedCourses && 
                    trainer.selectedCourses.includes(batchData.courseId)
                  )
                  .map(trainer => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name}
                    </option>
                  ))}
              </select>
              {batchData.courseId && trainers.filter(t => t.selectedCourses && t.selectedCourses.includes(batchData.courseId)).length === 0 && (
                <small style={{color: '#dc3545', fontSize: '11px', display: 'block', marginTop: '5px'}}>
                  No trainers available for this course
                </small>
              )}
            </div>

            <div className="form-field">
              <label>Start Date *</label>
              <input 
                type="date" 
                value={batchData.startDate}
                onChange={(e) => setBatchData({...batchData, startDate: e.target.value})}
                required
              />
            </div>

            <div className="form-field">
              <label>End Date *</label>
              <input 
                type="date" 
                value={batchData.endDate}
                onChange={(e) => setBatchData({...batchData, endDate: e.target.value})}
                required
                min={batchData.startDate}
              />
            </div>

            <div className="form-field">
              <label>Start Time *</label>
              <input 
                type="time" 
                value={batchData.startTime}
                onChange={(e) => setBatchData({...batchData, startTime: e.target.value})}
                required
              />
            </div>

            <div className="form-field">
              <label>End Time *</label>
              <input 
                type="time" 
                value={batchData.endTime}
                onChange={(e) => setBatchData({...batchData, endTime: e.target.value})}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setStep(1)}
              className="save-btn"
              style={{ backgroundColor: '#6c757d', padding: '10px 30px' }}
            >
              ← Back
            </button>
            <button 
              onClick={handleSubmit}
              className="save-btn"
              style={{ padding: '10px 30px' }}
              disabled={loading}
            >
              {loading ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Batch' : 'Create Batch')}
            </button>
          </div>
        </>
      )}

      <div className="faculty-list-section" style={{marginTop: '40px'}}>
        <h3>All Created Batches</h3>
        {allBatches.length === 0 ? (
          <p>No batches created yet.</p>
        ) : (
          <BatchTable 
            batches={allBatches}
            onEdit={handleEdit}
            onDelete={async (batchId) => {
              if (window.confirm('Delete this batch?')) {
                try {
                  const token = localStorage.getItem('token');
                  const response = await fetch(`${API_URL}/batches/${batchId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  const result = await response.json();
                  if (result.success) {
                    alert('Batch deleted!');
                    fetchAllBatches();
                  }
                } catch (error) {
                  alert('Delete failed');
                }
              }
            }}
            showActions={{ edit: true, delete: true }}
          />
        )}
      </div>
    </div>
  );
};

export default CreateBatch;
