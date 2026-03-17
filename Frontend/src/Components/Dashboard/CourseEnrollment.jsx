import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './CourseEnrollment.css';

const CourseEnrollment = () => {
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [enrollmentCounts, setEnrollmentCounts] = useState({});

    useEffect(() => {
        loadCourses();
        loadStudents();
    }, []);

    useEffect(() => {
        if (courses.length > 0) {
            loadEnrollmentCounts();
            
            // Set up polling for real-time updates every 30 seconds
            const interval = setInterval(() => {
                loadEnrollmentCounts();
            }, 30000);
            
            return () => clearInterval(interval);
        }
    }, [courses]);

    const loadCourses = async () => {
        try {
            setLoading(true);
            const response = await apiService.getCourses();
            if (response.success) {
                // Filter only On-Campus courses
                const onCampusCourses = (response.data || []).filter(
                    course => course.mode === 'On Campus' || course.mode === 'Offline'
                );
                setCourses(onCampusCourses);
            }
        } catch (error) {
            console.error('Error loading courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async () => {
        try {
            const response = await apiService.getStudents();
            if (response.success) {
                setStudents(response.data || []);
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };

    const loadEnrollmentCounts = async () => {
        try {
            const counts = {};
            await Promise.all(
                courses.map(async (course) => {
                    const courseId = course.coursesId || course.instituteCourseID;
                    try {
                        const response = await apiService.getInstituteStudentEnrollmentCount(courseId);
                        if (response.success) {
                            counts[courseId] = response.data?.enrollmentCount || 0;
                        } else {
                            counts[courseId] = 0;
                        }
                    } catch (error) {
                        console.error(`Error loading enrollment count for course ${courseId}:`, error);
                        counts[courseId] = 0;
                    }
                })
            );
            setEnrollmentCounts(counts);
        } catch (error) {
            console.error('Error loading enrollment counts:', error);
        }
    };

    const handleEnrollClick = (course) => {
        setSelectedCourse(course);
        setSelectedStudents([]);
        setSearchQuery('');
        setShowEnrollmentModal(true);
    };

    const handleStudentToggle = (studentId) => {
        setSelectedStudents(prev => {
            if (prev.includes(studentId)) {
                return prev.filter(id => id !== studentId);
            } else {
                return [...prev, studentId];
            }
        });
    };

    const handleSelectAll = () => {
        const filteredStudentIds = getFilteredStudents().map(s => s.instituteStudntsID);
        if (selectedStudents.length === filteredStudentIds.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(filteredStudentIds);
        }
    };

    const handleEnrollSubmit = async () => {
        if (selectedStudents.length === 0) {
            alert('Please select at least one student to enroll.');
            return;
        }

        try {
            setLoading(true);
            const courseId = selectedCourse.coursesId || selectedCourse.instituteCourseID;
            const response = await apiService.enrollInstituteStudents(courseId, selectedStudents);

            if (response.success) {
                alert(`Successfully enrolled ${selectedStudents.length} student(s) in ${selectedCourse.courseName || selectedCourse.name}!`);
                setShowEnrollmentModal(false);
                setSelectedCourse(null);
                setSelectedStudents([]);
                // Reload enrollment counts
                await loadEnrollmentCounts();
            } else {
                alert(response.message || 'Failed to enroll students');
            }
        } catch (error) {
            console.error('Error enrolling students:', error);
            alert('Failed to enroll students. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredStudents = () => {
        if (!searchQuery.trim()) return students;
        
        const query = searchQuery.toLowerCase();
        return students.filter(student => 
            student.fullName?.toLowerCase().includes(query) ||
            student.email?.toLowerCase().includes(query) ||
            student.phoneNumber?.includes(query)
        );
    };

    const closeModal = () => {
        setShowEnrollmentModal(false);
        setSelectedCourse(null);
        setSelectedStudents([]);
        setSearchQuery('');
    };

    if (loading && courses.length === 0) {
        return (
            <div className="course-enrollment-container">
                <div className="loading-state">Loading courses...</div>
            </div>
        );
    }

    return (
        <div className="course-enrollment-container">
            <div className="enrollment-header">
                <h2>📚 Course Enrollment</h2>
                <p>Enroll your institute students in On-Campus courses</p>
            </div>

            {courses.length === 0 ? (
                <div className="empty-state">
                    <p>No On-Campus courses available for enrollment.</p>
                    <p>Please add On-Campus courses first in the My Courses section.</p>
                </div>
            ) : (
                <div className="courses-grid">
                    {courses.map(course => {
                        const courseId = course.coursesId || course.instituteCourseID;
                        const enrollmentCount = enrollmentCounts[courseId] || 0;
                        
                        return (
                            <div key={courseId} className="enrollment-course-card">
                                {course.thumbnailUrl && (
                                    <div className="course-thumbnail">
                                        <img src={course.thumbnailUrl} alt={course.courseName || course.name} />
                                    </div>
                                )}
                                <div className="course-info">
                                    <h3>{course.courseName || course.name}</h3>
                                    <div className="course-meta">
                                        <span className="meta-item">
                                            <strong>Duration:</strong> {course.duration}
                                        </span>
                                        <span className="meta-item">
                                            <strong>Instructor:</strong> {course.instructor}
                                        </span>
                                        <span className="meta-item">
                                            <strong>Category:</strong> {course.category}
                                        </span>
                                        <span className="meta-item enrollment-count-badge">
                                            <strong>Enrolled Students:</strong> 
                                            <span className="count-value">{enrollmentCount}</span>
                                        </span>
                                    </div>
                                    <button 
                                        className="enroll-button"
                                        onClick={() => handleEnrollClick(course)}
                                        disabled={students.length === 0}
                                    >
                                        {students.length === 0 ? 'No Students Available' : 'Enroll Students'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Enrollment Modal */}
            {showEnrollmentModal && selectedCourse && (
                <div className="enrollment-modal-overlay" onClick={closeModal}>
                    <div className="enrollment-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Enroll Students in {selectedCourse.courseName || selectedCourse.name}</h2>
                            <button className="close-button" onClick={closeModal}>×</button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="search-section">
                                <input
                                    type="text"
                                    placeholder="Search students by name, email, or phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input"
                                />
                                <div className="selection-info">
                                    <span>{selectedStudents.length} student(s) selected</span>
                                    <button 
                                        className="select-all-button"
                                        onClick={handleSelectAll}
                                    >
                                        {selectedStudents.length === getFilteredStudents().length ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                            </div>

                            <div className="students-list">
                                {getFilteredStudents().length === 0 ? (
                                    <div className="no-students">
                                        {searchQuery ? 'No students found matching your search.' : 'No students available.'}
                                    </div>
                                ) : (
                                    getFilteredStudents().map(student => (
                                        <div 
                                            key={student.instituteStudntsID} 
                                            className={`student-item ${selectedStudents.includes(student.instituteStudntsID) ? 'selected' : ''}`}
                                            onClick={() => handleStudentToggle(student.instituteStudntsID)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.includes(student.instituteStudntsID)}
                                                onChange={() => handleStudentToggle(student.instituteStudntsID)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <div className="student-details">
                                                <div className="student-name">{student.fullName}</div>
                                                <div className="student-info">
                                                    <span>{student.email}</span>
                                                    <span>{student.phoneNumber}</span>
                                                </div>
                                                {student.degreeName && (
                                                    <div className="student-degree">
                                                        {student.degreeName} - {student.specialization}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                className="cancel-button" 
                                onClick={closeModal}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button 
                                className="submit-button" 
                                onClick={handleEnrollSubmit}
                                disabled={loading || selectedStudents.length === 0}
                            >
                                {loading ? 'Enrolling...' : `Enroll ${selectedStudents.length} Student(s)`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseEnrollment;
