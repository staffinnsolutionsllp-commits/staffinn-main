import React, { useState, useEffect } from 'react';
import './FacultyList.css';
import { useStateCityAPI } from '../../hooks/useStateCityAPI';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

const FacultyList = () => {
  const [formData, setFormData] = useState({
    enrollmentNo: '',
    name: '',
    dob: '',
    gender: '',
    mobile: '',
    email: '',
    maritalStatus: '',
    registrationDate: '',
    qualification: '',
    educationStream: '',
    skills: '',
    trainerCode: '',
    currentAddress: '',
    currentVillage: '',
    currentCity: '',
    currentState: '',
    currentDistrict: '',
    profilePhotoUrl: '',
    selectedCourses: []
  });
  const [certificate, setCertificate] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [facultyList, setFacultyList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const { states, cities, selectedState, selectedCity, handleStateChange, handleCityChange } = useStateCityAPI();

  useEffect(() => {
    fetchFacultyList();
    fetchCourses();
  }, []);

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

  const fetchFacultyList = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/faculty-list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Faculty list response:', data);
      
      if (data.success) {
        setFacultyList(data.data || []);
      } else {
        console.error('Faculty list fetch failed:', data.message);
        setFacultyList([]);
      }
    } catch (error) {
      console.error('Error fetching faculty list:', error);
      setFacultyList([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'currentState') {
      handleStateChange(value);
      setFormData({ ...formData, currentState: value, currentCity: '' });
    } else if (name === 'currentCity') {
      handleCityChange(value);
      setFormData({ ...formData, currentCity: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    setCertificate(e.target.files[0]);
  };

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setProfilePhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfilePhotoPreview(reader.result);
    reader.readAsDataURL(file);

    setUploadingPhoto(true);
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('profilePhoto', file);

      const response = await fetch(`${API_URL}/faculty-list/upload-photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      const result = await response.json();
      if (result.success) {
        setFormData({ ...formData, profilePhotoUrl: result.url });
      }
    } catch (error) {
      console.error('Photo upload error:', error);
    }
    setUploadingPhoto(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!certificate && !editingId) {
      alert('Please upload a certificate');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      
      const fields = ['enrollmentNo', 'name', 'dob', 'gender', 'mobile', 'email', 'maritalStatus', 'registrationDate', 'qualification', 'educationStream', 'skills', 'trainerCode', 'currentAddress', 'currentVillage', 'currentCity', 'currentState', 'currentDistrict', 'profilePhotoUrl'];
      
      fields.forEach(key => {
        const value = formData[key];
        if (value && value.toString().trim() !== '') {
          data.append(key, value);
        }
      });
      
      data.append('selectedCourses', JSON.stringify(formData.selectedCourses));
      
      if (certificate) data.append('certificate', certificate);

      const url = editingId ? `${API_URL}/faculty-list/${editingId}` : `${API_URL}/faculty-list`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      const result = await response.json();
      if (result.success) {
        alert(editingId ? 'Faculty updated successfully!' : 'Faculty added successfully!');
        resetForm();
        setTimeout(() => fetchFacultyList(), 500);
      } else {
        alert(result.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Operation failed: ' + error.message);
    }
    setLoading(false);
  };

  const handleEdit = (faculty) => {
    setFormData({
      enrollmentNo: faculty.enrollmentNo || '',
      name: faculty.name || '',
      dob: faculty.dob || '',
      gender: faculty.gender || '',
      mobile: faculty.mobile || '',
      email: faculty.email || '',
      maritalStatus: faculty.maritalStatus || '',
      registrationDate: faculty.registrationDate || '',
      qualification: faculty.qualification || '',
      educationStream: faculty.educationStream || '',
      skills: faculty.skills || '',
      trainerCode: faculty.trainerCode || '',
      currentAddress: faculty.currentAddress || '',
      currentVillage: faculty.currentVillage || '',
      currentCity: faculty.currentCity || '',
      currentState: faculty.currentState || '',
      currentDistrict: faculty.currentDistrict || '',
      profilePhotoUrl: faculty.profilePhotoUrl || '',
      selectedCourses: faculty.selectedCourses || []
    });
    if (faculty.profilePhotoUrl) {
      setProfilePhotoPreview(faculty.profilePhotoUrl);
    }
    setEditingId(faculty.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this faculty?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/faculty-list/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
          alert('Faculty deleted!');
          fetchFacultyList();
        }
      } catch (error) {
        alert('Delete failed');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      enrollmentNo: '',
      name: '',
      dob: '',
      gender: '',
      mobile: '',
      email: '',
      maritalStatus: '',
      registrationDate: '',
      qualification: '',
      educationStream: '',
      skills: '',
      trainerCode: '',
      currentAddress: '',
      currentVillage: '',
      currentCity: '',
      currentState: '',
      currentDistrict: '',
      profilePhotoUrl: '',
      selectedCourses: []
    });
    setCertificate(null);
    setProfilePhoto(null);
    setProfilePhotoPreview(null);
    setEditingId(null);
    setActiveTab('basic');
  };

  return (
    <div className="faculty-list-container">
      <div className="faculty-header">Faculty Details</div>
      
      <form onSubmit={handleSubmit} className="faculty-form">
        <div className="form-layout">
          <div className="left-section">
            <h3 className="faculty-name">{formData.name || 'MOHIT KUMAR'}</h3>
            
            <div className="profile-photo-wrapper">
              <div className="profile-photo-circle">
                {profilePhotoPreview ? (
                  <img src={profilePhotoPreview} alt="Profile" />
                ) : (
                  <div className="profile-placeholder">
                    <svg viewBox="0 0 24 24" fill="#ccc">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
              <p className="upload-hint">Upload a different photo</p>
              <label className="upload-label">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleProfilePhotoChange}
                  style={{ display: 'none' }}
                />
                <button type="button" className="upload-btn" onClick={(e) => {
                  e.preventDefault();
                  e.target.previousElementSibling.click();
                }} disabled={uploadingPhoto}>
                  📤 {uploadingPhoto ? 'Uploading...' : 'Upload'}
                </button>
              </label>
            </div>
            
            <div className="contact-section">
              <h4>Contact Numbers</h4>
              <p className="mobile-label">Mobile</p>
            </div>
          </div>

          <div className="right-section">
            <div className="tabs">
              <button 
                type="button" 
                className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Information
              </button>
              <button 
                type="button" 
                className={`tab ${activeTab === 'academic' ? 'active' : ''}`}
                onClick={() => setActiveTab('academic')}
              >
                Academic & Professional
              </button>
              <button 
                type="button" 
                className={`tab ${activeTab === 'address' ? 'active' : ''}`}
                onClick={() => setActiveTab('address')}
              >
                Address
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'basic' && (
                <div className="form-grid">
                  <div className="form-field">
                    <label>Enrollment No</label>
                    <input name="enrollmentNo" placeholder="MOT10918-19/2081819/30/01/91" value={formData.enrollmentNo} onChange={handleChange} />
                  </div>
                  <div className="form-field">
                    <label>Date of Birth *</label>
                    <input type="date" name="dob" placeholder="Wed, 10-Jan-2025" value={formData.dob} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label>Name</label>
                    <input name="name" placeholder="MOHIT KUMAR" value={formData.name} onChange={handleChange} />
                  </div>
                  <div className="form-field">
                    <label>Mobile *</label>
                    <input name="mobile" placeholder="Enter Mobile number" value={formData.mobile} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label>Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="">Male</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Email *</label>
                    <input type="email" name="email" placeholder="mohitkumar88@gmail.com" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label>Marital Status *</label>
                    <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} required>
                      <option value="">Single</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Registration Date</label>
                    <input type="date" name="registrationDate" placeholder="Wed, 10-Jan-2025" value={formData.registrationDate} onChange={handleChange} />
                  </div>
                </div>
              )}

              {activeTab === 'academic' && (
                <div className="form-grid">
                  <div className="form-field">
                    <label>Qualification</label>
                    <select name="qualification" value={formData.qualification} onChange={handleChange}>
                      <option value="">Graduate</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Post Graduate">Post Graduate</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Education Stream</label>
                    <input name="educationStream" placeholder="Enter Education Stream" value={formData.educationStream} onChange={handleChange} />
                  </div>
                  <div className="form-field">
                    <label>Skills *</label>
                    <input name="skills" placeholder="Enter your skills" value={formData.skills} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label>Trainer Code *</label>
                    <input name="trainerCode" placeholder="Enter your Trainer Code" value={formData.trainerCode} onChange={handleChange} required />
                  </div>
                  <div className="form-field full-width">
                    <label>Select Course(s) *</label>
                    <select 
                      multiple 
                      value={formData.selectedCourses} 
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setFormData({...formData, selectedCourses: selected});
                      }}
                      style={{height: '120px'}}
                      required
                    >
                      {courses.map(course => (
                        <option key={course.id || course.miscourses} value={course.id || course.miscourses}>
                          {course.course}
                        </option>
                      ))}
                    </select>
                    <small style={{color: '#666', fontSize: '11px'}}>Hold Ctrl (Windows) or Cmd (Mac) to select multiple courses</small>
                  </div>
                  <div className="form-field full-width">
                    <label>Certificate of Training or Trainers(CTTs) *</label>
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} required={!editingId} />
                    <small style={{color: '#dc3545', fontSize: '11px'}}>Max Size: 2MB (Ext: .png, .jpg, .jpeg, .pdf)</small>
                  </div>
                </div>
              )}

              {activeTab === 'address' && (
                <>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Current Address *</label>
                      <input name="currentAddress" placeholder="Enter Current Address" value={formData.currentAddress} onChange={handleChange} required />
                    </div>
                    <div className="form-field">
                      <label>Current Village *</label>
                      <input name="currentVillage" placeholder="Enter Current Village" value={formData.currentVillage} onChange={handleChange} required />
                    </div>
                    <div className="form-field">
                      <label>Current State *</label>
                      <select name="currentState" value={formData.currentState} onChange={handleChange} required>
                        <option value="">Select State</option>
                        {states.map(state => (
                          <option key={state.iso2} value={state.iso2}>{state.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Current City *</label>
                      <select name="currentCity" value={formData.currentCity} onChange={handleChange} required disabled={!formData.currentState}>
                        <option value="">Select City</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.name}>{city.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Current District</label>
                      <input name="currentDistrict" placeholder="Enter Current District" value={formData.currentDistrict} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={loading || uploadingPhoto}>
                      ➕ {loading ? 'Adding...' : 'Add Faculty'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </form>

      <div className="faculty-list-section">
        <h3>Faculty List</h3>
        {facultyList.length === 0 ? (
          <p>No faculty added yet.</p>
        ) : (
          <table className="faculty-table">
            <thead>
              <tr>
                <th>S. No</th>
                <th>Enrollment No</th>
                <th>Name</th>
                <th>DOB</th>
                <th>Gender</th>
                <th>Mobile</th>
                <th>Qualification</th>
                <th>Skills</th>
                <th>Address</th>
                <th>Email</th>
                <th>Trainer Code</th>
                <th>Profile Photo</th>
                <th>Certificate</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {facultyList.map((faculty, index) => (
                <tr key={faculty.id}>
                  <td>{index + 1}</td>
                  <td>{faculty.enrollmentNo || '-'}</td>
                  <td>{faculty.name || '-'}</td>
                  <td>{faculty.dob || '-'}</td>
                  <td>{faculty.gender || '-'}</td>
                  <td>{faculty.mobile || '-'}</td>
                  <td>{faculty.qualification || '-'}</td>
                  <td>{faculty.skills || '-'}</td>
                  <td>{faculty.address || faculty.currentAddress || '-'}</td>
                  <td>{faculty.email || '-'}</td>
                  <td>{faculty.trainerCode || '-'}</td>
                  <td>
                    {faculty.profilePhotoUrl ? (
                      <img src={faculty.profilePhotoUrl} alt="Profile" style={{width: '40px', height: '40px', borderRadius: '50%'}} />
                    ) : '-'}
                  </td>
                  <td>
                    {faculty.certificateUrl ? (
                      <a href={faculty.certificateUrl} target="_blank" rel="noopener noreferrer">View</a>
                    ) : '-'}
                  </td>
                  <td>
                    <button onClick={() => handleEdit(faculty)} className="edit-btn">Edit</button>
                    <button onClick={() => handleDelete(faculty.id)} className="delete-btn">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FacultyList;
