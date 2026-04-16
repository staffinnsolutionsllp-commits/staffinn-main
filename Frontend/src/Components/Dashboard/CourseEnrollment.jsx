import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './CourseEnrollment.css';

const CourseEnrollment = () => {
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [misStudents, setMisStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [enrollmentCounts, setEnrollmentCounts] = useState({});
    const [enrolledStudentsSet, setEnrolledStudentsSet] = useState(new Set());
    const [activeTab, setActiveTab] = useState('institute');
    const [isStaffinnPartner, setIsStaffinnPartner] = useState(false);

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
            console.log('📚 Loading students...');
            const response = await apiService.getAvailableStudents();
            console.log('📊 Students response:', response);
            
            if (response.success) {
                setIsStaffinnPartner(response.isStaffinnPartner || false);
                
                // Separate MIS and regular students
                const allStudents = response.data || [];
                const regularStudents = allStudents.filter(s => !s.isMisStudent);
                const misStudentsList = allStudents.filter(s => s.isMisStudent);
                
                setStudents(regularStudents);
                setMisStudents(misStudentsList);
                
                console.log('✅ Regular students:', regularStudents.length);
                console.log('✅ MIS students:', misStudentsList.length);
                console.log('✅ Is Staffinn Partner:', response.isStaffinnPartner);
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

    const handleEnrollClick = async (course) => {
        setSelectedCourse(course);
        setSelectedStudents([]);
        setSearchQuery('');
        setActiveTab('institute');
        setShowEnrollmentModal(true);
        
        // Fetch already enrolled students for this course
        await fetchEnrolledStudents(course.coursesId || course.instituteCourseID);
    };

    const fetchEnrolledStudents = async (courseId) => {
        try {
            console.log('🔍 Fetching enrolled students for course:', courseId);
            const response = await apiService.getEnrolledInstituteStudents(courseId);
            console.log('📊 Enrolled students response:', response);
            
            if (response.success && response.data) {
                // Create a Set of enrolled student IDs for quick lookup
                const enrolledIds = new Set(
                    response.data.map(enrollment => enrollment.studentsId || enrollment.studentId)
                );
                console.log('✅ Enrolled Students Set:', Array.from(enrolledIds));
                setEnrolledStudentsSet(enrolledIds);
            } else {
                console.log('⚠️ No enrolled students found or error:', response.message);
                setEnrolledStudentsSet(new Set());
            }
        } catch (error) {
            console.error('❌ Error fetching enrolled students:', error);
            setEnrolledStudentsSet(new Set());
        }
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
        const filteredStudentIds = getFilteredStudents().map(s => 
            s.instituteStudntsID || s.studentsId
        );
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
            const studentType = activeTab === 'mis' ? 'mis' : 'institute';
            
            const response = await apiService.enrollInstituteStudents(
                courseId, 
                selectedStudents,
                { studentType }
            );

            if (response.success) {
                const stats = response.stats || {};
                let message = `Successfully enrolled ${stats.enrolled || selectedStudents.length} student(s)!`;
                
                if (stats.skipped > 0) {
                    message += `\n${stats.skipped} student(s) were already enrolled.`;
                }
                
                alert(message);
                setShowEnrollmentModal(false);
                setSelectedCourse(null);
                setSelectedStudents([]);
                setEnrolledStudentsSet(new Set());
                setActiveTab('institute');
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
        // Get students based on active tab
        let filteredList = activeTab === 'institute' ? students : misStudents;
        
        // Filter out already enrolled students
        filteredList = filteredList.filter(student => {
            const studentId = student.instituteStudntsID || student.studentsId;
            const isEnrolled = enrolledStudentsSet.has(studentId);
            if (isEnrolled) {
                console.log('⛔ Student already enrolled, filtering out:', 
                    student.fullName || student.studentName, studentId);
            }
            return !isEnrolled;
        });
        
        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredList = filteredList.filter(student => {
                const name = student.fullName || student.studentName || '';
                const email = student.email || '';
                const phone = student.phoneNumber || student.mobile || '';
                
                return name.toLowerCase().includes(query) ||
                       email.toLowerCase().includes(query) ||
                       phone.includes(query);
            });
        }
        
        return filteredList;
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
                            {/* Tabs for Institute vs MIS Students */}
                            {isStaffinnPartner && (
                                <div className="student-tabs">
                                    <button 
                                        className={`tab-button ${activeTab === 'institute' ? 'active' : ''}`}
                                        onClick={() => {
                                            setActiveTab('institute');
                                            setSelectedStudents([]);
                                        }}
                                    >
                                        🏫 Institute Students ({students.length})
                                    </button>
                                    <button 
                                        className={`tab-button ${activeTab === 'mis' ? 'active' : ''}`}
                                        onClick={() => {
                                            setActiveTab('mis');
                                            setSelectedStudents([]);
                                        }}
                                    >
                                        📚 MIS Students ({misStudents.length})
                                    </button>
                                </div>
                            )}

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
                                        {searchQuery ? 'No students found matching your search.' : 
                                         activeTab === 'mis' ? 'No MIS students available.' : 'No students available.'}
                                    </div>
                                ) : (
                                    getFilteredStudents().map(student => {
                                        const studentId = student.instituteStudntsID || student.studentsId;
                                        const studentName = student.fullName || student.studentName;
                                        const studentEmail = student.email;
                                        const studentPhone = student.phoneNumber || student.mobile;
                                        
                                        return (
                                            <div 
                                                key={studentId} 
                                                className={`student-item ${selectedStudents.includes(studentId) ? 'selected' : ''}`}
                                                onClick={() => handleStudentToggle(studentId)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.includes(studentId)}
                                                    onChange={() => handleStudentToggle(studentId)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="student-details">
                                                    <div className="student-name">
                                                        {studentName}
                                                        {activeTab === 'mis' && (
                                                            <span className="mis-badge">MIS</span>
                                                        )}
                                                    </div>
                                                    <div className="student-info">
                                                        <span>{studentEmail}</span>
                                                        <span>{studentPhone}</span>
                                                    </div>
                                                    {(student.degreeName || student.qualification) && (
                                                        <div className="student-degree">
                                                            {student.degreeName || student.qualification}
                                                            {student.specialization && ` - ${student.specialization}`}
                                                            {student.course && ` - ${student.course}`}
                                                        </div>
                                                    )}
                                                    {student.fatherName && activeTab === 'mis' && (
                                                        <div className="student-father">
                                                            Father: {student.fatherName}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
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
