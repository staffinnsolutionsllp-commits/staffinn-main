import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminApi';
import './StaffinnPartnerInfrastructure.css';

const StaffinnPartnerInfrastructure = ({ section = 'infrastructure' }) => {
  const [institutes, setInstitutes] = useState([]);
  const [selectedInstitute, setSelectedInstitute] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  useEffect(() => {
    loadInstitutes();
  }, []);

  const loadInstitutes = async () => {
    try {
      const response = await adminAPI.getStaffinnPartnerInstitutes();
      if (response.success) {
        setInstitutes(response.data);
      }
    } catch (error) {
      console.error('Error loading institutes:', error);
    }
  };

  const loadData = async (instituteId) => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      
      switch (section) {
        case 'infrastructure':
          response = await adminAPI.getInstituteTrainingInfrastructure(instituteId);
          break;
        case 'courses':
          response = await adminAPI.getInstituteCourseDetails(instituteId);
          break;
        case 'faculty':
          response = await adminAPI.getStaffinnPartnerFaculty(instituteId);
          break;
        case 'students':
          response = await adminAPI.getStaffinnPartnerStudents(instituteId);
          break;
        default:
          // For other sections, keep mock data for now
          const mockData = [];
          setData(mockData);
          return;
      }
      
      if (response && response.success) {
        setData(response.data);
      } else {
        setError(`Failed to load ${section}`);
      }
    } catch (error) {
      setError(error.message || `Failed to load ${section}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInstituteChange = (e) => {
    const instituteId = e.target.value;
    setSelectedInstitute(instituteId);
    if (instituteId) {
      loadData(instituteId);
    } else {
      setData([]);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    
    try {
      if (type === 'infrastructure') {
        await adminAPI.deleteTrainingInfrastructure(id);
      } else if (type === 'course') {
        await adminAPI.deleteCourseDetail(id);
      } else if (type === 'faculty') {
        await adminAPI.deleteFaculty(id);
      }
      // Reload data
      if (selectedInstitute) {
        loadData(selectedInstitute);
      }
    } catch (error) {
      alert('Failed to delete: ' + error.message);
    }
  };

  const getSectionTitle = () => {
    switch (section) {
      case 'infrastructure': return 'Training Infrastructure';
      case 'courses': return 'Course Details';
      case 'faculty': return 'Faculty List';
      case 'students': return 'Student Management';
      default: return 'Data';
    }
  };

  const renderInfrastructureTable = () => (
    <table className="data-table">
      <thead>
        <tr>
          <th>Training Center Name</th>
          <th>Total Area (Sq.ft)</th>
          <th>Training Hours/day</th>
          <th>Working Hours/day</th>
          <th>Classrooms</th>
          <th>Labs</th>
          <th>Photos</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={item.id || index}>
            <td>{item.trainingCenterName}</td>
            <td>{item.totalArea}</td>
            <td>{item.totalTrainingHours}</td>
            <td>{item.workingHours}</td>
            <td>{item.totalClassrooms}</td>
            <td>{item.totalLabs}</td>
            <td>
              {item.photos && item.photos.length > 0 ? (
                <button 
                  className="view-photos-btn" 
                  onClick={() => {
                    setSelectedPhotos(item.photos);
                    setSelectedPhotoIndex(0);
                  }}
                >
                  View {item.photos.length} Photos
                </button>
              ) : (
                'No photos'
              )}
            </td>
            <td>
              <button className="delete-btn" onClick={() => handleDelete(item.id, 'infrastructure')}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderCoursesTable = () => (
    <div className="courses-container">
      {data.map((course, index) => (
        <div key={course.id || index} className="course-card">
          <div className="course-header">
            <div className="course-title-section">
              <h3>{course.course}</h3>
              <span className="sector-badge">{course.sector}</span>
            </div>
            <button 
              className="delete-btn" 
              onClick={() => handleDelete(course.id || course.miscourses, 'course')}
            >
              Delete
            </button>
          </div>
          <div className="course-details">
            <div className="detail-row">
              <label>Training Centres *</label>
              <span>
                {course.trainingCenterNames && course.trainingCenterNames.length > 0 
                  ? course.trainingCenterNames.join(', ') 
                  : 'None selected'
                }
              </span>
            </div>
            <div className="detail-row">
              <label>Sector *</label>
              <span>{course.sector}</span>
            </div>
            <div className="detail-row">
              <label>Course *</label>
              <span>{course.course}</span>
            </div>
            <div className="detail-row">
              <label>Minimum No. of Batches Proposed (per day) *</label>
              <span>{course.minBatchProposed}</span>
            </div>
          </div>
          {course.classrooms && course.classrooms.length > 0 && (
            <div className="classrooms-section">
              <table className="classrooms-table">
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
                  {course.classrooms.map((classroom, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{classroom.classRoomName}</td>
                      <td>{classroom.width}</td>
                      <td>{classroom.length}</td>
                      <td>{classroom.seats}</td>
                      <td>{classroom.projector}</td>
                      <td>{classroom.batchProposed}</td>
                      <td>{classroom.cctv}</td>
                      <td>{classroom.remark || 'Good'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderFacultyTable = () => (
    <table className="data-table">
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
          <th>Certificate Photo</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {data.map((faculty, index) => (
          <tr key={faculty.id || faculty.misfaculty || index}>
            <td>{index + 1}</td>
            <td>{faculty.enrollmentNo || '-'}</td>
            <td>{faculty.name || '-'}</td>
            <td>{faculty.dob || '-'}</td>
            <td>{faculty.gender || '-'}</td>
            <td>{faculty.mobile || '-'}</td>
            <td>{faculty.qualification || '-'}</td>
            <td>{faculty.skills || '-'}</td>
            <td>{faculty.address || '-'}</td>
            <td>{faculty.email || '-'}</td>
            <td>{faculty.trainerCode || '-'}</td>
            <td>
              {faculty.profilePhotoUrl ? (
                <img 
                  src={faculty.profilePhotoUrl} 
                  alt="Faculty Photo" 
                  className="faculty-photo"
                  onClick={() => window.open(faculty.profilePhotoUrl, '_blank')}
                />
              ) : '-'}
            </td>
            <td>
              <button 
                className="delete-btn" 
                onClick={() => handleDelete(faculty.id || faculty.misfaculty, 'faculty')}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderStudentsTable = () => (
    <table className="data-table">
      <thead>
        <tr>
          <th>S. No</th>
          <th>Father's Name</th>
          <th>DOB</th>
          <th>Gender</th>
          <th>Mobile</th>
          <th>Email</th>
          <th>Qualification</th>
          <th>Category</th>
          <th>City</th>
          <th>Aadhar Card</th>
        </tr>
      </thead>
      <tbody>
        {data.map((student, index) => (
          <tr key={student.studentsId || index}>
            <td>{index + 1}</td>
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
                <a href={student.aadharCardUrl} target="_blank" rel="noopener noreferrer" className="view-link">
                  View
                </a>
              ) : '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderTable = () => {
    switch (section) {
      case 'infrastructure': return renderInfrastructureTable();
      case 'courses': return renderCoursesTable();
      case 'faculty': return renderFacultyTable();
      case 'students': return renderStudentsTable();
      default: return <div>No data available</div>;
    }
  };

  return (
    <div className="staffinn-partner-infrastructure-container">
      <div className="page-header">
        <h1 className="page-title">{getSectionTitle()}</h1>
        <p className="page-subtitle">View {section} data for Staffinn Partner institutes</p>
      </div>

      <div className="institute-selector">
        <label htmlFor="institute-select">Select Staffinn Partner Institute:</label>
        <select 
          id="institute-select"
          value={selectedInstitute} 
          onChange={handleInstituteChange}
          className="institute-dropdown"
        >
          <option value="">-- Select Institute --</option>
          {institutes.map((institute) => (
            <option key={institute.instituteId} value={institute.instituteId}>
              {institute.instituteName}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading {section} data...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {data.length > 0 && !loading && (
        <div className="data-content">
          <div className="content-header">
            <h2>{getSectionTitle()}</h2>
            <p>Data for {institutes.find(i => i.instituteId === selectedInstitute)?.instituteName}</p>
          </div>

          <div className="data-table-container">
            {renderTable()}
          </div>
        </div>
      )}

      {selectedInstitute && data.length === 0 && !loading && !error && (
        <div className="no-data">
          <h3>No {getSectionTitle()} Found</h3>
          <p>This institute has not added any {section} data yet.</p>
        </div>
      )}

      {!selectedInstitute && !loading && (
        <div className="no-selection">
          <h3>Select an Institute</h3>
          <p>Please select a Staffinn Partner institute from the dropdown above to view their {section} data.</p>
        </div>
      )}

      {/* Photo Gallery Modal */}
      {selectedPhotos && (
        <div className="photo-modal-overlay" onClick={() => {
          setSelectedPhotos(null);
          setSelectedPhotoIndex(0);
        }}>
          <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="photo-modal-header">
              <h3>Infrastructure Photos ({selectedPhotos.length})</h3>
              <button className="close-btn" onClick={() => {
                setSelectedPhotos(null);
                setSelectedPhotoIndex(0);
              }}>×</button>
            </div>
            <div className="photo-modal-content">
              <div className="photos-grid">
                {selectedPhotos && selectedPhotos.map((photo, index) => (
                  <div key={index} className="photo-item">
                    <img 
                      src={photo.url} 
                      alt={photo.filename || `Infrastructure photo ${index + 1}`}
                      className="grid-photo-img"
                      onClick={() => window.open(photo.url, '_blank')}
                    />
                    <div className="photo-info">
                      <span className="photo-number">Photo {index + 1}</span>
                      <span className="photo-name">{photo.filename || `Image ${index + 1}`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffinnPartnerInfrastructure;