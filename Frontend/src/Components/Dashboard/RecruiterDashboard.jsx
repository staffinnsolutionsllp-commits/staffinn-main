/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import * as XLSX from 'xlsx';
import './RecruiterDashboard.css';
import './ProfileModal.css';
import '../Pages/StaffPage.css';
import './HiringStyles.css';
import './NewsCardStyles.css';

import apiService from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import useProfilePhotoSync from '../../hooks/useProfilePhotoSync';
import HiddenUser from '../HiddenUser/HiddenUser';
import GovernmentSchemes from './GovernmentSchemes';
import ContactHistory from '../Messages/ContactHistory';
import './HiddenNotification.css';
import CampusInviteEnvelope from './CampusInviteEnvelope';
import InstituteResponseSection from './InstituteResponseSection';
import { FiMail } from 'react-icons/fi';

const RecruiterDashboard = () => {
    const { currentUser } = useContext(AuthContext);
    // Profile photo state
    const [profilePhoto, setProfilePhoto] = useState(null);
    const { updateAllImages, notifyProfilePhotoUpdated } = useProfilePhotoSync(profilePhoto, 'recruiter');
    const [activeTab, setActiveTab] = useState('overview');
    const [isMyHiringsOpen, setIsMyHiringsOpen] = useState(false);
    const [isInstitutesOpen, setIsInstitutesOpen] = useState(false);
    
    // Handle URL tab parameter and hash
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        const hash = window.location.hash.replace('#', '');
        
        // Check for hash-based navigation (e.g., #job-management)
        if (hash === 'job-management') {
            setActiveTab('jobs');
            setIsMyHiringsOpen(true);
        } else if (tabParam) {
            setActiveTab(tabParam);
            // Open My Hirings dropdown if tab is jobs, candidates, or hiring
            if (tabParam === 'jobs' || tabParam === 'candidates' || tabParam === 'hiring') {
                setIsMyHiringsOpen(true);
            }
            // Open Institutes dropdown if tab is institutes or campus-requests
            if (tabParam === 'institutes' || tabParam === 'campus-requests' || tabParam === 'institute-response') {
                setIsInstitutesOpen(true);
            }
        }
    }, []);
    const [showJobForm, setShowJobForm] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Hidden user state
    const [isHidden, setIsHidden] = useState(false);
    const [showHiddenModal, setShowHiddenModal] = useState(false);
    
    // Mobile sidebar state
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Job form state
    const [jobForm, setJobForm] = useState({
        title: '',
        jobType: 'Full-time',
        salary: '',
        experience: '',
        location: '',
        description: '',
        skills: '',
        department: '',
        graduationYear: '',
        status: 'Active',
        postedDate: new Date().toISOString().split('T')[0]
    });

    // Profile form state - Updated to match backend expectations
    const [profileForm, setProfileForm] = useState({
        companyName: '',
        recruiterName: '',
        designation: '',
        industry: '',
        location: '',
        experience: '',
        website: '',
        phone: '',
        gstNumber: '',
        panNumber: '',
        linkedin: '',
        twitter: '',
        instagram: '',
        facebook: '',
        youtube: '',
        github: '',
        awards: [],
        companyDescription: 'A leading technology company providing innovative solutions.',
        perks: [
            { title: 'Health Insurance', description: 'Comprehensive health coverage for employees and their families', image: '' },
            { title: 'Work From Home', description: 'Flexible remote work options available', image: '' },
            { title: 'Learning Budget', description: 'Annual budget for professional development and courses', image: '' },
            { title: 'Performance Bonus', description: 'Quarterly performance-based incentives', image: '' }
        ],
        officeImages: [],
        officeLocations: [],   // [{id, locationName, unitCount, images: [], tempImages: []}]
        hiringSteps: [
            { title: 'Online Application', description: 'Submit your resume and complete a brief questionnaire.' },
            { title: 'HR Screening Call', description: '30-minute call to discuss your background and expectations.' },
            { title: 'Technical Assessment', description: 'Complete a skill-based assessment relevant to the position.' },
            { title: 'Final Round & Offer', description: 'Discussion with management, followed by an offer if selected.' }
        ],
        interviewQuestions: [
            'Tell us about yourself and your experience.',
            'Why do you want to work with our company?',
            'What are your salary expectations?',
            'Do you have any questions for us?'
        ]
    });

    // Real job postings from backend
    const [jobPostings, setJobPostings] = useState([]);

    // Filter states
    const [jobFilters, setJobFilters] = useState({
        search: '',
        status: 'all',
        department: 'all'
    });

    const [candidateFilters, setCandidateFilters] = useState({
        search: '',
        status: 'all',
        jobId: 'all'
    });

    // Real-time chart data with default values
    const [selectedYear, setSelectedYear] = useState(currentUser?.createdAt ? new Date(currentUser.createdAt).getFullYear() : new Date().getFullYear());
    const [selectedMonthRange, setSelectedMonthRange] = useState({ start: 0, end: 5 });
    
    // Generate real-time chart data
    const getChartData = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = [];
        const candidatesList = candidates || [];
        
        for (let i = selectedMonthRange.start; i <= selectedMonthRange.end && i < 12; i++) {
            const monthApplications = candidatesList.filter(c => {
                if (!c.date) return false;
                const appDate = new Date(c.date);
                return appDate.getMonth() === i;
            });
            
            const applications = monthApplications.length;
            const hired = monthApplications.filter(c => c.status === 'Hired').length;
            
            data.push({
                name: months[i],
                applications,
                hired
            });
        }
        
        return data.length > 0 ? data : [{ name: 'Jan', applications: 0, hired: 0 }];
    };
    
    // Generate hiring funnel data
    const getHiringFunnelData = () => {
        const candidatesList = candidates || [];
        const totalApplications = candidatesList.length;
        const totalHired = candidatesList.filter(c => c.status === 'Hired').length;
        
        return [
            { name: 'Applied', value: totalApplications || 0 },
            { name: 'Hired', value: totalHired || 0 }
        ];
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    // Real candidates from applications
    const [candidates, setCandidates] = useState([]);
    const [candidatesLoading, setCandidatesLoading] = useState(false);
    
    // Applied institutes state
    const [appliedInstitutes, setAppliedInstitutes] = useState([]);
    const [institutesLoading, setInstitutesLoading] = useState(false);
    const [selectedInstituteStudents, setSelectedInstituteStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [showStudentsModal, setShowStudentsModal] = useState(false);
    const [selectedInstitute, setSelectedInstitute] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);
    const [selectedJobFilter, setSelectedJobFilter] = useState('all');
    const [hiringHistory, setHiringHistory] = useState([]);          // institute modal only
    const [recruiterHiringHistory, setRecruiterHiringHistory] = useState([]); // My Hirings tab
    const [showHiringHistoryModal, setShowHiringHistoryModal] = useState(false);
    // Removed processedStudents state as backend now handles filtering
    
    // Campus requests state
    const [campusRequests, setCampusRequests] = useState([]);
    const [campusRequestsLoading, setCampusRequestsLoading] = useState(false);
    const [updatingInvite, setUpdatingInvite] = useState(null); // requestId being updated
    const [newInviteNotification, setNewInviteNotification] = useState(false);
    
    // Filter institutes based on selected job
    const filteredInstitutes = appliedInstitutes.filter(institute => {
        if (selectedJobFilter === 'all') return true;
        return institute.appliedJobs.some(job => job.jobId === selectedJobFilter);
    });


    
    // Hired candidates
    const [hiredCandidates, setHiredCandidates] = useState([]);
    
    // Profile modal state
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedCandidateProfile, setSelectedCandidateProfile] = useState(null);
    
    // Profile photo upload state
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [tempProfilePhoto, setTempProfilePhoto] = useState(null);
    
    // Office images upload state
    const [uploadingOfficeImage, setUploadingOfficeImage] = useState(false);
    const [tempOfficeImages, setTempOfficeImages] = useState([]);
    // Office location image upload state: { locationId: boolean }
    const [uploadingLocationImage, setUploadingLocationImage] = useState({});
    
    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: ''
    });
    
    // News state - always start empty and load from database
    const [newsItems, setNewsItems] = useState([]);
    const [showNewsForm, setShowNewsForm] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [newsLoading, setNewsLoading] = useState(false);
    const [showNewsView, setShowNewsView] = useState(false);
    const [viewingNews, setViewingNews] = useState(null);
    const [newsForm, setNewsForm] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        venue: '',
        expectedParticipants: '',
        details: '',
        verified: false,
        bannerImage: null
    });
    

    
    // Clear any invalid profile photo on component mount
    useEffect(() => {
        if (profilePhoto && typeof profilePhoto === 'string' && !profilePhoto.startsWith('http')) {
            console.log('Clearing invalid profile photo:', profilePhoto);
            setProfilePhoto(null);
        }
    }, [profilePhoto]);
    
    // Initialize with clean state on mount
    useEffect(() => {
        setProfilePhoto(null);
    }, []);
    
    // Real-time stats
    const [dashboardStats, setDashboardStats] = useState({ applications: 0, hires: 0, followers: 0, campusInvites: 0 });

    // Load recruiter profile and jobs on component mount
    useEffect(() => {
        if (currentUser && currentUser.role === 'recruiter') {
            loadRecruiterProfile();
            loadJobPostings();
            loadCandidates(candidateFilters);
            loadDashboardStats();
            loadAppliedInstitutes();
            loadHiringHistory();
            loadRecruiterNews();
            loadCampusRequests();
            setupSocketConnection();
        }
    }, [currentUser]);
    
    // Setup socket connection for real-time updates
    const setupSocketConnection = () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) return;

            // Use Socket.io client
            const socket = window.io ? window.io('http://localhost:4001', {
                auth: { token }
            }) : null;

            if (!socket) {
                console.warn('Socket.io client not available, using fallback');
                return;
            }

            socket.on('connect', () => {
                console.log('Socket connected for visibility updates');
                socket.emit('check_visibility');
                // Join recruiter room for campus invite notifications
                if (currentUser?.userId) {
                    socket.emit('join-recruiter-room', currentUser.userId);
                }
            });

            socket.on('visibility_update', (visibilityData) => {
                handleVisibilityUpdate(visibilityData);
            });

            // Real-time campus invite notification
            socket.on('campus-invite-received', (data) => {
                console.log('📬 New campus invite received:', data);
                loadCampusRequests();
                // Show a brief notification
                setNewInviteNotification(true);
                setTimeout(() => setNewInviteNotification(false), 6000);
            });

            socket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });

            return () => {
                if (socket) socket.disconnect();
            };
        } catch (error) {
            console.error('Error setting up socket connection:', error);
        }
    };
    
    // Handle visibility update from socket
    const handleVisibilityUpdate = (visibilityData) => {
        console.log('Received visibility update:', visibilityData);
        setIsHidden(visibilityData.isHidden);
        if (visibilityData.isHidden) {
            setShowHiddenModal(true);
        } else {
            // User is no longer hidden, hide the modal and notification
            setShowHiddenModal(false);
        }
    };
    
    // Reload news when switching to news tab
    useEffect(() => {
        if (activeTab === 'news' && currentUser && currentUser.role === 'recruiter') {
            loadRecruiterNews();
        }
    }, [activeTab, currentUser]);
    
    // Load dashboard stats
    const loadDashboardStats = async () => {
        try {
            const response = await apiService.getRecruiterStats();
            if (response.success) {
                setDashboardStats(response.data);
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    };
    
    // Load candidates who applied for jobs with search and filter support
    const loadCandidates = async (searchFilters = {}) => {
        try {
            setCandidatesLoading(true);
            const response = await apiService.getRecruiterCandidates(searchFilters);
            
            if (response.success) {
                setCandidates(response.data || []);
            }
        } catch (error) {
            console.error('Error loading candidates:', error);
        } finally {
            setCandidatesLoading(false);
        }
    };
    
    // Load applied institutes
    const loadAppliedInstitutes = async () => {
        try {
            setInstitutesLoading(true);
            const response = await apiService.getAppliedInstitutes();
            
            if (response.success) {
                setAppliedInstitutes(response.data || []);
            }
        } catch (error) {
            console.error('Error loading applied institutes:', error);
        } finally {
            setInstitutesLoading(false);
        }
    };
    
    // Load students of an institute
    const loadInstituteStudents = async (instituteId) => {
        try {
            setStudentsLoading(true);
            const response = await apiService.getInstituteStudents(instituteId);
            
            if (response.success) {
                setSelectedInstituteStudents(response.data || []);
            } else {
                alert('Failed to load students: ' + response.message);
            }
        } catch (error) {
            console.error('Error loading institute students:', error);
            alert('Failed to load students');
        } finally {
            setStudentsLoading(false);
        }
    };
    
    // Handle view students for specific job
    const handleViewJobStudents = async (institute, job) => {
        setSelectedInstitute(institute);
        setSelectedJob(job);
        setShowStudentsModal(true);
        await loadJobApplicationStudents(institute.instituteId, job.jobId);
    };
    
    // Load students for specific job application
    const loadJobApplicationStudents = async (instituteId, jobId) => {
        try {
            setStudentsLoading(true);
            const response = await apiService.getJobApplicationStudents(instituteId, jobId);
            
            if (response.success) {
                // Backend now filters out hired/rejected students automatically
                setSelectedInstituteStudents(response.data || []);
            } else {
                alert('Failed to load students: ' + response.message);
            }
        } catch (error) {
            console.error('Error loading job application students:', error);
            alert('Failed to load students');
        } finally {
            setStudentsLoading(false);
        }
    };
    
    // Handle view institute details
    const handleViewInstituteDetails = (institute) => {
        // For now, show basic info in alert - can be enhanced to show modal
        alert(`Institute: ${institute.instituteName}\nEmail: ${institute.email}\nPhone: ${institute.phone || 'Not provided'}\nRegistration: ${institute.registrationNumber || 'Not provided'}\nTotal Applications: ${institute.totalApplications}`);
    };
    
    // Handle view student profile - use consistent modal
    const [showStudentProfileModal, setShowStudentProfileModal] = useState(false);
    const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
    
    const handleViewStudentProfile = (student) => {
        setSelectedStudentProfile(student);
        setShowStudentProfileModal(true);
    };
    
    const closeStudentProfileModal = () => {
        setShowStudentProfileModal(false);
        setSelectedStudentProfile(null);
    };

    // Load recruiter profile from backend
    const loadRecruiterProfile = async () => {
        try {
            const response = await apiService.getRecruiterProfile();
            if (response.success && response.data) {
                const profile = response.data;
                
                // Check if recruiter is hidden
                setIsHidden(!profile.isVisible);
                
                // Default values for dashboard editing
                const defaultPerks = [
                    { title: 'Health Insurance', description: 'Comprehensive health coverage for employees and their families', image: '' },
                    { title: 'Work From Home', description: 'Flexible remote work options available', image: '' },
                    { title: 'Learning Budget', description: 'Annual budget for professional development and courses', image: '' },
                    { title: 'Performance Bonus', description: 'Quarterly performance-based incentives', image: '' }
                ];
                
                const defaultHiringSteps = [
                    { title: 'Online Application', description: 'Submit your resume and complete a brief questionnaire.' },
                    { title: 'HR Screening Call', description: '30-minute call to discuss your background and expectations.' },
                    { title: 'Technical Assessment', description: 'Complete a skill-based assessment relevant to the position.' },
                    { title: 'Final Round & Offer', description: 'Discussion with management, followed by an offer if selected.' }
                ];
                
                const defaultQuestions = [
                    'Tell us about yourself and your experience.',
                    'Why do you want to work with our company?',
                    'What are your salary expectations?',
                    'Do you have any questions for us?'
                ];
                
                setProfileForm({
                    companyName: profile.name || profile.companyName || '',
                    recruiterName: profile.recruiterName || '',
                    designation: profile.designation || '',
                    industry: profile.industry || '',
                    location: profile.location || '',
                    pincode: profile.pincode || '',
                    experience: profile.experience || '',
                    website: profile.website || '',
                    phone: profile.phone || '',
                    gstNumber: profile.gstNumber || '',
                    panNumber: profile.panNumber || '',
                    linkedin: profile.linkedin || '',
                    twitter: profile.twitter || '',
                    instagram: profile.instagram || '',
                    facebook: profile.facebook || '',
                    youtube: profile.youtube || '',
                    github: profile.github || '',
                    awards: profile.awards || [],
                    companyDescription: profile.companyDescription || 'A leading technology company providing innovative solutions.',
                    // Always show default values in dashboard for editing, regardless of profile state
                    perks: (profile.perks && profile.perks.length > 0) ? profile.perks : defaultPerks,
                    hiringSteps: (profile.hiringSteps && profile.hiringSteps.length > 0) ? profile.hiringSteps : defaultHiringSteps,
                    interviewQuestions: (profile.interviewQuestions && profile.interviewQuestions.length > 0) ? profile.interviewQuestions : defaultQuestions,
                    officeImages: (profile.officeImages || []).map(img => {
                        if (!img || typeof img !== 'string') return null;
                        if (img.startsWith('http://') || img.startsWith('https://')) return img;
                        const backendUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4001';
                        return `${backendUrl}${img.startsWith('/') ? img : '/' + img}`;
                    }).filter(Boolean),
                    officeLocations: (profile.officeLocations || []).map(loc => ({
                        ...loc,
                        images: (loc.images || []).map(img => {
                            if (!img || typeof img !== 'string') return null;
                            if (img.startsWith('http://') || img.startsWith('https://')) return img;
                            const backendUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4001';
                            return `${backendUrl}${img.startsWith('/') ? img : '/' + img}`;
                        }).filter(Boolean),
                        tempImages: []  // always reset temp on load
                    }))
                });
                // Set profile photo with proper URL handling
                if (profile.profilePhoto) {
                    const fullPhotoUrl = profile.profilePhoto.startsWith('http://') || profile.profilePhoto.startsWith('https://')
                        ? profile.profilePhoto
                        : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4001'}${profile.profilePhoto.startsWith('/') ? profile.profilePhoto : '/' + profile.profilePhoto}`;
                    setProfilePhoto(fullPhotoUrl);
                    // Update all images immediately when profile loads
                    updateAllImages(fullPhotoUrl);
                    console.log('Loaded and synced profile photo:', fullPhotoUrl);
                } else {
                    setProfilePhoto(null);
                    console.log('No profile photo found');
                }
                
                console.log('Loaded profile with office images:', profile.officeImages?.length || 0, 'images');
            }
        } catch (error) {
            console.error('Error loading recruiter profile:', error);
        }
    };
    
    // Handle profile photo upload
    const handlePhotoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('File size must be less than 5MB.');
            return;
        }
        
        setUploadingPhoto(true);
        
        try {
            const response = await apiService.uploadRecruiterPhoto(file);
            
            if (response.success && response.data && response.data.profilePhoto) {
                const newProfilePhoto = response.data.profilePhoto;
                // Convert relative path to full URL if needed
                const backendUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4001';
                const fullPhotoUrl = newProfilePhoto.startsWith('http://') || newProfilePhoto.startsWith('https://') ? newProfilePhoto : `${backendUrl}${newProfilePhoto.startsWith('/') ? newProfilePhoto : '/' + newProfilePhoto}`;
                
                // Store photo temporarily - don't update everywhere yet
                setTempProfilePhoto(fullPhotoUrl);
                console.log('Temp profile photo set:', fullPhotoUrl);
                console.log('Photo upload response data:', response.data);
                alert('Profile photo uploaded! Click "Update Profile & Go Live" to apply changes.');
            } else {
                console.error('Upload response:', response);
                alert('Failed to upload photo: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload photo');
        } finally {
            // Always reset uploading state
            setUploadingPhoto(false);
            // Clear the file input
            event.target.value = '';
        }
    };
    
    // Handle office image upload
    const handleOfficeImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        setUploadingOfficeImage(true);
        
        try {
            const response = await apiService.uploadRecruiterPhoto(file);
            
            if (response.success && response.data && response.data.profilePhoto) {
                const newImageUrl = response.data.profilePhoto;
                // Convert relative path to full URL if needed
                const backendUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4001';
                const fullImageUrl = newImageUrl.startsWith('http://') || newImageUrl.startsWith('https://') ? newImageUrl : `${backendUrl}${newImageUrl.startsWith('/') ? newImageUrl : '/' + newImageUrl}`;
                
                // Store image temporarily - don't update everywhere yet
                setTempOfficeImages(prev => [...prev, fullImageUrl]);
                console.log('Temp office image added:', fullImageUrl);
                console.log('Total temp office images:', tempOfficeImages.length + 1);
                
                alert('Office image uploaded! Click "Update Profile & Go Live" to apply changes.');
            } else {
                console.error('Upload response:', response);
                alert('Failed to upload image: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error uploading office image:', error);
            alert('Failed to upload office image');
        } finally {
            // Always reset uploading state
            setUploadingOfficeImage(false);
            // Clear the file input
            event.target.value = '';
        }
    };
    
    // Handle office image deletion
    const handleDeleteOfficeImage = (imageUrl, index, isTemp = false) => {
        if (window.confirm('Are you sure you want to delete this image?')) {
            if (isTemp) {
                const updatedTempImages = [...tempOfficeImages];
                updatedTempImages.splice(index, 1);
                setTempOfficeImages(updatedTempImages);
            } else {
                const updatedImages = [...profileForm.officeImages];
                updatedImages.splice(index, 1);
                setProfileForm(prev => ({ ...prev, officeImages: updatedImages }));
            }
        }
    };

    // ── Office Locations handlers ──────────────────────────────────────────

    const addOfficeLocation = () => {
        const newLoc = {
            id: `loc_${Date.now()}`,
            locationName: '',
            unitCount: 1,
            images: [],
            tempImages: []
        };
        setProfileForm(prev => ({
            ...prev,
            officeLocations: [...(prev.officeLocations || []), newLoc]
        }));
    };

    const removeOfficeLocation = (locId) => {
        if (window.confirm('Remove this office location?')) {
            setProfileForm(prev => ({
                ...prev,
                officeLocations: (prev.officeLocations || []).filter(l => l.id !== locId)
            }));
        }
    };

    const updateOfficeLocation = (locId, field, value) => {
        setProfileForm(prev => ({
            ...prev,
            officeLocations: (prev.officeLocations || []).map(l =>
                l.id === locId ? { ...l, [field]: value } : l
            )
        }));
    };

    const handleLocationImageUpload = async (event, locId) => {
        const file = event.target.files[0];
        if (!file) return;
        setUploadingLocationImage(prev => ({ ...prev, [locId]: true }));
        try {
            console.log('📸 Uploading location image to S3...');
            const response = await apiService.uploadOfficeImage(file);
            console.log('📸 Upload response:', response);
            if (response.success && response.data && response.data.imageUrl) {
                const url = response.data.imageUrl;
                console.log('📸 Image URL from S3:', url);
                setProfileForm(prev => ({
                    ...prev,
                    officeLocations: (prev.officeLocations || []).map(l =>
                        l.id === locId
                            ? { ...l, tempImages: [...(l.tempImages || []), url] }
                            : l
                    )
                }));
            } else {
                console.error('📸 Upload failed:', response);
                alert('Failed to upload image: ' + (response.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Location image upload error:', err);
            alert('Failed to upload image');
        } finally {
            setUploadingLocationImage(prev => ({ ...prev, [locId]: false }));
            event.target.value = '';
        }
    };

    const removeLocationImage = (locId, imgIndex, isTemp = false) => {
        if (window.confirm('Remove this image?')) {
            setProfileForm(prev => ({
                ...prev,
                officeLocations: (prev.officeLocations || []).map(l => {
                    if (l.id !== locId) return l;
                    if (isTemp) {
                        const t = [...(l.tempImages || [])];
                        t.splice(imgIndex, 1);
                        return { ...l, tempImages: t };
                    } else {
                        const imgs = [...(l.images || [])];
                        imgs.splice(imgIndex, 1);
                        return { ...l, images: imgs };
                    }
                })
            }));
        }
    };

    // Load job postings from backend
    const loadJobPostings = async () => {
        try {
            const response = await apiService.getRecruiterJobs();
            if (response.success && response.data) {
                setJobPostings(response.data);
            }
        } catch (error) {
            console.error('Error loading job postings:', error);
        }
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setJobForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle profile input changes
    const handleProfileInputChange = (e) => {
        const { name, value } = e.target;
        setProfileForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // Handle password input changes
    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
    };
    

    
    // Handle change password
    const handleChangePassword = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword) {
            alert('Please enter both current and new password');
            return;
        }
        
        if (passwordForm.newPassword.length < 6) {
            alert('New password must be at least 6 characters long');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await apiService.changePassword(
                passwordForm.currentPassword,
                passwordForm.newPassword
            );
            
            if (response.success) {
                alert('Password changed successfully!');
                setPasswordForm({ currentPassword: '', newPassword: '' });
            } else {
                alert('Failed to change password: ' + response.message);
            }
        } catch (error) {
            console.error('Change password error:', error);
            alert('Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    // Handle job filter changes
    const handleJobFilterChange = (e) => {
        const { name, value } = e.target;
        setJobFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Debounce function for search input
    const debounce = useCallback((func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
    }, []);

    // Debounced search function
    const debouncedSearch = useCallback(
        debounce((filters) => {
            loadCandidates(filters);
        }, 300),
        []
    );

    // Handle candidate filter changes with real-time search
    const handleCandidateFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = {
            ...candidateFilters,
            [name]: value
        };
        setCandidateFilters(newFilters);
        
        // Use debounced search for text input, immediate search for dropdowns
        if (name === 'search') {
            debouncedSearch(newFilters);
        } else {
            loadCandidates(newFilters);
        }
    };

    // Filter jobs based on search and filters
    const filteredJobs = jobPostings.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(jobFilters.search.toLowerCase()) ||
                             job.department.toLowerCase().includes(jobFilters.search.toLowerCase()) ||
                             job.location.toLowerCase().includes(jobFilters.search.toLowerCase());
        
        const matchesStatus = jobFilters.status === 'all' || job.status.toLowerCase() === jobFilters.status;
        const matchesDepartment = jobFilters.department === 'all' || job.department.toLowerCase() === jobFilters.department;

        return matchesSearch && matchesStatus && matchesDepartment;
    });

    // Use candidates directly since filtering is done on the server side
    const filteredCandidates = candidates;

    // Handle hiring candidate directly
    const handleHireCandidate = async (candidate) => {
        if (window.confirm(`Are you sure you want to hire ${candidate.name}?`)) {
            try {
                setLoading(true);
                const response = await apiService.updateCandidateStatus(
                    candidate.staffId, 
                    candidate.applicationId, 
                    'Hired'
                );
                
                if (response.success) {
                    // Add to hired candidates (local optimistic state)
                    setHiredCandidates(prev => [...prev, {
                        id: candidate.id,
                        name: candidate.name,
                        position: candidate.position,
                        hireDate: new Date().toISOString().split('T')[0],
                        staffId: candidate.staffId
                    }]);
                    
                    // Reload candidates list to reflect updated status
                    await loadCandidates(candidateFilters);
                    
                    // Reload recruiter hiring history so Hiring History tab shows this hire
                    await loadHiringHistory();
                    
                    // Reload dashboard stats to update Hires count
                    await loadDashboardStats();
                    
                    alert(`${candidate.name} has been hired successfully!`);
                } else {
                    alert('Failed to hire candidate: ' + response.message);
                }
            } catch (error) {
                console.error('Error hiring candidate:', error);
                alert('Failed to hire candidate');
            } finally {
                setLoading(false);
            }
        }
    };
    
    // Handle rejecting candidate
    const handleRejectCandidate = async (candidate) => {
        if (window.confirm(`Are you sure you want to reject ${candidate.name}?`)) {
            try {
                setLoading(true);
                const response = await apiService.updateCandidateStatus(
                    candidate.staffId, 
                    candidate.applicationId, 
                    'Rejected'
                );
                
                if (response.success) {
                    // Reload candidates to update list
                    await loadCandidates(candidateFilters);
                    
                    alert(`${candidate.name} has been rejected.`);
                } else {
                    alert('Failed to reject candidate: ' + response.message);
                }
            } catch (error) {
                console.error('Error rejecting candidate:', error);
                alert('Failed to reject candidate');
            } finally {
                setLoading(false);
            }
        }
    };
    
    // Handle viewing candidate profile
    const handleViewProfile = async (candidate) => {
        try {
            // Get full staff profile data
            const response = await apiService.getStaffProfileById(candidate.staffId);
            
            if (response.success) {
                const detailedProfile = response.data;
                setSelectedCandidateProfile({
                    ...detailedProfile,
                    name: detailedProfile.fullName,
                    profession: detailedProfile.skills?.split(',')[0] || 'Professional',
                    photo: detailedProfile.profilePhoto,
                    skillsArray: detailedProfile.skills ? detailedProfile.skills.split(',').map(s => s.trim()) : [],
                    experienceLevel: detailedProfile.experience || 'Not specified',
                    phone: detailedProfile.phone || '+91-XXXXXXXXXX',
                    email: detailedProfile.email,
                    resume: detailedProfile.resumeUrl,
                    certificates: detailedProfile.certificates || [],
                    workExperience: detailedProfile.experiences || [],
                    education: detailedProfile.education || {},
                    availability: detailedProfile.availability || 'Available',
                    rating: detailedProfile.rating || 0,
                    reviewCount: detailedProfile.reviewCount || 0
                });
                setShowProfileModal(true);
            } else {
                alert('Failed to load profile details');
            }
        } catch (error) {
            console.error('Error fetching profile details:', error);
            alert('Failed to load profile details');
        }
    };

    // Handle perk changes
    const handlePerkChange = (index, field, value) => {
        setProfileForm(prev => ({
            ...prev,
            perks: prev.perks.map((perk, i) => 
                i === index ? { ...perk, [field]: value } : perk
            )
        }));
    };
    
    // Handle perk image upload
    const handlePerkImageUpload = async (index, event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB.');
            return;
        }
        
        try {
            const response = await apiService.uploadRecruiterPhoto(file);
            
            if (response.success && response.data && response.data.profilePhoto) {
                const imageUrl = response.data.profilePhoto;
                const backendUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4001';
                const fullImageUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://') ? imageUrl : `${backendUrl}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
                
                // Update perk with image URL
                setProfileForm(prev => ({
                    ...prev,
                    perks: prev.perks.map((perk, i) => 
                        i === index ? { ...perk, image: fullImageUrl } : perk
                    )
                }));
                
                alert('Perk image uploaded successfully!');
            } else {
                alert('Failed to upload image: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error uploading perk image:', error);
            alert('Failed to upload perk image');
        } finally {
            event.target.value = '';
        }
    };
    
    // Remove perk image
    const handleRemovePerkImage = (index) => {
        if (window.confirm('Remove this perk image?')) {
            setProfileForm(prev => ({
                ...prev,
                perks: prev.perks.map((perk, i) => 
                    i === index ? { ...perk, image: '' } : perk
                )
            }));
        }
    };

    // Add new perk
    const addPerk = () => {
        setProfileForm(prev => ({
            ...prev,
            perks: [...prev.perks, { title: '', description: '', image: '' }]
        }));
    };

    // Remove perk
    const removePerk = (index) => {
        setProfileForm(prev => ({
            ...prev,
            perks: prev.perks.filter((_, i) => i !== index)
        }));
    };

    // ── Awards & Achievements handlers ──
    const handleAwardChange = (index, field, value) => {
        setProfileForm(prev => ({
            ...prev,
            awards: prev.awards.map((award, i) =>
                i === index ? { ...award, [field]: value } : award
            )
        }));
    };

    const handleAwardImageUpload = async (index, event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size must be less than 5MB.');
            return;
        }
        try {
            const response = await apiService.uploadRecruiterPhoto(file);
            if (response.success && response.data && response.data.profilePhoto) {
                const imageUrl = response.data.profilePhoto;
                const backendUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4001';
                const fullImageUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://') ? imageUrl : `${backendUrl}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
                setProfileForm(prev => ({
                    ...prev,
                    awards: prev.awards.map((award, i) =>
                        i === index ? { ...award, image: fullImageUrl } : award
                    )
                }));
                alert('Award image uploaded successfully!');
            } else {
                alert('Failed to upload image: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error uploading award image:', error);
            alert('Failed to upload award image');
        } finally {
            event.target.value = '';
        }
    };

    const handleRemoveAwardImage = (index) => {
        if (window.confirm('Remove this award image?')) {
            setProfileForm(prev => ({
                ...prev,
                awards: prev.awards.map((award, i) =>
                    i === index ? { ...award, image: '' } : award
                )
            }));
        }
    };

    const addAward = () => {
        setProfileForm(prev => ({
            ...prev,
            awards: [...prev.awards, { title: '', description: '', image: '' }]
        }));
    };

    const removeAward = (index) => {
        setProfileForm(prev => ({
            ...prev,
            awards: prev.awards.filter((_, i) => i !== index)
        }));
    };

    // Handle hiring step changes
    const handleHiringStepChange = (index, field, value) => {
        setProfileForm(prev => ({
            ...prev,
            hiringSteps: prev.hiringSteps.map((step, i) => 
                i === index ? { ...step, [field]: value } : step
            )
        }));
    };

    // Add new hiring step
    const addHiringStep = () => {
        setProfileForm(prev => ({
            ...prev,
            hiringSteps: [...prev.hiringSteps, { title: '', description: '' }]
        }));
    };

    // Remove hiring step
    const removeHiringStep = (index) => {
        setProfileForm(prev => ({
            ...prev,
            hiringSteps: prev.hiringSteps.filter((_, i) => i !== index)
        }));
    };

    // Handle interview question changes
    const handleQuestionChange = (index, value) => {
        setProfileForm(prev => ({
            ...prev,
            interviewQuestions: prev.interviewQuestions.map((question, i) => 
                i === index ? value : question
            )
        }));
    };

    // Add new interview question
    const addQuestion = () => {
        setProfileForm(prev => ({
            ...prev,
            interviewQuestions: [...prev.interviewQuestions, '']
        }));
    };

    // Remove interview question
    const removeQuestion = (index) => {
        setProfileForm(prev => ({
            ...prev,
            interviewQuestions: prev.interviewQuestions.filter((_, i) => i !== index)
        }));
    };

    // Handle profile form submission - REAL-TIME UPDATE
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        
        // Validate GST Number if provided
        if (profileForm.gstNumber && profileForm.gstNumber.trim() !== '') {
            const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstRegex.test(profileForm.gstNumber.trim())) {
                alert('Invalid GST Number format. GST Number should be 15 characters (e.g., 22AAAAA0000A1Z5)');
                return;
            }
        }
        
        // Validate PAN Number if provided
        if (profileForm.panNumber && profileForm.panNumber.trim() !== '') {
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
            if (!panRegex.test(profileForm.panNumber.trim().toUpperCase())) {
                alert('Invalid PAN Number format. PAN should be 10 characters (e.g., ABCDE1234F)');
                return;
            }
        }
        
        setLoading(true);
        
        try {
            // Keep existing office images for backward compatibility
            const finalOfficeImages = profileForm.officeImages || [];

            // Merge tempImages into images for each office location
            const finalOfficeLocations = (profileForm.officeLocations || []).map(loc => ({
                id: loc.id,
                locationName: loc.locationName || '',
                unitCount: parseInt(loc.unitCount) || 1,
                images: [...(loc.images || []), ...(loc.tempImages || [])]
            }));
            
            console.log('🏢 finalOfficeLocations being saved:', JSON.stringify(finalOfficeLocations, null, 2));
                
            const updateData = {
                ...profileForm,
                officeImages: finalOfficeImages,
                officeLocations: finalOfficeLocations,
                // Handle profile photo: use temp photo if available, otherwise keep current photo
                profilePhoto: tempProfilePhoto || profilePhoto
            };
            
            console.log('Updating profile with data:', updateData);
            console.log('Office images being saved:', finalOfficeImages);
            console.log('Profile photo being saved:', updateData.profilePhoto);
            console.log('Temp profile photo:', tempProfilePhoto);
            console.log('Current profile photo:', profilePhoto);
            
            const response = await apiService.updateRecruiterProfile(updateData);
            
            if (response.success) {
                // Update profile photo state and sync across app
                if (tempProfilePhoto) {
                    setProfilePhoto(tempProfilePhoto);
                    // Update all images across the app immediately
                    updateAllImages(tempProfilePhoto);
                    console.log('Profile photo updated and synced:', tempProfilePhoto);
                }
                // Clear temp photo after successful update
                setTempProfilePhoto(null);
                
                // Update office images
                if (tempOfficeImages.length > 0) {
                    const updatedOfficeImages = [...(profileForm.officeImages || []), ...tempOfficeImages];
                    setProfileForm(prev => ({
                        ...prev,
                        officeImages: updatedOfficeImages,
                        // Clear tempImages from all locations after save
                        officeLocations: (prev.officeLocations || []).map(loc => ({
                            ...loc,
                            images: [...(loc.images || []), ...(loc.tempImages || [])],
                            tempImages: []
                        }))
                    }));
                    setTempOfficeImages([]);
                    console.log('Updated office images in form:', updatedOfficeImages);
                } else {
                    // Still clear location tempImages even if no global office images changed
                    setProfileForm(prev => ({
                        ...prev,
                        officeLocations: (prev.officeLocations || []).map(loc => ({
                            ...loc,
                            images: [...(loc.images || []), ...(loc.tempImages || [])],
                            tempImages: []
                        }))
                    }));
                }
                
                alert('Profile updated successfully! Your changes are now live on the main recruiters page.');
                // Reload profile to get latest data
                await loadRecruiterProfile();
            } else {
                alert('Failed to update profile: ' + response.message);
            }
        } catch (error) {
            console.error('Profile update error:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Validate experience field to accept both formats: "3-5" and single numbers like "2", "5"
    const validateExperience = (experience) => {
        if (!experience || !experience.trim()) {
            return false;
        }
        
        const trimmed = experience.trim();
        
        // Check for single number format (e.g., "2", "5", "10")
        if (/^\d+$/.test(trimmed)) {
            return true;
        }
        
        // Check for range format (e.g., "3-5", "2-4", "0-2")
        if (/^\d+-\d+$/.test(trimmed)) {
            return true;
        }
        
        return false;
    };

    // Handle job form submission - REAL-TIME UPDATE
    const handleJobSubmit = async (e) => {
        e.preventDefault();
        
        // Validate experience field
        if (!validateExperience(jobForm.experience)) {
            alert('Please enter a valid experience format. Examples: "2" for 2 years, "3-5" for 3-5 years range.');
            return;
        }
        
        setLoading(true);
        
        try {
            if (editingJob) {
                // Update existing job
                const response = await apiService.updateJob(editingJob.jobId, jobForm);
                
                if (response.success) {
                    alert('Job updated successfully! Changes are now visible on the main recruiters page.');
                    await loadJobPostings(); // Reload jobs
                } else {
                    alert('Failed to update job: ' + response.message);
                }
            } else {
                // Create new job
                const response = await apiService.createJob(jobForm);
                
                if (response.success) {
                    alert('Job posted successfully! It is now visible on the main recruiters page.');
                    await loadJobPostings(); // Reload jobs
                } else {
                    alert('Failed to create job: ' + response.message);
                }
            }

            // Reset form and close modal
            setJobForm({
                title: '',
                jobType: 'Full-time',
                salary: '',
                experience: '',
                location: '',
                description: '',
                skills: '',
                department: '',
                graduationYear: '',
                status: 'Active',
                postedDate: new Date().toISOString().split('T')[0]
            });
            setShowJobForm(false);
            setEditingJob(null);
            
        } catch (error) {
            console.error('Job submission error:', error);
            alert('Failed to submit job. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle job editing
    const handleEditJob = (job) => {
        setEditingJob(job);
        setJobForm({
            title: job.title,
            jobType: job.jobType,
            salary: job.salary,
            experience: job.experience,
            location: job.location,
            description: job.description,
            skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills,
            department: job.department,
            graduationYear: job.graduationYear || '',
            status: job.status,
            postedDate: job.postedDate ? job.postedDate.split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setShowJobForm(true);
    };

    // Handle job deletion - REAL-TIME UPDATE
    const handleDeleteJob = async (jobId) => {
        if (window.confirm('Are you sure you want to delete this job posting? This will remove it from the main recruiters page.')) {
            setLoading(true);
            
            try {
                const response = await apiService.deleteJob(jobId);
                
                if (response.success) {
                    alert('Job deleted successfully! It has been removed from the main recruiters page.');
                    await loadJobPostings(); // Reload jobs
                } else {
                    alert('Failed to delete job: ' + response.message);
                }
            } catch (error) {
                console.error('Job deletion error:', error);
                alert('Failed to delete job. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = Math.abs(today - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        if (diffDays <= 14) return '1 week ago';
        if (diffDays <= 21) return '2 weeks ago';
        if (diffDays <= 30) return '3 weeks ago';
        return date.toLocaleDateString();
    };
    
    // Close students modal
    const closeStudentsModal = () => {
        setShowStudentsModal(false);
        setSelectedInstitute(null);
        setSelectedJob(null);
        setSelectedInstituteStudents([]);
    };
    
    // Handle hiring/rejecting institute student
    const handleHireInstituteStudent = async (student, status) => {
        if (!selectedJob || !selectedInstitute) {
            alert('Missing job or institute information');
            return;
        }
        
        const action = status === 'Hired' ? 'hire' : 'reject';
        if (window.confirm(`Are you sure you want to ${action} ${student.fullName}?`)) {
            try {
                setLoading(true);
                const response = await apiService.hireInstituteStudent(
                    student.instituteStudntsID,
                    selectedInstitute.instituteId,
                    selectedJob.jobId,
                    selectedJob.jobTitle,
                    status,
                    student // Pass student snapshot
                );
                
                if (response.success) {
                    // Remove student from current list immediately
                    setSelectedInstituteStudents(prev => 
                        prev.filter(s => s.instituteStudntsID !== student.instituteStudntsID)
                    );
                    
                    alert(`${student.fullName} has been ${status.toLowerCase()} successfully!`);
                    
                    // Reload hiring history and dashboard stats
                    await loadHiringHistory();
                    await loadDashboardStats();
                    
                    // If hiring history modal is open for this institute, refresh it
                    if (showHiringHistoryModal && selectedInstitute && selectedInstitute.instituteId === selectedInstitute.instituteId) {
                        await loadInstituteSpecificHiringHistory(selectedInstitute.instituteId);
                    }
                } else {
                    alert(`Failed to ${action} student: ` + response.message);
                }
            } catch (error) {
                console.error(`Error ${action}ing student:`, error);
                alert(`Failed to ${action} student`);
            } finally {
                setLoading(false);
            }
        }
    };
    
    // Load hiring history
    // Load recruiter hiring history — staff/seeker candidates ONLY
    // Sets recruiterHiringHistory (isolated from institute placement history)
    const loadHiringHistory = async () => {
        try {
            const response = await apiService.getRecruiterHiringHistory();
            if (response.success) {
                setRecruiterHiringHistory(response.data.all || []);
            }
        } catch (error) {
            console.error('Error loading hiring history:', error);
        }
    };
    

    
    // Handle view hiring history for institute
    const handleViewHiringHistory = async (institute) => {
        setSelectedInstitute(institute);
        setShowHiringHistoryModal(true);
        await loadInstituteSpecificHiringHistory(institute.instituteId);
    };
    
    // Load hiring history for specific institute
    // Load hiring history for specific institute — sets hiringHistory (modal only)
    // Does NOT touch recruiterHiringHistory to prevent cross-contamination
    const loadInstituteSpecificHiringHistory = async (instituteId) => {
        try {
            const response = await apiService.getInstituteHiringHistory(instituteId);
            if (response.success) {
                setHiringHistory(response.data || []); // modal-only state
            }
        } catch (error) {
            console.error('Error loading institute hiring history:', error);
        }
    };
    
    // Load recruiter news
    const loadRecruiterNews = async () => {
        try {
            setNewsLoading(true);
            console.log('Loading recruiter news...');
            const response = await apiService.getRecruiterNews();
            console.log('News response:', response);
            
            if (response && response.success) {
                const newsData = response.data || [];
                console.log('Raw news data:', newsData);
                
                // Ensure each news item has a proper ID for editing/deleting and sort by date
                const processedNews = newsData
                    .map(item => ({
                        ...item,
                        // Ensure we have a consistent ID field
                        id: item.recruiterNewsID || item.id || Date.now() + Math.random()
                    }))
                    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)); // Sort by newest first
                
                console.log('Processed news items:', processedNews);
                setNewsItems(processedNews);
            } else {
                console.log('API response failed or no data, response:', response);
                setNewsItems([]);
            }
        } catch (error) {
            console.error('Error loading recruiter news:', error);
            setNewsItems([]);
        } finally {
            setNewsLoading(false);
        }
    };
    
    // Load campus requests with institute details
    const loadCampusRequests = async () => {
        try {
            setCampusRequestsLoading(true);
            const response = await apiService.getRecruiterCampusRequests();
            if (response.success && response.data) {
                // Fetch institute details for each request
                const requestsWithDetails = await Promise.all(
                    response.data.map(async (request) => {
                        try {
                            const instituteResponse = await apiService.getInstituteById(request.instituteId);
                            if (instituteResponse.success && instituteResponse.data) {
                                return {
                                    ...request,
                                    instituteName: instituteResponse.data.instituteName || 'N/A',
                                    instituteEmail: instituteResponse.data.email || 'N/A',
                                    institutePhone: instituteResponse.data.phone || 'Not provided',
                                    instituteLocation: instituteResponse.data.location || 'Not provided'
                                };
                            }
                            return request;
                        } catch (err) {
                            console.error('Error fetching institute details:', err);
                            return request;
                        }
                    })
                );
                setCampusRequests(requestsWithDetails);
                // Keep dashboard stats in sync with latest campus invite count
                setDashboardStats(prev => ({
                    ...prev,
                    campusInvites: response.data.length
                }));
            }
        } catch (error) {
            console.error('Error loading campus invites:', error);
        } finally {
            setCampusRequestsLoading(false);
        }
    };
    
    // Handle news form input changes
    const handleNewsInputChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'file') {
            setNewsForm(prev => ({
                ...prev,
                [name]: files[0]
            }));
        } else if (type === 'checkbox') {
            setNewsForm(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            setNewsForm(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };
    
    // Handle news form submission
    const handleNewsSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const newsData = {
                ...newsForm,
                company: profileForm.companyName || currentUser?.name || 'Company',
                recruiterName: profileForm.recruiterName || currentUser?.name || 'Recruiter'
            };
            
            console.log('Submitting news data:', newsData);
            
            if (editingNews) {
                const newsId = editingNews.recruiterNewsID || editingNews.id;
                const response = await apiService.updateRecruiterNews(newsId, newsData);
                if (response.success) {
                    alert('News updated successfully!');
                    await loadRecruiterNews();
                } else {
                    alert('Failed to update news: ' + response.message);
                }
            } else {
                const response = await apiService.addRecruiterNews(newsData);
                if (response.success) {
                    alert('News added successfully!');
                    await loadRecruiterNews();
                } else {
                    alert('Failed to add news: ' + response.message);
                }
            }
            
            // Reset form and close modal only after successful submission
            setNewsForm({
                title: '',
                date: new Date().toISOString().split('T')[0],
                venue: '',
                expectedParticipants: '',
                details: '',
                verified: false,
                bannerImage: null
            });
            setShowNewsForm(false);
            setEditingNews(null);
        } catch (error) {
            console.error('Error submitting news:', error);
            alert('Failed to submit news: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Handle edit news
    const handleEditNews = (news) => {
        console.log('Editing news item:', news);
        console.log('News ID fields:', {
            recruiterNewsID: news.recruiterNewsID,
            id: news.id
        });
        setEditingNews(news);
        setNewsForm({
            title: news.title,
            date: news.date,
            venue: news.venue || '',
            expectedParticipants: news.expectedParticipants || '',
            details: news.details,
            verified: news.verified || false,
            bannerImage: null // Don't pre-fill file input
        });
        setShowNewsForm(true);
    };
    
    // Handle delete news with real-time update
    const handleDeleteNews = async (newsId) => {
        console.log('Attempting to delete news with ID:', newsId);
        if (window.confirm('Are you sure you want to delete this news? This will remove it from both your dashboard and the database.')) {
            try {
                setLoading(true);
                const response = await apiService.deleteRecruiterNews(newsId);
                console.log('Delete response:', response);
                if (response.success) {
                    alert('News deleted successfully!');
                    // Immediately reload news from database to show updated list
                    await loadRecruiterNews();
                } else {
                    alert('Failed to delete news: ' + response.message);
                }
            } catch (error) {
                console.error('Error deleting news:', error);
                alert('Failed to delete news: ' + error.message);
            } finally {
                setLoading(false);
            }
        }
    };
    
    // Handle view news
    const handleViewNews = (news) => {
        setViewingNews(news);
        setShowNewsView(true);
    };
    

    
    // Toggle mobile sidebar
    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };
    
    // Handle tab change and close mobile sidebar
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setIsMobileSidebarOpen(false);
        // Open My Hirings dropdown if navigating to jobs, candidates, or hiring
        if (tab === 'jobs' || tab === 'candidates' || tab === 'hiring') {
            setIsMyHiringsOpen(true);
        }
        // Open Institutes dropdown if navigating to institutes or campus-requests
        if (tab === 'institutes' || tab === 'campus-requests') {
            setIsInstitutesOpen(true);
        }
        // Refresh candidates when switching to Hiring History so list is always current
        if (tab === 'hiring') {
            loadCandidates(candidateFilters);
        }
    };
    
    // Toggle My Hirings dropdown
    const toggleMyHirings = () => {
        setIsMyHiringsOpen(!isMyHiringsOpen);
    };

    // Toggle Institutes dropdown
    const toggleInstitutes = () => {
        setIsInstitutesOpen(!isInstitutesOpen);
    };
    
    // Handle HRMS access - Direct redirect
    const handleHRMSAccess = () => {
        if (currentUser && currentUser.userId) {
            const hrmsUrl = `https://hrms.staffinn.com?recruiterId=${currentUser.userId}`;
            window.open(hrmsUrl, '_blank');
        } else {
            alert('User information not found. Please login again.');
        }
    };
    
    // Download all students details as Excel
    const downloadStudentsExcel = () => {
        if (!selectedInstituteStudents || selectedInstituteStudents.length === 0) {
            alert('No students data available to download.');
            return;
        }
        
        try {
            // Prepare data for Excel
            const excelData = selectedInstituteStudents.map((student, index) => {
                return {
                    'S.No': index + 1,
                    'Full Name': student.fullName || 'N/A',
                    'Email': student.email || 'N/A',
                    'Phone Number': student.phoneNumber || 'N/A',
                    'Date of Birth': student.dateOfBirth || 'N/A',
                    'Gender': student.gender || 'N/A',
                    'Address': student.address || 'N/A',
                    'Degree Name': student.degreeName || 'N/A',
                    'Specialization': student.specialization || 'N/A',
                    'Expected Year of Passing': student.expectedYearOfPassing || 'N/A',
                    'Currently Pursuing': student.currentlyPursuing ? 'Yes' : 'No',
                    '10th Grade Details': student.tenthGradeDetails || 'N/A',
                    '10th Percentage': student.tenthPercentage || 'N/A',
                    '10th Year of Passing': student.tenthYearOfPassing || 'N/A',
                    '12th Grade Details': student.twelfthGradeDetails || 'N/A',
                    '12th Percentage': student.twelfthPercentage || 'N/A',
                    '12th Year of Passing': student.twelfthYearOfPassing || 'N/A',
                    'Skills': student.skills && Array.isArray(student.skills) ? student.skills.join(', ') : 'N/A',
                    'Profile Photo URL': student.profilePhoto || 'N/A',
                    'Resume URL': student.resume || 'N/A',
                    'Certificates Count': student.certificates && Array.isArray(student.certificates) ? student.certificates.length : 0,
                    'Certificate URLs': student.certificates && Array.isArray(student.certificates) ? student.certificates.join(', ') : 'N/A'
                };
            });
            
            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            
            // Set column widths for better readability
            const columnWidths = [
                { wch: 5 },   // S.No
                { wch: 20 },  // Full Name
                { wch: 25 },  // Email
                { wch: 15 },  // Phone Number
                { wch: 12 },  // Date of Birth
                { wch: 8 },   // Gender
                { wch: 30 },  // Address
                { wch: 20 },  // Degree Name
                { wch: 20 },  // Specialization
                { wch: 15 },  // Expected Year
                { wch: 12 },  // Currently Pursuing
                { wch: 20 },  // 10th Grade Details
                { wch: 12 },  // 10th Percentage
                { wch: 15 },  // 10th Year
                { wch: 20 },  // 12th Grade Details
                { wch: 12 },  // 12th Percentage
                { wch: 15 },  // 12th Year
                { wch: 30 },  // Skills
                { wch: 40 },  // Profile Photo URL
                { wch: 40 },  // Resume URL
                { wch: 15 },  // Certificates Count
                { wch: 50 }   // Certificate URLs
            ];
            worksheet['!cols'] = columnWidths;
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Students Details');
            
            // Generate filename with institute name and job title
            const instituteName = selectedInstitute?.instituteName || 'Institute';
            const jobTitle = selectedJob?.jobTitle || 'Job';
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `${instituteName}_${jobTitle}_Students_${timestamp}.xlsx`;
            
            // Download the file
            XLSX.writeFile(workbook, filename);
            
            console.log(`Excel file downloaded: ${filename}`);
        } catch (error) {
            console.error('Error generating Excel file:', error);
            alert('Failed to generate Excel file. Please try again.');
        }
    };

    return (
        <div className="recruiter-dashboard">
            {/* Hidden User Modal */}
            {showHiddenModal && isHidden && (
                <HiddenUser
                    user={currentUser}
                    onClose={() => setShowHiddenModal(false)}
                />
            )}
            
            {/* Hidden User Notification Bar */}
            {isHidden && !showHiddenModal && (
                <div className="hidden-notification-bar">
                    <div className="hidden-notification-content">
                        <i className="fas fa-eye-slash"></i>
                        <span>You are hidden from Staffinn.</span>
                        <button 
                            className="request-help-link"
                            onClick={() => setShowHiddenModal(true)}
                        >
                            Request Help
                        </button>
                    </div>
                </div>
            )}
            
            {/* Mobile Hamburger Button */}
            <button className="recruiter-mobile-sidebar-toggle" onClick={toggleMobileSidebar}>
                <span></span>
                <span></span>
                <span></span>
            </button>
            
            <div className={`recruiter-dashboard-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
                <div className="recruiter-company-info">
                    {profilePhoto && profilePhoto !== '' ? (
                        <img src={profilePhoto} alt="Company Logo" className="recruiter-company-logo" data-recruiter-image />
                    ) : (
                        <div className="recruiter-company-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50' }}>
                            {(profileForm.companyName || currentUser?.name || 'C').charAt(0)}
                        </div>
                    )}
                    <h3>{profileForm.companyName || currentUser?.name || 'Your Company'}</h3>
                </div>
                <ul className="recruiter-sidebar-menu">
                    <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => handleTabChange('profile')}>
                        My Profile
                    </li>
                    <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => handleTabChange('overview')}>
                        Dashboard Overview
                    </li>
                    <li className={`recruiter-dropdown-parent ${activeTab === 'jobs' || activeTab === 'candidates' || activeTab === 'hiring' ? 'active' : ''} ${isMyHiringsOpen ? 'open' : ''}`} onClick={toggleMyHirings}>
                        <span className="dropdown-label">My Hirings</span>
                        <span className="dropdown-icon">{isMyHiringsOpen ? '▼' : '▶'}</span>
                    </li>
                    {isMyHiringsOpen && (
                        <ul className="recruiter-submenu">
                            <li className={activeTab === 'jobs' ? 'active' : ''} onClick={(e) => { e.stopPropagation(); handleTabChange('jobs'); }}>
                                Post Job
                            </li>
                            <li className={activeTab === 'candidates' ? 'active' : ''} onClick={(e) => { e.stopPropagation(); handleTabChange('candidates'); }}>
                                Candidates Applied
                            </li>
                            <li className={activeTab === 'hiring' ? 'active' : ''} onClick={(e) => { e.stopPropagation(); handleTabChange('hiring'); }}>
                                Hiring History
                            </li>
                        </ul>
                    )}
                    <li className={`recruiter-dropdown-parent ${activeTab === 'institutes' || activeTab === 'campus-requests' || activeTab === 'institute-response' ? 'active' : ''} ${isInstitutesOpen ? 'open' : ''}`} onClick={toggleInstitutes}>
                        <span className="dropdown-label">Institutes</span>
                        <span className="dropdown-icon">{isInstitutesOpen ? '▼' : '▶'}</span>
                    </li>
                    {isInstitutesOpen && (
                        <ul className="recruiter-submenu">
                            <li onClick={(e) => { e.stopPropagation(); window.location.href = '/institute'; }}>
                                Search Institute
                            </li>
                            <li className={activeTab === 'institutes' ? 'active' : ''} onClick={(e) => { e.stopPropagation(); handleTabChange('institutes'); }}>
                                Students Applied
                            </li>
                            <li className={activeTab === 'campus-requests' ? 'active' : ''} onClick={(e) => { e.stopPropagation(); handleTabChange('campus-requests'); }}>
                                Campus Invites
                            </li>
                            <li className={activeTab === 'institute-response' ? 'active' : ''} onClick={(e) => { e.stopPropagation(); handleTabChange('institute-response'); }}>
                                Institute Response
                            </li>
                        </ul>
                    )}
                    <li onClick={() => window.location.href = '/staff'}>
                        Search Staff
                    </li>
                    <li className={activeTab === 'news' ? 'active' : ''} onClick={() => handleTabChange('news')}>
                        News
                    </li>
                    <li className={activeTab === 'contact-history' ? 'active' : ''} onClick={() => handleTabChange('contact-history')}>
                        Chat History
                    </li>
                    <li className={activeTab === 'government-schemes' ? 'active' : ''} onClick={() => handleTabChange('government-schemes')}>
                        Government Schemes
                    </li>
                    <li className={activeTab === 'hrms' ? 'active' : ''} onClick={handleHRMSAccess}>
                        HRMS
                    </li>
                </ul>
            </div>

            {/* Dashboard title will be shown inside the content area */}

            {/* Real-time campus invite notification banner */}
            {newInviteNotification && (
                <div className="rci-new-invite-banner" onClick={() => { handleTabChange('campus-requests'); setNewInviteNotification(false); }}>
                    <span>📬</span>
                    <span>New campus invite received! Click to view.</span>
                    <button onClick={(e) => { e.stopPropagation(); setNewInviteNotification(false); }}>×</button>
                </div>
            )}

            <div className="recruiter-dashboard-content">
                <h1>
                    {activeTab === 'overview' && 'Dashboard Overview'}
                    {activeTab === 'jobs' && 'Post Job'}
                    {activeTab === 'candidates' && 'Candidates Applied'}
                    {activeTab === 'hiring' && 'Hiring History'}
                    {activeTab === 'institutes' && 'Students Applied'}
                    {activeTab === 'campus-requests' && 'Campus Invites'}
                    {activeTab === 'news' && 'News'}
                    {activeTab === 'contact-history' && 'Chat History'}
                    {activeTab === 'government-schemes' && 'Government Schemes'}
                    {activeTab === 'profile' && 'My Profile'}
                </h1>


                {/* Job Form Modal */}
                {showJobForm && (
                    <div className="recruiter-modal-overlay" data-lenis-prevent>
                        <div className="recruiter-job-form-modal" data-lenis-prevent>
                            <div className="recruiter-modal-header">
                                <h2>{editingJob ? 'Edit Job' : 'Post a New Job'}</h2>
                                <button 
                                    className="recruiter-close-modal"
                                    onClick={() => {
                                        setShowJobForm(false);
                                        setEditingJob(null);
                                        setJobForm({
                                            title: '',
                                            jobType: 'Full-time',
                                            salary: '',
                                            experience: '',
                                            location: '',
                                            description: '',
                                            skills: '',
                                            department: '',
                                            graduationYear: '',
                                            status: 'Active',
                                            postedDate: new Date().toISOString().split('T')[0]
                                        });
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            
                            <form onSubmit={handleJobSubmit} className="recruiter-job-form" data-lenis-prevent>
                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>Job Title *</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={jobForm.title}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. Senior Frontend Developer"
                                        />
                                        <span className="recruiter-field-hint">Full job designation as it should appear to candidates</span>
                                    </div>
                                    <div className="recruiter-form-group">
                                        <label>Department *</label>
                                        <select
                                            name="department"
                                            value={jobForm.department}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Select Department</option>
                                            <option value="Engineering">Engineering</option>
                                            <option value="Product">Product</option>
                                            <option value="Design">Design</option>
                                            <option value="Marketing">Marketing</option>
                                            <option value="Sales">Sales</option>
                                            <option value="Analytics">Analytics</option>
                                            <option value="HR">HR</option>
                                            <option value="Finance">Finance</option>
                                        </select>
                                        <span className="recruiter-field-hint">Select the team this role belongs to</span>
                                    </div>
                                </div>

                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>Job Type *</label>
                                        <select
                                            name="jobType"
                                            value={jobForm.jobType}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Freelance">Freelance</option>
                                            <option value="Internship">Internship</option>
                                        </select>
                                        <span className="recruiter-field-hint">Employment nature of this role</span>
                                    </div>
                                    <div className="recruiter-form-group">
                                        <label>Experience Required *</label>
                                        <input
                                            type="text"
                                            name="experience"
                                            value={jobForm.experience}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. 2 or 3-5"
                                        />
                                        <span className="recruiter-field-hint">Enter years as a number (e.g. <strong>2</strong>) or range (e.g. <strong>3-5</strong>). Use <strong>0</strong> for fresher roles.</span>
                                    </div>
                                </div>

                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>Salary Range *</label>
                                        <input
                                            type="text"
                                            name="salary"
                                            value={jobForm.salary}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. ₹12-18 LPA"
                                        />
                                        <span className="recruiter-field-hint">Format: <strong>₹[min]-[max] LPA</strong> for annual (e.g. ₹8-12 LPA) or <strong>₹[amount]/month</strong> for monthly (e.g. ₹25,000/month)</span>
                                    </div>
                                    <div className="recruiter-form-group">
                                        <label>Location *</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={jobForm.location}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. Bangalore (Hybrid)"
                                        />
                                        <span className="recruiter-field-hint">City name followed by work mode in brackets — <strong>Remote</strong>, <strong>Hybrid</strong>, or <strong>On-site</strong></span>
                                    </div>
                                </div>

                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>Graduation Year</label>
                                        <input
                                            type="text"
                                            name="graduationYear"
                                            value={jobForm.graduationYear}
                                            onChange={handleInputChange}
                                            placeholder="e.g. 2025 or 2023-2025"
                                        />
                                        <span className="recruiter-field-hint">Single year (e.g. <strong>2025</strong>) or batch range (e.g. <strong>2023-2025</strong>). Leave blank if not applicable.</span>
                                    </div>
                                    <div className="recruiter-form-group">
                                        <label>Date Posted *</label>
                                        <input
                                            type="date"
                                            name="postedDate"
                                            value={jobForm.postedDate}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <span className="recruiter-field-hint">Date the job listing goes live (defaults to today)</span>
                                    </div>
                                </div>

                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>Status *</label>
                                        <select
                                            name="status"
                                            value={jobForm.status}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="Active">Active — visible to candidates</option>
                                            <option value="Closed">Closed — no longer accepting applications</option>
                                            <option value="Draft">Draft — saved but not yet published</option>
                                        </select>
                                        <span className="recruiter-field-hint">Controls whether this job is visible on your public profile</span>
                                    </div>
                                    <div className="recruiter-form-group">
                                        {/* Empty div for spacing */}
                                    </div>
                                </div>

                                <div className="recruiter-form-group">
                                    <label>Required Skills *</label>
                                    <input
                                        type="text"
                                        name="skills"
                                        value={jobForm.skills}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="e.g. React, Node.js, MongoDB"
                                    />
                                    <span className="recruiter-field-hint">Enter skills separated by commas. These are used for candidate matching (e.g. <strong>Python, Django, PostgreSQL, Docker</strong>)</span>
                                </div>

                                <div className="recruiter-form-group">
                                    <label>Job Description *</label>
                                    <textarea
                                        name="description"
                                        value={jobForm.description}
                                        onChange={handleInputChange}
                                        required
                                        rows="6"
                                        placeholder="Describe the role, key responsibilities, and what you're looking for in a candidate..."
                                        maxLength={2000}
                                    />
                                    <span className="recruiter-field-hint">
                                        Min 100 characters · Max 2000 characters · {jobForm.description.length}/2000 used.
                                        Cover: role overview, day-to-day responsibilities, must-have qualifications, and nice-to-haves.
                                    </span>
                                </div>

                                <div className="recruiter-form-actions">
                                    <button 
                                        type="button" 
                                        className="recruiter-cancel-btn"
                                        onClick={() => {
                                            setShowJobForm(false);
                                            setEditingJob(null);
                                            setJobForm({
                                                title: '',
                                                jobType: 'Full-time',
                                                salary: '',
                                                experience: '',
                                                location: '',
                                                description: '',
                                                skills: '',
                                                department: '',
                                                graduationYear: '',
                                                status: 'Active',
                                                postedDate: new Date().toISOString().split('T')[0]
                                            });
                                        }}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="recruiter-submit-btn" disabled={loading}>
                                        {loading ? 'Saving...' : (editingJob ? 'Update Job' : 'Post Job')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* News Form Modal */}
                {showNewsForm && (
                    <div className="recruiter-modal-overlay" data-lenis-prevent>
                        <div className="recruiter-job-form-modal" data-lenis-prevent>
                            <div className="recruiter-modal-header">
                                <h2>{editingNews ? 'Edit News' : 'Add News'}</h2>
                                <button 
                                    className="recruiter-close-modal"
                                    onClick={() => {
                                        setShowNewsForm(false);
                                        setEditingNews(null);
                                        setNewsForm({
                                            title: '',
                                            date: new Date().toISOString().split('T')[0],
                                            venue: '',
                                            expectedParticipants: '',
                                            details: '',
                                            verified: false,
                                            bannerImage: null
                                        });
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            
                            <form onSubmit={handleNewsSubmit} className="recruiter-job-form">
                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>News Title *</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={newsForm.title}
                                            onChange={handleNewsInputChange}
                                            required
                                            placeholder="e.g. New Job Openings Available"
                                        />
                                    </div>
                                    <div className="recruiter-form-group">
                                        <label>Date *</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={newsForm.date}
                                            onChange={handleNewsInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>Venue</label>
                                        <input
                                            type="text"
                                            name="venue"
                                            value={newsForm.venue}
                                            onChange={handleNewsInputChange}
                                            placeholder="e.g. Conference Hall, Online"
                                        />
                                    </div>
                                    <div className="recruiter-form-group">
                                        <label>Expected Participants</label>
                                        <input
                                            type="number"
                                            name="expectedParticipants"
                                            value={newsForm.expectedParticipants}
                                            onChange={handleNewsInputChange}
                                            placeholder="e.g. 100"
                                        />
                                    </div>
                                </div>

                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>Banner Image</label>
                                        <input
                                            type="file"
                                            name="bannerImage"
                                            onChange={handleNewsInputChange}
                                            accept="image/*"
                                        />
                                    </div>
                                </div>

                                <div className="recruiter-form-group">
                                    <label>News Details *</label>
                                    <textarea
                                        name="details"
                                        value={newsForm.details}
                                        onChange={handleNewsInputChange}
                                        required
                                        rows="4"
                                        placeholder="Describe the news, event, or announcement..."
                                    />
                                </div>

                                <div className="recruiter-form-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="verified"
                                            checked={newsForm.verified}
                                            onChange={handleNewsInputChange}
                                        />
                                        Mark as Verified News
                                    </label>
                                </div>

                                <div className="recruiter-form-actions">
                                    <button 
                                        type="button" 
                                        className="recruiter-cancel-btn"
                                        onClick={() => {
                                            setShowNewsForm(false);
                                            setEditingNews(null);
                                            setNewsForm({
                                                title: '',
                                                date: new Date().toISOString().split('T')[0],
                                                venue: '',
                                                expectedParticipants: '',
                                                details: '',
                                                verified: false,
                                                bannerImage: null
                                            });
                                        }}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="recruiter-submit-btn" disabled={loading}>
                                        {loading ? 'Saving...' : (editingNews ? 'Update News' : 'Add News')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'overview' && (
                    <div className="recruiter-dashboard-overview">

                        <div className="recruiter-metrics-grid">
                            <div className="recruiter-metric-card">
                                <h3>Jobs Posted</h3>
                                <p className="recruiter-metric-value">{jobPostings.length}</p>
                                <p className="recruiter-metric-trend positive">+{jobPostings.filter(job => {
                                    const jobDate = new Date(job.postedDate);
                                    const thisMonth = new Date();
                                    return jobDate.getMonth() === thisMonth.getMonth() && jobDate.getFullYear() === thisMonth.getFullYear();
                                }).length} this month</p>
                            </div>
                            <div className="recruiter-metric-card">
                                <h3>Applications</h3>
                                <p className="recruiter-metric-value">{dashboardStats.applications}</p>
                                <p className="recruiter-metric-trend positive">+{dashboardStats.applications} this month</p>
                            </div>
                            <div className="recruiter-metric-card">
                                <h3>Hires</h3>
                                <p className="recruiter-metric-value">{dashboardStats.hires}</p>
                                <p className="recruiter-metric-trend positive">+{dashboardStats.hires} this month</p>
                            </div>
                            <div className="recruiter-metric-card">
                                <h3>Followers</h3>
                                <p className="recruiter-metric-value">{dashboardStats.followers || 0}</p>
                                <p className="recruiter-metric-trend positive">+{dashboardStats.followers || 0} total</p>
                            </div>
                            <div className="recruiter-metric-card campus-invites-card">
                                <h3>Campus Invites</h3>
                                <p className="recruiter-metric-value">{dashboardStats.campusInvites || 0}</p>
                                <p className="recruiter-metric-trend positive">{dashboardStats.campusInvites || 0} received</p>
                            </div>
                        </div>

                        <div className="recruiter-charts-section">
                            <div className="chart-controls">
                                <label>Year: </label>
                                <select 
                                    value={selectedYear} 
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                >
                                    {(() => {
                                        const startYear = currentUser?.createdAt ? new Date(currentUser.createdAt).getFullYear() : new Date().getFullYear();
                                        const currentYear = new Date().getFullYear();
                                        const years = [];
                                        for (let year = startYear; year <= currentYear; year++) {
                                            years.push(<option key={year} value={year}>{year}</option>);
                                        }
                                        return years;
                                    })()
                                    }
                                </select>
                                <label>From: </label>
                                <select 
                                    value={selectedMonthRange.start} 
                                    onChange={(e) => setSelectedMonthRange(prev => ({ ...prev, start: parseInt(e.target.value) }))}
                                >
                                    <option value={0}>January</option>
                                    <option value={1}>February</option>
                                    <option value={2}>March</option>
                                    <option value={3}>April</option>
                                    <option value={4}>May</option>
                                    <option value={5}>June</option>
                                    <option value={6}>July</option>
                                    <option value={7}>August</option>
                                    <option value={8}>September</option>
                                    <option value={9}>October</option>
                                    <option value={10}>November</option>
                                    <option value={11}>December</option>
                                </select>
                                <label>To: </label>
                                <select 
                                    value={selectedMonthRange.end} 
                                    onChange={(e) => setSelectedMonthRange(prev => ({ ...prev, end: parseInt(e.target.value) }))}
                                >
                                    <option value={0}>January</option>
                                    <option value={1}>February</option>
                                    <option value={2}>March</option>
                                    <option value={3}>April</option>
                                    <option value={4}>May</option>
                                    <option value={5}>June</option>
                                    <option value={6}>July</option>
                                    <option value={7}>August</option>
                                    <option value={8}>September</option>
                                    <option value={9}>October</option>
                                    <option value={10}>November</option>
                                    <option value={11}>December</option>
                                </select>
                            </div>
                            
                            <div className="recruiter-charts-row">
                                <div className="recruiter-chart-container">
                                    <h3>Applications & Hiring Trends</h3>
                                    <BarChart width={400} height={300} data={getChartData()}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="applications" fill="#8884d8" name="Applications" />
                                        <Bar dataKey="hired" fill="#ffc658" name="Hired" />
                                    </BarChart>
                                </div>
                                <div className="recruiter-chart-container">
                                    <h3>Hiring Funnel</h3>
                                    <PieChart width={400} height={300}>
                                        <Pie
                                            data={getHiringFunnelData()}
                                            cx={200}
                                            cy={150}
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {getHiringFunnelData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </div>
                            </div>
                        </div>

                        <div className="recruiter-recent-section">
                            <h3>Recent Job Postings</h3>
                            <table className="recruiter-data-table">
                                <thead>
                                    <tr>
                                        <th>Job Title</th>
                                        <th>Department</th>
                                        <th>Location</th>
                                        <th>Graduation Year</th>
                                        <th>Applications</th>
                                        <th>Status</th>
                                        <th>Posted</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {jobPostings.slice(0, 3).map(job => (
                                        <tr key={job.jobId}>
                                            <td>{job.title}</td>
                                            <td>{job.department}</td>
                                            <td>{job.location}</td>
                                            <td>{job.graduationYear || 'Any'}</td>
                                            <td>{job.applications || 0}</td>
                                            <td>
                                                <span className={`recruiter-status-badge ${job.status.toLowerCase()}`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td>{formatDate(job.postedDate)}</td>
                                            <td>
                                                <button 
                                                    className="recruiter-table-action"
                                                    onClick={() => handleEditJob(job)}
                                                    disabled={loading}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="recruiter-table-action delete"
                                                    onClick={() => handleDeleteJob(job.jobId)}
                                                    disabled={loading}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>




                    </div>
                )}

                {activeTab === 'jobs' && (
                    <div className="recruiter-jobs-tab">
                        <div className="recruiter-tab-header">
                            <button 
                                className="recruiter-primary-button"
                                onClick={() => setShowJobForm(true)}
                                disabled={loading}
                            >
                                + Post New Job
                            </button>
                        </div>

                        <div className="recruiter-filter-section">
                            <input 
                                type="text" 
                                placeholder="Search jobs..." 
                                className="recruiter-search-input"
                                name="search"
                                value={jobFilters.search}
                                onChange={handleJobFilterChange}
                            />
                            <select 
                                className="recruiter-filter-select"
                                name="status"
                                value={jobFilters.status}
                                onChange={handleJobFilterChange}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="closed">Closed</option>
                                <option value="draft">Draft</option>
                            </select>
                            <select 
                                className="recruiter-filter-select"
                                name="department"
                                value={jobFilters.department}
                                onChange={handleJobFilterChange}
                            >
                                <option value="all">All Departments</option>
                                <option value="engineering">Engineering</option>
                                <option value="design">Design</option>
                                <option value="product">Product</option>
                                <option value="marketing">Marketing</option>
                                <option value="analytics">Analytics</option>
                                <option value="sales">Sales</option>
                                <option value="hr">HR</option>
                                <option value="finance">Finance</option>
                            </select>
                        </div>

                        <table className="recruiter-data-table full-width">
                            <thead>
                                <tr>
                                    <th>Job Title</th>
                                    <th>Department</th>
                                    <th>Location</th>
                                    <th>Graduation Year</th>
                                    <th>Applications</th>
                                    <th>Status</th>
                                    <th>Posted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJobs.map(job => (
                                    <tr key={job.jobId}>
                                        <td>{job.title}</td>
                                        <td>{job.department}</td>
                                        <td>{job.location}</td>
                                        <td>{job.graduationYear || 'Any'}</td>
                                        <td>{job.applications || 0}</td>
                                        <td>
                                            <span className={`recruiter-status-badge ${job.status.toLowerCase()}`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td>{formatDate(job.postedDate)}</td>
                                        <td>
                                            <button 
                                                className="recruiter-table-action"
                                                onClick={() => handleEditJob(job)}
                                                disabled={loading}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="recruiter-table-action delete"
                                                onClick={() => handleDeleteJob(job.jobId)}
                                                disabled={loading}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredJobs.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                                No jobs found matching your criteria.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'candidates' && (
                    <div className="recruiter-candidates-tab">

                        {/* Clean professional filter bar — no hero/banner */}
                        <div className="rcd-filter-bar">
                            <div className="rcd-search-wrap">
                                <input
                                    type="text"
                                    placeholder="Search by name, skills, or experience..."
                                    className="rcd-search-input"
                                    name="search"
                                    value={candidateFilters.search}
                                    onChange={handleCandidateFilterChange}
                                />
                                {candidatesLoading && <span className="rcd-search-spinner" />}
                            </div>
                            <select
                                className="rcd-filter-select"
                                name="status"
                                value={candidateFilters.status}
                                onChange={handleCandidateFilterChange}
                                disabled={candidatesLoading}
                            >
                                <option value="all">All Status</option>
                                <option value="hired">Hired</option>
                                <option value="rejected">Rejected</option>
                                <option value="new">New</option>
                            </select>
                            <select
                                className="rcd-filter-select"
                                name="jobId"
                                value={candidateFilters.jobId}
                                onChange={handleCandidateFilterChange}
                                disabled={candidatesLoading}
                            >
                                <option value="all">Search Job</option>
                                {jobPostings.map(job => (
                                    <option key={job.jobId} value={job.jobId}>{job.title}</option>
                                ))}
                            </select>
                        </div>

                        <table className="recruiter-data-table full-width rcd-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Position</th>
                                    <th>Skills</th>
                                    <th>Status</th>
                                    <th>Applied Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidatesLoading ? (
                                    <tr>
                                        <td colSpan="6" className="rcd-loading-cell">
                                            Loading candidates…
                                        </td>
                                    </tr>
                                ) : candidates.length > 0 ? (
                                    candidates.map(candidate => {
                                        const isHired = candidate.status?.toLowerCase() === 'hired';
                                        return (
                                            <tr key={candidate.id} className="rcd-row">
                                                <td>{candidate.name}</td>
                                                <td>{candidate.position}</td>
                                                <td>{candidate.skills}</td>
                                                <td>
                                                    <span className={`recruiter-status-badge ${candidate.status.toLowerCase()}`}>
                                                        {candidate.status}
                                                    </span>
                                                </td>
                                                <td>{new Date(candidate.date).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="rcd-actions">
                                                        <button
                                                            className="rcd-btn rcd-btn-view"
                                                            onClick={() => handleViewProfile(candidate)}
                                                        >
                                                            View Profile
                                                        </button>
                                                        {!isHired && (
                                                            <button
                                                                className="rcd-btn rcd-btn-hire"
                                                                onClick={() => handleHireCandidate(candidate)}
                                                                disabled={loading}
                                                            >
                                                                Hire
                                                            </button>
                                                        )}
                                                        <button
                                                            className="rcd-btn rcd-btn-delete"
                                                            onClick={() => handleRejectCandidate(candidate)}
                                                            disabled={loading}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="rcd-loading-cell">
                                            No candidates found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Profile Modal - Exact Same as Staff Page */}
                {showProfileModal && selectedCandidateProfile && (
                    <div className="clean-modal-overlay" onClick={() => {
                        setShowProfileModal(false);
                        setSelectedCandidateProfile(null);
                    }}>
                        <div className="clean-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="clean-modal-header">
                                <div className="clean-modal-info">
                                    <div className="clean-modal-avatar">
                                        {selectedCandidateProfile.profilePhoto ? (
                                            <img src={selectedCandidateProfile.profilePhoto} alt={selectedCandidateProfile.name} className="modal-avatar-img" />
                                        ) : (
                                            <div className="modal-avatar-placeholder">
                                                {selectedCandidateProfile.name?.charAt(0) || 'S'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="clean-modal-details">
                                        <h2>{selectedCandidateProfile.name}</h2>
                                        <p className="modal-profession">{selectedCandidateProfile.skills?.split(',')[0] || 'Professional'}</p>
                                        <div className="modal-rating">
                                            <span className="star">⭐</span>
                                            <span className="rating-text">{selectedCandidateProfile.rating || 'New'}</span>
                                            <span className="experience-text">({selectedCandidateProfile.experience || 'Not specified'} level)</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="clean-modal-close" onClick={() => {
                                    setShowProfileModal(false);
                                    setSelectedCandidateProfile(null);
                                }}>×</button>
                            </div>



                            <div className="clean-modal-body">
                                <div className="clean-profile-content">
                                    <div className="clean-profile-section">
                                        <h4>Profile Details</h4>
                                        <div className="clean-detail-item">
                                            <span className="detail-icon">📍</span>
                                            <span>{selectedCandidateProfile.address || 'Location not specified'}</span>
                                        </div>
                                        <div className="clean-detail-item">
                                            <span className="detail-label">Phone:</span>
                                            <span>{selectedCandidateProfile.phone}</span>
                                        </div>
                                        <div className="clean-detail-item">
                                            <span className="detail-label">Email:</span>
                                            <span>{selectedCandidateProfile.email}</span>
                                        </div>
                                        <div className="clean-detail-item">
                                            <span className="detail-label">Availability:</span>
                                            <span className={`clean-availability ${selectedCandidateProfile.availability?.toLowerCase()?.replace(' ', '-') || 'available'}`}>
                                                {selectedCandidateProfile.availability?.charAt(0)?.toUpperCase() + selectedCandidateProfile.availability?.slice(1) || 'Available'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="clean-profile-section">
                                        <h4>Skills</h4>
                                        <div className="clean-skills-list">
                                            {selectedCandidateProfile.skills?.split(',').map((skill, index) => (
                                                <span key={index} className="clean-skill-tag">{skill.trim()}</span>
                                            )) || <span>No skills specified</span>}
                                        </div>
                                    </div>

                                    {selectedCandidateProfile.experiences && selectedCandidateProfile.experiences.length > 0 && (
                                        <div className="clean-profile-section">
                                            <h4>Work Experience</h4>
                                            {selectedCandidateProfile.experiences.map((exp, index) => (
                                                <div key={index} className="experience-item">
                                                    <h5>{exp.role} at {exp.company}</h5>
                                                    <p className="experience-duration">
                                                        {exp.startDate} - {exp.endDate || 'Present'}
                                                    </p>
                                                    {exp.salary && <p className="experience-salary">Salary: {exp.salary}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {selectedCandidateProfile.education && (
                                        <div className="clean-profile-section">
                                            <h4>Education</h4>
                                            {selectedCandidateProfile.education.graduation?.degree && (
                                                <div className="education-item">
                                                    <h5>{selectedCandidateProfile.education.graduation.degree}</h5>
                                                    <p>{selectedCandidateProfile.education.graduation.college}</p>
                                                    <p>Percentage: {selectedCandidateProfile.education.graduation.percentage}</p>
                                                </div>
                                            )}
                                            {selectedCandidateProfile.education.twelfth?.percentage && (
                                                <div className="education-item">
                                                    <h5>12th Grade</h5>
                                                    <p>{selectedCandidateProfile.education.twelfth.school}</p>
                                                    <p>Percentage: {selectedCandidateProfile.education.twelfth.percentage}%</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedCandidateProfile.certificates && selectedCandidateProfile.certificates.length > 0 && (
                                        <div className="clean-profile-section">
                                            <h4>Certificates & Qualifications</h4>
                                            <div className="modern-certificate-grid">
                                                {selectedCandidateProfile.certificates.map((cert, index) => (
                                                    <div key={index} className="modern-certificate-card">
                                                        <div className="certificate-badge">🏆</div>
                                                        <div className="certificate-info">
                                                            <h5>{cert.name}</h5>
                                                            <p><strong>Issuer:</strong> {cert.issuer}</p>
                                                            <p><strong>Issued:</strong> {cert.issued}</p>
                                                            {cert.duration && <p><strong>Duration:</strong> {cert.duration}</p>}
                                                            {cert.url && (
                                                                <a 
                                                                    href={cert.url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="view-certificate-link"
                                                                >
                                                                    View Certificate
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selectedCandidateProfile.resumeUrl && (
                                        <div className="clean-profile-section">
                                            <h4>Resume</h4>
                                            <div className="modern-resume-view">
                                                <div className="resume-container">
                                                    <div className="resume-header">
                                                        <h4>Resume - {selectedCandidateProfile.name}</h4>
                                                        <a 
                                                            href={selectedCandidateProfile.resumeUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="download-btn"
                                                        >
                                                            📥 Download
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'hiring' && (
                    <div className="recruiter-hiring-tab">
                        {(() => {
                            // Read directly from candidates state (already loaded, always up-to-date)
                            // Filter to only candidates this recruiter has hired
                            // This is the single source of truth — same data shown in Candidates Applied
                            const hiredCandidatesList = candidates.filter(
                                c => c.status?.toLowerCase() === 'hired'
                            );

                            return hiredCandidatesList.length > 0 ? (
                                <div className="recruiter-hiring-content">
                                    <table className="recruiter-data-table full-width">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Position</th>
                                                <th>Hire Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hiredCandidatesList.map((candidate, index) => (
                                                <tr key={candidate.id || index}>
                                                    <td>{candidate.name}</td>
                                                    <td>{candidate.position}</td>
                                                    <td>
                                                        {candidate.date
                                                            ? new Date(candidate.date).toLocaleDateString()
                                                            : '—'}
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="recruiter-table-action"
                                                            onClick={() => handleViewProfile(candidate)}
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="recruiter-empty-state">
                                    <p>No hiring records found. Hire candidates from the Candidates Applied section.</p>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {activeTab === 'institutes' && (
                    <div className="recruiter-institutes-tab">
                        <div className="institutes-filter-section">
                            <select 
                                className="recruiter-filter-select"
                                value={selectedJobFilter}
                                onChange={(e) => setSelectedJobFilter(e.target.value)}
                            >
                                <option value="all">All Applied Jobs</option>
                                {jobPostings.map(job => (
                                    <option key={job.jobId} value={job.jobId}>{job.title}</option>
                                ))}
                            </select>
                        </div>
                        
                        {institutesLoading ? (
                            <div className="loading-section">
                                <p>Loading students applied...</p>
                            </div>
                        ) : filteredInstitutes.length > 0 ? (
                            <div className="institutes-grid">
                                {filteredInstitutes.map((institute) => (
                                    <div key={institute.instituteId} className="institute-card">
                                        <div className="institute-header">
                                            <h3 className="institute-name">
                                                {institute.instituteName}
                                            </h3>
                                        </div>
                                        
                                        <div className="institute-contact">
                                            <div className="contact-item">
                                                <span className="contact-icon">📞</span>
                                                <span>{institute.phone || 'Phone Available'}</span>
                                            </div>
                                            <div className="contact-item">
                                                <span className="contact-icon">📧</span>
                                                <span>{institute.email}</span>
                                            </div>
                                            <div className="contact-item">
                                                <span className="contact-icon">🌐</span>
                                                <span>{institute.website || 'Website Available'}</span>
                                            </div>
                                        </div>

                                        
                                        <div className="applied-jobs-section">
                                            <h4>Applied Jobs ({institute.totalApplications})</h4>
                                            <div className="applied-jobs-list">
                                                {institute.appliedJobs.map((job, index) => (
                                                    <div key={index} className="applied-job-item">
                                                        <div className="job-info">
                                                            <span className="job-title">{job.jobTitle}</span>
                                                            <span className="applied-date">[{formatDate(job.appliedAt)}]</span>
                                                        </div>
                                                        <button 
                                                            className="view-students-btn"
                                                            onClick={() => handleViewJobStudents(institute, job)}
                                                        >
                                                            View Students
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <div className="institute-actions">
                                            <button 
                                                className="view-details-btn"
                                                onClick={() => window.open(`/institute/${institute.instituteId}`, '_blank')}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                        
                                        <div className="institute-hiring-history-section" style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e0e0e0'}}>
                                            <button 
                                                className="hiring-history-btn"
                                                onClick={() => handleViewHiringHistory(institute)}
                                                style={{
                                                    width: '100%',
                                                    backgroundColor: '#28a745',
                                                    color: 'white',
                                                    padding: '10px 16px',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                📋 Hiring History
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="recruiter-empty-state">
                                <p>No students have applied to your jobs yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'campus-requests' && (
                    <div className="recruiter-campus-requests-tab">
                        <div className="rci-header">
                            <div>
                                <h1 className="rci-title">Campus Invites</h1>
                                <p className="rci-subtitle">Institutes inviting you for campus placement drives</p>
                            </div>
                            <div className="rci-stats-row">
                                <div className="rci-count-badge">{campusRequests.length} invite{campusRequests.length !== 1 ? 's' : ''}</div>
                                {campusRequests.filter(r => r.status === 'pending').length > 0 && (
                                    <div className="rci-pending-badge">
                                        {campusRequests.filter(r => r.status === 'pending').length} pending
                                    </div>
                                )}
                                {campusRequests.filter(r => r.status === 'confirmed').length > 0 && (
                                    <div className="rci-confirmed-badge">
                                        {campusRequests.filter(r => r.status === 'confirmed').length} confirmed
                                    </div>
                                )}
                            </div>
                        </div>

                        {campusRequestsLoading ? (
                            <div className="rci-loading">
                                <div className="rci-spinner" />
                                <p>Loading campus invites...</p>
                            </div>
                        ) : campusRequests.length > 0 ? (
                            <div className="rci-envelopes-grid">
                                {campusRequests.map((request) => (
                                    <CampusInviteEnvelope
                                        key={request.campusreq}
                                        request={request}
                                        onRefresh={async () => {
                                            await loadCampusRequests();
                                            await loadDashboardStats();
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rci-empty">
                                <div className="rci-empty-icon"><FiMail /></div>
                                <h3>No Campus Invites Yet</h3>
                                <p>When institutes send you campus drive invitations, they'll appear here as interactive envelopes.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'institute-response' && (
                    <div className="recruiter-institute-response-tab">
                        <InstituteResponseSection />
                    </div>
                )}

                {activeTab === 'contact-history' && (
                    <div className="recruiter-contact-history-tab">
                        <ContactHistory />
                    </div>
                )}

                {activeTab === 'government-schemes' && (
                    <div className="recruiter-government-schemes-tab">
                        <GovernmentSchemes />
                    </div>
                )}

                {activeTab === 'news' && (
                    <div className="recruiter-news-tab">
                        <div className="recruiter-tab-header">
                            <button 
                                className="recruiter-primary-button"
                                onClick={() => setShowNewsForm(true)}
                                disabled={loading}
                            >
                                + Add News
                            </button>
                        </div>

                        {newsLoading ? (
                            <div className="loading-section">
                                <p>Loading news...</p>
                            </div>
                        ) : (
                            <div className="recruiter-news-grid">
                                {newsItems.length > 0 ? (
                                    newsItems.map((news) => (
                                        <div key={news.recruiterNewsID || news.id} className="recruiter-news-card">
                                            {news.bannerImage && (
                                                <div className="recruiter-news-banner">
                                                    <img 
                                                        src={news.bannerImage.startsWith('http') ? news.bannerImage : `https://s3.ap-south-1.amazonaws.com/staffinn-files/${news.bannerImage}`}
                                                        alt={news.title}
                                                        className="recruiter-news-banner-image"
                                                    />
                                                </div>
                                            )}
                                            <div className="recruiter-news-content">
                                                <div className="recruiter-news-header">
                                                    <h3>{news.title}</h3>
                                                    <span className="recruiter-news-badge">NEWS</span>
                                                </div>
                                                
                                                <div className="recruiter-news-meta">
                                                    <div className="recruiter-news-meta-item">
                                                        <strong>Company:</strong> {news.company || 'Company'}
                                                    </div>
                                                    <div className="recruiter-news-meta-item">
                                                        <strong>Date:</strong> {new Date(news.date).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                
                                                {news.venue && (
                                                    <div className="recruiter-news-meta">
                                                        <div className="recruiter-news-meta-item">
                                                            <strong>Venue:</strong> {news.venue}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {news.expectedParticipants && (
                                                    <div className="recruiter-news-meta">
                                                        <div className="recruiter-news-meta-item">
                                                            <strong>Expected Participants:</strong> {news.expectedParticipants}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="recruiter-news-meta" style={{marginBottom: '15px'}}>
                                                    <div className="recruiter-news-meta-item">
                                                        <strong>Details:</strong> {news.details}
                                                    </div>
                                                </div>
                                                
                                                {news.verified && (
                                                    <div className="recruiter-verified-badge">
                                                        ✓ Verified
                                                    </div>
                                                )}
                                                
                                                <div className="recruiter-news-actions">
                                                    <button 
                                                        className="recruiter-table-action"
                                                        onClick={() => handleViewNews(news)}
                                                        disabled={loading}
                                                    >
                                                        View
                                                    </button>
                                                    <button 
                                                        className="recruiter-table-action"
                                                        onClick={() => handleEditNews(news)}
                                                        disabled={loading}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="recruiter-table-action delete"
                                                        onClick={() => handleDeleteNews(news.recruiterNewsID || news.id)}
                                                        disabled={loading}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="recruiter-empty-state">
                                        <p>No news added yet. Click "Add News" to create your first news item.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* News View Modal */}
                {showNewsView && viewingNews && (
                    <div className="recruiter-modal-overlay">
                        <div className="recruiter-job-form-modal">
                            <div className="recruiter-modal-header">
                                <h2>View News</h2>
                                <button 
                                    className="recruiter-close-modal"
                                    onClick={() => {
                                        setShowNewsView(false);
                                        setViewingNews(null);
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="recruiter-job-form" style={{padding: '30px'}}>
                                {viewingNews.bannerImage && (
                                    <div style={{marginBottom: '20px'}}>
                                        <img 
                                            src={viewingNews.bannerImage.startsWith('http') ? viewingNews.bannerImage : `https://s3.ap-south-1.amazonaws.com/staffinn-files/${viewingNews.bannerImage}`}
                                            alt={viewingNews.title}
                                            style={{width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px'}}
                                        />
                                    </div>
                                )}
                                
                                <h3 style={{margin: '0 0 15px 0', color: '#1e293b'}}>{viewingNews.title}</h3>
                                
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px'}}>
                                    <div>
                                        <strong>Date:</strong> {new Date(viewingNews.date).toLocaleDateString()}
                                    </div>
                                    <div>
                                        <strong>Company:</strong> {viewingNews.company}
                                    </div>
                                    {viewingNews.venue && (
                                        <div>
                                            <strong>Venue:</strong> {viewingNews.venue}
                                        </div>
                                    )}
                                    {viewingNews.expectedParticipants && (
                                        <div>
                                            <strong>Expected Participants:</strong> {viewingNews.expectedParticipants}
                                        </div>
                                    )}
                                </div>
                                
                                <div style={{marginBottom: '20px'}}>
                                    <strong>Details:</strong>
                                    <p style={{marginTop: '8px', lineHeight: '1.6', color: '#64748b'}}>{viewingNews.details}</p>
                                </div>
                                
                                {viewingNews.verified && (
                                    <div style={{marginBottom: '20px'}}>
                                        <span className="recruiter-verified-badge">✓ Verified News</span>
                                    </div>
                                )}
                                
                                <div className="recruiter-form-actions">
                                    <button 
                                        type="button" 
                                        className="recruiter-cancel-btn"
                                        onClick={() => {
                                            setShowNewsView(false);
                                            setViewingNews(null);
                                        }}
                                    >
                                        Close
                                    </button>
                                    <button 
                                        type="button" 
                                        className="recruiter-submit-btn"
                                        onClick={() => {
                                            setShowNewsView(false);
                                            setViewingNews(null);
                                            handleEditNews(viewingNews);
                                        }}
                                    >
                                        Edit News
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="recruiter-profile-tab">
                        <div className="profile-update-notice">
                            <p>📢 <strong>Note:</strong> Changes will only appear on your public profile after clicking "Update Profile & Go Live" button.</p>
                        </div>
                        
                        <form onSubmit={handleProfileSubmit} className="recruiter-profile-form">
                            {/* Profile Photo Upload */}
                            <div className="recruiter-profile-section">
                                <h2>Profile Photo</h2>
                                <div className="profile-photo-upload">
                                    <div className="current-photo">
                                        {(tempProfilePhoto || (profilePhoto && profilePhoto !== '')) && !uploadingPhoto ? (
                                            <img 
                                                src={tempProfilePhoto || profilePhoto} 
                                                alt="Profile" 
                                                className="profile-photo-preview"
                                                onError={(e) => {
                                                    console.error('Failed to load profile photo:', tempProfilePhoto || profilePhoto);
                                                    if (tempProfilePhoto) {
                                                        setTempProfilePhoto(null);
                                                    } else {
                                                        setProfilePhoto(null);
                                                        updateAllImages(null);
                                                    }
                                                }}
                                                onLoad={() => console.log('Profile photo loaded successfully:', tempProfilePhoto || profilePhoto)}
                                            />
                                        ) : (
                                            <div className="photo-placeholder">
                                                {uploadingPhoto ? '⏳' : (profileForm.companyName.charAt(0) || 'C')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="photo-upload-controls">
                                        <input
                                            type="file"
                                            id="profilePhotoInput"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            style={{ display: 'none' }}
                                        />
                                        <button
                                            type="button"
                                            className="upload-photo-btn"
                                            onClick={() => document.getElementById('profilePhotoInput').click()}
                                            disabled={uploadingPhoto}
                                        >
                                            {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                                        </button>
                                        {(tempProfilePhoto || (profilePhoto && profilePhoto !== '')) && (
                                            <button
                                                type="button"
                                                className="remove-photo-btn"
                                                onClick={() => {
                                                    if (tempProfilePhoto) {
                                                        setTempProfilePhoto(null);
                                                    } else {
                                                        setProfilePhoto(null);
                                                        setTempProfilePhoto(null);
                                                        updateAllImages(null);
                                                    }
                                                }}
                                            >
                                                Remove Photo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Company Information */}
                            <div className="recruiter-profile-section">
                                <h2>Company Information</h2>
                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>Company Name *</label>
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={profileForm.companyName}
                                            onChange={handleProfileInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="recruiter-form-group">
                                        <label>Industry *</label>
                                        <input
                                            type="text"
                                            name="industry"
                                            value={profileForm.industry}
                                            onChange={handleProfileInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>Location *</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={profileForm.location}
                                            onChange={handleProfileInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="recruiter-form-group">
                                        <label>Pincode</label>
                                        <input
                                            type="text"
                                            name="pincode"
                                            value={profileForm.pincode}
                                            onChange={handleProfileInputChange}
                                            placeholder="Enter pincode"
                                        />
                                    </div>
                                </div>
                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>Website</label>
                                        <input
                                            type="url"
                                            name="website"
                                            value={profileForm.website}
                                            onChange={handleProfileInputChange}
                                            placeholder="https://yourcompany.com"
                                        />
                                    </div>
                                </div>

                                {/* Social Links */}
                                <div className="recruiter-social-links-section">
                                    <h3 className="recruiter-social-links-heading">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                                        Social Links
                                    </h3>
                                    <div className="recruiter-form-row">
                                        <div className="recruiter-form-group recruiter-social-input-group">
                                            <label>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                                LinkedIn
                                            </label>
                                            <input
                                                type="url"
                                                name="linkedin"
                                                value={profileForm.linkedin}
                                                onChange={handleProfileInputChange}
                                                placeholder="https://linkedin.com/company/yourcompany"
                                            />
                                        </div>
                                        <div className="recruiter-form-group recruiter-social-input-group">
                                            <label>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#000000"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                                X (Twitter)
                                            </label>
                                            <input
                                                type="url"
                                                name="twitter"
                                                value={profileForm.twitter}
                                                onChange={handleProfileInputChange}
                                                placeholder="https://x.com/yourhandle"
                                            />
                                        </div>
                                    </div>
                                    <div className="recruiter-form-row">
                                        <div className="recruiter-form-group recruiter-social-input-group">
                                            <label>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="url(#ig-grad)">
                                                    <defs>
                                                        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor="#f09433"/>
                                                            <stop offset="25%" stopColor="#e6683c"/>
                                                            <stop offset="50%" stopColor="#dc2743"/>
                                                            <stop offset="75%" stopColor="#cc2366"/>
                                                            <stop offset="100%" stopColor="#bc1888"/>
                                                        </linearGradient>
                                                    </defs>
                                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                                                </svg>
                                                Instagram
                                            </label>
                                            <input
                                                type="url"
                                                name="instagram"
                                                value={profileForm.instagram}
                                                onChange={handleProfileInputChange}
                                                placeholder="https://instagram.com/yourhandle"
                                            />
                                        </div>
                                        <div className="recruiter-form-group recruiter-social-input-group">
                                            <label>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                                Facebook
                                            </label>
                                            <input
                                                type="url"
                                                name="facebook"
                                                value={profileForm.facebook}
                                                onChange={handleProfileInputChange}
                                                placeholder="https://facebook.com/yourpage"
                                            />
                                        </div>
                                    </div>
                                    <div className="recruiter-form-row">
                                        <div className="recruiter-form-group recruiter-social-input-group">
                                            <label>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                                YouTube
                                            </label>
                                            <input
                                                type="url"
                                                name="youtube"
                                                value={profileForm.youtube}
                                                onChange={handleProfileInputChange}
                                                placeholder="https://youtube.com/@yourchannel"
                                            />
                                        </div>
                                        <div className="recruiter-form-group recruiter-social-input-group">
                                            <label>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#181717"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                                                GitHub
                                            </label>
                                            <input
                                                type="url"
                                                name="github"
                                                value={profileForm.github}
                                                onChange={handleProfileInputChange}
                                                placeholder="https://github.com/yourorg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>GST Number</label>
                                        <input
                                            type="text"
                                            name="gstNumber"
                                            value={profileForm.gstNumber}
                                            onChange={(e) => {
                                                const value = e.target.value.toUpperCase();
                                                setProfileForm(prev => ({ ...prev, gstNumber: value }));
                                            }}
                                            placeholder="22AAAAA0000A1Z5"
                                            maxLength="15"
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                        <small style={{ color: '#666', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                                            Format: 15 characters (e.g., 22AAAAA0000A1Z5) - Private field, not shown publicly
                                        </small>
                                    </div>
                                    <div className="recruiter-form-group">
                                        <label>PAN Number</label>
                                        <input
                                            type="text"
                                            name="panNumber"
                                            value={profileForm.panNumber}
                                            onChange={(e) => {
                                                const value = e.target.value.toUpperCase();
                                                setProfileForm(prev => ({ ...prev, panNumber: value }));
                                            }}
                                            placeholder="ABCDE1234F"
                                            maxLength="10"
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                        <small style={{ color: '#666', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                                            Format: 10 characters (e.g., ABCDE1234F) - Private field, not shown publicly
                                        </small>
                                    </div>
                                </div>
                                <div className="recruiter-form-group">
                                    <label>Company Description *</label>
                                    <textarea
                                        name="companyDescription"
                                        value={profileForm.companyDescription}
                                        onChange={handleProfileInputChange}
                                        required
                                        rows="4"
                                        placeholder="Describe your company..."
                                    />
                                </div>
                            </div>

                            {/* Recruiter Information */}
                            <div className="recruiter-profile-section">
                                <h2>Recruiter Information</h2>
                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>Email (Login Email)</label>
                                        <input
                                            type="email"
                                            value={currentUser?.email || ''}
                                            disabled
                                            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                        />
                                        <small style={{ color: '#666', fontSize: '0.8rem' }}>This is your login email and cannot be changed</small>
                                    </div>
                                </div>
                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>Recruiter Name *</label>
                                        <input
                                            type="text"
                                            name="recruiterName"
                                            value={profileForm.recruiterName}
                                            onChange={handleProfileInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="recruiter-form-group">
                                        <label>Designation *</label>
                                        <input
                                            type="text"
                                            name="designation"
                                            value={profileForm.designation}
                                            onChange={handleProfileInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>Hiring Experience *</label>
                                        <input
                                            type="text"
                                            name="experience"
                                            value={profileForm.experience}
                                            onChange={handleProfileInputChange}
                                            required
                                            placeholder="e.g. 5+ years"
                                        />
                                    </div>
                                    <div className="recruiter-form-group">
                                        <label>Phone</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={profileForm.phone}
                                            onChange={handleProfileInputChange}
                                            placeholder="+91 9876543210"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Perks & Benefits */}
                            <div className="recruiter-profile-section">
                                <div className="recruiter-section-header">
                                    <h2>Perks & Benefits</h2>
                                    <button
                                        type="button"
                                        className="recruiter-add-btn"
                                        onClick={addPerk}
                                    >
                                        + Add Perk
                                    </button>
                                </div>
                                {profileForm.perks.map((perk, index) => (
                                    <div key={index} className="recruiter-perk-item-enhanced">
                                        <div className="perk-header">
                                            <h4>Perk #{index + 1}</h4>
                                            <button
                                                type="button"
                                                className="recruiter-remove-btn small"
                                                onClick={() => removePerk(index)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="recruiter-form-group">
                                            <label>Title *</label>
                                            <input
                                                type="text"
                                                value={perk.title || ''}
                                                onChange={(e) => handlePerkChange(index, 'title', e.target.value)}
                                                placeholder="e.g., Health Insurance"
                                                required
                                            />
                                        </div>
                                        <div className="recruiter-form-group">
                                            <label>Description *</label>
                                            <textarea
                                                value={perk.description || ''}
                                                onChange={(e) => handlePerkChange(index, 'description', e.target.value)}
                                                placeholder="Describe this benefit in detail..."
                                                rows="3"
                                                required
                                            />
                                        </div>
                                        <div className="recruiter-form-group">
                                            <label>Image (Optional)</label>
                                            {perk.image ? (
                                                <div className="perk-image-preview">
                                                    <img src={perk.image} alt={perk.title} />
                                                    <button
                                                        type="button"
                                                        className="remove-image-btn"
                                                        onClick={() => handleRemovePerkImage(index)}
                                                    >
                                                        Remove Image
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="perk-image-upload">
                                                    <input
                                                        type="file"
                                                        id={`perk-image-${index}`}
                                                        accept="image/*"
                                                        onChange={(e) => handlePerkImageUpload(index, e)}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="upload-image-btn"
                                                        onClick={() => document.getElementById(`perk-image-${index}`).click()}
                                                    >
                                                        Upload Image
                                                    </button>
                                                    <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '8px', display: 'block' }}>
                                                        Recommended: 400x300px, Max 5MB
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Hiring Process */}
                            <div className="recruiter-profile-section">
                                <div className="recruiter-section-header">
                                    <h2>Hiring Process</h2>
                                    <button
                                        type="button"
                                        className="recruiter-add-btn"
                                        onClick={addHiringStep}
                                    >
                                        + Add Step
                                    </button>
                                </div>
                                {profileForm.hiringSteps.map((step, index) => (
                                    <div key={index} className="recruiter-hiring-step-item">
                                        <div className="recruiter-step-header">
                                            <div className="recruiter-step-number">{index + 1}</div>
                                            <button
                                                type="button"
                                                className="recruiter-remove-btn"
                                                onClick={() => removeHiringStep(index)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="recruiter-form-group">
                                            <label>Step Title</label>
                                            <input
                                                type="text"
                                                value={step.title}
                                                onChange={(e) => handleHiringStepChange(index, 'title', e.target.value)}
                                                placeholder="e.g. Online Application"
                                            />
                                        </div>
                                        <div className="recruiter-form-group">
                                            <label>Step Description</label>
                                            <textarea
                                                value={step.description}
                                                onChange={(e) => handleHiringStepChange(index, 'description', e.target.value)}
                                                placeholder="Describe this step in detail..."
                                                rows="2"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Office Images section removed - images now managed per location */}

                            {/* Office Locations & Units */}
                            <div className="recruiter-profile-section">
                                <div className="recruiter-section-header">
                                    <h2>Office Locations &amp; Units</h2>
                                    <button
                                        type="button"
                                        className="recruiter-add-btn"
                                        onClick={addOfficeLocation}
                                    >
                                        + Add Location
                                    </button>
                                </div>
                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', marginTop: '-4px' }}>
                                    Add your office branches/units with location details and photos.
                                </p>

                                {(profileForm.officeLocations || []).length === 0 && (
                                    <div className="no-images-message">
                                        <p>No office locations added yet. Click "+ Add Location" to add your first branch.</p>
                                    </div>
                                )}

                                {(profileForm.officeLocations || []).map((loc, locIdx) => (
                                    <div key={loc.id} style={{
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '12px',
                                        padding: '18px',
                                        marginBottom: '16px',
                                        background: '#FAFBFF'
                                    }}>
                                        {/* Location header */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                            <span style={{ fontWeight: '700', fontSize: '14px', color: '#0F172A' }}>
                                                📍 Office Location #{locIdx + 1}
                                            </span>
                                            <button
                                                type="button"
                                                className="recruiter-remove-btn"
                                                onClick={() => removeOfficeLocation(loc.id)}
                                                style={{ padding: '4px 12px', fontSize: '12px' }}
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        {/* Location Name */}
                                        <div style={{ marginBottom: '12px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                                                Location Name / Address *
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Jaipur, Rajasthan or 123 MG Road, Bangalore"
                                                value={loc.locationName}
                                                onChange={(e) => updateOfficeLocation(loc.id, 'locationName', e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px 12px',
                                                    border: '1px solid #D1D5DB',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                        </div>

                                        {/* Unit Count */}
                                        <div style={{ marginBottom: '14px' }}>
                                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                                                Number of Office Units at this Location
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="999"
                                                value={loc.unitCount}
                                                onChange={(e) => updateOfficeLocation(loc.id, 'unitCount', e.target.value)}
                                                style={{
                                                    width: '120px',
                                                    padding: '10px 12px',
                                                    border: '1px solid #D1D5DB',
                                                    borderRadius: '8px',
                                                    fontSize: '14px',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>

                                        {/* Location Images */}
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                                                    Office Images
                                                </label>
                                                <div>
                                                    <input
                                                        type="file"
                                                        id={`locImageInput_${loc.id}`}
                                                        accept="image/*"
                                                        onChange={(e) => handleLocationImageUpload(e, loc.id)}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="recruiter-add-btn"
                                                        style={{ fontSize: '12px', padding: '6px 12px' }}
                                                        onClick={() => document.getElementById(`locImageInput_${loc.id}`).click()}
                                                        disabled={uploadingLocationImage[loc.id]}
                                                    >
                                                        {uploadingLocationImage[loc.id] ? 'Uploading...' : '+ Add Image'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="recruiter-office-images-grid">
                                                {(loc.images || []).map((imgUrl, imgIdx) => (
                                                    <div key={`loc-perm-${imgIdx}`} className="recruiter-office-image-item">
                                                        <img src={imgUrl} alt={`${loc.locationName} ${imgIdx + 1}`} className="office-image-preview" />
                                                        <button
                                                            type="button"
                                                            className="recruiter-remove-btn image-remove-btn"
                                                            onClick={() => removeLocationImage(loc.id, imgIdx, false)}
                                                        >Remove</button>
                                                    </div>
                                                ))}
                                                {(loc.tempImages || []).map((imgUrl, imgIdx) => (
                                                    <div key={`loc-temp-${imgIdx}`} className="recruiter-office-image-item temp-image">
                                                        <img src={imgUrl} alt={`${loc.locationName} pending ${imgIdx + 1}`} className="office-image-preview" />
                                                        <button
                                                            type="button"
                                                            className="recruiter-remove-btn image-remove-btn"
                                                            onClick={() => removeLocationImage(loc.id, imgIdx, true)}
                                                        >Remove</button>
                                                        <div className="temp-image-badge">Pending</div>
                                                    </div>
                                                ))}
                                                {(loc.images || []).length === 0 && (loc.tempImages || []).length === 0 && (
                                                    <p style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No photos for this location yet.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Interview Questions */}
                            <div className="recruiter-profile-section">
                                <div className="recruiter-section-header">
                                    <h2>Expectations from Candidates</h2>
                                    <button
                                        type="button"
                                        className="recruiter-add-btn"
                                        onClick={addQuestion}
                                    >
                                        + Add Question
                                    </button>
                                </div>
                                {profileForm.interviewQuestions.map((question, index) => (
                                    <div key={index} className="recruiter-question-item">
                                        <div className="recruiter-form-row">
                                            <div className="recruiter-form-group">
                                                <label>Question {index + 1}</label>
                                                <input
                                                    type="text"
                                                    value={question}
                                                    onChange={(e) => handleQuestionChange(index, e.target.value)}
                                                    placeholder="Enter interview question..."
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="recruiter-remove-btn small"
                                                onClick={() => removeQuestion(index)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Awards & Achievements */}
                            <div className="recruiter-profile-section">
                                <div className="recruiter-section-header">
                                    <h2>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight:'8px',verticalAlign:'middle'}}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                                        Awards & Achievements
                                    </h2>
                                    <button
                                        type="button"
                                        className="recruiter-add-btn"
                                        onClick={addAward}
                                    >
                                        + Add Award
                                    </button>
                                </div>
                                {profileForm.awards.length === 0 && (
                                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '8px' }}>
                                        No awards added yet. Click "+ Add Award" to showcase your company's achievements.
                                    </p>
                                )}
                                {profileForm.awards.map((award, index) => (
                                    <div key={index} className="recruiter-award-item">
                                        <div className="perk-header">
                                            <h4>Award #{index + 1}</h4>
                                            <button
                                                type="button"
                                                className="recruiter-remove-btn small"
                                                onClick={() => removeAward(index)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="recruiter-form-group">
                                            <label>Title *</label>
                                            <input
                                                type="text"
                                                value={award.title || ''}
                                                onChange={(e) => handleAwardChange(index, 'title', e.target.value)}
                                                placeholder="e.g., Best Startup Award 2025"
                                                required
                                            />
                                        </div>
                                        <div className="recruiter-form-group">
                                            <label>Description *</label>
                                            <textarea
                                                value={award.description || ''}
                                                onChange={(e) => handleAwardChange(index, 'description', e.target.value)}
                                                placeholder="Describe this award or achievement in detail..."
                                                rows="3"
                                                required
                                            />
                                        </div>
                                        <div className="recruiter-form-group">
                                            <label>Image (Optional)</label>
                                            {award.image ? (
                                                <div className="perk-image-preview">
                                                    <img src={award.image} alt={award.title} />
                                                    <button
                                                        type="button"
                                                        className="remove-image-btn"
                                                        onClick={() => handleRemoveAwardImage(index)}
                                                    >
                                                        Remove Image
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="perk-image-upload">
                                                    <input
                                                        type="file"
                                                        id={`award-image-${index}`}
                                                        accept="image/*"
                                                        onChange={(e) => handleAwardImageUpload(index, e)}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="upload-image-btn"
                                                        onClick={() => document.getElementById(`award-image-${index}`).click()}
                                                    >
                                                        Upload Image
                                                    </button>
                                                    <small style={{ color: '#666', fontSize: '0.8rem', marginTop: '8px', display: 'block' }}>
                                                        Recommended: 800x600px, Max 5MB
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Change Password Section */}
                            <div className="recruiter-profile-section">
                                <h2>Change Password</h2>
                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>Current Password</label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            value={passwordForm.currentPassword}
                                            onChange={handlePasswordInputChange}
                                            placeholder="Enter current password"
                                        />
                                    </div>
                                    <div className="recruiter-form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwordForm.newPassword}
                                            onChange={handlePasswordInputChange}
                                            placeholder="Enter new password"
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="button" 
                                    className="recruiter-change-password-btn"
                                    onClick={handleChangePassword}
                                    disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword}
                                >
                                    {loading ? 'Changing Password...' : 'Change Password'}
                                </button>
                            </div>

                            {/* Submit Button */}
                            <div className="recruiter-profile-actions">
                                <button type="submit" className="recruiter-save-profile-btn" disabled={loading}>
                                    {loading ? 'Updating Profile...' : 'Update Profile & Go Live'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                
                {/* Students Modal */}
                {showStudentsModal && selectedInstitute && (
                    <div className="recruiter-modal-overlay" data-lenis-prevent>
                        <div className="recruiter-students-modal" data-lenis-prevent>
                            <div className="recruiter-modal-header">
                                <h2>Students from {selectedInstitute.instituteName}</h2>
                                <button 
                                    className="recruiter-close-modal"
                                    onClick={closeStudentsModal}
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="students-modal-content">
                                {studentsLoading ? (
                                    <div className="loading-section">
                                        <p>Loading students...</p>
                                    </div>
                                ) : selectedInstituteStudents.length > 0 ? (
                                    <>
                                        <div className="students-table-container">
                                            <table className="students-table">
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Email</th>
                                                        <th>Qualification</th>
                                                        <th>Center</th>
                                                        <th>Course</th>
                                                        <th>Hiring</th>
                                                        <th>Skills</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedInstituteStudents.map((student) => (
                                                        <tr key={student.instituteStudntsID}>
                                                            <td>
                                                                <div className="student-name-cell">
                                                                    {student.isMisStudent && (
                                                                        <span className="staffinn-verified-badge-pill">
                                                                            ✓ Staffinn Verified
                                                                        </span>
                                                                    )}
                                                                    <span className={student.isMisStudent ? 'student-name-bold' : ''}>{student.fullName}</span>
                                                                </div>
                                                            </td>
                                                            <td>{student.email}</td>
                                                            <td>{student.isMisStudent ? (student.qualification || 'N/A') : (student.degreeName || 'N/A')}</td>
                                                            <td>{student.isMisStudent ? (student.trainingCenter || 'MIS Center') : (student.specialization || 'N/A')}</td>
                                                            <td>{student.isMisStudent ? (student.course || 'N/A') : (student.expectedYearOfPassing || 'N/A')}</td>
                                                            <td>
                                                                <div className="hiring-action-btns">
                                                                    <button 
                                                                        className="hire-action-btn hired"
                                                                        onClick={() => handleHireInstituteStudent(student, 'Hired')}
                                                                        disabled={loading}
                                                                    >
                                                                        ✓ Hire
                                                                    </button>
                                                                    <button 
                                                                        className="hire-action-btn rejected"
                                                                        onClick={() => handleHireInstituteStudent(student, 'Rejected')}
                                                                        disabled={loading}
                                                                    >
                                                                        ✕ Reject
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="skills-compact">
                                                                    {student.skills && student.skills.length > 0 ? (
                                                                        student.skills.slice(0, 2).map((skill, index) => (
                                                                            <span key={index} className="skill-tag-small">{skill}</span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="no-skills">No skills</span>
                                                                    )}
                                                                    {student.skills && student.skills.length > 2 && (
                                                                        <span className="more-skills">+{student.skills.length - 2}</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <button 
                                                                    className="view-profile-btn-small"
                                                                    onClick={() => handleViewStudentProfile(student)}
                                                                >
                                                                    View Profile
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        {/* Download All Students Detail Button */}
                                        <div className="download-students-section">
                                            <button 
                                                className="download-all-students-btn"
                                                onClick={downloadStudentsExcel}
                                                disabled={loading}
                                            >
                                                📥 Download All Students Detail
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="no-students">
                                        <p>This institute has not added any students yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Student Profile Modal - Enhanced with actual document display */}
                {showStudentProfileModal && selectedStudentProfile && (
                    <div className="institute-modal-overlay" onClick={closeStudentProfileModal}>
                        <div className="institute-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="institute-modal-header">
                                <h2>Student Profile</h2>
                                <button className="institute-close-button" onClick={closeStudentProfileModal}>×</button>
                            </div>
                            
                            <div className="institute-student-profile-view">
                                {loading ? (
                                    <div style={{textAlign: 'center', padding: '40px'}}>
                                        <p>Loading student details...</p>
                                    </div>
                                ) : selectedStudentProfile ? (
                                    <>
                                        <div className="institute-profile-section">
                                            <h4>Basic Details</h4>
                                            <div className="institute-profile-grid">
                                                <div className="institute-profile-item">
                                                    <strong>Full Name:</strong>
                                                    <span>{selectedStudentProfile.fullName || 'Not provided'}</span>
                                                </div>
                                                <div className="institute-profile-item">
                                                    <strong>Email:</strong>
                                                    <span>{selectedStudentProfile.email || 'Not provided'}</span>
                                                </div>
                                                <div className="institute-profile-item">
                                                    <strong>Phone:</strong>
                                                    <span>{selectedStudentProfile.phoneNumber || 'Not provided'}</span>
                                                </div>
                                                <div className="institute-profile-item">
                                                    <strong>Date of Birth:</strong>
                                                    <span>{selectedStudentProfile.dateOfBirth || 'Not provided'}</span>
                                                </div>
                                                <div className="institute-profile-item">
                                                    <strong>Gender:</strong>
                                                    <span>{selectedStudentProfile.gender || 'Not provided'}</span>
                                                </div>
                                                <div className="institute-profile-item">
                                                    <strong>Address:</strong>
                                                    <span>{selectedStudentProfile.address || 'Not provided'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="institute-profile-section">
                                            <h4>Academic Information</h4>
                                            <div className="institute-academic-grid">
                                                <div className="institute-academic-section">
                                                    <h5>10th Grade</h5>
                                                    <p><strong>Board:</strong> {selectedStudentProfile.tenthGradeDetails || 'Not provided'}</p>
                                                    <p><strong>Percentage/Grade:</strong> {selectedStudentProfile.tenthPercentage || 'Not provided'}</p>
                                                    <p><strong>Year of Passing:</strong> {selectedStudentProfile.tenthYearOfPassing || 'Not provided'}</p>
                                                </div>
                                                <div className="institute-academic-section">
                                                    <h5>12th Grade</h5>
                                                    <p><strong>Board:</strong> {selectedStudentProfile.twelfthGradeDetails || 'Not provided'}</p>
                                                    <p><strong>Percentage/Grade:</strong> {selectedStudentProfile.twelfthPercentage || 'Not provided'}</p>
                                                    <p><strong>Year of Passing:</strong> {selectedStudentProfile.twelfthYearOfPassing || 'Not provided'}</p>
                                                </div>
                                                <div className="institute-academic-section">
                                                    <h5>Graduation</h5>
                                                    <p><strong>Degree:</strong> {selectedStudentProfile.degreeName || 'Not provided'}</p>
                                                    <p><strong>Specialization:</strong> {selectedStudentProfile.specialization || 'Not provided'}</p>
                                                    <p><strong>Expected Year:</strong> {selectedStudentProfile.expectedYearOfPassing || 'Not provided'}</p>
                                                    <p><strong>Currently Pursuing:</strong> {selectedStudentProfile.currentlyPursuing ? 'Yes' : 'No'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="institute-profile-section">
                                            <h4>Additional Information</h4>
                                            <div className="institute-profile-item">
                                                <strong>Skills:</strong>
                                                <div className="institute-skills-display">
                                                    {selectedStudentProfile.skills && Array.isArray(selectedStudentProfile.skills) && selectedStudentProfile.skills.length > 0 ? 
                                                        selectedStudentProfile.skills.map((skill, index) => (
                                                            <span key={index} className="institute-skill-tag">{skill}</span>
                                                        )) : 
                                                        <span>No skills listed</span>
                                                    }
                                                </div>
                                            </div>
                                        </div>

                                        <div className="institute-profile-section">
                                            <h4>Documents</h4>
                                            <div className="institute-documents-grid">
                                                <div className="institute-document-item">
                                                    <strong>Profile Photo:</strong>
                                                    {selectedStudentProfile.profilePhoto ? (
                                                        <div className="document-preview">
                                                            <img 
                                                                src={selectedStudentProfile.profilePhoto} 
                                                                alt="Profile Photo" 
                                                                style={{
                                                                    maxWidth: '150px', 
                                                                    maxHeight: '150px', 
                                                                    borderRadius: '8px',
                                                                    cursor: 'pointer',
                                                                    border: '2px solid #ddd'
                                                                }}
                                                                onClick={() => window.open(selectedStudentProfile.profilePhoto, '_blank')}
                                                            />
                                                            <br />
                                                            <button 
                                                                onClick={() => window.open(selectedStudentProfile.profilePhoto, '_blank')}
                                                                style={{
                                                                    marginTop: '8px',
                                                                    padding: '4px 8px',
                                                                    backgroundColor: '#007bff',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px'
                                                                }}
                                                            >
                                                                View Full Size
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span>Not uploaded</span>
                                                    )}
                                                </div>
                                                <div className="institute-document-item">
                                                    <strong>Resume:</strong>
                                                    {selectedStudentProfile.resume ? (
                                                        <div className="document-preview">
                                                            <div style={{
                                                                padding: '12px',
                                                                border: '2px solid #28a745',
                                                                borderRadius: '8px',
                                                                backgroundColor: '#f8f9fa',
                                                                textAlign: 'center',
                                                                maxWidth: '200px'
                                                            }}>
                                                                <div style={{fontSize: '24px', marginBottom: '8px'}}>📄</div>
                                                                <div style={{fontSize: '14px', fontWeight: 'bold', marginBottom: '8px'}}>Resume Document</div>
                                                                <button 
                                                                    onClick={() => window.open(selectedStudentProfile.resume, '_blank')}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#28a745',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '12px'
                                                                    }}
                                                                >
                                                                    📥 View Resume
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span>Not uploaded</span>
                                                    )}
                                                </div>
                                                <div className="institute-document-item">
                                                    <strong>Certificates:</strong>
                                                    {selectedStudentProfile.certificates && selectedStudentProfile.certificates.length > 0 ? (
                                                        <div className="certificates-preview">
                                                            {selectedStudentProfile.certificates.map((cert, index) => (
                                                                <div key={index} style={{
                                                                    padding: '8px',
                                                                    border: '2px solid #ffc107',
                                                                    borderRadius: '6px',
                                                                    backgroundColor: '#fff3cd',
                                                                    margin: '4px 0',
                                                                    textAlign: 'center',
                                                                    maxWidth: '180px'
                                                                }}>
                                                                    <div style={{fontSize: '20px', marginBottom: '4px'}}>🏆</div>
                                                                    <div style={{fontSize: '12px', fontWeight: 'bold', marginBottom: '6px'}}>Certificate {index + 1}</div>
                                                                    <button 
                                                                        onClick={() => window.open(cert, '_blank')}
                                                                        style={{
                                                                            padding: '4px 8px',
                                                                            backgroundColor: '#ffc107',
                                                                            color: '#212529',
                                                                            border: 'none',
                                                                            borderRadius: '3px',
                                                                            cursor: 'pointer',
                                                                            fontSize: '11px'
                                                                        }}
                                                                    >
                                                                        📜 View Certificate
                                                                    </button>
                                                                </div>
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
                                                onClick={closeStudentProfileModal}
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="institute-modal-error">
                                        <h3>Error Loading Student</h3>
                                        <p>Unable to load student details. Please try again.</p>
                                        <div className="institute-form-buttons">
                                            <button type="button" className="institute-secondary-button" onClick={closeStudentProfileModal}>Close</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Hiring History Modal */}
                {showHiringHistoryModal && selectedInstitute && (
                    <div className="recruiter-modal-overlay">
                        <div className="recruiter-hiring-history-modal">
                            <div className="recruiter-modal-header">
                                <h2>Hiring History - {selectedInstitute.instituteName}</h2>
                                <button 
                                    className="recruiter-close-modal"
                                    onClick={() => {
                                        setShowHiringHistoryModal(false);
                                        setSelectedInstitute(null);
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="hiring-history-content">
                                {(() => {
                                    if (hiringHistory.length === 0) {
                                        return (
                                            <div className="no-hiring-history">
                                                <p>No hiring records found for this institute.</p>
                                            </div>
                                        );
                                    }
                                    
                                    // Group by job title
                                    const groupedByJob = hiringHistory.reduce((acc, record) => {
                                        const jobTitle = record.jobTitle;
                                        if (!acc[jobTitle]) {
                                            acc[jobTitle] = [];
                                        }
                                        acc[jobTitle].push(record);
                                        return acc;
                                    }, {});
                                    
                                    return (
                                        <div className="hiring-history-by-job">
                                            {Object.entries(groupedByJob).map(([jobTitle, records]) => (
                                                <div key={jobTitle} className="job-hiring-section">
                                                    <h3 className="job-title-header">{jobTitle}</h3>
                                                    <table className="recruiter-data-table full-width">
                                                        <thead>
                                                            <tr>
                                                                <th>Student Name</th>
                                                                <th>Email</th>
                                                                <th>Status</th>
                                                                <th>Date</th>
                                                                <th>Degree</th>
                                                                <th>Skills</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {records.map((record) => (
                                                                <tr key={record.hiringRecordID || record.hiringId}>
                                                                    <td>{record.studentSnapshot?.fullName || 'Student Name'}</td>
                                                                    <td>{record.studentSnapshot?.email || 'N/A'}</td>
                                                                    <td>
                                                                        <span className={`recruiter-status-badge ${record.status.toLowerCase()}`}>
                                                                            {record.status}
                                                                        </span>
                                                                    </td>
                                                                    <td>{new Date(record.timestamp || record.createdAt).toLocaleDateString()}</td>
                                                                    <td>
                                                                        {record.studentSnapshot?.degreeName ? 
                                                                            `${record.studentSnapshot.degreeName} - ${record.studentSnapshot.specialization || 'N/A'}` : 
                                                                            'N/A'
                                                                        }
                                                                    </td>
                                                                    <td>
                                                                        {record.studentSnapshot?.skills && record.studentSnapshot.skills.length > 0 ? (
                                                                            <div className="skills-compact">
                                                                                {record.studentSnapshot.skills.slice(0, 2).map((skill, index) => (
                                                                                    <span key={index} className="skill-tag-small">{skill}</span>
                                                                                ))}
                                                                                {record.studentSnapshot.skills.length > 2 && (
                                                                                    <span className="more-skills">+{record.studentSnapshot.skills.length - 2}</span>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <span>No skills</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()
                                }
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecruiterDashboard;