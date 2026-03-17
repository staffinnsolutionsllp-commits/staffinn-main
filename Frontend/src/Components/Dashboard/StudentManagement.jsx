import React, { useState, useEffect } from 'react';
import './FacultyList.css';
import { useStateCityAPI } from '../../hooks/useStateCityAPI';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api/v1';

const StudentManagement = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    dob: '',
    qualification: '',
    category: '',
    mobile: '',
    maritalStatus: '',
    email: '',
    gender: '',
    fatherName: '',
    profilePhotoUrl: '',
    address: '',
    pincode: '',
    city: '',
    district: '',
    state: '',
    country: 'India',
    tenth_examination: '',
    tenth_board: '',
    tenth_subject: '',
    tenth_marks: '',
    tenth_percentage: '',
    tenth_year: '',
    tenth_documentUrl: '',
    twelfth_examination: '',
    twelfth_board: '',
    twelfth_subject: '',
    twelfth_marks: '',
    twelfth_percentage: '',
    twelfth_year: '',
    twelfth_documentUrl: '',
    graduation_examination: '',
    graduation_university: '',
    graduation_subject: '',
    graduation_marks: '',
    graduation_percentage: '',
    graduation_year: '',
    graduation_documentUrl: '',
    bankName: '',
    accountName: '',
    branchName: '',
    ifscCode: '',
    aadharCardUrl: ''
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [studentList, setStudentList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { states, cities, selectedState, selectedCity, handleStateChange, handleCityChange } = useStateCityAPI();

  useEffect(() => {
    fetchStudentList();
  }, []);

  const fetchStudentList = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/mis-students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        console.log('Student data:', data.data);
        setStudentList(data.data);
      }
    } catch (error) {
      console.error('Error fetching student list:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'state') {
      handleStateChange(value);
      setFormData({ ...formData, state: value, city: '' });
    } else if (name === 'city') {
      handleCityChange(value);
      setFormData({ ...formData, city: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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

      const response = await fetch(`${API_URL}/mis-students/upload-photo`, {
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

  const handleDocumentUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('document', file);

      const response = await fetch(`${API_URL}/mis-students/upload-document`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      const result = await response.json();
      console.log(`Upload result for ${field}:`, result);
      if (result.success) {
        setFormData(prev => ({ ...prev, [field]: result.url }));
        console.log(`${field} set to:`, result.url);
        alert(`${field === 'aadharCardUrl' ? 'Aadhar Card' : 'Document'} uploaded successfully!`);
      } else {
        alert('Upload failed: ' + result.message);
      }
    } catch (error) {
      console.error('Document upload error:', error);
      alert('Upload failed: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('Submitting form data:', formData);
    console.log('Aadhar Card URL being submitted:', formData.aadharCardUrl);

    try {
      const token = localStorage.getItem('token');
      const url = editingId ? `${API_URL}/mis-students/${editingId}` : `${API_URL}/mis-students`;
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      console.log('Submit result:', result);
      if (result.success) {
        alert(editingId ? 'Student updated successfully!' : 'Student added successfully!');
        resetForm();
        await fetchStudentList();
      } else {
        alert(result.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Operation failed: ' + error.message);
    }
    setLoading(false);
  };

  const handleEdit = (student) => {
    console.log('Editing student:', student);
    console.log('Student aadharCardUrl:', student.aadharCardUrl);
    setFormData({
      studentName: student.studentName || '',
      dob: student.dob || '',
      qualification: student.qualification || '',
      category: student.category || '',
      mobile: student.mobile || '',
      maritalStatus: student.maritalStatus || '',
      email: student.email || '',
      gender: student.gender || '',
      fatherName: student.fatherName || '',
      profilePhotoUrl: student.profilePhotoUrl || '',
      address: student.address || '',
      pincode: student.pincode || '',
      city: student.city || '',
      district: student.district || '',
      state: student.state || '',
      country: student.country || 'India',
      tenth_examination: student.tenth_examination || '',
      tenth_board: student.tenth_board || '',
      tenth_subject: student.tenth_subject || '',
      tenth_marks: student.tenth_marks || '',
      tenth_percentage: student.tenth_percentage || '',
      tenth_year: student.tenth_year || '',
      tenth_documentUrl: student.tenth_documentUrl || '',
      twelfth_examination: student.twelfth_examination || '',
      twelfth_board: student.twelfth_board || '',
      twelfth_subject: student.twelfth_subject || '',
      twelfth_marks: student.twelfth_marks || '',
      twelfth_percentage: student.twelfth_percentage || '',
      twelfth_year: student.twelfth_year || '',
      twelfth_documentUrl: student.twelfth_documentUrl || '',
      graduation_examination: student.graduation_examination || '',
      graduation_university: student.graduation_university || '',
      graduation_subject: student.graduation_subject || '',
      graduation_marks: student.graduation_marks || '',
      graduation_percentage: student.graduation_percentage || '',
      graduation_year: student.graduation_year || '',
      graduation_documentUrl: student.graduation_documentUrl || '',
      bankName: student.bankName || '',
      accountName: student.accountName || '',
      branchName: student.branchName || '',
      ifscCode: student.ifscCode || '',
      aadharCardUrl: student.aadharCardUrl || ''
    });
    if (student.profilePhotoUrl) {
      setProfilePhotoPreview(student.profilePhotoUrl);
    }
    setEditingId(student.studentsId);
    console.log('FormData after edit:', formData);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this student?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/mis-students/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (result.success) {
          alert('Student deleted!');
          fetchStudentList();
        }
      } catch (error) {
        alert('Delete failed');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      studentName: '', dob: '', qualification: '', category: '', mobile: '', maritalStatus: '', email: '', gender: '', fatherName: '',
      profilePhotoUrl: '', address: '', pincode: '', city: '', district: '', state: '', country: 'India',
      tenth_examination: '', tenth_board: '', tenth_subject: '', tenth_marks: '', tenth_percentage: '', tenth_year: '', tenth_documentUrl: '',
      twelfth_examination: '', twelfth_board: '', twelfth_subject: '', twelfth_marks: '', twelfth_percentage: '', twelfth_year: '', twelfth_documentUrl: '',
      graduation_examination: '', graduation_university: '', graduation_subject: '', graduation_marks: '', graduation_percentage: '', graduation_year: '', graduation_documentUrl: '',
      bankName: '', accountName: '', branchName: '', ifscCode: '', aadharCardUrl: ''
    });
    setProfilePhoto(null);
    setProfilePhotoPreview(null);
    setEditingId(null);
    setActiveTab('basic');
  };

  return (
    <div className="faculty-list-container">
      <div className="faculty-header">Student Management</div>
      
      <form onSubmit={handleSubmit} className="faculty-form">
        <div className="form-layout">
          <div className="left-section">
            <h3 className="faculty-name">{formData.studentName || formData.fatherName || 'Student Name'}</h3>
            
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
              <p className="mobile-label">Mobile: {formData.mobile || 'N/A'}</p>
            </div>
          </div>

          <div className="right-section">
            <div className="tabs">
              <button type="button" className={`tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>Basic Details</button>
              <button type="button" className={`tab ${activeTab === 'address' ? 'active' : ''}`} onClick={() => setActiveTab('address')}>Address</button>
              <button type="button" className={`tab ${activeTab === 'education' ? 'active' : ''}`} onClick={() => setActiveTab('education')}>Education</button>
              <button type="button" className={`tab ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>Account Details</button>
              <button type="button" className={`tab ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>Documents</button>
            </div>

            <div className="tab-content">
              {activeTab === 'basic' && (
                <div className="form-grid">
                  <div className="form-field">
                    <label>Student Name *</label>
                    <input name="studentName" value={formData.studentName} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label>Date of Birth *</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label>Qualification *</label>
                    <input name="qualification" value={formData.qualification} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label>Category *</label>
                    <select name="category" value={formData.category} onChange={handleChange} required>
                      <option value="">Select</option>
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Mobile *</label>
                    <input name="mobile" value={formData.mobile} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label>Marital Status *</label>
                    <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} required>
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label>Gender *</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} required>
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Father Name *</label>
                    <input name="fatherName" value={formData.fatherName} onChange={handleChange} required />
                  </div>
                </div>
              )}

              {activeTab === 'address' && (
                <div className="form-grid">
                  <div className="form-field full-width">
                    <label>Address *</label>
                    <input name="address" value={formData.address} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label>Pincode *</label>
                    <input name="pincode" value={formData.pincode} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label>State *</label>
                    <select name="state" value={formData.state} onChange={handleChange} required>
                      <option value="">Select State</option>
                      {states.map(state => (
                        <option key={state.iso2} value={state.iso2}>{state.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>City *</label>
                    <select name="city" value={formData.city} onChange={handleChange} required disabled={!formData.state}>
                      <option value="">Select City</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.name}>{city.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label>District *</label>
                    <input name="district" value={formData.district} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label>Country</label>
                    <input name="country" value={formData.country} onChange={handleChange} />
                  </div>
                </div>
              )}

              {activeTab === 'education' && (
                <>
                  <h4 style={{marginTop: 0}}>10th Details (Mandatory)</h4>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Examination Passed *</label>
                      <input name="tenth_examination" value={formData.tenth_examination} onChange={handleChange} required />
                    </div>
                    <div className="form-field">
                      <label>Board *</label>
                      <input name="tenth_board" value={formData.tenth_board} onChange={handleChange} required />
                    </div>
                    <div className="form-field">
                      <label>Subject *</label>
                      <input name="tenth_subject" value={formData.tenth_subject} onChange={handleChange} required />
                    </div>
                    <div className="form-field">
                      <label>Marks Obtained *</label>
                      <input name="tenth_marks" value={formData.tenth_marks} onChange={handleChange} required />
                    </div>
                    <div className="form-field">
                      <label>Percentage *</label>
                      <input name="tenth_percentage" value={formData.tenth_percentage} onChange={handleChange} required />
                    </div>
                    <div className="form-field">
                      <label>Year of Passing *</label>
                      <input name="tenth_year" value={formData.tenth_year} onChange={handleChange} required />
                    </div>
                    <div className="form-field full-width">
                      <label>Upload Document *</label>
                      <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleDocumentUpload(e, 'tenth_documentUrl')} required={!editingId} />
                      {formData.tenth_documentUrl && <small style={{color: 'green'}}>✓ Uploaded</small>}
                    </div>
                  </div>

                  <h4>12th Details (Mandatory)</h4>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Examination Passed *</label>
                      <input name="twelfth_examination" value={formData.twelfth_examination} onChange={handleChange} required />
                    </div>
                    <div className="form-field">
                      <label>Board *</label>
                      <input name="twelfth_board" value={formData.twelfth_board} onChange={handleChange} required />
                    </div>
                    <div className="form-field">
                      <label>Subject *</label>
                      <input name="twelfth_subject" value={formData.twelfth_subject} onChange={handleChange} required />
                    </div>
                    <div className="form-field">
                      <label>Marks Obtained *</label>
                      <input name="twelfth_marks" value={formData.twelfth_marks} onChange={handleChange} required />
                    </div>
                    <div className="form-field">
                      <label>Percentage *</label>
                      <input name="twelfth_percentage" value={formData.twelfth_percentage} onChange={handleChange} required />
                    </div>
                    <div className="form-field">
                      <label>Year of Passing *</label>
                      <input name="twelfth_year" value={formData.twelfth_year} onChange={handleChange} required />
                    </div>
                    <div className="form-field full-width">
                      <label>Upload Document *</label>
                      <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleDocumentUpload(e, 'twelfth_documentUrl')} required={!editingId} />
                      {formData.twelfth_documentUrl && <small style={{color: 'green'}}>✓ Uploaded</small>}
                    </div>
                  </div>

                  <h4>Graduation Details (Optional)</h4>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Examination Passed</label>
                      <input name="graduation_examination" value={formData.graduation_examination} onChange={handleChange} />
                    </div>
                    <div className="form-field">
                      <label>University</label>
                      <input name="graduation_university" value={formData.graduation_university} onChange={handleChange} />
                    </div>
                    <div className="form-field">
                      <label>Subject</label>
                      <input name="graduation_subject" value={formData.graduation_subject} onChange={handleChange} />
                    </div>
                    <div className="form-field">
                      <label>Marks Obtained</label>
                      <input name="graduation_marks" value={formData.graduation_marks} onChange={handleChange} />
                    </div>
                    <div className="form-field">
                      <label>Percentage</label>
                      <input name="graduation_percentage" value={formData.graduation_percentage} onChange={handleChange} />
                    </div>
                    <div className="form-field">
                      <label>Year of Passing</label>
                      <input name="graduation_year" value={formData.graduation_year} onChange={handleChange} />
                    </div>
                    <div className="form-field full-width">
                      <label>Upload Document</label>
                      <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleDocumentUpload(e, 'graduation_documentUrl')} />
                      {formData.graduation_documentUrl && <small style={{color: 'green'}}>✓ Uploaded</small>}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'account' && (
                <div className="form-grid">
                  <div className="form-field">
                    <label>Bank Name *</label>
                    <input name="bankName" value={formData.bankName} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label>Account Name *</label>
                    <input name="accountName" value={formData.accountName} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label>Branch Name *</label>
                    <input name="branchName" value={formData.branchName} onChange={handleChange} required />
                  </div>
                  <div className="form-field">
                    <label>IFSC Code *</label>
                    <input name="ifscCode" value={formData.ifscCode} onChange={handleChange} required />
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <>
                  <div className="form-grid">
                    <div className="form-field full-width">
                      <label>Aadhar Card *</label>
                      <input 
                        type="file" 
                        accept=".pdf,.png,.jpg,.jpeg" 
                        onChange={(e) => handleDocumentUpload(e, 'aadharCardUrl')} 
                        required={!editingId && !formData.aadharCardUrl} 
                      />
                      {formData.aadharCardUrl && (
                        <div style={{marginTop: '10px'}}>
                          <small style={{color: 'green'}}>✓ Uploaded</small>
                          <a 
                            href={formData.aadharCardUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{marginLeft: '10px', color: '#007bff', textDecoration: 'none'}}
                          >
                            View Document
                          </a>
                        </div>
                      )}
                      <small style={{color: '#dc3545', fontSize: '11px', display: 'block', marginTop: '5px'}}>Max Size: 5MB (Ext: .png, .jpg, .jpeg, .pdf)</small>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="save-btn" disabled={loading || uploadingPhoto}>
                      ➕ {loading ? 'Saving...' : editingId ? 'Update Student' : 'Add Student'}
                    </button>
                    {editingId && (
                      <button type="button" className="save-btn" onClick={resetForm} style={{marginLeft: '10px', backgroundColor: '#6c757d'}}>
                        Cancel
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </form>

      <div className="faculty-list-section">
        <h3>Student List</h3>
        {studentList.length === 0 ? (
          <p>No students added yet.</p>
        ) : (
          <table className="faculty-table">
            <thead>
              <tr>
                <th>S. No</th>
                <th>Student Name</th>
                <th>Father's Name</th>
                <th>DOB</th>
                <th>Gender</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Qualification</th>
                <th>Category</th>
                <th>City</th>
                <th>Aadhar Card</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {studentList.map((student, index) => (
                <tr key={student.studentsId}>
                  <td>{index + 1}</td>
                  <td>{student.studentName || '-'}</td>
                  <td>{student.fatherName || '-'}</td>
                  <td>{student.dob || '-'}</td>
                  <td>{student.gender || '-'}</td>
                  <td>{student.mobile || '-'}</td>
                  <td>{student.email || '-'}</td>
                  <td>{student.qualification || '-'}</td>
                  <td>{student.category || '-'}</td>
                  <td>{student.city || '-'}</td>
                  <td>
                    {student.aadharCardUrl && student.aadharCardUrl.trim() !== '' ? (
                      <a 
                        href={student.aadharCardUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="view-btn"
                        style={{
                          color: '#fff',
                          backgroundColor: '#007bff',
                          textDecoration: 'none',
                          fontWeight: '600',
                          padding: '6px 16px',
                          borderRadius: '4px',
                          display: 'inline-block',
                          fontSize: '13px'
                        }}
                      >
                        View
                      </a>
                    ) : (
                      <span style={{color: '#999'}}>-</span>
                    )}
                  </td>
                  <td>
                    <button onClick={() => handleEdit(student)} className="edit-btn">Edit</button>
                    <button onClick={() => handleDelete(student.studentsId)} className="delete-btn">Delete</button>
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

export default StudentManagement;
