/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import './InstituteDashboard.css';

const InstituteDashboard = () => {
    // Get user data from localStorage
    const getUserData = () => {
        const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        return registeredUsers.find(user => user.role === 'Institute') || { instituteName: 'Your Institute' };
    };

    const userData = getUserData();
    const [activeTab, setActiveTab] = useState('overview');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    
    // Profile management state
    const [profileData, setProfileData] = useState({
        instituteName: userData.instituteName || 'Your Institute',
        address: '123 Education Lane, Tech Park, Jaipur - 302022',
        phone: '+91 141 2770120',
        email: 'info@institute.edu',
        website: 'www.institute.edu',
        experience: '25+ Years of Excellence in Education',
        badges: ['AICTE Approved', 'ISO 9001:2015', 'NSDC Partner']
    });

    // Form states
    const [studentForm, setStudentForm] = useState({
        name: '',
        email: '',
        phone: '',
        course: '',
        enrollmentDate: '',
        address: '',
        qualification: '',
        experience: '',
        skills: '',
        emergencyContact: '',
        feeStatus: 'Pending'
    });

    const [courseForm, setCourseForm] = useState({
        name: '',
        duration: '',
        fees: '',
        instructor: '',
        description: '',
        category: '',
        mode: 'Offline',
        prerequisites: '',
        syllabus: '',
        certification: ''
    });

    const [eventForm, setEventForm] = useState({
        title: '',
        date: '',
        company: '',
        details: '',
        participants: '',
        type: 'Event',
        verified: false
    });

    // Sample data for charts
    const enrollmentData = [
        { name: 'Jan', students: 120, completed: 40 },
        { name: 'Feb', students: 135, completed: 45 },
        { name: 'Mar', students: 150, completed: 50 },
        { name: 'Apr', students: 165, completed: 58 },
        { name: 'May', students: 180, completed: 65 },
    ];

    const placementData = [
        { name: 'Q1', rate: 68 },
        { name: 'Q2', rate: 72 },
        { name: 'Q3', rate: 75 },
        { name: 'Q4', rate: 78 },
    ];

    const courseCompletionData = [
        { name: 'Completed', value: 350 },
        { name: 'In Progress', value: 580 },
        { name: 'Dropped', value: 70 },
    ];

    const COLORS = ['#00C49F', '#0088FE', '#FF8042'];

    // Sample students data
    const students = [
        { id: 1, name: 'Rahul Sharma', course: 'Web Development', enrolled: '2023-11-15', status: 'Active', placementStatus: 'Placed' },
        { id: 2, name: 'Priya Singh', course: 'Data Science', enrolled: '2023-12-01', status: 'Active', placementStatus: 'Interviewing' },
        { id: 3, name: 'Amit Kumar', course: 'Digital Marketing', enrolled: '2023-10-20', status: 'Completed', placementStatus: 'Placed' },
        { id: 4, name: 'Neha Patel', course: 'UI/UX Design', enrolled: '2024-01-05', status: 'Active', placementStatus: 'Searching' },
    ];

    // Sample courses data
    const courses = [
        { id: 1, name: 'Web Development', students: 85, duration: '3 months', fees: '₹15,000', instructor: 'Vikram Mehta' },
        { id: 2, name: 'Data Science', students: 65, duration: '4 months', fees: '₹20,000', instructor: 'Anjali Shah' },
        { id: 3, name: 'Digital Marketing', students: 55, duration: '2 months', fees: '₹12,000', instructor: 'Rajesh Kumar' },
        { id: 4, name: 'UI/UX Design', students: 45, duration: '3 months', fees: '₹18,000', instructor: 'Meera Joshi' },
    ];

    // Sample company collaborations
    const companies = [
        { id: 1, name: 'TechSolutions Ltd', type: 'Placement Partner', hiringCount: 25, lastEvent: '2024-01-20' },
        { id: 2, name: 'DataCorp Inc', type: 'Training Partner', hiringCount: 18, lastEvent: '2024-01-15' },
        { id: 3, name: 'WebTech Systems', type: 'Placement Partner', hiringCount: 12, lastEvent: '2024-01-10' },
    ];

    // Sample upcoming events
    const [events, setEvents] = useState([
        { id: 1, title: 'Campus Recruitment Drive', company: 'TechSolutions Ltd', date: '2024-02-15', participants: 45, type: 'Event', verified: true },
        { id: 2, title: 'Workshop on AI', company: 'DataCorp Inc', date: '2024-02-20', participants: 60, type: 'Event', verified: false },
        { id: 3, title: 'Career Counseling Session', company: 'Internal', date: '2024-02-25', participants: 80, type: 'Event', verified: true },
    ]);

    // Handle modal operations
    const openModal = (type) => {
        setModalType(type);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        // Reset forms
        setStudentForm({
            name: '', email: '', phone: '', course: '', enrollmentDate: '', address: '',
            qualification: '', experience: '', skills: '', emergencyContact: '', feeStatus: 'Pending'
        });
        setCourseForm({
            name: '', duration: '', fees: '', instructor: '', description: '', category: '',
            mode: 'Offline', prerequisites: '', syllabus: '', certification: ''
        });
        setEventForm({
            title: '', date: '', company: '', details: '', participants: '', type: 'Event', verified: false
        });
    };

    // Handle form submissions
    const handleStudentSubmit = (e) => {
        e.preventDefault();
        console.log('Student data:', studentForm);
        // Here you would typically send data to backend
        alert('Student added successfully!');
        closeModal();
    };

    const handleCourseSubmit = (e) => {
        e.preventDefault();
        console.log('Course data:', courseForm);
        // Here you would typically send data to backend
        alert('Course added successfully!');
        closeModal();
    };

    const handleEventSubmit = (e) => {
        e.preventDefault();
        const newEvent = {
            id: events.length + 1,
            ...eventForm,
            participants: parseInt(eventForm.participants) || 0
        };
        setEvents([...events, newEvent]);
        alert('Event/News added successfully!');
        closeModal();
    };

    const handleProfileUpdate = (e) => {
        e.preventDefault();
        console.log('Profile updated:', profileData);
        // Here you would typically send data to backend
        alert('Profile updated successfully!');
        closeModal();
    };

    return (
        <div className="institute-dashboard">
            <div className="institute-dashboard-sidebar">
                <div className="institute-info">
                    <img src="/institute-logo-placeholder.png" alt="Institute Logo" className="institute-logo" />
                    <h3>{profileData.instituteName}</h3>
                </div>
                <ul className="institute-sidebar-menu">
                    <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
                        My Profile
                    </li>
                    <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
                        Overview
                    </li>
                    <li className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>
                        Student Management
                    </li>
                    <li className={activeTab === 'courses' ? 'active' : ''} onClick={() => setActiveTab('courses')}>
                        Course Management
                    </li>
                    <li className={activeTab === 'placements' ? 'active' : ''} onClick={() => setActiveTab('placements')}>
                        Placements
                    </li>
                    <li className={activeTab === 'collaborations' ? 'active' : ''} onClick={() => setActiveTab('collaborations')}>
                        Industry Collaborations
                    </li>
                    <li className={activeTab === 'govt' ? 'active' : ''} onClick={() => setActiveTab('govt')}>
                        Government Schemes
                    </li>
                    <li className={activeTab === 'events' ? 'active' : ''} onClick={() => setActiveTab('events')}>
                        Events & News
                    </li>
                </ul>
            </div>

            <div className="institute-dashboard-content">
                {/* My Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="institute-profile-tab">
                        <div className="institute-tab-header">
                            <h1>My Profile</h1>
                            <button className="institute-primary-button" onClick={() => openModal('profile')}>Edit Profile</button>
                        </div>
                        
                        <div className="institute-profile-details-card">
                            <div className="institute-profile-header">
                                <img src="/institute-logo-placeholder.png" alt="Institute Logo" className="institute-profile-logo" />
                                <div className="institute-profile-info">
                                    <h2>{profileData.instituteName}</h2>
                                    <p className="institute-experience-text">{profileData.experience}</p>
                                    <div className="institute-profile-badges">
                                        {profileData.badges.map((badge, index) => (
                                            <span key={index} className="institute-profile-badge">{badge}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="institute-profile-contact-grid">
                                <div className="institute-contact-item">
                                    <strong>Address:</strong>
                                    <span>{profileData.address}</span>
                                </div>
                                <div className="institute-contact-item">
                                    <strong>Phone:</strong>
                                    <span>{profileData.phone}</span>
                                </div>
                                <div className="institute-contact-item">
                                    <strong>Email:</strong>
                                    <span>{profileData.email}</span>
                                </div>
                                <div className="institute-contact-item">
                                    <strong>Website:</strong>
                                    <span>{profileData.website}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Events & News Tab */}
                {activeTab === 'events' && (
                    <div className="institute-events-tab">
                        <div className="institute-tab-header">
                            <h1>Events & News Management</h1>
                            <div>
                                <button className="institute-primary-button" onClick={() => openModal('event')}>+ Add Event</button>
                                <button className="institute-action-button" onClick={() => openModal('news')}>+ Add News</button>
                            </div>
                        </div>

                        <div className="institute-events-management-grid">
                            {events.map(event => (
                                <div className="institute-event-management-card" key={event.id}>
                                    <div className="institute-event-card-header">
                                        <h3>{event.title}</h3>
                                        <span className={`institute-event-type-badge ${event.type.toLowerCase()}`}>
                                            {event.type}
                                        </span>
                                    </div>
                                    <div className="institute-event-card-details">
                                        <p><strong>Company:</strong> {event.company}</p>
                                        <p><strong>Date:</strong> {event.date}</p>
                                        <p><strong>Participants:</strong> {event.participants}</p>
                                        <p><strong>Details:</strong> {event.details}</p>
                                        <p><strong>Status:</strong> 
                                            <span className={`institute-verification-badge ${event.verified ? 'verified' : 'pending'}`}>
                                                {event.verified ? '✓ Verified' : '⏳ Pending'}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="institute-event-card-actions">
                                        <button className="institute-table-action">Edit</button>
                                        <button className="institute-table-action delete">Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'overview' && (
                    <div className="institute-dashboard-overview">
                        <h1>Institute Dashboard</h1>
                        
                        <div className="institute-metrics-grid">
                            <div className="institute-metric-card">
                                <h3>Total Students</h3>
                                <p className="institute-metric-value">1,025</p>
                                <p className="institute-metric-trend positive">+48 this month</p>
                            </div>
                            <div className="institute-metric-card">
                                <h3>Active Courses</h3>
                                <p className="institute-metric-value">12</p>
                                <p className="institute-metric-trend positive">+2 this month</p>
                            </div>
                            <div className="institute-metric-card">
                                <h3>Placement Rate</h3>
                                <p className="institute-metric-value">78%</p>
                                <p className="institute-metric-trend positive">+3% this quarter</p>
                            </div>
                            <div className="institute-metric-card">
                                <h3>Industry Partners</h3>
                                <p className="institute-metric-value">24</p>
                                <p className="institute-metric-trend positive">+1 this month</p>
                            </div>
                        </div>

                        <div className="institute-charts-row">
                            <div className="institute-chart-container">
                                <h3>Student Enrollment Trends</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={enrollmentData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="students" name="Enrolled Students" fill="#8884d8" />
                                        <Bar dataKey="completed" name="Course Completed" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="institute-chart-container">
                                <h3>Placement Success Rate</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={placementData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="rate" name="Placement Rate (%)" stroke="#8884d8" activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="institute-charts-row">
                            <div className="institute-chart-container">
                                <h3>Course Completion Rate</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={courseCompletionData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {courseCompletionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="institute-stat-boxes">
                                <div className="institute-stat-box">
                                    <h4>Pending Approvals</h4>
                                    <p className="institute-stat-number">15</p>
                                    <p className="institute-stat-description">Student profiles awaiting verification</p>
                                </div>
                                <div className="institute-stat-box">
                                    <h4>Upcoming Job Fairs</h4>
                                    <p className="institute-stat-number">3</p>
                                    <p className="institute-stat-description">Scheduled in the next 30 days</p>
                                </div>
                                <div className="institute-stat-box">
                                    <h4>Government Schemes</h4>
                                    <p className="institute-stat-number">5</p>
                                    <p className="institute-stat-description">Available for enrollment</p>
                                </div>
                            </div>
                        </div>

                        <div className="institute-upcoming-events">
                            <h3>Upcoming Events & Job Fairs</h3>
                            <div className="institute-events-grid">
                                {events.slice(0, 3).map(event => (
                                    <div className="institute-event-card" key={event.id}>
                                        <div className="institute-event-date">
                                            <span className="institute-day">{new Date(event.date).getDate()}</span>
                                            <span className="institute-month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                        </div>
                                        <div className="institute-event-details">
                                            <h4>{event.title}</h4>
                                            <p>Organized by: {event.company}</p>
                                            <p>Expected Participants: {event.participants}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'students' && (
                    <div className="institute-students-tab">
                        <div className="institute-tab-header">
                            <h1>Student Management</h1>
                            <button className="institute-primary-button" onClick={() => openModal('student')}>+ Add New Student</button>
                        </div>

                        <div className="institute-search-section">
                            <div className="institute-search-row">
                                <input type="text" placeholder="Search students by name, course, or status..." className="institute-search-input large" />
                                <button className="institute-primary-button">Search</button>
                            </div>
                            <div className="institute-filter-row">
                                <select className="institute-filter-select">
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                    <option value="dropped">Dropped</option>
                                </select>
                                <select className="institute-filter-select">
                                    <option value="all">All Courses</option>
                                    <option value="web">Web Development</option>
                                    <option value="data">Data Science</option>
                                    <option value="marketing">Digital Marketing</option>
                                    <option value="design">UI/UX Design</option>
                                </select>
                                <select className="institute-filter-select">
                                    <option value="all">All Placement Status</option>
                                    <option value="placed">Placed</option>
                                    <option value="interviewing">Interviewing</option>
                                    <option value="searching">Searching</option>
                                    <option value="not-eligible">Not Eligible Yet</option>
                                </select>
                            </div>
                        </div>

                        <table className="institute-data-table full-width">
                            <thead>
                                <tr>
                                    <th>Student Name</th>
                                    <th>Course</th>
                                    <th>Enrollment Date</th>
                                    <th>Status</th>
                                    <th>Placement Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    <tr key={student.id}>
                                        <td>{student.name}</td>
                                        <td>{student.course}</td>
                                        <td>{student.enrolled}</td>
                                        <td>
                                            <span className={`institute-status-badge ${student.status.toLowerCase()}`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`institute-status-badge ${student.placementStatus.toLowerCase().replace(' ', '-')}`}>
                                                {student.placementStatus}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="institute-table-action">View Profile</button>
                                            <button className="institute-table-action">Edit</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'courses' && (
                    <div className="institute-courses-tab">
                        <div className="institute-tab-header">
                            <h1>Course Management</h1>
                            <button className="institute-primary-button" onClick={() => openModal('course')}>+ Add New Course</button>
                        </div>

                        <div className="institute-course-cards">
                            {courses.map(course => (
                                <div className="institute-course-card" key={course.id}>
                                    <h3>{course.name}</h3>
                                    <div className="institute-course-details">
                                        <div className="institute-detail-item">
                                            <span className="institute-label">Students:</span>
                                            <span className="institute-value">{course.students}</span>
                                        </div>
                                        <div className="institute-detail-item">
                                            <span className="institute-label">Duration:</span>
                                            <span className="institute-value">{course.duration}</span>
                                        </div>
                                        <div className="institute-detail-item">
                                            <span className="institute-label">Fees:</span>
                                            <span className="institute-value">{course.fees}</span>
                                        </div>
                                        <div className="institute-detail-item">
                                            <span className="institute-label">Instructor:</span>
                                            <span className="institute-value">{course.instructor}</span>
                                        </div>
                                    </div>
                                    <div className="institute-course-actions">
                                        <button className="institute-action-button">View Details</button>
                                        <button className="institute-action-button">Edit Course</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'placements' && (
                    <div className="institute-placements-tab">
                        <div className="institute-tab-header">
                            <h1>Placement & Recruitment</h1>
                            <div>
                                <button className="institute-primary-button">Schedule Campus Drive</button>
                                <button className="institute-action-button">Organize Job Fair</button>
                            </div>
                        </div>

                        <div className="institute-metrics-grid">
                            <div className="institute-metric-card">
                                <h3>Placement Rate</h3>
                                <p className="institute-metric-value">78%</p>
                                <p className="institute-metric-trend positive">+3% this quarter</p>
                            </div>
                            <div className="institute-metric-card">
                                <h3>Students Placed</h3>
                                <p className="institute-metric-value">286</p>
                                <p className="institute-metric-trend positive">+22 this month</p>
                            </div>
                            <div className="institute-metric-card">
                                <h3>On-Job Training</h3>
                                <p className="institute-metric-value">125</p>
                                <p className="institute-metric-trend positive">+15 this month</p>
                            </div>
                            <div className="institute-metric-card">
                                <h3>Avg. Salary Package</h3>
                                <p className="institute-metric-value">₹4.8L</p>
                                <p className="institute-metric-trend positive">+₹0.3L this year</p>
                            </div>
                        </div>

                        <div className="institute-tab-section">
                            <h3>Industry Collaborations</h3>
                            <table className="institute-data-table full-width">
                                <thead>
                                    <tr>
                                        <th>Company Name</th>
                                        <th>Partnership Type</th>
                                        <th>Students Hired</th>
                                        <th>Last Recruitment Event</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {companies.map(company => (
                                        <tr key={company.id}>
                                            <td>{company.name}</td>
                                            <td>{company.type}</td>
                                            <td>{company.hiringCount}</td>
                                            <td>{company.lastEvent}</td>
                                            <td>
                                                <button className="institute-table-action">View Details</button>
                                                <button className="institute-table-action">Schedule Event</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Additional tabs would be implemented similarly */}
                {activeTab === 'collaborations' && (
                    <div className="institute-collaborations-tab">
                        <h1>Industry Collaborations</h1>
                        <p>Manage your industry partnerships and collaboration initiatives here.</p>
                    </div>
                )}

                {activeTab === 'govt' && (
                    <div className="institute-govt-tab">
                        <h1>Government Schemes & Projects</h1>
                        <p>Access and manage government-backed employment and training programs.</p>
                    </div>
                )}
            </div>

            {/* Modal for forms */}
            {showModal && (
                <div className="institute-modal-overlay" onClick={closeModal}>
                    <div className="institute-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="institute-modal-header">
                            <h2>
                                {modalType === 'student' && 'Add New Student'}
                                {modalType === 'course' && 'Add New Course'}
                                {modalType === 'event' && 'Add New Event'}
                                {modalType === 'news' && 'Add News'}
                                {modalType === 'profile' && 'Edit Profile'}
                            </h2>
                            <button className="institute-close-button" onClick={closeModal}>×</button>
                        </div>

                        {/* Student Form */}
                        {modalType === 'student' && (
                            <form onSubmit={handleStudentSubmit} className="institute-modal-form">
                                <div className="institute-form-grid">
                                    <div className="institute-form-group">
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            value={studentForm.name}
                                            onChange={(e) => setStudentForm({...studentForm, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Email Address *</label>
                                        <input
                                            type="email"
                                            value={studentForm.email}
                                            onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Phone Number *</label>
                                        <input
                                            type="tel"
                                            value={studentForm.phone}
                                            onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Course *</label>
                                        <select
                                            value={studentForm.course}
                                            onChange={(e) => setStudentForm({...studentForm, course: e.target.value})}
                                            required
                                        >
                                            <option value="">Select Course</option>
                                            <option value="Web Development">Web Development</option>
                                            <option value="Data Science">Data Science</option>
                                            <option value="Digital Marketing">Digital Marketing</option>
                                            <option value="UI/UX Design">UI/UX Design</option>
                                        </select>
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Enrollment Date *</label>
                                        <input
                                            type="date"
                                            value={studentForm.enrollmentDate}
                                            onChange={(e) => setStudentForm({...studentForm, enrollmentDate: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Emergency Contact</label>
                                        <input
                                            type="tel"
                                            value={studentForm.emergencyContact}
                                            onChange={(e) => setStudentForm({...studentForm, emergencyContact: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="institute-form-group">
                                    <label>Address</label>
                                    <textarea
                                        value={studentForm.address}
                                        onChange={(e) => setStudentForm({...studentForm, address: e.target.value})}
                                        rows="3"
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Qualification</label>
                                    <input
                                        type="text"
                                        value={studentForm.qualification}
                                        onChange={(e) => setStudentForm({...studentForm, qualification: e.target.value})}
                                        placeholder="e.g., B.Tech, BCA, MBA"
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Previous Experience</label>
                                    <textarea
                                        value={studentForm.experience}
                                        onChange={(e) => setStudentForm({...studentForm, experience: e.target.value})}
                                        rows="3"
                                        placeholder="Previous work experience, internships, etc."
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Skills</label>
                                    <textarea
                                        value={studentForm.skills}
                                        onChange={(e) => setStudentForm({...studentForm, skills: e.target.value})}
                                        rows="3"
                                        placeholder="Technical skills, programming languages, etc."
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Fee Status</label>
                                    <select
                                        value={studentForm.feeStatus}
                                        onChange={(e) => setStudentForm({...studentForm, feeStatus: e.target.value})}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Partial">Partial</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                </div>
                                <div className="institute-form-buttons">
                                    <button type="submit" className="institute-primary-button">Add Student</button>
                                    <button type="button" className="institute-secondary-button" onClick={closeModal}>Cancel</button>
                                </div>
                            </form>
                        )}

                        {/* Course Form */}
                        {modalType === 'course' && (
                            <form onSubmit={handleCourseSubmit} className="institute-modal-form">
                                <div className="institute-form-grid">
                                    <div className="institute-form-group">
                                        <label>Course Name *</label>
                                        <input
                                            type="text"
                                            value={courseForm.name}
                                            onChange={(e) => setCourseForm({...courseForm, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Duration *</label>
                                        <input
                                            type="text"
                                            value={courseForm.duration}
                                            onChange={(e) => setCourseForm({...courseForm, duration: e.target.value})}
                                            placeholder="e.g., 3 months, 6 months"
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Fees *</label>
                                        <input
                                            type="text"
                                            value={courseForm.fees}
                                            onChange={(e) => setCourseForm({...courseForm, fees: e.target.value})}
                                            placeholder="e.g., ₹15,000"
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Instructor *</label>
                                        <input
                                            type="text"
                                            value={courseForm.instructor}
                                            onChange={(e) => setCourseForm({...courseForm, instructor: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Category *</label>
                                        <select
                                            value={courseForm.category}
                                            onChange={(e) => setCourseForm({...courseForm, category: e.target.value})}
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            <option value="IT">IT</option>
                                            <option value="Engineering">Engineering</option>
                                            <option value="Management">Management</option>
                                            <option value="Vocational">Vocational Training</option>
                                        </select>
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Mode</label>
                                        <select
                                            value={courseForm.mode}
                                            onChange={(e) => setCourseForm({...courseForm, mode: e.target.value})}
                                        >
                                            <option value="Offline">Offline</option>
                                            <option value="Online">Online</option>
                                            <option value="Online/Offline">Online/Offline</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="institute-form-group">
                                    <label>Course Description</label>
                                    <textarea
                                        value={courseForm.description}
                                        onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                                        rows="4"
                                        placeholder="Brief description of the course"
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Prerequisites</label>
                                    <textarea
                                        value={courseForm.prerequisites}
                                        onChange={(e) => setCourseForm({...courseForm, prerequisites: e.target.value})}
                                        rows="3"
                                        placeholder="Required qualifications or skills"
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Syllabus Overview</label>
                                    <textarea
                                        value={courseForm.syllabus}
                                        onChange={(e) => setCourseForm({...courseForm, syllabus: e.target.value})}
                                        rows="4"
                                        placeholder="Main topics covered in the course"
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Certification</label>
                                    <select
                                        value={courseForm.certification}
                                        onChange={(e) => setCourseForm({...courseForm, certification: e.target.value})}
                                    >
                                        <option value="">Select Certification Type</option>
                                        <option value="Government-Recognized">Government-Recognized</option>
                                        <option value="Industry-Specific">Industry-Specific</option>
                                        <option value="Internal Certificate">Internal Certificate</option>
                                    </select>
                                </div>
                                <div className="institute-form-buttons">
                                    <button type="submit" className="institute-primary-button">Add Course</button>
                                    <button type="button" className="institute-secondary-button" onClick={closeModal}>Cancel</button>
                                </div>
                            </form>
                        )}

                        {/* Event/News Form */}
                        {(modalType === 'event' || modalType === 'news') && (
                            <form onSubmit={handleEventSubmit} className="institute-modal-form">
                                <div className="institute-form-grid">
                                    <div className="institute-form-group">
                                        <label>Title *</label>
                                        <input
                                            type="text"
                                            value={eventForm.title}
                                            onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Date *</label>
                                        <input
                                            type="date"
                                            value={eventForm.date}
                                            onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Company/Organizer *</label>
                                        <input
                                            type="text"
                                            value={eventForm.company}
                                            onChange={(e) => setEventForm({...eventForm, company: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Expected Participants</label>
                                        <input
                                            type="number"
                                            value={eventForm.participants}
                                            onChange={(e) => setEventForm({...eventForm, participants: e.target.value})}
                                            placeholder="Number of participants"
                                        />
                                    </div>
                                </div>
                                <div className="institute-form-group">
                                    <label>Details *</label>
                                    <textarea
                                        value={eventForm.details}
                                        onChange={(e) => setEventForm({...eventForm, details: e.target.value})}
                                        rows="4"
                                        placeholder="Event/News details and description"
                                        required
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Type</label>
                                    <select
                                        value={eventForm.type}
                                        onChange={(e) => setEventForm({...eventForm, type: e.target.value})}
                                    >
                                        <option value="Event">Event</option>
                                        <option value="News">News</option>
                                        <option value="Job Fair">Job Fair</option>
                                        <option value="Workshop">Workshop</option>
                                        <option value="Announcement">Announcement</option>
                                    </select>
                                </div>
                                <div className="institute-form-group institute-checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={eventForm.verified}
                                            onChange={(e) => setEventForm({...eventForm, verified: e.target.checked})}
                                        />
                                        Mark as Verified (Institute Verified)
                                    </label>
                                </div>
                                <div className="institute-form-buttons">
                                    <button type="submit" className="institute-primary-button">
                                        Add {modalType === 'event' ? 'Event' : 'News'}
                                    </button>
                                    <button type="button" className="institute-secondary-button" onClick={closeModal}>Cancel</button>
                                </div>
                            </form>
                        )}

                        {/* Profile Form */}
                        {modalType === 'profile' && (
                            <form onSubmit={handleProfileUpdate} className="institute-modal-form">
                                <div className="institute-form-grid">
                                    <div className="institute-form-group">
                                        <label>Institute Name *</label>
                                        <input
                                            type="text"
                                            value={profileData.instituteName}
                                            onChange={(e) => setProfileData({...profileData, instituteName: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Phone Number *</label>
                                        <input
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Email Address *</label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Website</label>
                                        <input
                                            type="url"
                                            value={profileData.website}
                                            onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="institute-form-group">
                                    <label>Address *</label>
                                    <textarea
                                        value={profileData.address}
                                        onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                                        rows="3"
                                        required
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Experience</label>
                                    <input
                                        type="text"
                                        value={profileData.experience}
                                        onChange={(e) => setProfileData({...profileData, experience: e.target.value})}
                                        placeholder="e.g., 25+ Years of Excellence in Education"
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Badges/Certifications</label>
                                    <input
                                        type="text"
                                        value={profileData.badges.join(', ')}
                                        onChange={(e) => setProfileData({...profileData, badges: e.target.value.split(', ')})}
                                        placeholder="Separate multiple badges with commas"
                                    />
                                </div>
                                <div className="institute-form-buttons">
                                    <button type="submit" className="institute-primary-button">Update Profile</button>
                                    <button type="button" className="institute-secondary-button" onClick={closeModal}>Cancel</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstituteDashboard;