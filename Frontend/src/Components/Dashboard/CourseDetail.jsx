import React, { useState, useEffect } from 'react';
import { SECTOR_COURSES } from '../../data/sectorCourses';
import ErrorBoundary from '../common/ErrorBoundary';
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
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setInitialLoading(true);
      await Promise.all([
        fetchCourseDetails(),
        fetchTrainingCentres()
      ]);
      setInitialLoading(false);
    };
    loadInitialData();
  }, []);

  const fetchTrainingCentres = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/training-centers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setTrainingCentres(data.data);
      } else {
        setTrainingCentres([]);
      }
    } catch (error) {
      console.error('Error fetching training centres:', error);
      setTrainingCentres([]);
    }
  };

  const fetchCourseDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/course-details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setCourseDetails(data.data);
      } else {
        setCourseDetails([]);
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      setCourseDetails([]);
    }
  };

  const addClassroom = () => {
    setClassrooms([...classrooms, {
      srNo: classrooms.length + 1,
      classRoomName: '',
      classroomType: 'Classroom',
      width: '',
      length: '',
      seats: '',
      projector: '',
      batchProposed: '',
      cctv: '',
      remarks: '',
      photos: []
    }]);
  };

  const updateClassroom = (index, field, value) => {
    const updated = [...classrooms];
    updated[index][field] = value;
    setClassrooms(updated);
  };

  const handlePhotoUpload = (classroomIndex, files) => {
    const updated = [...classrooms];
    const fileArray = Array.from(files);
    
    // Validate file count (max 3 photos)
    if (fileArray.length > 3) {
      alert('Maximum 3 photos allowed per classroom');
      return;
    }
    
    // Validate file sizes (max 10MB each)
    const oversizedFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert('Each photo must be less than 10MB');
      return;
    }
    
    updated[classroomIndex].photoFiles = fileArray;
    setClassrooms(updated);
  };

  const removeClassroom = (index) => {
    setClassrooms(classrooms.filter((_, i) => i !== index));
  };

  const validateClassroomData = (classrooms) => {
    for (let i = 0; i < classrooms.length; i++) {
      const classroom = classrooms[i];
      if (!classroom.classRoomName?.trim()) {
        throw new Error(`Classroom ${i + 1}: Name is required`);
      }
      if (!classroom.classroomType) {
        throw new Error(`Classroom ${i + 1}: Type is required`);
      }
      if (!classroom.width || classroom.width <= 0) {
        throw new Error(`Classroom ${i + 1}: Valid width is required`);
      }
      if (!classroom.length || classroom.length <= 0) {
        throw new Error(`Classroom ${i + 1}: Valid length is required`);
      }
      if (!classroom.seats || classroom.seats <= 0) {
        throw new Error(`Classroom ${i + 1}: Valid number of seats is required`);
      }
      if (!classroom.projector) {
        throw new Error(`Classroom ${i + 1}: Projector availability is required`);
      }
      if (!classroom.batchProposed || classroom.batchProposed <= 0) {
        throw new Error(`Classroom ${i + 1}: Valid batch proposed is required`);
      }
      if (classroom.cctv === '' || classroom.cctv < 0) {
        throw new Error(`Classroom ${i + 1}: CCTV count is required`);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate required fields
      if (selectedTrainingCentres.length === 0) {
        throw new Error('Please select at least one training centre');
      }
      if (!sector) {
        throw new Error('Please select a sector');
      }
      if (!course) {
        throw new Error('Please select a course');
      }
      if (!minBatchProposed || minBatchProposed <= 0) {
        throw new Error('Please enter a valid minimum batch proposed');
      }
      if (classrooms.length === 0) {
        throw new Error('Please add at least one classroom');
      }
      
      // Validate classroom data
      validateClassroomData(classrooms);
      
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Add non-file data
      formData.append('trainingCentres', JSON.stringify(selectedTrainingCentres));
      formData.append('sector', sector);
      formData.append('course', course);
      formData.append('minBatchProposed', minBatchProposed);
      // Process classrooms data
      const processedClassrooms = classrooms.map(c => ({
        srNo: c.srNo,
        classRoomName: c.classRoomName,
        classroomType: c.classroomType || 'Classroom',
        width: parseInt(c.width),
        length: parseInt(c.length),
        seats: parseInt(c.seats),
        projector: c.projector,
        batchProposed: parseInt(c.batchProposed),
        cctv: parseInt(c.cctv),
        remarks: c.remarks || '',
        photos: c.photos || []
      }));
      
      formData.append('classrooms', JSON.stringify(processedClassrooms));
      
      // Add classroom photos
      classrooms.forEach((classroom, index) => {
        if (classroom.photoFiles && classroom.photoFiles.length > 0) {
          classroom.photoFiles.forEach((file, fileIndex) => {
            formData.append(`classroomPhotos_${index}`, file);
          });
        }
      });
      
      const url = editingId ? `${API_URL}/course-details/${editingId}` : `${API_URL}/course-details`;
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const result = await response.json();
      if (result.success) {
        alert(editingId ? 'Course detail updated successfully!' : 'Course detail created successfully!');
        resetForm();
        fetchCourseDetails();
      } else {
        throw new Error(result.message || 'Operation failed');
      }
    } catch (error) {
      alert(error.message || 'Operation failed');
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleEdit = (detail) => {
    setSelectedTrainingCentres(Array.isArray(detail.trainingCentres) ? detail.trainingCentres : []);
    setSector(detail.sector);
    setCourse(detail.course);
    setMinBatchProposed(detail.minBatchProposed);
    setClassrooms(Array.isArray(detail.classrooms) ? detail.classrooms : []);
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
    <ErrorBoundary>
      <div className="course-detail-container">
        {initialLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>Loading course details...</p>
          </div>
        ) : (
          <>
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
            {SECTOR_COURSES && Object.keys(SECTOR_COURSES).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        
        {sector && SECTOR_COURSES[sector] && (
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
                      <th>Classroom Type</th>
                      <th>Width (ft.)</th>
                      <th>Length (ft.)</th>
                      <th>No. of Seats</th>
                      <th>Projector</th>
                      <th>Batch Proposed/day</th>
                      <th>CCTV</th>
                      <th>Remarks</th>
                      <th>Photos</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classrooms.map((classroom, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td><input value={classroom.classRoomName} onChange={(e) => updateClassroom(index, 'classRoomName', e.target.value)} required /></td>
                        <td>
                          <select value={classroom.classroomType || 'Classroom'} onChange={(e) => updateClassroom(index, 'classroomType', e.target.value)} required>
                            <option value="Classroom">Classroom</option>
                            <option value="Lab">Lab</option>
                          </select>
                        </td>
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
                        <td>
                          <div className="photo-upload-container">
                            <input 
                              type="file" 
                              multiple 
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" 
                              onChange={(e) => handlePhotoUpload(index, e.target.files)}
                              className="photo-upload-input"
                            />
                            <div className="photo-upload-info">Max 3 photos, 10MB each</div>
                            {classroom.photoFiles && classroom.photoFiles.length > 0 && (
                              <div className="photo-upload-status selected">
                                ✓ {classroom.photoFiles.length} photo(s) selected
                              </div>
                            )}
                            {classroom.photos && classroom.photos.length > 0 && (
                              <div className="photo-upload-status existing">
                                {classroom.photos.length} existing photo(s)
                              </div>
                            )}
                          </div>
                        </td>
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
        {Array.isArray(courseDetails) && courseDetails.length === 0 ? (
          <p>No course details added yet.</p>
        ) : (
          Array.isArray(courseDetails) && courseDetails.map(detail => (
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
                    {Array.isArray(detail.trainingCentres) && detail.trainingCentres.length > 0 
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
              {Array.isArray(detail.classrooms) && detail.classrooms.length > 0 && (
                <div className="classroom-details">
                  <table className="classroom-display-table">
                    <thead>
                      <tr>
                        <th>Sr. No.</th>
                        <th>Classroom Name</th>
                        <th>Classroom Type</th>
                        <th>Width (ft.)</th>
                        <th>Length (ft.)</th>
                        <th>No. of Seats</th>
                        <th>Projector</th>
                        <th>Batches Proposed / Day</th>
                        <th>CCTV</th>
                        <th>Remark</th>
                        <th>Photos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.classrooms.map((classroom, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{classroom.classRoomName}</td>
                          <td>{classroom.classroomType || 'Classroom'}</td>
                          <td>{classroom.width}</td>
                          <td>{classroom.length}</td>
                          <td>{classroom.seats}</td>
                          <td>{classroom.projector}</td>
                          <td>{classroom.batchProposed}</td>
                          <td>{classroom.cctv}</td>
                          <td>{classroom.remarks || '-'}</td>
                          <td>
                            {classroom.photos && classroom.photos.length > 0 ? (
                              <div className="photo-gallery">
                                {classroom.photos.map((photo, photoIdx) => (
                                  <div key={photoIdx} className="photo-item">
                                    <img 
                                      src={typeof photo === 'string' ? photo : photo.url} 
                                      alt={`Classroom ${idx + 1} Photo ${photoIdx + 1}`}
                                      className="photo-thumbnail"
                                      onClick={() => window.open(typeof photo === 'string' ? photo : photo.url, '_blank')}
                                      title="Click to view full size"
                                    />
                                    {typeof photo === 'object' && photo.fileName && (
                                      <div className="photo-filename">
                                        {photo.fileName.length > 15 ? photo.fileName.substring(0, 15) + '...' : photo.fileName}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="no-photos">No photos uploaded</span>
                            )}
                          </td>
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
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default CourseDetail;
