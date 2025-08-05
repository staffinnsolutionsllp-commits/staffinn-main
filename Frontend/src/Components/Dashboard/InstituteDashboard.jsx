/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import apiService from '../../services/api';
import useProfilePhotoSync from '../../hooks/useProfilePhotoSync';
import './InstituteDashboard.css';
import './BadgeStyles.css';
import './ImageUpload.css';
import './HiringStyles.css';
import './PlacementSection.css';

const InstituteDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [loading, setLoading] = useState(true);

    const [profileData, setProfileData] = useState({
        instituteName: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        experience: '',
        badges: [],
        description: '',
        establishedYear: '',
        profileImage: null,
        isLive: false
    });
    const [currentBadge, setCurrentBadge] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    
    // Real-time dashboard data
    const [dashboardStats, setDashboardStats] = useState({
        totalStudents: 0,
        activeCourses: 0,
        placementRate: 0,
        placedStudents: 0,
        avgSalaryPackage: 0,
        industryPartners: 24
    });
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    
    // Use profile photo sync hook
    const { updateAllImages } = useProfilePhotoSync(profileData.profileImage, 'institute');

    // Load profile data on component mount
    useEffect(() => {
        loadProfileData();
        loadDashboardData();
        loadStudents();
        loadCourses();
        loadPlacementSectionData();
    }, []);
    
    // Refresh dashboard data when switching to overview or placements tab
    useEffect(() => {
        if (activeTab === 'overview' || activeTab === 'placements') {
            loadDashboardData();
            if (activeTab === 'placements') {
                loadPlacementSectionData();
            }
        }
    }, [activeTab]);
    
    const loadDashboardData = async () => {
        try {
            const [statsResponse, courseCountResponse] = await Promise.all([
                apiService.getDashboardStats(),
                apiService.getActiveCourseCount()
            ]);
            
            setDashboardStats({
                totalStudents: statsResponse.success ? statsResponse.data.totalStudents : 0,
                activeCourses: courseCountResponse.success ? courseCountResponse.data.activeCourses : 0,
                placementRate: statsResponse.success ? statsResponse.data.placementRate : 0,
                placedStudents: statsResponse.success ? statsResponse.data.placedStudents : 0,
                avgSalaryPackage: statsResponse.success ? statsResponse.data.avgSalaryPackage : 0,
                industryPartners: 24 // Static for now
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setDashboardStats({
                totalStudents: 0,
                activeCourses: 0,
                placementRate: 0,
                placedStudents: 0,
                avgSalaryPackage: 0,
                industryPartners: 24
            });
        }
    };
    
    // Function to refresh placement data when tab changes
    const refreshPlacementData = async () => {
        await loadDashboardData();
    };
    
    const loadStudents = async () => {
        try {
            const response = await apiService.getStudents();
            if (response.success) {
                setStudents(response.data);
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };
    
    const loadCourses = async () => {
        try {
            const response = await apiService.getCourses();
            if (response.success) {
                setCourses(response.data || []);
            } else {
                setCourses([]);
            }
        } catch (error) {
            console.error('Error loading courses:', error);
            setCourses([]);
        }
    };

    const loadPlacementSectionData = async () => {
        try {
            const response = await apiService.getPlacementSection();
            if (response.success && response.data) {
                setPlacementSectionData(response.data);
                setPlacementSectionForm({
                    averageSalary: response.data.averageSalary || '',
                    highestPackage: response.data.highestPackage || '',
                    topHiringCompanies: (response.data.topHiringCompanies || []).map(company => ({
                        name: company.name || '',
                        logo: null, // Reset file object
                        logoPreview: company.logo || null // Show existing image URL as preview
                    })),
                    recentPlacementSuccess: (response.data.recentPlacementSuccess || []).map(placement => ({
                        name: placement.name || '',
                        company: placement.company || '',
                        position: placement.position || '',
                        photo: null, // Reset file object
                        photoPreview: placement.photo || null // Show existing image URL as preview
                    }))
                });
            }
        } catch (error) {
            console.error('Error loading placement section data:', error);
        }
    };

    const loadProfileData = async () => {
        try {
            setLoading(true);
            const response = await apiService.getInstituteProfile();
            
            if (response.success && response.data) {
                const profileImageUrl = response.data.profileImage || null;
                setProfileData({
                    instituteName: response.data.instituteName || '',
                    address: response.data.address || '',
                    phone: response.data.phone || '',
                    email: response.data.email || '',
                    website: response.data.website || '',
                    experience: response.data.experience || '',
                    badges: response.data.badges || [],
                    description: response.data.description || '',
                    establishedYear: response.data.establishedYear || '',
                    profileImage: profileImageUrl,
                    isLive: response.data.isLive || false
                });
                setImagePreview(profileImageUrl);
                
                // Update all image elements with loaded profile image
                if (profileImageUrl) {
                    updateAllImageElements(profileImageUrl);
                }
            } else {
                // Set default values if no profile exists
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                setProfileData(prev => ({
                    ...prev,
                    instituteName: userData.instituteName || 'Your Institute',
                    email: userData.email || '',
                    profileImage: null
                }));
                setImagePreview(null);
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Form states
    const [studentForm, setStudentForm] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        profilePhoto: null,
        resume: null,
        certificates: [],
        tenthGradeDetails: '',
        tenthPercentage: '',
        tenthYearOfPassing: '',
        twelfthGradeDetails: '',
        twelfthPercentage: '',
        twelfthYearOfPassing: '',
        degreeName: '',
        specialization: '',
        expectedYearOfPassing: '',
        currentlyPursuing: false,
        skills: []
    });
    const [studentFiles, setStudentFiles] = useState({
        profilePhoto: null,
        resume: null,
        certificates: []
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

    const [placementSectionForm, setPlacementSectionForm] = useState({
        averageSalary: '',
        highestPackage: '',
        topHiringCompanies: [],
        recentPlacementSuccess: []
    });

    const [placementSectionData, setPlacementSectionData] = useState(null);

    // Student view/edit states
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [editingStudentId, setEditingStudentId] = useState(null);
    const [showPlacementHistoryModal, setShowPlacementHistoryModal] = useState(false);
    const [selectedStudentPlacementHistory, setSelectedStudentPlacementHistory] = useState([]);

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
    const openModal = async (type, student = null) => {
        setModalType(type);
        setShowModal(true);
        
        if (type === 'profile') {
            console.log('Opening profile modal with image:', profileData.profileImage);
            setImagePreview(profileData.profileImage || null);
            setImageFile(null);
        } else if (type === 'viewStudent' && student) {
            try {
                setLoading(true);
                const response = await apiService.getStudentById(student.instituteStudntsID);
                if (response.success && response.data) {
                    setSelectedStudent(response.data);
                } else {
                    setSelectedStudent(student);
                }
            } catch (error) {
                console.error('Error fetching student details:', error);
                setSelectedStudent(student);
            } finally {
                setLoading(false);
            }
        } else if (type === 'editStudent' && student) {
            try {
                setLoading(true);
                const response = await apiService.getStudentById(student.instituteStudntsID);
                const studentData = response.success && response.data ? response.data : student;
                
                setSelectedStudent(studentData);
                setEditingStudentId(studentData.instituteStudntsID);
                
                // Pre-fill form with student data
                setStudentForm({
                    fullName: studentData.fullName || '',
                    email: studentData.email || '',
                    phoneNumber: studentData.phoneNumber || '',
                    dateOfBirth: studentData.dateOfBirth || '',
                    gender: studentData.gender || '',
                    address: studentData.address || '',
                    profilePhoto: null,
                    resume: null,
                    certificates: [],
                    tenthGradeDetails: studentData.tenthGradeDetails || '',
                    tenthPercentage: studentData.tenthPercentage || '',
                    tenthYearOfPassing: studentData.tenthYearOfPassing || '',
                    twelfthGradeDetails: studentData.twelfthGradeDetails || '',
                    twelfthPercentage: studentData.twelfthPercentage || '',
                    twelfthYearOfPassing: studentData.twelfthYearOfPassing || '',
                    degreeName: studentData.degreeName || '',
                    specialization: studentData.specialization || '',
                    expectedYearOfPassing: studentData.expectedYearOfPassing || '',
                    currentlyPursuing: studentData.currentlyPursuing || false,
                    skills: Array.isArray(studentData.skills) ? studentData.skills : []
                });
            } catch (error) {
                console.error('Error fetching student details for edit:', error);
                setSelectedStudent(student);
                setEditingStudentId(student.instituteStudntsID);
            } finally {
                setLoading(false);
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType('');
        setSelectedStudent(null);
        setEditingStudentId(null);
        // Reset image states
        setImageFile(null);
        setImagePreview(profileData.profileImage || null);
        // Reset forms
        setStudentForm({
            fullName: '', email: '', phoneNumber: '', dateOfBirth: '', gender: '', address: '',
            profilePhoto: null, resume: null, certificates: [], tenthGradeDetails: '', tenthPercentage: '',
            tenthYearOfPassing: '', twelfthGradeDetails: '', twelfthPercentage: '', twelfthYearOfPassing: '',
            degreeName: '', specialization: '', expectedYearOfPassing: '', currentlyPursuing: false, skills: []
        });
        setStudentFiles({ profilePhoto: null, resume: null, certificates: [] });
        setCourseForm({
            name: '', duration: '', fees: '', instructor: '', description: '', category: '',
            mode: 'Offline', prerequisites: '', syllabus: '', certification: ''
        });
        setEventForm({
            title: '', date: '', company: '', details: '', participants: '', type: 'Event', verified: false
        });
    };
    
    // Handle viewing placement history
    const handleViewPlacementHistory = async (student) => {
        setSelectedStudent(student);
        setShowPlacementHistoryModal(true);
        setLoading(true);
        
        try {
            // Fetch complete application history from API
            const response = await apiService.getStudentApplicationHistory(student.instituteStudntsID);
            
            if (response.success && response.data) {
                setSelectedStudentPlacementHistory(response.data);
            } else {
                console.error('Failed to fetch application history:', response.message);
                setSelectedStudentPlacementHistory([]);
            }
        } catch (error) {
            console.error('Error fetching application history:', error);
            setSelectedStudentPlacementHistory([]);
        } finally {
            setLoading(false);
        }
    };
    
    // Close placement history modal
    const closePlacementHistoryModal = () => {
        setShowPlacementHistoryModal(false);
        setSelectedStudent(null);
        setSelectedStudentPlacementHistory([]);
    };

    // Handle form submissions
    const handleStudentSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            const formData = new FormData();
            
            // Add all form fields
            Object.keys(studentForm).forEach(key => {
                if (key === 'skills') {
                    const skillsArray = Array.isArray(studentForm[key]) ? studentForm[key] : [];
                    formData.append(key, JSON.stringify(skillsArray));
                } else if (studentForm[key] !== null && studentForm[key] !== undefined) {
                    formData.append(key, studentForm[key]);
                }
            });
            
            // Add files
            if (studentFiles.profilePhoto) {
                formData.append('profilePhoto', studentFiles.profilePhoto);
            }
            if (studentFiles.resume) {
                formData.append('resume', studentFiles.resume);
            }
            studentFiles.certificates.forEach(cert => {
                formData.append('certificates', cert);
            });
            
            let response;
            if (editingStudentId) {
                // Update existing student
                response = await apiService.updateStudent(editingStudentId, formData);
                if (response.success) {
                    alert('Student updated successfully!');
                }
            } else {
                // Add new student
                response = await apiService.addStudent(formData);
                if (response.success) {
                    alert('Student added successfully!');
                }
            }
            
            if (response.success) {
                await Promise.all([
                    loadDashboardData(), // Refresh dashboard stats for real-time sync
                    loadStudents() // Refresh student list
                ]);
                // If on placements tab, refresh placement data as well
                if (activeTab === 'placements') {
                    await refreshPlacementData();
                }
                closeModal();
            } else {
                alert(response.message || `Failed to ${editingStudentId ? 'update' : 'add'} student`);
            }
        } catch (error) {
            console.error(`Error ${editingStudentId ? 'updating' : 'adding'} student:`, error);
            alert(`Failed to ${editingStudentId ? 'update' : 'add'} student. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const handleCourseSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            const response = await apiService.addCourse(courseForm);
            
            if (response.success) {
                alert('Course added successfully!');
                await Promise.all([
                    loadDashboardData(), // Refresh dashboard stats
                    loadCourses() // Refresh course list
                ]);
                closeModal();
            } else {
                alert(response.message || 'Failed to add course');
            }
        } catch (error) {
            console.error('Error adding course:', error);
            alert('Failed to add course. Please try again.');
        } finally {
            setLoading(false);
        }
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

    const handlePlacementSectionSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            // Prepare data for API - keep file objects for upload
            const placementData = {
                averageSalary: placementSectionForm.averageSalary,
                highestPackage: placementSectionForm.highestPackage,
                topHiringCompanies: placementSectionForm.topHiringCompanies.map(company => ({
                    name: company.name,
                    logo: company.logo // Keep the File object for upload
                })),
                recentPlacementSuccess: placementSectionForm.recentPlacementSuccess.map(placement => ({
                    name: placement.name,
                    company: placement.company,
                    position: placement.position,
                    photo: placement.photo // Keep the File object for upload
                }))
            };
            
            const response = await apiService.updatePlacementSection(placementData);
            
            if (response.success) {
                alert('Placement section updated successfully!');
                // Reload placement section data
                await loadPlacementSectionData();
                // Refresh dashboard stats to ensure real-time sync
                await loadDashboardData();
                // Force refresh of placement tab data if currently active
                if (activeTab === 'placements') {
                    await refreshPlacementData();
                }
                
                // Maintain existing redirect behavior - redirect to overview tab
                setActiveTab('overview');
            } else {
                alert(response.message || 'Failed to update placement section');
            }
        } catch (error) {
            console.error('Error updating placement section:', error);
            alert('Failed to update placement section. Please try again.');
        } finally {
            setLoading(false);
        }
    };





    const handleDeleteStudent = async (studentId, studentName) => {
        if (window.confirm(`Are you sure you want to delete ${studentName}? This action cannot be undone.`)) {
            try {
                setLoading(true);
                const response = await apiService.deleteStudent(studentId);
                if (response.success) {
                    alert('Student deleted successfully!');
                    await Promise.all([
                        loadDashboardData(), // Refresh dashboard stats for real-time sync
                        loadStudents() // Refresh student list
                    ]);
                    // If on placements tab, refresh placement data as well
                    if (activeTab === 'placements') {
                        await refreshPlacementData();
                    }
                } else {
                    alert(response.message || 'Failed to delete student');
                }
            } catch (error) {
                console.error('Error deleting student:', error);
                alert('Failed to delete student');
            } finally {
                setLoading(false);
            }
        }
    };



    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            let finalProfileData = { ...profileData };
            
            // First upload image if there's a new one
            if (imageFile) {
                const imageResponse = await apiService.uploadInstituteImage(imageFile);
                if (imageResponse.success) {
                    // Update profile data with new image URL
                    finalProfileData.profileImage = imageResponse.data.profileImage;
                    setProfileData(prev => ({ ...prev, profileImage: imageResponse.data.profileImage }));
                    setImagePreview(imageResponse.data.profileImage);
                    setImageFile(null);
                    
                    // Update all image elements immediately
                    updateAllImageElements(imageResponse.data.profileImage);
                } else {
                    alert(imageResponse.message || 'Failed to upload image');
                    setLoading(false);
                    return;
                }
            }
            
            // Prepare profile data for API
            const updateData = {
                ...finalProfileData,
                badges: Array.isArray(finalProfileData.badges) ? finalProfileData.badges : [],
                isLive: true
            };
            
            const response = await apiService.updateInstituteProfile(updateData);
            
            if (response.success) {
                alert('Profile updated and is now live!');
                await loadProfileData(); // Reload data
                closeModal();
            } else {
                alert(response.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoLive = async () => {
        try {
            const updateData = {
                ...profileData,
                isLive: true
            };
            
            const response = await apiService.updateInstituteProfile(updateData);
            
            if (response.success) {
                alert('Profile is now live! Your institute will be visible to users.');
                setProfileData(prev => ({ ...prev, isLive: true }));
            } else {
                alert(response.message || 'Failed to go live');
            }
        } catch (error) {
            console.error('Error going live:', error);
            alert('Failed to go live. Please try again.');
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        console.log('File selected:', file);
        
        if (file) {
            console.log('File details:', {
                name: file.name,
                size: file.size,
                type: file.type
            });
            
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }
            
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
                return;
            }
            
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                console.log('FileReader result:', e.target.result.substring(0, 50) + '...');
                setImagePreview(e.target.result);
            };
            reader.onerror = (e) => {
                console.error('FileReader error:', e);
            };
            reader.readAsDataURL(file);
        }
    };

    // Function to update all image elements in real-time
    const updateAllImageElements = (imageUrl) => {
        updateAllImages(imageUrl);
    };

    const handleImageUpload = async () => {
        if (!imageFile) return;
        
        try {
            setLoading(true);
            const response = await apiService.uploadInstituteImage(imageFile);
            
            if (response.success) {
                setProfileData(prev => ({ ...prev, profileImage: response.data.profileImage }));
                setImagePreview(response.data.profileImage);
                setImageFile(null);
                
                // Update all image elements immediately
                updateAllImageElements(response.data.profileImage);
                
                alert('Profile image uploaded successfully!');
                await loadProfileData(); // Reload profile data to ensure consistency
            } else {
                alert(response.message || 'Failed to upload image');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleImageDelete = async () => {
        try {
            setLoading(true);
            const response = await apiService.deleteInstituteImage();
            
            if (response.success) {
                setProfileData(prev => ({ ...prev, profileImage: null }));
                setImagePreview(null);
                setImageFile(null);
                
                // Update all image elements immediately
                updateAllImageElements(null);
                
                alert('Profile image deleted successfully!');
                await loadProfileData(); // Reload profile data to ensure consistency
            } else {
                alert(response.message || 'Failed to delete image');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to delete image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !showModal) {
        return (
            <div className="institute-dashboard">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }



    return (
        <div className="institute-dashboard">
            <div className="institute-dashboard-sidebar">
                <div className="institute-info">
                    <img 
                        src={profileData.profileImage || "/institute-logo-placeholder.png"} 
                        alt="Institute Logo" 
                        className="institute-logo" 
                    />
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
                            <div>
                                <button className="institute-primary-button" onClick={() => openModal('profile')}>Edit Profile</button>
                                {profileData.isLive && (
                                    <span className="institute-live-badge" style={{marginLeft: '10px', padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', borderRadius: '4px'}}>Live</span>
                                )}
                            </div>
                        </div>
                        
                        <div className="institute-profile-details-card">
                            <div className="institute-profile-header">
                                <img 
                                    src={profileData.profileImage || "/institute-logo-placeholder.png"} 
                                    alt="Institute Logo" 
                                    className="institute-profile-logo" 
                                />
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
                                <p className="institute-metric-value">{dashboardStats.totalStudents}</p>
                                <p className="institute-metric-trend positive">Real-time data</p>
                            </div>
                            <div className="institute-metric-card">
                                <h3>Active Courses</h3>
                                <p className="institute-metric-value">{dashboardStats.activeCourses}</p>
                                <p className="institute-metric-trend positive">Real-time data</p>
                            </div>
                            <div className="institute-metric-card">
                                <h3>Placement Rate</h3>
                                <p className="institute-metric-value">{dashboardStats.placementRate}%</p>
                                <p className="institute-metric-trend positive">Real-time data</p>
                            </div>
                            <div className="institute-metric-card">
                                <h3>Industry Partners</h3>
                                <p className="institute-metric-value">{dashboardStats.industryPartners}</p>
                                <p className="institute-metric-trend positive">Static data</p>
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
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Degree</th>
                                    <th>View Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.length > 0 ? students.map(student => (
                                    <tr key={student.instituteStudntsID}>
                                        <td>{student.fullName}</td>
                                        <td>{student.email}</td>
                                        <td>{student.phoneNumber}</td>
                                        <td>{student.degreeName} - {student.specialization}</td>
                                        <td>
                                            <button 
                                                className="institute-table-action" 
                                                onClick={() => handleViewPlacementHistory(student)}
                                                style={{backgroundColor: '#6f42c1', color: 'white', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer'}}
                                                disabled={loading}
                                            >
                                                View Status
                                            </button>
                                        </td>
                                        <td>
                                            <button 
                                                className="institute-table-action view" 
                                                onClick={() => {
                                                    console.log('View Profile clicked for student:', student);
                                                    openModal('viewStudent', student);
                                                }}
                                                style={{backgroundColor: '#17a2b8', color: 'white', marginRight: '5px'}}
                                                disabled={loading}
                                            >
                                                {loading ? 'Loading...' : 'View Profile'}
                                            </button>
                                            <button 
                                                className="institute-table-action edit" 
                                                onClick={() => {
                                                    console.log('Edit clicked for student:', student);
                                                    openModal('editStudent', student);
                                                }}
                                                style={{backgroundColor: '#28a745', color: 'white', marginRight: '5px'}}
                                                disabled={loading}
                                            >
                                                {loading ? 'Loading...' : 'Edit'}
                                            </button>
                                            <button 
                                                className="institute-table-action delete" 
                                                onClick={() => handleDeleteStudent(student.instituteStudntsID, student.fullName)}
                                                style={{backgroundColor: '#dc3545', color: 'white'}}
                                                disabled={loading}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                                            No students added yet. Click "Add New Student" to get started.
                                        </td>
                                    </tr>
                                )}
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
                            {courses.length > 0 ? courses.map(course => (
                                <div className="institute-course-card" key={course.instituteCourseID}>
                                    <h3>{course.name}</h3>
                                    <div className="institute-course-details">
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
                                        <div className="institute-detail-item">
                                            <span className="institute-label">Status:</span>
                                            <span className={`institute-value ${course.isActive ? 'active' : 'inactive'}`}>
                                                {course.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="institute-course-actions">
                                        <button className="institute-action-button">View Details</button>
                                        <button className="institute-action-button">Edit Course</button>
                                    </div>
                                </div>
                            )) : (
                                <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                                    <p>No courses added yet. Click "Add New Course" to get started.</p>
                                </div>
                            )}
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
                                <p className="institute-metric-value">{dashboardStats.placementRate}%</p>
                                <p className="institute-metric-trend positive">Real-time data</p>
                            </div>
                            <div className="institute-metric-card">
                                <h3>Students Placed</h3>
                                <p className="institute-metric-value">{dashboardStats.placedStudents}</p>
                                <p className="institute-metric-trend positive">Real-time data</p>
                            </div>
                            <div className="institute-metric-card">
                                <h3>Avg. Salary Package</h3>
                                <p className="institute-metric-value">{placementSectionData?.averageSalary || `₹${dashboardStats.avgSalaryPackage}L`}</p>
                                <p className="institute-metric-trend positive">Real-time data</p>
                            </div>
                        </div>

                        <div className="institute-tab-section">
                            <h3>Placement Section Management</h3>
                            <form onSubmit={handlePlacementSectionSubmit} className="institute-placement-form">
                                <div className="institute-form-grid">
                                    <div className="institute-form-group">
                                        <label>Average Salary</label>
                                        <input
                                            type="text"
                                            value={placementSectionForm.averageSalary}
                                            onChange={(e) => setPlacementSectionForm({...placementSectionForm, averageSalary: e.target.value})}
                                            placeholder="e.g., 6.5 LPA"
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Highest Package</label>
                                        <input
                                            type="text"
                                            value={placementSectionForm.highestPackage}
                                            onChange={(e) => setPlacementSectionForm({...placementSectionForm, highestPackage: e.target.value})}
                                            placeholder="e.g., 24 LPA"
                                        />
                                    </div>
                                </div>
                                
                                <div className="institute-form-group">
                                    <label>Top Hiring Companies</label>
                                    <div className="institute-companies-section">
                                        {placementSectionForm.topHiringCompanies.map((company, index) => (
                                            <div key={index} className="institute-company-item">
                                                <input
                                                    type="text"
                                                    value={company.name}
                                                    onChange={(e) => {
                                                        const updatedCompanies = [...placementSectionForm.topHiringCompanies];
                                                        updatedCompanies[index].name = e.target.value;
                                                        setPlacementSectionForm({...placementSectionForm, topHiringCompanies: updatedCompanies});
                                                    }}
                                                    placeholder="Company Name"
                                                />
                                                <div className="file-input-container">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                const updatedCompanies = [...placementSectionForm.topHiringCompanies];
                                                                updatedCompanies[index].logo = file;
                                                                updatedCompanies[index].logoPreview = URL.createObjectURL(file);
                                                                setPlacementSectionForm({...placementSectionForm, topHiringCompanies: updatedCompanies});
                                                            }
                                                        }}
                                                    />
                                                    {company.logoPreview && (
                                                        <div className="image-preview-container">
                                                            <img src={company.logoPreview} alt="Company Logo" className="image-preview" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updatedCompanies = [...placementSectionForm.topHiringCompanies];
                                                                    if (updatedCompanies[index].logoPreview) {
                                                                        URL.revokeObjectURL(updatedCompanies[index].logoPreview);
                                                                    }
                                                                    updatedCompanies[index].logo = null;
                                                                    updatedCompanies[index].logoPreview = null;
                                                                    setPlacementSectionForm({...placementSectionForm, topHiringCompanies: updatedCompanies});
                                                                }}
                                                                className="image-remove-btn"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedCompanies = placementSectionForm.topHiringCompanies.filter((_, i) => i !== index);
                                                        if (company.logoPreview) {
                                                            URL.revokeObjectURL(company.logoPreview);
                                                        }
                                                        setPlacementSectionForm({...placementSectionForm, topHiringCompanies: updatedCompanies});
                                                    }}
                                                    className="institute-remove-btn"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPlacementSectionForm({
                                                    ...placementSectionForm,
                                                    topHiringCompanies: [...placementSectionForm.topHiringCompanies, { name: '', logo: null, logoPreview: null }]
                                                });
                                            }}
                                            className="institute-add-btn"
                                        >
                                            Add Company
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="institute-form-group">
                                    <label>Recent Placement Success</label>
                                    <div className="institute-placements-section">
                                        {placementSectionForm.recentPlacementSuccess.map((placement, index) => (
                                            <div key={index} className="institute-placement-item">
                                                <input
                                                    type="text"
                                                    value={placement.name}
                                                    onChange={(e) => {
                                                        const updatedPlacements = [...placementSectionForm.recentPlacementSuccess];
                                                        updatedPlacements[index].name = e.target.value;
                                                        setPlacementSectionForm({...placementSectionForm, recentPlacementSuccess: updatedPlacements});
                                                    }}
                                                    placeholder="Student Name"
                                                />
                                                <input
                                                    type="text"
                                                    value={placement.company || ''}
                                                    onChange={(e) => {
                                                        const updatedPlacements = [...placementSectionForm.recentPlacementSuccess];
                                                        updatedPlacements[index].company = e.target.value;
                                                        setPlacementSectionForm({...placementSectionForm, recentPlacementSuccess: updatedPlacements});
                                                    }}
                                                    placeholder="Company Name"
                                                />
                                                <input
                                                    type="text"
                                                    value={placement.position || ''}
                                                    onChange={(e) => {
                                                        const updatedPlacements = [...placementSectionForm.recentPlacementSuccess];
                                                        updatedPlacements[index].position = e.target.value;
                                                        setPlacementSectionForm({...placementSectionForm, recentPlacementSuccess: updatedPlacements});
                                                    }}
                                                    placeholder="Position"
                                                />
                                                <div className="file-input-container">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                const updatedPlacements = [...placementSectionForm.recentPlacementSuccess];
                                                                updatedPlacements[index].photo = file;
                                                                updatedPlacements[index].photoPreview = URL.createObjectURL(file);
                                                                setPlacementSectionForm({...placementSectionForm, recentPlacementSuccess: updatedPlacements});
                                                            }
                                                        }}
                                                    />
                                                    {placement.photoPreview && (
                                                        <div className="image-preview-container">
                                                            <img src={placement.photoPreview} alt="Student Photo" className="image-preview" />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updatedPlacements = [...placementSectionForm.recentPlacementSuccess];
                                                                    if (updatedPlacements[index].photoPreview) {
                                                                        URL.revokeObjectURL(updatedPlacements[index].photoPreview);
                                                                    }
                                                                    updatedPlacements[index].photo = null;
                                                                    updatedPlacements[index].photoPreview = null;
                                                                    setPlacementSectionForm({...placementSectionForm, recentPlacementSuccess: updatedPlacements});
                                                                }}
                                                                className="image-remove-btn"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedPlacements = placementSectionForm.recentPlacementSuccess.filter((_, i) => i !== index);
                                                        if (placement.photoPreview) {
                                                            URL.revokeObjectURL(placement.photoPreview);
                                                        }
                                                        setPlacementSectionForm({...placementSectionForm, recentPlacementSuccess: updatedPlacements});
                                                    }}
                                                    className="institute-remove-btn"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setPlacementSectionForm({
                                                    ...placementSectionForm,
                                                    recentPlacementSuccess: [...placementSectionForm.recentPlacementSuccess, { name: '', company: '', position: '', photo: null, photoPreview: null }]
                                                });
                                            }}
                                            className="institute-add-btn"
                                        >
                                            Add Student
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="institute-form-buttons">
                                    <button type="submit" className="institute-primary-button" disabled={loading}>
                                        {loading ? 'Updating...' : 'Update Placement Section'}
                                    </button>
                                </div>
                            </form>
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

            {/* Placement History Modal */}
            {showPlacementHistoryModal && selectedStudent && (
                <div className="institute-modal-overlay" onClick={closePlacementHistoryModal}>
                    <div className="institute-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="institute-modal-header">
                            <h2>Placement History - {selectedStudent.fullName}</h2>
                            <button className="institute-close-button" onClick={closePlacementHistoryModal}>×</button>
                        </div>
                        
                        <div className="institute-placement-history-content">
                            {loading ? (
                                <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                                    <p>Loading application history...</p>
                                </div>
                            ) : selectedStudentPlacementHistory.length > 0 ? (
                                <table className="institute-data-table full-width">
                                    <thead>
                                        <tr>
                                            <th>Recruiter</th>
                                            <th>Company Name</th>
                                            <th>Job Title</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedStudentPlacementHistory.map((record, index) => (
                                            <tr key={record.staffinnjob || index}>
                                                <td>{record.recruiterName}</td>
                                                <td>{record.companyName}</td>
                                                <td>{record.jobTitle}</td>
                                                <td>
                                                    <span className={`institute-status-badge ${record.status.toLowerCase().replace(' ', '-')}`}>
                                                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td>{new Date(record.lastUpdated || record.appliedDate).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                                    <p>No job applications found for this student.</p>
                                    <p>The student has not applied to any jobs yet.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="institute-form-buttons">
                            <button 
                                type="button" 
                                className="institute-secondary-button" 
                                onClick={closePlacementHistoryModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for forms */}
            {showModal && (
                <div className="institute-modal-overlay" onClick={closeModal}>
                    <div className="institute-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="institute-modal-header">
                            <h2>
                                {modalType === 'student' && 'Add New Student'}
                                {modalType === 'editStudent' && 'Edit Student'}
                                {modalType === 'viewStudent' && 'Student Profile'}
                                {modalType === 'course' && 'Add New Course'}
                                {modalType === 'event' && 'Add New Event'}
                                {modalType === 'news' && 'Add News'}
                                {modalType === 'profile' && 'Edit Profile'}
                            </h2>
                            <button className="institute-close-button" onClick={closeModal}>×</button>
                        </div>

                        {/* View Student Profile Modal */}
                        {modalType === 'viewStudent' && (
                            <div className="institute-student-profile-view">
                                {loading ? (
                                    <div style={{textAlign: 'center', padding: '40px'}}>
                                        <p>Loading student details...</p>
                                    </div>
                                ) : selectedStudent ? (
                                    <>
                                        <div className="institute-profile-section">
                                            <h4>Basic Details</h4>
                                            <div className="institute-profile-grid">
                                                <div className="institute-profile-item">
                                                    <strong>Full Name:</strong>
                                                    <span>{selectedStudent.fullName || 'Not provided'}</span>
                                                </div>
                                                <div className="institute-profile-item">
                                                    <strong>Email:</strong>
                                                    <span>{selectedStudent.email || 'Not provided'}</span>
                                                </div>
                                                <div className="institute-profile-item">
                                                    <strong>Phone:</strong>
                                                    <span>{selectedStudent.phoneNumber || 'Not provided'}</span>
                                                </div>
                                                <div className="institute-profile-item">
                                                    <strong>Date of Birth:</strong>
                                                    <span>{selectedStudent.dateOfBirth || 'Not provided'}</span>
                                                </div>
                                                <div className="institute-profile-item">
                                                    <strong>Gender:</strong>
                                                    <span>{selectedStudent.gender || 'Not provided'}</span>
                                                </div>
                                                <div className="institute-profile-item">
                                                    <strong>Address:</strong>
                                                    <span>{selectedStudent.address || 'Not provided'}</span>
                                                </div>
                                            </div>
                                        </div>

                                <div className="institute-profile-section">
                                    <h4>Academic Information</h4>
                                    <div className="institute-academic-grid">
                                        <div className="institute-academic-section">
                                            <h5>10th Grade</h5>
                                            <p><strong>Board:</strong> {selectedStudent.tenthGradeDetails || 'Not provided'}</p>
                                            <p><strong>Percentage/Grade:</strong> {selectedStudent.tenthPercentage || 'Not provided'}</p>
                                            <p><strong>Year of Passing:</strong> {selectedStudent.tenthYearOfPassing || 'Not provided'}</p>
                                        </div>
                                        <div className="institute-academic-section">
                                            <h5>12th Grade</h5>
                                            <p><strong>Board:</strong> {selectedStudent.twelfthGradeDetails || 'Not provided'}</p>
                                            <p><strong>Percentage/Grade:</strong> {selectedStudent.twelfthPercentage || 'Not provided'}</p>
                                            <p><strong>Year of Passing:</strong> {selectedStudent.twelfthYearOfPassing || 'Not provided'}</p>
                                        </div>
                                        <div className="institute-academic-section">
                                            <h5>Graduation</h5>
                                            <p><strong>Degree:</strong> {selectedStudent.degreeName || 'Not provided'}</p>
                                            <p><strong>Specialization:</strong> {selectedStudent.specialization || 'Not provided'}</p>
                                            <p><strong>Expected Year:</strong> {selectedStudent.expectedYearOfPassing || 'Not provided'}</p>
                                            <p><strong>Currently Pursuing:</strong> {selectedStudent.currentlyPursuing ? 'Yes' : 'No'}</p>
                                        </div>
                                    </div>
                                </div>

                                        <div className="institute-profile-section">
                                            <h4>Additional Information</h4>
                                            <div className="institute-profile-item">
                                                <strong>Skills:</strong>
                                                <div className="institute-skills-display">
                                                    {selectedStudent.skills && Array.isArray(selectedStudent.skills) && selectedStudent.skills.length > 0 ? 
                                                        selectedStudent.skills.map((skill, index) => (
                                                            <span key={index} className="institute-skill-tag">{skill}</span>
                                                        )) : 
                                                        <span>No skills listed</span>
                                                    }
                                                </div>
                                            </div>
                                            <div className="institute-profile-item">
                                                <strong>Placement Status:</strong>
                                                <span className={`institute-status-badge ${(selectedStudent.placementStatus || 'not-placed').toLowerCase().replace(' ', '-')}`}>
                                                    {selectedStudent.placementStatus || 'Not Placed'}
                                                </span>
                                            </div>
                                        </div>

                                <div className="institute-profile-section">
                                    <h4>Documents</h4>
                                    <div className="institute-documents-grid">
                                        <div className="institute-document-item">
                                            <strong>Profile Photo:</strong>
                                            {selectedStudent.profilePhoto ? (
                                                <a href={selectedStudent.profilePhoto} target="_blank" rel="noopener noreferrer">View Photo</a>
                                            ) : (
                                                <span>Not uploaded</span>
                                            )}
                                        </div>
                                        <div className="institute-document-item">
                                            <strong>Resume:</strong>
                                            {selectedStudent.resume ? (
                                                <a href={selectedStudent.resume} target="_blank" rel="noopener noreferrer">View Resume</a>
                                            ) : (
                                                <span>Not uploaded</span>
                                            )}
                                        </div>
                                        <div className="institute-document-item">
                                            <strong>Certificates:</strong>
                                            {selectedStudent.certificates && selectedStudent.certificates.length > 0 ? (
                                                <div className="institute-certificates-list">
                                                    {selectedStudent.certificates.map((cert, index) => (
                                                        <a key={index} href={cert} target="_blank" rel="noopener noreferrer">
                                                            Certificate {index + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span>No certificates uploaded</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                        <div className="institute-form-buttons">
                                            <button 
                                                type="button" 
                                                className="institute-secondary-button" 
                                                onClick={closeModal}
                                            >
                                                Close
                                            </button>
                                            <button 
                                                type="button" 
                                                className="institute-primary-button" 
                                                onClick={() => {
                                                    closeModal();
                                                    setTimeout(() => openModal('editStudent', selectedStudent), 100);
                                                }}
                                            >
                                                Edit Student
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="institute-modal-error">
                                        <h3>Error Loading Student</h3>
                                        <p>Unable to load student details. Please try again.</p>
                                        <div className="institute-form-buttons">
                                            <button type="button" className="institute-secondary-button" onClick={closeModal}>Close</button>
                                            <button 
                                                type="button" 
                                                className="institute-primary-button" 
                                                onClick={() => {
                                                    closeModal();
                                                    setTimeout(() => loadStudents(), 100);
                                                }}
                                            >
                                                Refresh
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Student Form */}
                        {(modalType === 'student' || modalType === 'editStudent') && (
                            <form onSubmit={handleStudentSubmit} className="institute-modal-form">
                                <h4>Basic Personal Details</h4>
                                <div className="institute-form-grid">
                                    <div className="institute-form-group">
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            value={studentForm.fullName}
                                            onChange={(e) => setStudentForm({...studentForm, fullName: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Email *</label>
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
                                            value={studentForm.phoneNumber}
                                            onChange={(e) => setStudentForm({...studentForm, phoneNumber: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Date of Birth</label>
                                        <input
                                            type="date"
                                            value={studentForm.dateOfBirth}
                                            onChange={(e) => setStudentForm({...studentForm, dateOfBirth: e.target.value})}
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Gender</label>
                                        <select
                                            value={studentForm.gender}
                                            onChange={(e) => setStudentForm({...studentForm, gender: e.target.value})}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
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
                                    <label>Profile Photo</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setStudentFiles({...studentFiles, profilePhoto: e.target.files[0]})}
                                    />
                                </div>
                                
                                <div className="institute-form-group">
                                    <label>Resume (PDF/DOC)</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setStudentFiles({...studentFiles, resume: e.target.files[0]})}
                                    />
                                </div>
                                
                                <div className="institute-form-group">
                                    <label>Certificates (Multiple files)</label>
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        multiple
                                        onChange={(e) => setStudentFiles({...studentFiles, certificates: Array.from(e.target.files)})}
                                    />
                                </div>
                                
                                <h4>Academic Information</h4>
                                <div className="institute-form-grid">
                                    <div className="institute-form-group">
                                        <label>10th Grade Details</label>
                                        <input
                                            type="text"
                                            value={studentForm.tenthGradeDetails}
                                            onChange={(e) => setStudentForm({...studentForm, tenthGradeDetails: e.target.value})}
                                            placeholder="Board name"
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>10th Percentage/Grade</label>
                                        <input
                                            type="text"
                                            value={studentForm.tenthPercentage}
                                            onChange={(e) => setStudentForm({...studentForm, tenthPercentage: e.target.value})}
                                            placeholder="85% or GPA"
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>10th Year of Passing</label>
                                        <input
                                            type="number"
                                            value={studentForm.tenthYearOfPassing}
                                            onChange={(e) => setStudentForm({...studentForm, tenthYearOfPassing: e.target.value})}
                                            placeholder="2019"
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>12th Grade Details</label>
                                        <input
                                            type="text"
                                            value={studentForm.twelfthGradeDetails}
                                            onChange={(e) => setStudentForm({...studentForm, twelfthGradeDetails: e.target.value})}
                                            placeholder="Board name"
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>12th Percentage/Grade</label>
                                        <input
                                            type="text"
                                            value={studentForm.twelfthPercentage}
                                            onChange={(e) => setStudentForm({...studentForm, twelfthPercentage: e.target.value})}
                                            placeholder="88%"
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>12th Year of Passing</label>
                                        <input
                                            type="number"
                                            value={studentForm.twelfthYearOfPassing}
                                            onChange={(e) => setStudentForm({...studentForm, twelfthYearOfPassing: e.target.value})}
                                            placeholder="2021"
                                        />
                                    </div>
                                </div>
                                
                                <h4>Graduation Details</h4>
                                <div className="institute-form-grid">
                                    <div className="institute-form-group">
                                        <label>Degree Name</label>
                                        <select
                                            value={studentForm.degreeName}
                                            onChange={(e) => setStudentForm({...studentForm, degreeName: e.target.value})}
                                        >
                                            <option value="">Select Degree</option>
                                            <option value="B.Tech">B.Tech</option>
                                            <option value="BBA">BBA</option>
                                            <option value="BCA">BCA</option>
                                            <option value="B.Com">B.Com</option>
                                            <option value="BA">BA</option>
                                            <option value="BSc">BSc</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Specialization/Major</label>
                                        <input
                                            type="text"
                                            value={studentForm.specialization}
                                            onChange={(e) => setStudentForm({...studentForm, specialization: e.target.value})}
                                            placeholder="Computer Science"
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Expected Year of Passing</label>
                                        <input
                                            type="number"
                                            value={studentForm.expectedYearOfPassing}
                                            onChange={(e) => setStudentForm({...studentForm, expectedYearOfPassing: e.target.value})}
                                            placeholder="2025"
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={studentForm.currentlyPursuing}
                                                onChange={(e) => setStudentForm({...studentForm, currentlyPursuing: e.target.checked})}
                                            />
                                            Currently Pursuing
                                        </label>
                                    </div>
                                </div>
                                
                                <h4>Additional Information</h4>
                                <div className="institute-form-group">
                                    <label>Skills</label>
                                    <div className="institute-skills-input-container">
                                        <div className="institute-skills-tags">
                                            {Array.isArray(studentForm.skills) && studentForm.skills.map((skill, index) => (
                                                <span key={index} className="institute-skill-tag-input">
                                                    {skill}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newSkills = studentForm.skills.filter((_, i) => i !== index);
                                                            setStudentForm({...studentForm, skills: newSkills});
                                                        }}
                                                        className="institute-remove-skill-btn"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Type skill and press Enter"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const skill = e.target.value.trim();
                                                    if (skill && !studentForm.skills.includes(skill)) {
                                                        setStudentForm({...studentForm, skills: [...studentForm.skills, skill]});
                                                        e.target.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                
                                <div className="institute-form-buttons">
                                    <button type="submit" className="institute-primary-button" disabled={loading}>
                                        {loading ? (editingStudentId ? 'Updating...' : 'Adding...') : (editingStudentId ? 'Update Student' : 'Add Student')}
                                    </button>
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
                                <div className="institute-form-group">
                                    <label>Profile Image</label>
                                    <div className={`image-upload-container ${loading ? 'image-loading' : ''}`}>
                                        <div className="image-preview-section">
                                            {(imagePreview || profileData.profileImage) && (
                                                <div className="image-preview">
                                                    <img 
                                                        src={imagePreview || profileData.profileImage} 
                                                        alt="Profile Preview" 
                                                        style={{
                                                            width: '150px', 
                                                            height: '150px', 
                                                            objectFit: 'cover', 
                                                            borderRadius: '8px',
                                                            display: 'block'
                                                        }} 
                                                        onError={(e) => {
                                                            console.log('Image load error:', e.target.src);
                                                            e.target.style.display = 'none';
                                                        }}
                                                        onLoad={() => console.log('Image loaded successfully:', imagePreview || profileData.profileImage)}
                                                    />
                                                    <button type="button" onClick={handleImageDelete} className="delete-image-btn" disabled={loading}>×</button>
                                                </div>
                                            )}
                                            {!(imagePreview || profileData.profileImage) && (
                                                <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>
                                                    No image selected
                                                </div>
                                            )}
                                        </div>
                                        <div className="image-upload-controls">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                                onChange={handleImageChange}
                                                disabled={loading}
                                                style={{marginBottom: '10px'}}
                                            />
                                            {imageFile && (
                                                <p style={{color: '#27ae60', fontSize: '14px', margin: '5px 0', fontWeight: '500'}}>✓ New image selected. Click "Update and Go Live" to save changes.</p>
                                            )}
                                            {loading && (
                                                <p style={{color: '#3498db', fontSize: '14px', margin: '5px 0'}}>Processing...</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="institute-form-grid">
                                    <div className="institute-form-group">
                                        <label>Institute Name *</label>
                                        <input
                                            type="text"
                                            value={profileData.instituteName}
                                            onChange={(e) => setProfileData(prev => ({...prev, instituteName: e.target.value}))}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Phone Number *</label>
                                        <input
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData(prev => ({...prev, phone: e.target.value}))}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Email Address *</label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData(prev => ({...prev, email: e.target.value}))}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Website</label>
                                        <input
                                            type="url"
                                            value={profileData.website}
                                            onChange={(e) => setProfileData(prev => ({...prev, website: e.target.value}))}
                                        />
                                    </div>
                                </div>
                                <div className="institute-form-group">
                                    <label>Address *</label>
                                    <textarea
                                        value={profileData.address}
                                        onChange={(e) => setProfileData(prev => ({...prev, address: e.target.value}))}
                                        rows="3"
                                        required
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Experience</label>
                                    <input
                                        type="text"
                                        value={profileData.experience}
                                        onChange={(e) => setProfileData(prev => ({...prev, experience: e.target.value}))}
                                        placeholder="e.g., 25+ Years of Excellence in Education"
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={profileData.description}
                                        onChange={(e) => setProfileData(prev => ({...prev, description: e.target.value}))}
                                        rows="3"
                                        placeholder="Brief description of your institute"
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Established Year</label>
                                    <input
                                        type="number"
                                        value={profileData.establishedYear}
                                        onChange={(e) => setProfileData(prev => ({...prev, establishedYear: e.target.value}))}
                                        placeholder="e.g., 1995"
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Badges</label>
                                    <div className="badges-input-container">
                                        <div className="badge-input-row">
                                            <input
                                                type="text"
                                                value={currentBadge}
                                                onChange={(e) => setCurrentBadge(e.target.value)}
                                                placeholder="Enter a badge"
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (currentBadge.trim() && !profileData.badges.includes(currentBadge.trim())) {
                                                            setProfileData(prev => ({...prev, badges: [...prev.badges, currentBadge.trim()]}));
                                                            setCurrentBadge('');
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (currentBadge.trim() && !profileData.badges.includes(currentBadge.trim())) {
                                                        setProfileData(prev => ({...prev, badges: [...prev.badges, currentBadge.trim()]}));
                                                        setCurrentBadge('');
                                                    }
                                                }}
                                                className="add-badge-btn"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="badges-display">
                                            {profileData.badges.map((badge, index) => (
                                                <span key={index} className="badge-pill">
                                                    {badge}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setProfileData(prev => ({
                                                                ...prev,
                                                                badges: prev.badges.filter((_, i) => i !== index)
                                                            }));
                                                        }}
                                                        className="remove-badge-btn"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="institute-form-buttons">
                                    <button type="submit" className="institute-primary-button">Update and Go Live</button>
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