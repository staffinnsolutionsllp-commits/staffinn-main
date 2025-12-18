import React, { useState, useEffect } from 'react';
import { SECTOR_COURSES } from '../../data/sectorCourses';
import './CourseDetail.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

const CourseDetail = () => {
  const [trainingCentres, setTrainingCentres] = useState([]);
  const [selectedTrainingCentres, setSelectedTrainingCentres] = useState([]);
  const [sector, setSector] = useState('');
  const [course, setCourse] = useState('');
  const [minBatchProposed, setMinBatchProposed] = useState('');
  const [classrooms, setClassrooms] = useState([]);
  const [courseDetails, setCourseDetails] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
    fetchTrainingCentres();
  }, []);

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

  const fetchCourseDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/course-details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setCourseDetails(data.data);
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  const addClassroom = () => {
    setClassrooms([...classrooms, {
      srNo: classrooms.length + 1,
      classRoomName: '',
      width: '',
      length: '',
      seats: '',
      projector: '',
      batchProposed: '',
      cctv: '',
      remarks: ''
    }]);
  };

  const updateClassroom = (index, field, value) => {
    const updated = [...classrooms];
    updated[index][field] = value;
    setClassrooms(updated);
  };

  const removeClassroom = (index) => {
    setClassrooms(classrooms.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = { trainingCentres: selectedTrainingCentres, sector, course, minBatchProposed, classrooms };
      const url = editingId ? `${API_URL}/course-details/${editingId}` : `${API_URL}/course-details`;
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (result.success) {
        alert(editingId ? 'Course detail updated!' : 'Course detail created!');
        resetForm();
        fetchCourseDetails();
      } else {
        alert(result.message || 'Operation failed');
      }
    } catch (error) {
      alert('Operation failed');
    }
    setLoading(false);
  };

  const handleEdit = (detail) => {
    setSelectedTrainingCentres(detail.trainingCentres || []);
    setSector(detail.sector);
    setCourse(detail.course);
    setMinBatchProposed(detail.minBatchProposed);
    setClassrooms(detail.classrooms || []);
    setEditingId(detail.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this course detail?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/course-details/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
          alert('Course detail deleted!');
          fetchCourseDetails();
        }
      } catch (error) {
        alert('Delete failed');
      }
    }
  };

  const resetForm = () => {
    setSelectedTrainingCentres([]);
    setSector('');
    setCourse('');
    setMinBatchProposed('');
    setClassrooms([]);
    setEditingId(null);
  };

  const handleTrainingCentreToggle = (centreId) => {
    setSelectedTrainingCentres(prev => 
      prev.includes(centreId) 
        ? prev.filter(id => id !== centreId)
        : [...prev, centreId]
    );
  };

  return (
    <div className="course-detail-container">
      <h2>Course Details</h2>
      <form onSubmit={handleSubmit} className="course-detail-form">
        <div className="form-row">
          <label>Training Centre (Multi-Select) *</label>
          <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto' }}>
            {trainingCentres.length === 0 ? (
              <p style={{ margin: 0, color: '#666' }}>No training centres available</p>
            ) : (
              trainingCentres.map(centre => (
                <label key={centre.id} style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedTrainingCentres.includes(centre.id)}
                    onChange={() => handleTrainingCentreToggle(centre.id)}
                    style={{ marginRight: '8px' }}
                  />
                  {centre.trainingCentreName}
                </label>
              ))
            )}
          </div>
          {selectedTrainingCentres.length === 0 && <small style={{ color: 'red' }}>Please select at least one training centre</small>}
        </div>

        <div className="form-row">
          <label>Sector *</label>
          <select value={sector} onChange={(e) => { setSector(e.target.value); setCourse(''); }} required>
            <option value="">Select Sector</option>
            {Object.keys(SECTOR_COURSES).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        
        {sector && (
          <div className="form-row">
            <label>Course *</label>
            <select value={course} onChange={(e) => setCourse(e.target.value)} required>
              <option value="">Select Course</option>
              {SECTOR_COURSES[sector].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        {course && (
          <>
            <div className="form-row">
              <label>Minimum no. of Batch Proposed (per day) *</label>
              <input type="number" value={minBatchProposed} onChange={(e) => setMinBatchProposed(e.target.value)} required />
            </div>

            <div className="classroom-section">
              <h3>Classroom Details</h3>
              <button type="button" onClick={addClassroom} className="add-btn">+ Add Classroom</button>
              
              {classrooms.length > 0 && (
                <table className="classroom-table">
                  <thead>
                    <tr>
                      <th>Sr. No</th>
                      <th>Class Room Name</th>
                      <th>Width (ft.)</th>
                      <th>Length (ft.)</th>
                      <th>No. of Seats</th>
                      <th>Projector</th>
                      <th>Batch Proposed/day</th>
                      <th>CCTV</th>
                      <th>Remarks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classrooms.map((classroom, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td><input value={classroom.classRoomName} onChange={(e) => updateClassroom(index, 'classRoomName', e.target.value)} required /></td>
                        <td><input type="number" value={classroom.width} onChange={(e) => updateClassroom(index, 'width', e.target.value)} required /></td>
                        <td><input type="number" value={classroom.length} onChange={(e) => updateClassroom(index, 'length', e.target.value)} required /></td>
                        <td><input type="number" value={classroom.seats} onChange={(e) => updateClassroom(index, 'seats', e.target.value)} required /></td>
                        <td>
                          <select value={classroom.projector} onChange={(e) => updateClassroom(index, 'projector', e.target.value)} required>
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </td>
                        <td><input type="number" value={classroom.batchProposed} onChange={(e) => updateClassroom(index, 'batchProposed', e.target.value)} required /></td>
                        <td><input type="number" value={classroom.cctv} onChange={(e) => updateClassroom(index, 'cctv', e.target.value)} required /></td>
                        <td><input value={classroom.remarks} onChange={(e) => updateClassroom(index, 'remarks', e.target.value)} /></td>
                        <td><button type="button" onClick={() => removeClassroom(index)} className="remove-btn">Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading}>{editingId ? 'Update' : 'Create'}</button>
              {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
            </div>
          </>
        )}
      </form>

      <div className="course-details-list">
        <h3>List of Course Details</h3>
        {courseDetails.length === 0 ? (
          <p>No course details added yet.</p>
        ) : (
          courseDetails.map(detail => (
            <div key={detail.id} className="detail-card">
              <div className="detail-header">
                <div className="detail-actions">
                  <button onClick={() => handleEdit(detail)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(detail.id)} className="delete-btn">Delete</button>
                </div>
              </div>
              <div className="detail-fields">
                <div className="field-row">
                  <label>Training Centres *</label>
                  <span>
                    {detail.trainingCentres && detail.trainingCentres.length > 0 
                      ? detail.trainingCentres.map(tcId => {
                          const tc = trainingCentres.find(t => t.id === tcId);
                          return tc?.trainingCentreName || tcId;
                        }).join(', ')
                      : 'None selected'
                    }
                  </span>
                </div>
                <div className="field-row">
                  <label>Sector *</label>
                  <span>{detail.sector}</span>
                </div>
                <div className="field-row">
                  <label>Course *</label>
                  <span>{detail.course}</span>
                </div>
                <div className="field-row">
                  <label>Minimum No. of Batches Proposed (per day) *</label>
                  <span>{detail.minBatchProposed}</span>
                </div>
              </div>
              {detail.classrooms && detail.classrooms.length > 0 && (
                <div className="classroom-details">
                  <table className="classroom-display-table">
                    <thead>
                      <tr>
                        <th>Sr. No.</th>
                        <th>Classroom Name</th>
                        <th>Width (ft.)</th>
                        <th>Length (ft.)</th>
                        <th>No. of Seats</th>
                        <th>Projector</th>
                        <th>Batches Proposed / Day</th>
                        <th>CCTV</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.classrooms.map((classroom, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{classroom.classRoomName}</td>
                          <td>{classroom.width}</td>
                          <td>{classroom.length}</td>
                          <td>{classroom.seats}</td>
                          <td>{classroom.projector}</td>
                          <td>{classroom.batchProposed}</td>
                          <td>{classroom.cctv}</td>
                          <td>{classroom.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
