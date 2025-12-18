/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";
import axios from 'axios';
import HiddenUser from '../HiddenUser/HiddenUser';
import StaffCourses from './StaffCourses';
import GovernmentSchemes from './GovernmentSchemes';
import ContactHistory from '../Messages/ContactHistory';
import { getSectors, getRolesForSector } from '../../utils/sectorRoleData';
import './HiddenNotification.css';
import './Dashboard.css';
import './HiddenNotification.css';

const StaffDashboard = ({ currentUser }) => {
    const { user, updateUser } = useContext(AuthContext);
    
    // State to track active tab
    const [activeTab, setActiveTab] = useState('profile');
    
    // Handle URL tab parameter
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, []);
    
    // State to track if user is in active staff mode or seeker mode
    const [isActiveStaff, setIsActiveStaff] = useState(false);
    
    // State for profile completion popup
    const [showProfileCompletionPopup, setShowProfileCompletionPopup] = useState(false);
    const [isFirstTimeToggle, setIsFirstTimeToggle] = useState(false);
    
    // Loading and error states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadLoading, setUploadLoading] = useState({
        profilePhoto: false,
        resume: false,
        certificate: false
    });
    
    // Hidden user state
    const [isHidden, setIsHidden] = useState(false);
    const [showHiddenModal, setShowHiddenModal] = useState(false);
    
    // Mobile sidebar state
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    // Contact History is now handled by the ContactHistory component
    
    // Dashboard data states
    const [dashboardData, setDashboardData] = useState({
        totalApplications: 0,
        profileViews: 0,
        recentApplications: [],
        recentActivity: [],
        applicationTrend: []
    });
    const [dashboardLoading, setDashboardLoading] = useState(false);
    
    // Dynamic certificates state
    const [certificates, setCertificates] = useState([]);

    // Dynamic experiences state
    const [experiences, setExperiences] = useState([
        { id: 1, role: '', company: '', salary: '', startDate: '', endDate: '' }
    ]);

    // Certificate Modal State
    const [showCertificateModal, setShowCertificateModal] = useState(false);
    const [certificateForm, setCertificateForm] = useState({
        courseName: '',
        issuer: '',
        duration: '',
        issueDate: '',
        certificateFile: null
    });
    
    // Get user data from context or props
    const getUserData = () => {
        if (user) {
            return user;
        }
        if (currentUser) {
            return currentUser;
        }
        
        const userJSON = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        if (userJSON) {
            return JSON.parse(userJSON);
        }
        
        return { fullName: 'Staff Member', email: 'staff@example.com' };
    };

    const userData = getUserData();
    
    // State for profile editing
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        pincode: '',
        skills: '',
        profilePhoto: null,
        resumeUrl: null,
        sector: '',
        role: '',
        state: '',
        city: '',
        
        // Education fields
        education: {
            tenth: { percentage: '', year: '', school: '' },
            twelfth: { percentage: '', year: '', school: '' },
            graduation: { degree: '', college: '', percentage: '', startDate: '', endDate: '', pursuing: false }
        },
        
        visibility: 'public',
        availability: 'available',
        isActiveStaff: false,
        profileVisibility: 'private'
    });

    // Available roles based on selected sector
    const [availableRoles, setAvailableRoles] = useState([]);
    const sectors = getSectors();
    
    // State and City data
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const API_KEY = 'Rzk1SnVRU3NDTWpzb2ZiMERwU1RKTXRpT0R4Nmh0ZmhsZHlNM0pacw==';

    // Seeker profile state (simplified)
    const [seekerProfile, setSeekerProfile] = useState({
        fullName: '',
        email: '',
        phone: '',
        userId: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    
    // Load staff profile on component mount
    useEffect(() => {
        loadStaffProfile();
        setupSocketConnection();
        fetchStates();
    }, []);
    
    // Load dashboard data when isActiveStaff changes
    useEffect(() => {
        if (isActiveStaff) {
            loadDashboardData();
        }
    }, [isActiveStaff]);
    
    // Fetch states from API
    const fetchStates = async () => {
        try {
            const response = await axios.get(
                'https://api.countrystatecity.in/v1/countries/IN/states',
                { headers: { "X-CSCAPI-KEY": API_KEY } }
            );
            setStates(response.data);
        } catch (error) {
            console.error('Error fetching states:', error);
        }
    };
    
    // Fetch cities when state is selected
    useEffect(() => {
        const fetchCities = async () => {
            if (!selectedState) {
                setCities([]);
                return;
            }
            try {
                const response = await fetch(
                    `https://api.countrystatecity.in/v1/countries/IN/states/${selectedState}/cities`,
                    { 
                        method: 'GET',
                        headers: { "X-CSCAPI-KEY": API_KEY }
                    }
                );
                const data = await response.json();
                setCities(data);
            } catch (error) {
                console.error('Error fetching cities:', error);
            }
        };
        fetchCities();
    }, [selectedState]);
    
    // Set selected city after cities are loaded and profile city is available
    useEffect(() => {
        if (cities.length > 0 && profile.city && !selectedCity) {
            const cityObj = cities.find(c => c.name === profile.city);
            if (cityObj) {
                setSelectedCity(cityObj.id.toString());
            }
        }
    }, [cities, profile.city, selectedCity]);
    
    // Set selected state after states and profile are loaded
    useEffect(() => {
        if (states.length > 0 && profile.state && !selectedState) {
            const stateObj = states.find(s => s.name === profile.state);
            if (stateObj) {
                setSelectedState(stateObj.iso2);
            }
        }
    }, [states, profile.state, selectedState]);
    
    // Setup socket connection for real-time updates
    const setupSocketConnection = () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) return;
            
            // Use Socket.io client (assuming it's available globally or imported)
            const socket = window.io ? window.io('http://localhost:4001', {
                auth: { token }
            }) : null;
            
            if (!socket) {
                console.warn('Socket.io client not available, using fallback');
                return;
            }
            
            socket.on('connect', () => {
                console.log('Socket connected for visibility updates');
                // Check current visibility status
                socket.emit('check_visibility');
            });
            
            socket.on('visibility_update', (visibilityData) => {
                handleVisibilityUpdate(visibilityData);
            });
            
            socket.on('disconnect', () => {
                console.log('Socket disconnected');
            });
            
            socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });
            
            return () => {
                if (socket) {
                    socket.disconnect();
                }
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
    
    // Load dashboard data when mode changes
    useEffect(() => {
        if (isActiveStaff) {
            loadDashboardData();
        }
    }, [isActiveStaff]);
    
    // Load dashboard data
    const loadDashboardData = async () => {
        try {
            setDashboardLoading(true);
            const response = await api.getDashboardData();
            
            if (response.success) {
                // Get recent activities from staff profile (includes job notifications)
                const profileResponse = await api.getStaffProfile();
                const recentActivities = profileResponse.success ? (profileResponse.data.recentActivities || []) : [];
                
                // Merge existing dashboard activities with profile activities
                const existingActivities = response.data.recentActivity || [];
                const allActivities = [...recentActivities, ...existingActivities];
                
                // Remove duplicates and sort by timestamp
                const uniqueActivities = allActivities.filter((activity, index, self) => 
                    index === self.findIndex(a => a.id === activity.id || (a.message === activity.message && a.timestamp === activity.timestamp))
                ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                setDashboardData({
                    ...response.data,
                    recentActivity: uniqueActivities.slice(0, 10) // Keep only 10 most recent
                });
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setDashboardLoading(false);
        }
    };

    // Contact history is now handled by the ContactHistory component

    // Format date for display
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    };

    // Contact type utilities moved to ContactHistory component

    // Load staff profile from backend
    const loadStaffProfile = async () => {
        try {
            setLoading(true);
            console.log('🔄 Loading staff profile...');
            
            const response = await api.getStaffProfile();
            console.log('📝 Profile response:', response);
            
            if (response.success && response.data) {
                const profileData = response.data;
                console.log('📝 Profile data received:', profileData);
                
                // Update profile state
                setProfile({
                    fullName: profileData.fullName || '',
                    email: profileData.email || '',
                    phone: profileData.phone || '',
                    address: profileData.address || '',
                    pincode: profileData.pincode || '',
                    skills: profileData.skills || '',
                    profilePhoto: profileData.profilePhoto || null,
                    resumeUrl: profileData.resumeUrl || null,
                    sector: profileData.sector || '',
                    role: profileData.role || '',
                    state: profileData.state || '',
                    city: profileData.city || '',
                    education: profileData.education || {
                        tenth: { percentage: '', year: '', school: '' },
                        twelfth: { percentage: '', year: '', school: '' },
                        graduation: { degree: '', college: '', percentage: '', startDate: '', endDate: '', pursuing: false }
                    },
                    visibility: profileData.visibility || 'public',
                    availability: profileData.availability || 'available',
                    isActiveStaff: Boolean(profileData.isActiveStaff),
                    profileVisibility: profileData.profileVisibility || 'private'
                });
                
                // Update available roles if sector is set
                if (profileData.sector) {
                    const roles = getRolesForSector(profileData.sector);
                    setAvailableRoles(roles);
                }
                
                // Check if user is hidden - only show hidden message for admin actions, not for seeker mode
                // Don't show hidden message when user is in seeker mode (isActiveStaff = false)
                setIsHidden(profileData.profileVisibility === 'private' && Boolean(profileData.isActiveStaff));
                
                // Update seeker profile state
                setSeekerProfile({
                    fullName: profileData.fullName || '',
                    email: profileData.email || '',
                    phone: profileData.phone || '',
                    userId: profileData.userId || userData.userId || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                
                // Update mode state - ensure boolean conversion and persistence
                const activeStaffStatus = Boolean(profileData.isActiveStaff);
                console.log('🔄 Setting isActiveStaff from profile:', activeStaffStatus, 'from value:', profileData.isActiveStaff);
                setIsActiveStaff(activeStaffStatus);
                
                // Update experiences
                if (profileData.experiences && profileData.experiences.length > 0) {
                    setExperiences(profileData.experiences);
                }
                
                // Update certificates
                if (profileData.certificates && profileData.certificates.length > 0) {
                    setCertificates(profileData.certificates);
                }
            } else {
                console.error('❌ Profile load failed:', response.message);
                setError('Failed to load profile data: ' + (response.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Failed to load staff profile:', error);
            setError('Failed to load profile data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Handler for profile form changes
    const handleProfileChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // Handle nested education fields
        if (name.includes('_')) {
            const [section, field] = name.split('_');
            if (section === 'tenth' || section === 'twelfth' || section === 'graduation') {
                setProfile(prev => ({
                    ...prev,
                    education: {
                        ...prev.education,
                        [section]: {
                            ...prev.education[section],
                            [field]: type === 'checkbox' ? checked : value
                        }
                    }
                }));
                return;
            }
        }
        
        // Handle sector change - update available roles
        if (name === 'sector') {
            const roles = getRolesForSector(value);
            setAvailableRoles(roles);
            setProfile(prev => ({
                ...prev,
                [name]: value,
                role: '' // Reset role when sector changes
            }));
            return;
        }
        
        // Handle state change - update cities and profile
        if (name === 'state') {
            const selectedStateName = states.find(s => s.iso2 === value)?.name || '';
            setSelectedState(value);
            setSelectedCity(''); // Reset city when state changes
            setCities([]);
            setProfile(prev => ({
                ...prev,
                state: selectedStateName,
                city: '' // Reset city when state changes
            }));
            return;
        }
        
        // Handle city change - update profile
        if (name === 'city') {
            const selectedCityName = cities.find(c => c.id === parseInt(value))?.name || '';
            setSelectedCity(value);
            setProfile(prev => ({
                ...prev,
                city: selectedCityName
            }));
            return;
        }
        
        setProfile(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handler for seeker profile changes
    const handleSeekerProfileChange = (e) => {
        const { name, value } = e.target;
        setSeekerProfile({
            ...seekerProfile,
            [name]: value
        });
    };

    // Handler for experience changes
    const handleExperienceChange = (id, field, value) => {
        setExperiences(experiences.map(exp => 
            exp.id === id ? { ...exp, [field]: value } : exp
        ));
    };

    // Add new experience
    const addExperience = () => {
        const newId = Math.max(...experiences.map(exp => exp.id), 0) + 1;
        setExperiences([...experiences, { 
            id: newId, 
            role: '', 
            company: '', 
            salary: '', 
            startDate: '', 
            endDate: '' 
        }]);
    };

    // Delete experience
    const deleteExperience = (id) => {
        if (experiences.length > 1) {
            setExperiences(experiences.filter(exp => exp.id !== id));
        }
    };

    // Handler for certificate form changes
    const handleCertificateFormChange = (e) => {
        const { name, value, files } = e.target;
        setCertificateForm({
            ...certificateForm,
            [name]: files ? files[0] : value
        });
    };
    
    // Handler for "Update and Go Live" button
    const handleUpdateAndGoLive = async (e) => {
        e.preventDefault();
        
        console.log('🚀 Update and Go Live clicked');
        console.log('Current profile state:', {
            address: profile.address,
            state: profile.state,
            city: profile.city,
            pincode: profile.pincode,
            sector: profile.sector,
            role: profile.role,
            skills: profile.skills
        });
        
        // Check mandatory fields
        const missingFields = [];
        if (!profile.address?.trim()) missingFields.push('Address (House No. / Street / Area)');
        if (!profile.state?.trim()) missingFields.push('State');
        if (!profile.city?.trim()) missingFields.push('City');
        if (!profile.pincode?.trim()) missingFields.push('Pincode');
        if (!profile.sector?.trim()) missingFields.push('Choose Your Sector');
        if (!profile.role?.trim()) missingFields.push('Choose Your Role');
        if (!profile.skills?.trim()) missingFields.push('Skills (separate with commas)');
        
        if (missingFields.length > 0) {
            alert('Please fill all mandatory fields before going live:\n\n' + missingFields.join('\n'));
            return;
        }
        
        try {
            setLoading(true);
            
            const updateData = {
                fullName: profile.fullName,
                phone: profile.phone,
                address: profile.address,
                pincode: profile.pincode,
                skills: profile.skills,
                sector: profile.sector,
                role: profile.role,
                state: profile.state,
                city: profile.city,
                education: profile.education,
                visibility: profile.visibility,
                availability: profile.availability,
                experiences: experiences.filter(exp => exp.role || exp.company),
                isActiveStaff: true,
                profileVisibility: 'public'
            };
            
            console.log('📝 Sending update data:', updateData);
            
            const response = await api.updateStaffProfile(updateData);
            console.log('📝 API response:', response);
            
            if (response.success) {
                alert('Profile updated and is now live as Active Staff!');
                
                // Update user data
                const updatedUserData = {
                    ...userData,
                    fullName: profile.fullName,
                    email: profile.email,
                    phone: profile.phone
                };
                sessionStorage.setItem('currentUser', JSON.stringify(updatedUserData));
                localStorage.setItem('currentUser', JSON.stringify(updatedUserData));
                
                if (updateUser) {
                    updateUser(updatedUserData);
                }
                
                // Close popup and reload
                if (showProfileCompletionPopup) {
                    setShowProfileCompletionPopup(false);
                    setIsFirstTimeToggle(false);
                }
                
                await loadStaffProfile();
                setActiveTab('dashboard');
            } else {
                console.error('❌ API returned failure:', response);
                if (response.missingFields?.length > 0) {
                    alert('Please complete all mandatory fields:\n\n' + response.missingFields.join('\n'));
                } else {
                    throw new Error(response.message || 'Unknown error occurred');
                }
            }
        } catch (error) {
            console.error('❌ Update and go live error:', error);
            alert('Failed to update profile and go live: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handler for profile form submission (for seeker mode)
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        // This is for seeker mode - just call the seeker profile submit
        return handleSeekerProfileSubmit(e);
    };

    // Handler for seeker profile form submission
    const handleSeekerProfileSubmit = async (e) => {
        e.preventDefault();
        
        // Validate password fields if user is trying to change password
        if (seekerProfile.newPassword || seekerProfile.confirmPassword) {
            if (!seekerProfile.currentPassword) {
                alert('Please enter your current password to change password.');
                return;
            }
            if (seekerProfile.newPassword !== seekerProfile.confirmPassword) {
                alert('New password and confirm password do not match.');
                return;
            }
            if (seekerProfile.newPassword.length < 6) {
                alert('New password must be at least 6 characters long.');
                return;
            }
        }
        
        try {
            setLoading(true);
            
            // Prepare update data
            const updateData = {
                fullName: seekerProfile.fullName,
                phone: seekerProfile.phone
            };
            
            // Add password change if provided
            if (seekerProfile.newPassword) {
                updateData.password = seekerProfile.newPassword;
                updateData.currentPassword = seekerProfile.currentPassword;
            }
            
            const response = await api.updateStaffProfile(updateData);
            
            if (response.success) {
                alert('Profile updated successfully!');
                // Update user data in storage to prevent auth issues
                const updatedUserData = {
                    ...userData,
                    fullName: seekerProfile.fullName,
                    email: seekerProfile.email,
                    phone: seekerProfile.phone
                };
                sessionStorage.setItem('currentUser', JSON.stringify(updatedUserData));
                localStorage.setItem('currentUser', JSON.stringify(updatedUserData));
                // Update context if available
                if (updateUser) {
                    updateUser(updatedUserData);
                }
                // Clear password fields
                setSeekerProfile(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));
            } else {
                throw new Error(response.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            alert('Failed to update profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handler for certificate form submission
    const handleCertificateSubmit = async (e) => {
        e.preventDefault();
        
        if (!certificateForm.certificateFile) {
            alert('Please select a certificate file to upload.');
            return;
        }
        
        if (certificateForm.certificateFile.type !== 'application/pdf') {
            alert('Please upload only PDF files.');
            return;
        }

        try {
            setUploadLoading(prev => ({ ...prev, certificate: true }));
            
            // Prepare form data for file upload
            const formData = new FormData();
            formData.append('certificate', certificateForm.certificateFile);
            formData.append('certificateName', certificateForm.courseName);
            formData.append('certificateIssuer', certificateForm.issuer);
            formData.append('certificateDuration', certificateForm.duration);
            formData.append('certificateIssued', certificateForm.issueDate);
            
            const response = await api.uploadFiles(formData);
            
            if (response.success) {
                alert('Certificate uploaded successfully!');
                
                // Reload profile to get updated certificates
                await loadStaffProfile();
                
                // Reset form
                setCertificateForm({
                    courseName: '',
                    issuer: '',
                    duration: '',
                    issueDate: '',
                    certificateFile: null
                });
                setShowCertificateModal(false);
            } else {
                throw new Error(response.message || 'Failed to upload certificate');
            }
        } catch (error) {
            console.error('Certificate upload error:', error);
            alert('Failed to upload certificate: ' + error.message);
        } finally {
            setUploadLoading(prev => ({ ...prev, certificate: false }));
        }
    };

    // Delete certificate
    const deleteCertificate = async (certificateId) => {
        if (!confirm('Are you sure you want to delete this certificate?')) {
            return;
        }
        
        try {
            const response = await api.deleteCertificate(certificateId);
            
            if (response.success) {
                alert('Certificate deleted successfully!');
                // Reload profile to get updated certificates
                await loadStaffProfile();
            } else {
                throw new Error(response.message || 'Failed to delete certificate');
            }
        } catch (error) {
            console.error('Certificate delete error:', error);
            alert('Failed to delete certificate: ' + error.message);
        }
    };
    
    // Handler for file upload (profile photo and resume)
    const handleFileUpload = async (e, fileType) => {
        const file = e.target.files[0];
        if (!file) return;
        
        console.log('File selected:', file.name, file.type, file.size);
        
        // Validate file types
        if (fileType === 'profilePhoto' && !file.type.startsWith('image/')) {
            alert('Please select an image file for profile photo.');
            return;
        }
        
        if (fileType === 'resume' && file.type !== 'application/pdf') {
            alert('Please select a PDF file for resume.');
            return;
        }
        
        try {
            setUploadLoading(prev => ({ ...prev, [fileType]: true }));
            
            // Prepare form data
            const formData = new FormData();
            formData.append(fileType, file);
            
            console.log('Uploading file:', fileType, file.name);
            
            const response = await api.uploadFiles(formData);
            
            console.log('Upload response:', response);
            
            if (response.success) {
                alert(`${fileType === 'profilePhoto' ? 'Profile photo' : 'Resume'} uploaded successfully!`);
                
                // Reload profile to get updated file URLs
                await loadStaffProfile();
            } else {
                throw new Error(response.message || 'Failed to upload file');
            }
        } catch (error) {
            console.error('File upload error:', error);
            alert('Failed to upload file: ' + error.message);
        } finally {
            setUploadLoading(prev => ({ ...prev, [fileType]: false }));
        }
    };

    // Handler for removing profile photo
    const handleRemoveProfilePhoto = async () => {
        if (!confirm('Are you sure you want to remove your profile photo?')) {
            return;
        }
        
        try {
            setLoading(true);
            
            const response = await api.removeProfilePhoto();
            
            if (response.success) {
                alert('Profile photo removed successfully!');
                await loadStaffProfile();
            } else {
                throw new Error(response.message || 'Failed to remove profile photo');
            }
        } catch (error) {
            console.error('Remove photo error:', error);
            alert('Failed to remove profile photo: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Handler for toggle switch
    const handleToggleActiveStaff = async () => {
        const newActiveStaffState = !isActiveStaff;
        
        // If trying to become active staff for the first time, show popup
        if (newActiveStaffState && !profile.isActiveStaff) {
            setIsFirstTimeToggle(true);
            setShowProfileCompletionPopup(true);
            return;
        }
        
        try {
            setLoading(true);
            
            const response = await api.toggleProfileMode({ isActiveStaff: newActiveStaffState });
            
            if (response.success) {
                setIsActiveStaff(newActiveStaffState);
                
                // Reset to appropriate default tab based on mode
                if (newActiveStaffState) {
                    setActiveTab('dashboard');
                } else {
                    setActiveTab('profile');
                }
                
                alert(newActiveStaffState ? 'You are now in Active Staff mode. Your profile will be visible publicly.' : 'You are now in Seeker mode. Your profile is private.');
                
                // Reload profile to get updated data
                await loadStaffProfile();
            } else {
                // Show validation error if profile is incomplete
                if (response.missingFields && response.missingFields.length > 0) {
                    alert('Please complete your profile first. Missing fields: ' + response.missingFields.join(', '));
                } else {
                    throw new Error(response.message || 'Failed to toggle profile mode');
                }
            }
        } catch (error) {
            console.error('Toggle profile mode error:', error);
            alert('Failed to toggle profile mode: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Handler for profile completion popup close
    const handleProfileCompletionPopupClose = () => {
        setShowProfileCompletionPopup(false);
        setIsFirstTimeToggle(false);
    };
    
    // Check if profile is complete for mandatory fields
    const isProfileComplete = () => {
        return profile.address && profile.address.trim() !== '' &&
               profile.state && profile.state.trim() !== '' &&
               profile.city && profile.city.trim() !== '' &&
               profile.pincode && profile.pincode.trim() !== '' &&
               profile.sector && profile.sector.trim() !== '' &&
               profile.role && profile.role.trim() !== '' &&
               profile.skills && profile.skills.trim() !== '';
    };

    // Update tab when mode changes and persist isActiveStaff state
    useEffect(() => {
        if (!isActiveStaff && activeTab === 'dashboard') {
            setActiveTab('profile');
        }
        // Store isActiveStaff state in sessionStorage for persistence
        if (isActiveStaff !== undefined) {
            sessionStorage.setItem('isActiveStaff', JSON.stringify(isActiveStaff));
        }
    }, [isActiveStaff, activeTab]);
    
    // Restore isActiveStaff state on component mount
    useEffect(() => {
        const savedActiveStaff = sessionStorage.getItem('isActiveStaff');
        if (savedActiveStaff !== null) {
            const parsedValue = JSON.parse(savedActiveStaff);
            console.log('🔄 Restoring isActiveStaff from session:', parsedValue);
            setIsActiveStaff(parsedValue);
        }
    }, []);
    
    // Toggle mobile sidebar
    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };
    
    // Handle tab change and close mobile sidebar
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setIsMobileSidebarOpen(false);
    };

    return (
        <div className="staff-dashboard">
            {/* Hidden User Modal */}
            {showHiddenModal && isHidden && (
                <HiddenUser
                    user={userData}
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
            <button className="staff-mobile-sidebar-toggle" onClick={toggleMobileSidebar}>
                <span></span>
                <span></span>
                <span></span>
            </button>
            
            {/* Sidebar Navigation */}
            <div className={`staff-dashboard-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
                <div className="staff-sidebar-header">
                    <div className="staff-user-avatar">
                        {profile.profilePhoto ? (
                            <img src={profile.profilePhoto} alt="Profile" />
                        ) : (
                            <span>{profile.fullName ? profile.fullName.charAt(0) : 'S'}</span>
                        )}
                    </div>
                    <div className="staff-user-info">
                        <h3>{profile.fullName || userData.fullName || 'Staff Member'}</h3>
                        <p>{profile.email || userData.email || 'staff@example.com'}</p>
                        <span className={`staff-mode-indicator ${isActiveStaff ? 'active-staff' : 'seeker'}`}>
                            {isActiveStaff ? 'Active Staff' : 'Seeker Mode'}
                        </span>
                    </div>
                </div>
                
                <nav className="staff-sidebar-nav">
                    {isActiveStaff && (
                        <button 
                            className={`staff-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                            onClick={() => handleTabChange('dashboard')}
                        >
                            <i className="fas fa-tachometer-alt"></i>
                            Dashboard
                        </button>
                    )}
                    
                    <button 
                        className={`staff-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => handleTabChange('profile')}
                    >
                        <i className="fas fa-user"></i>
                        My Profile
                    </button>

                    <button 
                        className={`staff-nav-item ${activeTab === 'contact-history' ? 'active' : ''}`}
                        onClick={() => handleTabChange('contact-history')}
                    >
                        <i className="fas fa-history"></i>
                        Contact History
                    </button>
                    
                    <button 
                        className={`staff-nav-item ${activeTab === 'courses' ? 'active' : ''}`}
                        onClick={() => handleTabChange('courses')}
                    >
                        <i className="fas fa-graduation-cap"></i>
                        My Courses
                    </button>
                    
                    <button 
                        className={`staff-nav-item ${activeTab === 'government-schemes' ? 'active' : ''}`}
                        onClick={() => handleTabChange('government-schemes')}
                    >
                        <i className="fas fa-university"></i>
                        Government Schemes
                    </button>
                </nav>
            </div>

            {/* Profile Completion Popup */}
            {showProfileCompletionPopup && (
                <div className="staff-modal-overlay">
                    <div className="staff-modal">
                        <div className="staff-modal-header">
                            <h3>Complete Your Profile</h3>
                            <button 
                                type="button"
                                className="staff-modal-close"
                                onClick={handleProfileCompletionPopupClose}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="staff-modal-content">
                            <p>Please complete your profile first. After completing all details, click on Update and Go Live. Only then your profile will become live as a staff and others will be able to view it.</p>
                            
                            <div className="staff-mandatory-fields">
                                <h4>Mandatory Fields:</h4>
                                <ul>
                                    <li>Address (House No. / Street / Area)</li>
                                    <li>State</li>
                                    <li>City</li>
                                    <li>Pincode</li>
                                    <li>Choose Your Sector</li>
                                    <li>Choose Your Role</li>
                                    <li>Skills (separate with commas)</li>
                                </ul>
                            </div>
                        </div>
                        <div className="staff-modal-actions">
                            <button 
                                type="button" 
                                className="staff-cancel-btn"
                                onClick={handleProfileCompletionPopupClose}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="staff-submit-btn"
                                onClick={() => {
                                    handleProfileCompletionPopupClose();
                                    setActiveTab('profile');
                                    // Set toggle to ON permanently after clicking Complete Profile
                                    setIsActiveStaff(true);
                                }}
                            >
                                Complete Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Certificate Modal */}
            {showCertificateModal && (
                <div className="staff-modal-overlay">
                    <div className="staff-modal">
                        <div className="staff-modal-header">
                            <h3>Add Certificate</h3>
                            <button 
                                type="button"
                                className="staff-modal-close"
                                onClick={() => setShowCertificateModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCertificateSubmit} className="staff-modal-form">
                            <div className="staff-form-group">
                                <label>Course Name</label>
                                <input 
                                    type="text" 
                                    name="courseName" 
                                    value={certificateForm.courseName}
                                    onChange={handleCertificateFormChange}
                                    required
                                />
                            </div>
                            <div className="staff-form-group">
                                <label>Issuer/Institution</label>
                                <input 
                                    type="text" 
                                    name="issuer" 
                                    value={certificateForm.issuer}
                                    onChange={handleCertificateFormChange}
                                    required
                                />
                            </div>
                            <div className="staff-form-group">
                                <label>Duration</label>
                                <input 
                                    type="text" 
                                    name="duration" 
                                    value={certificateForm.duration}
                                    onChange={handleCertificateFormChange}
                                    placeholder="e.g., 40 hours, 3 months"
                                    required
                                />
                            </div>
                            <div className="staff-form-group">
                                <label>Issue Date</label>
                                <input 
                                    type="date" 
                                    name="issueDate" 
                                    value={certificateForm.issueDate}
                                    onChange={handleCertificateFormChange}
                                    required
                                />
                            </div>
                            <div className="staff-form-group">
                                <label>Upload Certificate (PDF only)</label>
                                <input 
                                    type="file" 
                                    name="certificateFile" 
                                    accept=".pdf"
                                    onChange={handleCertificateFormChange}
                                    required
                                />
                            </div>
                            <div className="staff-modal-actions">
                                <button 
                                    type="button" 
                                    className="staff-cancel-btn"
                                    onClick={() => setShowCertificateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="staff-submit-btn"
                                    disabled={uploadLoading.certificate}
                                >
                                    {uploadLoading.certificate ? 'Uploading...' : 'Add Certificate'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="staff-dashboard-content">
                {/* Loading Indicator */}
                {loading && (
                    <div className="staff-loading-overlay">
                        <div className="staff-loading-spinner">Loading...</div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="staff-error-message">
                        <p>{error}</p>
                        <button onClick={() => setError(null)}>Dismiss</button>
                    </div>
                )}

                {/* Dashboard Overview Tab - Only visible in Active Staff mode */}
                {activeTab === 'dashboard' && isActiveStaff && (
                    <div className="staff-dashboard-overview">
                        <div className="staff-page-header">
                            <h1>Dashboard Overview</h1>
                        </div>

                        {/* Stats Cards */}
                        <div className="staff-stats-container">
                            <div className="staff-stat-card">
                                <div className="staff-stat-icon">
                                    <i className="fas fa-file-alt"></i>
                                </div>
                                <div className="staff-stat-info">
                                    <h3>Total Applications</h3>
                                    <p className="staff-stat-number">{dashboardData.totalApplications}</p>
                                </div>
                            </div>
                            <div className="staff-stat-card">
                                <div className="staff-stat-icon">
                                    <i className="fas fa-eye"></i>
                                </div>
                                <div className="staff-stat-info">
                                    <h3>Profile Views</h3>
                                    <p className="staff-stat-number">{dashboardData.profileViews}</p>
                                </div>
                            </div>
                        </div>

                        {/* Charts Section */}
                        <div className="staff-charts-container">
                            <div className="staff-chart-card">
                                <h3>Application Trend</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={dashboardData.applicationTrend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line 
                                            type="monotone" 
                                            dataKey="applications" 
                                            stroke="#4863f7" 
                                            activeDot={{ r: 8 }} 
                                            strokeWidth={2}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Applications Table */}
                        <div className="staff-recent-applications">
                            <div className="staff-section-header">
                                <h3>Recent Applications</h3>
                            </div>
                            {dashboardData.recentApplications.length > 0 ? (
                                <div className="staff-table-responsive">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Company</th>
                                                <th>Position</th>
                                                <th>Applied Date</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dashboardData.recentApplications.map((app, index) => (
                                                <tr key={index}>
                                                    <td>{app.companyName}</td>
                                                    <td>{app.jobTitle}</td>
                                                    <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <span className="staff-status applied">
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>No applications yet. Start applying for jobs!</p>
                            )}
                        </div>
                        
                        {/* Activity Feed */}
                        <div className="staff-dashboard-bottom-grid">
                            <div className="staff-activity-feed">
                                <h3>Recent Activity</h3>
                                {dashboardData.recentActivity.length > 0 ? (
                                    <div className="staff-activity-list">
                                        {dashboardData.recentActivity.map((activity, index) => (
                                            <div key={index} className="staff-activity-item">
                                                <div className="staff-activity-icon">
                                                    <i className={activity.type === 'profile_view' ? 'fas fa-eye' : 'fas fa-briefcase'}></i>
                                                </div>
                                                <div className="staff-activity-content">
                                                    <p>{activity.message}</p>
                                                    <span className="staff-activity-time">
                                                        {new Date(activity.timestamp).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>No recent activity</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* My Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="staff-profile-section">
                        <div className="staff-page-header">
                            <h1>My Profile</h1>
                        </div>

                        {/* Profile Mode Toggle */}
                        <div className="staff-profile-mode-toggle">
                            <div className="staff-toggle-container">
                                <div className="staff-toggle-info">
                                    <h3>Profile Mode</h3>
                                    <p>
                                        {isActiveStaff 
                                            ? 'You are in Active Staff mode. Your profile is visible publicly and you can receive job opportunities.' 
                                            : 'You are in Seeker mode. Your profile is private and you can hire people.'
                                        }
                                    </p>
                                </div>
                                <div className="staff-toggle-switch">
                                    <label className="staff-switch">
                                        <input 
                                            type="checkbox" 
                                            checked={isActiveStaff} 
                                            onChange={handleToggleActiveStaff}
                                            disabled={loading}
                                        />
                                        <span className="staff-slider">
                                            <span className="staff-slider-text">
                                                {isActiveStaff ? 'Active Staff' : 'Seeker'}
                                            </span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div className="staff-profile-full-width">
                            <div className="staff-profile-content">
                                {/* Seeker Profile Form - Simplified */}
                                {!isActiveStaff ? (
                                    <form onSubmit={handleSeekerProfileSubmit}>
                                        <div className="staff-seeker-profile-grid">
                                            <div className="staff-seeker-profile-left">
                                                <h3>Basic Information</h3>
                                                <div className="staff-form-group">
                                                    <label>Full Name</label>
                                                    <input 
                                                        type="text" 
                                                        name="fullName" 
                                                        value={seekerProfile.fullName} 
                                                        onChange={handleSeekerProfileChange}
                                                    />
                                                </div>
                                                <div className="staff-form-group">
                                                    <label>Email</label>
                                                    <input 
                                                        type="email" 
                                                        name="email" 
                                                        value={seekerProfile.email} 
                                                        readOnly
                                                        className="staff-readonly-field"
                                                    />
                                                </div>
                                                <div className="staff-form-group">
                                                    <label>Phone Number</label>
                                                    <input 
                                                        type="tel" 
                                                        name="phone" 
                                                        value={seekerProfile.phone} 
                                                        onChange={handleSeekerProfileChange}
                                                    />
                                                </div>
                                                <div className="staff-form-group">
                                                    <label>User ID</label>
                                                    <input 
                                                        type="text" 
                                                        name="userId" 
                                                        value={seekerProfile.userId} 
                                                        readOnly
                                                        className="staff-readonly-field"
                                                    />
                                                </div>

                                                <h3>Change Password</h3>
                                                <div className="staff-form-group">
                                                    <label>Current Password</label>
                                                    <input 
                                                        type="password" 
                                                        name="currentPassword" 
                                                        value={seekerProfile.currentPassword} 
                                                        onChange={handleSeekerProfileChange}
                                                        placeholder="Enter current password"
                                                    />
                                                </div>
                                                <div className="staff-form-group">
                                                    <label>New Password</label>
                                                    <input 
                                                        type="password" 
                                                        name="newPassword" 
                                                        value={seekerProfile.newPassword} 
                                                        onChange={handleSeekerProfileChange}
                                                        placeholder="Enter new password"
                                                    />
                                                </div>
                                                <div className="staff-form-group">
                                                    <label>Confirm New Password</label>
                                                    <input 
                                                        type="password" 
                                                        name="confirmPassword" 
                                                        value={seekerProfile.confirmPassword} 
                                                        onChange={handleSeekerProfileChange}
                                                        placeholder="Confirm new password"
                                                    />
                                                </div>

                                                <button 
                                                    type="submit" 
                                                    className="staff-submit-btn"
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            </div>

                                            <div className="staff-seeker-profile-right">
                                                <div className="staff-profile-photo-section">
                                                    <h3>Profile Photo</h3>
                                                    <div className="staff-profile-photo">
                                                        {profile.profilePhoto ? (
                                                            <img src={profile.profilePhoto} alt="Profile" />
                                                        ) : (
                                                            <div className="staff-profile-photo-placeholder">
                                                                {profile.fullName ? profile.fullName.charAt(0) : 'S'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="staff-upload-buttons">
                                                        <label className="staff-upload-btn">
                                                            <input 
                                                                type="file" 
                                                                hidden 
                                                                onChange={(e) => handleFileUpload(e, 'profilePhoto')} 
                                                                accept="image/*"
                                                                disabled={uploadLoading.profilePhoto}
                                                            />
                                                            {uploadLoading.profilePhoto ? 'Uploading...' : 'Upload Photo'}
                                                        </label>
                                                        {profile.profilePhoto && (
                                                            <button 
                                                                type="button" 
                                                                className="staff-remove-btn"
                                                                onClick={handleRemoveProfilePhoto}
                                                                disabled={loading}
                                                            >
                                                                {loading ? 'Removing...' : 'Remove'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                ) : (
                                    /* Active Staff Profile Form - Full detailed form */
                                    <form onSubmit={(e) => e.preventDefault()}>
                                        <div className="staff-profile-main-grid">
                                            {/* Left Column */}
                                            <div className="staff-profile-left">
                                                <h3>Personal Information</h3>
                                                <div className="staff-form-group">
                                                    <label>Full Name</label>
                                                    <input 
                                                        type="text" 
                                                        name="fullName" 
                                                        value={profile.fullName} 
                                                        onChange={handleProfileChange}
                                                    />
                                                </div>
                                                <div className="staff-form-grid">
                                                    <div className="staff-form-group">
                                                        <label>Email</label>
                                                        <input 
                                                            type="email" 
                                                            name="email" 
                                                            value={profile.email} 
                                                            readOnly
                                                            className="staff-readonly-field"
                                                        />
                                                    </div>
                                                    <div className="staff-form-group">
                                                        <label>Phone</label>
                                                        <input 
                                                            type="tel" 
                                                            name="phone" 
                                                            value={profile.phone} 
                                                            onChange={handleProfileChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="staff-form-group required">
                                                    <label>Address (House No. / Street / Area)</label>
                                                    <textarea 
                                                        name="address" 
                                                        value={profile.address} 
                                                        onChange={handleProfileChange}
                                                        placeholder="Enter house number, street, area details"
                                                        className="required"
                                                        required
                                                    ></textarea>
                                                </div>
                                                <div className="staff-form-grid">
                                                    <div className="staff-form-group required">
                                                        <label>State</label>
                                                        <select 
                                                            name="state" 
                                                            value={selectedState} 
                                                            onChange={handleProfileChange}
                                                            className="required"
                                                            required
                                                        >
                                                            <option value="">Select State</option>
                                                            {states.map((state) => (
                                                                <option key={state.iso2} value={state.iso2}>{state.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="staff-form-group required">
                                                        <label>City</label>
                                                        <select 
                                                            name="city" 
                                                            value={selectedCity} 
                                                            onChange={handleProfileChange}
                                                            disabled={!selectedState}
                                                            className="required"
                                                            required
                                                        >
                                                            <option value="">Select City</option>
                                                            {cities.map((city) => (
                                                                <option key={city.id} value={city.id}>{city.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="staff-form-group required">
                                                    <label>Pincode</label>
                                                    <input 
                                                        type="text" 
                                                        name="pincode" 
                                                        value={profile.pincode} 
                                                        onChange={handleProfileChange}
                                                        placeholder="Enter pincode"
                                                        className="required"
                                                        required
                                                    />
                                                </div>
                                                
                                                <h3>Professional Information</h3>
                                                <div className="staff-form-grid">
                                                    <div className="staff-form-group required">
                                                        <label>Choose Your Sector</label>
                                                        <select 
                                                            name="sector" 
                                                            value={profile.sector} 
                                                            onChange={handleProfileChange}
                                                            className="required"
                                                            required
                                                        >
                                                            <option value="">Select Sector</option>
                                                            {sectors.map((sector, index) => (
                                                                <option key={index} value={sector}>{sector}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="staff-form-group required">
                                                        <label>Choose Your Role</label>
                                                        <select 
                                                            name="role" 
                                                            value={profile.role} 
                                                            onChange={handleProfileChange}
                                                            disabled={!profile.sector}
                                                            className="required"
                                                            required
                                                        >
                                                            <option value="">Select Role</option>
                                                            {availableRoles.map((role, index) => (
                                                                <option key={index} value={role}>{role}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="staff-form-group required">
                                                    <label>Skills (separate with commas)</label>
                                                    <input 
                                                        type="text" 
                                                        name="skills" 
                                                        value={profile.skills} 
                                                        onChange={handleProfileChange}
                                                        placeholder="e.g., Communication, Problem Solving, Time Management"
                                                        className="required"
                                                        required
                                                    />
                                                </div>

                                                <div className="staff-section-with-actions">
                                                    <h3>Experience</h3>
                                                    <button 
                                                        type="button" 
                                                        className="staff-add-btn"
                                                        onClick={addExperience}
                                                    >
                                                        <i className="fas fa-plus"></i> Add Experience
                                                    </button>
                                                </div>
                                                
                                                {experiences.map((experience, index) => (
                                                    <div key={experience.id} className="staff-experience-section">
                                                        <div className="staff-section-header">
                                                            <h4>Experience {index + 1}</h4>
                                                            {experiences.length > 1 && (
                                                                <button 
                                                                    type="button" 
                                                                    className="staff-delete-experience-btn"
                                                                    onClick={() => deleteExperience(experience.id)}
                                                                >
                                                                    <i className="fas fa-trash-alt"></i> Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="staff-form-grid">
                                                            <div className="staff-form-group">
                                                                <label>Role/Position</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={experience.role} 
                                                                    onChange={(e) => handleExperienceChange(experience.id, 'role', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="staff-form-group">
                                                                <label>Company</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={experience.company} 
                                                                    onChange={(e) => handleExperienceChange(experience.id, 'company', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="staff-form-grid">
                                                            <div className="staff-form-group">
                                                                <label>Salary</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={experience.salary} 
                                                                    onChange={(e) => handleExperienceChange(experience.id, 'salary', e.target.value)}
                                                                    placeholder="e.g., ₹5,00,000 per annum"
                                                                />
                                                            </div>
                                                            <div className="staff-form-group">
                                                                <label>Start Date</label>
                                                                <input 
                                                                    type="date" 
                                                                    value={experience.startDate} 
                                                                    onChange={(e) => handleExperienceChange(experience.id, 'startDate', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="staff-form-group">
                                                            <label>End Date</label>
                                                            <input 
                                                                type="date" 
                                                                value={experience.endDate} 
                                                                onChange={(e) => handleExperienceChange(experience.id, 'endDate', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                
                                                <h3>Education</h3>
                                                {/* 10th Grade */}
                                                <div className="staff-education-section">
                                                    <h4>10th Grade</h4>
                                                    <div className="staff-form-grid">
                                                        <div className="staff-form-group">
                                                            <label>Percentage</label>
                                                            <input 
                                                                type="number" 
                                                                name="tenth_percentage" 
                                                                value={profile.education.tenth.percentage} 
                                                                onChange={handleProfileChange}
                                                                min="0" 
                                                                max="100"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                        <div className="staff-form-group">
                                                            <label>Year of Completion</label>
                                                            <input 
                                                                type="date" 
                                                                name="tenth_year" 
                                                                value={profile.education.tenth.year} 
                                                                onChange={handleProfileChange}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="staff-form-group">
                                                        <label>School Name</label>
                                                        <input 
                                                            type="text" 
                                                            name="tenth_school" 
                                                            value={profile.education.tenth.school} 
                                                            onChange={handleProfileChange}
                                                        />
                                                    </div>
                                                </div>

                                                {/* 12th Grade */}
                                                <div className="staff-education-section">
                                                    <h4>12th Grade</h4>
                                                    <div className="staff-form-grid">
                                                        <div className="staff-form-group">
                                                            <label>Percentage</label>
                                                            <input 
                                                                type="number" 
                                                                name="twelfth_percentage" 
                                                                value={profile.education.twelfth.percentage} 
                                                                onChange={handleProfileChange}
                                                                min="0" 
                                                                max="100"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                        <div className="staff-form-group">
                                                            <label>Year of Completion</label>
                                                            <input 
                                                                type="date" 
                                                                name="twelfth_year" 
                                                                value={profile.education.twelfth.year} 
                                                                onChange={handleProfileChange}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="staff-form-group">
                                                        <label>School Name</label>
                                                        <input 
                                                            type="text" 
                                                            name="twelfth_school" 
                                                            value={profile.education.twelfth.school} 
                                                            onChange={handleProfileChange}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Graduation */}
                                                <div className="staff-education-section">
                                                    <h4>Graduation</h4>
                                                    <div className="staff-form-grid">
                                                        <div className="staff-form-group">
                                                            <label>Degree</label>
                                                            <input 
                                                                type="text" 
                                                                name="graduation_degree" 
                                                                value={profile.education.graduation.degree} 
                                                                onChange={handleProfileChange}
                                                                placeholder="e.g., B.Tech, B.Com, BBA"
                                                            />
                                                        </div>
                                                        <div className="staff-form-group">
                                                            <label>College/University</label>
                                                            <input 
                                                                type="text" 
                                                                name="graduation_college" 
                                                                value={profile.education.graduation.college} 
                                                                onChange={handleProfileChange}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="staff-form-grid">
                                                        <div className="staff-form-group">
                                                            <label>Percentage/CGPA</label>
                                                            <input 
                                                                type="text" 
                                                                name="graduation_percentage" 
                                                                value={profile.education.graduation.percentage} 
                                                                onChange={handleProfileChange}
                                                                placeholder="e.g., 75% or 8.5 CGPA"
                                                            />
                                                        </div>
                                                        <div className="staff-form-group">
                                                            <label>Start Date</label>
                                                            <input 
                                                                type="date" 
                                                                name="graduation_startDate" 
                                                                value={profile.education.graduation.startDate} 
                                                                onChange={handleProfileChange}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="staff-form-group">
                                                        <div className="staff-checkbox-group">
                                                            <label>
                                                                <input 
                                                                    type="checkbox" 
                                                                    name="graduation_pursuing" 
                                                                    checked={profile.education.graduation.pursuing} 
                                                                    onChange={handleProfileChange}
                                                                />
                                                                Currently Pursuing
                                                            </label>
                                                        </div>
                                                    </div>
                                                    {!profile.education.graduation.pursuing && (
                                                        <div className="staff-form-group">
                                                            <label>End Date</label>
                                                            <input 
                                                                type="date" 
                                                                name="graduation_endDate" 
                                                                value={profile.education.graduation.endDate} 
                                                                onChange={handleProfileChange}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <h3>Availability Status</h3>
                                                <div className="staff-radio-group">
                                                    <label>
                                                        <input 
                                                            type="radio" 
                                                            name="availability" 
                                                            value="available" 
                                                            checked={profile.availability === 'available'} 
                                                            onChange={handleProfileChange}
                                                        />
                                                        <span className="staff-availability-status available">Available</span> - Ready for new opportunities
                                                    </label>
                                                    <label>
                                                        <input 
                                                            type="radio" 
                                                            name="availability" 
                                                            value="busy" 
                                                            checked={profile.availability === 'busy'} 
                                                            onChange={handleProfileChange}
                                                        />
                                                        <span className="staff-availability-status busy">Busy</span> - Currently occupied with other commitments
                                                    </label>
                                                    <label>
                                                        <input 
                                                            type="radio" 
                                                            name="availability" 
                                                            value="part-time" 
                                                            checked={profile.availability === 'part-time'} 
                                                            onChange={handleProfileChange}
                                                        />
                                                        <span className="staff-availability-status part-time">Part-time</span> - Available for part-time opportunities only
                                                    </label>
                                                </div>
                                                
                                                <button 
                                                    type="button" 
                                                    className="staff-submit-btn"
                                                    disabled={loading}
                                                    onClick={handleUpdateAndGoLive}
                                                >
                                                    {loading ? 'Updating...' : 'Update and Go Live'}
                                                </button>
                                            </div>

                                            {/* Right Column */}
                                            <div className="staff-profile-right">
                                                <div className="staff-profile-photo-section">
                                                    <h3>Profile Photo</h3>
                                                    <div className="staff-profile-photo">
                                                        {profile.profilePhoto ? (
                                                            <img src={profile.profilePhoto} alt="Profile" />
                                                        ) : (
                                                            <div className="staff-profile-photo-placeholder">
                                                                {profile.fullName ? profile.fullName.charAt(0) : 'S'}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="staff-upload-buttons">
                                                        <label className="staff-upload-btn">
                                                            <input 
                                                                type="file" 
                                                                hidden 
                                                                onChange={(e) => handleFileUpload(e, 'profilePhoto')} 
                                                                accept="image/*"
                                                                disabled={uploadLoading.profilePhoto}
                                                            />
                                                            {uploadLoading.profilePhoto ? 'Uploading...' : 'Upload Photo'}
                                                        </label>
                                                        {profile.profilePhoto && (
                                                            <button 
                                                                type="button" 
                                                                className="staff-remove-btn"
                                                                onClick={handleRemoveProfilePhoto}
                                                                disabled={loading}
                                                            >
                                                                {loading ? 'Removing...' : 'Remove'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="staff-resume-section">
                                                    <h3>Resume</h3>
                                                    <div className="staff-resume-placeholder">
                                                        {profile.resumeUrl ? (
                                                            <div className="staff-resume-uploaded">
                                                                <i className="fas fa-file-pdf"></i>
                                                                <p>Resume Uploaded</p>
                                                                <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="staff-view-resume-btn">
                                                                    View Resume
                                                                </a>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <i className="fas fa-file-pdf"></i>
                                                                <p>Upload PDF Resume</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="staff-upload-buttons">
                                                        <label className="staff-upload-btn">
                                                            <input 
                                                                type="file" 
                                                                hidden 
                                                                onChange={(e) => handleFileUpload(e, 'resume')} 
                                                                accept=".pdf"
                                                                disabled={uploadLoading.resume}
                                                            />
                                                            {uploadLoading.resume ? 'Uploading...' : 'Upload Resume (PDF)'}
                                                        </label>
                                                    </div>
                                                </div>
                                                
                                                <div className="staff-certificates-section">
                                                    <div className="staff-section-header">
                                                        <h3>My Certificates</h3>
                                                        <button 
                                                            type="button"
                                                            className="staff-upload-certificate-btn"
                                                            onClick={() => setShowCertificateModal(true)}
                                                        >
                                                            <i className="fas fa-plus"></i> Add
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="staff-certificates-container">
                                                        {certificates.length > 0 ? (
                                                            certificates.map((cert) => (
                                                                <div key={cert.id} className="staff-certificate-card">
                                                                    <div className="staff-certificate-thumbnail">
                                                                        <i className="fas fa-certificate"></i>
                                                                    </div>
                                                                    <div className="staff-certificate-content">
                                                                        <h4>{cert.name}</h4>
                                                                        <p>Issuer: {cert.issuer}</p>
                                                                        <p>Issued: {cert.issued}</p>
                                                                        <p>Duration: {cert.duration}</p>
                                                                        {cert.url && (
                                                                            <a href={cert.url} target="_blank" rel="noopener noreferrer" className="staff-view-certificate-btn">
                                                                                View Certificate
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                    <div className="staff-certificate-actions">
                                                                        <button 
                                                                            type="button"
                                                                            className="staff-delete-certificate-btn"
                                                                            onClick={() => deleteCertificate(cert.id)}
                                                                        >
                                                                            <i className="fas fa-trash-alt"></i> Delete
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="staff-no-certificates">
                                                                <p>No certificates added yet. Click "Add" to upload your first certificate.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="staff-profile-completion">
                                                    <h3>Profile Completion</h3>
                                                    <div className="staff-completion-bar">
                                                        <div className="staff-completion-progress" style={{
                                                            width: `${Math.round(
                                                                ((profile.fullName ? 1 : 0) +
                                                                (profile.skills ? 1 : 0) +
                                                                (profile.resumeUrl ? 1 : 0) +
                                                                (profile.profilePhoto ? 1 : 0)) / 4 * 100
                                                            )}%`
                                                        }}></div>
                                                    </div>
                                                    <p>{Math.round(
                                                        ((profile.fullName ? 1 : 0) +
                                                        (profile.skills ? 1 : 0) +
                                                        (profile.resumeUrl ? 1 : 0) +
                                                        (profile.profilePhoto ? 1 : 0)) / 4 * 100
                                                    )}% Complete</p>
                                                    <ul className="staff-completion-tips">
                                                        <li>
                                                            <i className={`fas ${profile.fullName ? 'fa-check-circle completed' : 'fa-times-circle'}`}></i>
                                                            <span>Basic Information</span>
                                                        </li>
                                                        <li>
                                                            <i className={`fas ${profile.skills ? 'fa-check-circle completed' : 'fa-times-circle'}`}></i>
                                                            <span>Skills Added</span>
                                                        </li>
                                                        <li>
                                                            <i className={`fas ${profile.resumeUrl ? 'fa-check-circle completed' : 'fa-times-circle'}`}></i>
                                                            <span>Upload Resume</span>
                                                        </li>
                                                        <li>
                                                            <i className={`fas ${profile.profilePhoto ? 'fa-check-circle completed' : 'fa-times-circle'}`}></i>
                                                            <span>Upload Profile Photo</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Courses Tab */}
                {activeTab === 'courses' && (
                    <div className="staff-courses-section">
                        <div className="staff-page-header">
                            <h1>My Courses</h1>
                            <p>Courses you've enrolled in and your learning progress</p>
                        </div>
                        <StaffCourses />
                    </div>
                )}

                {/* Government Schemes Tab */}
                {activeTab === 'government-schemes' && (
                    <div className="staff-government-schemes-section">
                        <div className="staff-page-header">
                            <h1>Government Schemes</h1>
                            <p>Explore government schemes and opportunities for skill development and employment</p>
                        </div>
                        <GovernmentSchemes />
                    </div>
                )}

                {/* Contact History Tab - Available for both modes */}
                {activeTab === 'contact-history' && (
                    <div className="staff-contact-history-section">
                        <ContactHistory />
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffDashboard;