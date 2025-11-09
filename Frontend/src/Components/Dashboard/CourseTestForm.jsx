import React, { useState } from 'react';
import apiService from '../../services/api';

const CourseTestForm = () => {
  const [formData, setFormData] = useState({
    name: 'Test Course',
    duration: '8 weeks',
    fees: 12000,
    instructor: 'Test Instructor',
    description: 'This is a test course for validation',
    category: 'Technology',
    mode: 'Online',
    prerequisites: 'Basic knowledge required',
    syllabus: 'Module 1, Module 2, Module 3',
    certification: true
  });

  const [modules, setModules] = useState([
    {
      title: 'Introduction Module',
      order: 1,
      description: 'Basic introduction',
      content: [
        {
          title: 'Welcome Video',
          type: 'video',
          order: 1,
          duration: 30,
          mandatory: true
        },
        {
          title: 'Course Guide',
          type: 'document',
          order: 2,
          duration: 15,
          mandatory: true
        }
      ]
    }
  ]);

  const [files, setFiles] = useState({
    thumbnail: null,
    content_0_0: null, // Video for first module, first content
    content_0_1: null  // Document for first module, second content
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles(prev => ({
      ...prev,
      [name]: selectedFiles[0]
    }));
  };

  const testBasicSubmission = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Testing basic course submission...');
      
      const response = await apiService.addCourse({
        ...formData,
        modules: JSON.stringify(modules)
      });

      setResult({
        type: 'basic',
        success: response.success,
        message: response.message,
        data: response.data
      });

      console.log('Basic submission result:', response);
    } catch (error) {
      setResult({
        type: 'basic',
        success: false,
        message: error.message,
        data: null
      });
      console.error('Basic submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testFileSubmission = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Testing course submission with files...');
      
      const formDataObj = new FormData();
      
      // Add course data
      Object.keys(formData).forEach(key => {
        formDataObj.append(key, formData[key]);
      });

      // Add modules
      formDataObj.append('modules', JSON.stringify(modules));

      // Add files
      Object.keys(files).forEach(key => {
        if (files[key]) {
          formDataObj.append(key, files[key]);
        }
      });

      const response = await apiService.addCourse(formDataObj);

      setResult({
        type: 'files',
        success: response.success,
        message: response.message,
        data: response.data
      });

      console.log('File submission result:', response);
    } catch (error) {
      setResult({
        type: 'files',
        success: false,
        message: error.message,
        data: null
      });
      console.error('File submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testValidation = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('Testing validation...');
      
      // Test with missing required fields
      const response = await apiService.addCourse({
        description: 'Test validation'
      });

      setResult({
        type: 'validation',
        success: response.success,
        message: response.message,
        data: response.data
      });

      console.log('Validation test result:', response);
    } catch (error) {
      setResult({
        type: 'validation',
        success: false,
        message: error.message,
        data: null
      });
      console.error('Validation test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Course Submission Test Form</h2>
      
      {/* Basic Course Data */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Course Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input
            type="text"
            name="name"
            placeholder="Course Name"
            value={formData.name}
            onChange={handleInputChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '3px' }}
          />
          <input
            type="text"
            name="duration"
            placeholder="Duration"
            value={formData.duration}
            onChange={handleInputChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '3px' }}
          />
          <input
            type="number"
            name="fees"
            placeholder="Fees"
            value={formData.fees}
            onChange={handleInputChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '3px' }}
          />
          <input
            type="text"
            name="instructor"
            placeholder="Instructor"
            value={formData.instructor}
            onChange={handleInputChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '3px' }}
          />
        </div>
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleInputChange}
          style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '3px', marginTop: '10px' }}
          rows="3"
        />
        <label style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
          <input
            type="checkbox"
            name="certification"
            checked={formData.certification}
            onChange={handleInputChange}
            style={{ marginRight: '8px' }}
          />
          Certification Available
        </label>
      </div>

      {/* File Uploads */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>File Uploads</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
          <div>
            <label>Thumbnail Image:</label>
            <input
              type="file"
              name="thumbnail"
              accept="image/*"
              onChange={handleFileChange}
              style={{ marginLeft: '10px' }}
            />
          </div>
          <div>
            <label>Module 1 - Video Content:</label>
            <input
              type="file"
              name="content_0_0"
              accept="video/*"
              onChange={handleFileChange}
              style={{ marginLeft: '10px' }}
            />
          </div>
          <div>
            <label>Module 1 - Document Content:</label>
            <input
              type="file"
              name="content_0_1"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              style={{ marginLeft: '10px' }}
            />
          </div>
        </div>
      </div>

      {/* Test Buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={testBasicSubmission}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Basic Submission'}
        </button>
        
        <button
          onClick={testFileSubmission}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test File Submission'}
        </button>
        
        <button
          onClick={testValidation}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Validation'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div style={{
          padding: '15px',
          border: '1px solid #ddd',
          borderRadius: '5px',
          backgroundColor: result.success ? '#d4edda' : '#f8d7da',
          borderColor: result.success ? '#c3e6cb' : '#f5c6cb'
        }}>
          <h3>Test Result ({result.type})</h3>
          <p><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
          <p><strong>Message:</strong> {result.message}</p>
          {result.data && (
            <div>
              <strong>Data:</strong>
              <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '3px', overflow: 'auto' }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Module Preview */}
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
        <h3>Module Structure Preview</h3>
        <pre style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '3px', overflow: 'auto' }}>
          {JSON.stringify(modules, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default CourseTestForm;