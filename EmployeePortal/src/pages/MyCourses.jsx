import { useState, useEffect } from 'react';
import { courseAPI } from '../services/api';

function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getMyCourses();
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#059669';
      case 'in-progress': return '#d97706';
      default: return '#2563eb';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in-progress': return 'In Progress';
      default: return 'Not Started';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#1e293b' }}>
        My Courses
      </h1>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>
        Courses assigned to you by your organization
      </p>

      {courses.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
          <h3 style={{ color: '#374151', marginBottom: '8px' }}>No courses assigned yet</h3>
          <p style={{ color: '#64748b' }}>When your organization assigns courses to you, they will appear here.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {courses.map(course => (
            <div key={course.assignmentId} style={{
              background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
              overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              transition: 'box-shadow 0.2s', cursor: 'pointer'
            }}>
              {/* Course Header */}
              <div style={{
                background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                padding: '20px', color: '#fff'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                  {course.courseName}
                </h3>
                <span style={{
                  display: 'inline-block', padding: '3px 10px',
                  background: 'rgba(255,255,255,0.2)', borderRadius: '12px',
                  fontSize: '11px', fontWeight: '500', marginTop: '8px'
                }}>
                  {getStatusLabel(course.status)}
                </span>
              </div>

              {/* Course Body */}
              <div style={{ padding: '16px' }}>
                {/* Progress Bar */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Progress</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: getStatusColor(course.status) }}>
                      {course.progress}%
                    </span>
                  </div>
                  <div style={{
                    height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%', width: `${course.progress}%`,
                      background: getStatusColor(course.status), borderRadius: '3px',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Assigned: {new Date(course.assignedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {course.completedAt && (
                    <span style={{ fontSize: '12px', color: '#059669', fontWeight: '500' }}>
                      ✓ Completed {new Date(course.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>

                {/* Action */}
                <a
                  href={`https://staffinn.com/course-learning/${course.courseId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block', marginTop: '14px', textAlign: 'center',
                    padding: '10px', background: course.status === 'completed' ? '#f0fdf4' : '#eff6ff',
                    color: course.status === 'completed' ? '#059669' : '#2563eb',
                    borderRadius: '8px', fontWeight: '600', fontSize: '13px',
                    textDecoration: 'none', border: `1px solid ${course.status === 'completed' ? '#bbf7d0' : '#bfdbfe'}`
                  }}
                >
                  {course.status === 'completed' ? '✓ Review Course' : course.progress > 0 ? '▶ Continue Learning' : '▶ Start Course'}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyCourses;
