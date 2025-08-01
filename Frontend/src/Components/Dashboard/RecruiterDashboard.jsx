/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import './RecruiterDashboard.css';
import './ProfileModal.css';
import '../Pages/StaffPage.css';
import apiService from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import useProfilePhotoSync from '../../hooks/useProfilePhotoSync';

const RecruiterDashboard = () => {
    const { currentUser } = useContext(AuthContext);
    const { notifyProfilePhotoUpdated } = useProfilePhotoSync();
    const [activeTab, setActiveTab] = useState('overview');
    const [showJobForm, setShowJobForm] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [loading, setLoading] = useState(false);

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
        companyDescription: 'A leading technology company providing innovative solutions.',
        perks: [
            { text: 'Health insurance' },
            { text: 'Work from home options' },
            { text: 'Learning & development budget' },
            { text: 'Performance bonuses' }
        ],
        officeImages: [],
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
        position: 'all',
        experience: 'all'
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


    
    // Hired candidates
    const [hiredCandidates, setHiredCandidates] = useState([]);
    
    // Profile modal state
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedCandidateProfile, setSelectedCandidateProfile] = useState(null);
    
    // Profile photo upload state
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [tempProfilePhoto, setTempProfilePhoto] = useState(null);
    
    // Office images upload state
    const [uploadingOfficeImage, setUploadingOfficeImage] = useState(false);
    const [tempOfficeImages, setTempOfficeImages] = useState([]);
    
    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: ''
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
    const [dashboardStats, setDashboardStats] = useState({ applications: 0, hires: 0 });

    // Load recruiter profile and jobs on component mount
    useEffect(() => {
        if (currentUser && currentUser.role === 'recruiter') {
            loadRecruiterProfile();
            loadJobPostings();
            loadCandidates();
            loadDashboardStats();
        }
    }, [currentUser]);
    
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
    
    // Load candidates who applied for jobs
    const loadCandidates = async () => {
        try {
            setCandidatesLoading(true);
            const response = await apiService.getRecruiterCandidates();
            
            if (response.success) {
                setCandidates(response.data || []);
            }
        } catch (error) {
            console.error('Error loading candidates:', error);
        } finally {
            setCandidatesLoading(false);
        }
    };

    // Load recruiter profile from backend
    const loadRecruiterProfile = async () => {
        try {
            const response = await apiService.getRecruiterProfile();
            if (response.success && response.data) {
                const profile = response.data;
                
                // Default values for dashboard editing
                const defaultPerks = [
                    { text: 'Health insurance' },
                    { text: 'Work from home options' },
                    { text: 'Learning & development budget' },
                    { text: 'Performance bonuses' }
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
                    experience: profile.experience || '',
                    website: profile.website || '',
                    phone: profile.phone || '',
                    companyDescription: profile.companyDescription || 'A leading technology company providing innovative solutions.',
                    // Always show default values in dashboard for editing, regardless of profile state
                    perks: (profile.perks && profile.perks.length > 0) ? profile.perks : defaultPerks,
                    hiringSteps: (profile.hiringSteps && profile.hiringSteps.length > 0) ? profile.hiringSteps : defaultHiringSteps,
                    interviewQuestions: (profile.interviewQuestions && profile.interviewQuestions.length > 0) ? profile.interviewQuestions : defaultQuestions,
                    officeImages: (profile.officeImages || []).map(img => 
                        img.startsWith('http') ? img : `http://localhost:5000${img}`
                    )
                });
                // Set profile photo with proper URL handling
                if (profile.profilePhoto) {
                    const fullPhotoUrl = profile.profilePhoto.startsWith('http') ? profile.profilePhoto : `http://localhost:5000${profile.profilePhoto}`;
                    setProfilePhoto(fullPhotoUrl);
                    console.log('Loaded profile photo:', fullPhotoUrl);
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
        
        setUploadingPhoto(true);
        
        try {
            const response = await apiService.uploadRecruiterPhoto(file);
            
            if (response.success && response.data && response.data.profilePhoto) {
                const newProfilePhoto = response.data.profilePhoto;
                // Convert relative path to full URL if needed
                const fullPhotoUrl = newProfilePhoto.startsWith('http') ? newProfilePhoto : `http://localhost:5000${newProfilePhoto}`;
                
                // Store photo temporarily - don't update everywhere yet
                setTempProfilePhoto(fullPhotoUrl);
                console.log('Temp profile photo set:', fullPhotoUrl);
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
                const fullImageUrl = newImageUrl.startsWith('http') ? newImageUrl : `http://localhost:5000${newImageUrl}`;
                
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
                // Remove from temp images
                const updatedTempImages = [...tempOfficeImages];
                updatedTempImages.splice(index, 1);
                setTempOfficeImages(updatedTempImages);
            } else {
                // Remove from permanent images
                const updatedImages = [...profileForm.officeImages];
                updatedImages.splice(index, 1);
                setProfileForm(prev => ({
                    ...prev,
                    officeImages: updatedImages
                }));
            }
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

    // Handle candidate filter changes
    const handleCandidateFilterChange = (e) => {
        const { name, value } = e.target;
        setCandidateFilters(prev => ({
            ...prev,
            [name]: value
        }));
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

    // Filter candidates based on search and filters (exclude hired and rejected)
    const filteredCandidates = candidates.filter(candidate => {
        const matchesSearch = candidate.name.toLowerCase().includes(candidateFilters.search.toLowerCase()) ||
                             candidate.position.toLowerCase().includes(candidateFilters.search.toLowerCase()) ||
                             candidate.skills.toLowerCase().includes(candidateFilters.search.toLowerCase());
        
        const matchesStatus = candidateFilters.status === 'all' || candidate.status.toLowerCase() === candidateFilters.status;
        const matchesPosition = candidateFilters.position === 'all' || candidate.position.toLowerCase().includes(candidateFilters.position.toLowerCase());
        const matchesExperience = candidateFilters.experience === 'all' || candidate.experience.toLowerCase().includes(candidateFilters.experience.toLowerCase());
        
        // Only show Applied candidates in Candidate Search
        const isApplied = candidate.status === 'Applied';

        return matchesSearch && matchesStatus && matchesPosition && matchesExperience && isApplied;
    });

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
                    // Add to hired candidates
                    setHiredCandidates(prev => [...prev, {
                        id: candidate.id,
                        name: candidate.name,
                        position: candidate.position,
                        hireDate: new Date().toISOString().split('T')[0],
                        staffId: candidate.staffId
                    }]);
                    
                    // Reload candidates to update status
                    await loadCandidates();
                    
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
                    await loadCandidates();
                    
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
    const handlePerkChange = (index, value) => {
        setProfileForm(prev => ({
            ...prev,
            perks: prev.perks.map((perk, i) => 
                i === index ? { text: value } : perk
            )
        }));
    };

    // Add new perk
    const addPerk = () => {
        setProfileForm(prev => ({
            ...prev,
            perks: [...prev.perks, { text: '' }]
        }));
    };

    // Remove perk
    const removePerk = (index) => {
        setProfileForm(prev => ({
            ...prev,
            perks: prev.perks.filter((_, i) => i !== index)
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
        setLoading(true);
        
        try {
            // Include temp profile photo and office images in the update
            const finalOfficeImages = tempOfficeImages.length > 0 
                ? [...(profileForm.officeImages || []), ...tempOfficeImages]
                : profileForm.officeImages || [];
                
            const updateData = {
                ...profileForm,
                officeImages: finalOfficeImages,
                // Handle profile photo: use temp photo, current photo, or explicitly null if removed
                profilePhoto: tempProfilePhoto !== null ? (tempProfilePhoto || profilePhoto || profileForm.profilePhoto) : null
            };
            
            console.log('Updating profile with data:', updateData);
            console.log('Office images being saved:', finalOfficeImages);
            console.log('Profile photo being saved:', updateData.profilePhoto);
            console.log('Temp office images:', tempOfficeImages);
            console.log('Profile form office images:', profileForm.officeImages);
            
            const response = await apiService.updateRecruiterProfile(updateData);
            
            if (response.success) {
                // Now update profile photo and office images everywhere
                if (tempProfilePhoto !== null) {
                    if (tempProfilePhoto) {
                        setProfilePhoto(tempProfilePhoto);
                    }
                    setTempProfilePhoto(null);
                    // Notify other components about the profile photo update
                    notifyProfilePhotoUpdated();
                } else {
                    // Photo was removed
                    setProfilePhoto(null);
                    setTempProfilePhoto(null);
                    // Notify other components about the profile photo removal
                    notifyProfilePhotoUpdated();
                }
                
                // Update office images
                if (tempOfficeImages.length > 0) {
                    const updatedOfficeImages = [...(profileForm.officeImages || []), ...tempOfficeImages];
                    setProfileForm(prev => ({
                        ...prev,
                        officeImages: updatedOfficeImages
                    }));
                    setTempOfficeImages([]);
                    console.log('Updated office images in form:', updatedOfficeImages);
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

    // Handle job form submission - REAL-TIME UPDATE
    const handleJobSubmit = async (e) => {
        e.preventDefault();
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

    return (
        <div className="recruiter-dashboard">
            <div className="recruiter-dashboard-sidebar">
                <div className="recruiter-company-info">
                    {profilePhoto && profilePhoto !== '' ? (
                        <img src={profilePhoto} alt="Company Logo" className="recruiter-company-logo" />
                    ) : (
                        <div className="recruiter-company-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50' }}>
                            {(profileForm.companyName || currentUser?.name || 'C').charAt(0)}
                        </div>
                    )}
                    <h3>{profileForm.companyName || currentUser?.name || 'Your Company'}</h3>
                </div>
                <ul className="recruiter-sidebar-menu">
                    <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
                        Dashboard Overview
                    </li>
                    <li className={activeTab === 'jobs' ? 'active' : ''} onClick={() => setActiveTab('jobs')}>
                        Job Management
                    </li>
                    <li className={activeTab === 'candidates' ? 'active' : ''} onClick={() => setActiveTab('candidates')}>
                        Candidate Search
                    </li>
                    <li className={activeTab === 'hiring' ? 'active' : ''} onClick={() => setActiveTab('hiring')}>
                        Hiring History
                    </li>
                    <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
                        My Profile
                    </li>
                </ul>
            </div>

            {/* Dashboard title will be shown inside the content area */}

            <div className="recruiter-dashboard-content">
                <h1>
                    {activeTab === 'overview' && 'Dashboard Overview'}
                    {activeTab === 'jobs' && 'Job Management'}
                    {activeTab === 'candidates' && 'Candidate Search'}
                    {activeTab === 'hiring' && 'Hiring History'}
                    {activeTab === 'profile' && 'My Profile'}
                </h1>
                {/* Job Form Modal */}
                {showJobForm && (
                    <div className="recruiter-modal-overlay">
                        <div className="recruiter-job-form-modal">
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
                                            status: 'Active',
                                            postedDate: new Date().toISOString().split('T')[0]
                                        });
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                            
                            <form onSubmit={handleJobSubmit} className="recruiter-job-form">
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
                                    </div>
                                    <div className="recruiter-form-group">
                                        <label>Experience Required *</label>
                                        <input
                                            type="text"
                                            name="experience"
                                            value={jobForm.experience}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="e.g. 3-5 years"
                                        />
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
                                    </div>
                                </div>

                                <div className="recruiter-form-row">
                                    <div className="recruiter-form-group">
                                        <label>Date Posted *</label>
                                        <input
                                            type="date"
                                            name="postedDate"
                                            value={jobForm.postedDate}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="recruiter-form-group">
                                        <label>Status *</label>
                                        <select
                                            name="status"
                                            value={jobForm.status}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Closed">Closed</option>
                                            <option value="Draft">Draft</option>
                                        </select>
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
                                        placeholder="e.g. React, Node.js, MongoDB (comma separated)"
                                    />
                                </div>

                                <div className="recruiter-form-group">
                                    <label>Job Description *</label>
                                    <textarea
                                        name="description"
                                        value={jobForm.description}
                                        onChange={handleInputChange}
                                        required
                                        rows="4"
                                        placeholder="Describe the role, responsibilities, and requirements..."
                                    />
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
                        <div className="recruiter-tab-header">
                        </div>

                        <div className="recruiter-search-section">
                            <div className="recruiter-search-row">
                                <input 
                                    type="text" 
                                    placeholder="Search by name, skills, or experience..." 
                                    className="recruiter-search-input large"
                                    name="search"
                                    value={candidateFilters.search}
                                    onChange={handleCandidateFilterChange}
                                />
                                <button className="recruiter-primary-button">Search</button>
                            </div>
                            <div className="recruiter-filter-row">
                                <select 
                                    className="recruiter-filter-select"
                                    name="status"
                                    value={candidateFilters.status}
                                    onChange={handleCandidateFilterChange}
                                >
                                    <option value="all">All Status</option>
                                    <option value="new">New</option>
                                    <option value="shortlisted">Shortlisted</option>
                                    <option value="interviewed">Interviewed</option>
                                    <option value="hired">Hired</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                                <select 
                                    className="recruiter-filter-select"
                                    name="position"
                                    value={candidateFilters.position}
                                    onChange={handleCandidateFilterChange}
                                >
                                    <option value="all">All Positions</option>
                                    <option value="developer">Developer</option>
                                    <option value="designer">Designer</option>
                                    <option value="product">Product</option>
                                    <option value="marketing">Marketing</option>
                                    <option value="analyst">Analyst</option>
                                    <option value="manager">Manager</option>
                                </select>
                                <select 
                                    className="recruiter-filter-select"
                                    name="experience"
                                    value={candidateFilters.experience}
                                    onChange={handleCandidateFilterChange}
                                >
                                    <option value="all">Experience Level</option>
                                    <option value="entry">Entry Level</option>
                                    <option value="mid">Mid Level</option>
                                    <option value="senior">Senior</option>
                                </select>
                            </div>
                        </div>

                        <table className="recruiter-data-table full-width">
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
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                            Loading candidates...
                                        </td>
                                    </tr>
                                ) : filteredCandidates.length > 0 ? (
                                    filteredCandidates.map(candidate => (
                                        <tr key={candidate.id}>
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
                                                <button 
                                                    className="recruiter-table-action"
                                                    onClick={() => handleViewProfile(candidate)}
                                                >
                                                    View Profile
                                                </button>
                                                <button 
                                                    className="recruiter-table-action"
                                                    onClick={() => handleHireCandidate(candidate)}
                                                    disabled={loading}
                                                >
                                                    Hired
                                                </button>
                                                <button 
                                                    className="recruiter-table-action delete"
                                                    onClick={() => handleRejectCandidate(candidate)}
                                                    disabled={loading}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                            No candidates have applied yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {filteredCandidates.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                                No candidates found matching your criteria.
                            </div>
                        )}
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
                            const hiredCandidatesFromApplications = candidates.filter(c => c.status === 'Hired');
                            const allHiredCandidates = [...hiredCandidates, ...hiredCandidatesFromApplications];
                            
                            return allHiredCandidates.length > 0 ? (
                                <div className="recruiter-hiring-content">
                                    <h3>Recently Hired</h3>
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
                                            {allHiredCandidates.map((hired, index) => (
                                                <tr key={hired.id || index}>
                                                    <td>{hired.name}</td>
                                                    <td>{hired.position}</td>
                                                    <td>{hired.hireDate || new Date(hired.date).toLocaleDateString()}</td>
                                                    <td>
                                                        <button 
                                                            className="recruiter-table-action"
                                                            onClick={() => {
                                                                if (hired.staffId) {
                                                                    const candidate = candidates.find(c => c.staffId === hired.staffId);
                                                                    if (candidate) {
                                                                        handleViewProfile(candidate);
                                                                    }
                                                                }
                                                            }}
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
                                    <p>No hiring records found. Hire candidates from the Candidate Search section.</p>
                                </div>
                            );
                        })()
                        }
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
                                                    if (tempProfilePhoto) setTempProfilePhoto(null);
                                                    else setProfilePhoto(null);
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
                                    <div key={index} className="recruiter-perk-item">
                                        <div className="recruiter-form-row">
                                            <div className="recruiter-form-group">
                                                <label>Benefit Description</label>
                                                <input
                                                    type="text"
                                                    value={perk.text}
                                                    onChange={(e) => handlePerkChange(index, e.target.value)}
                                                    placeholder="Comprehensive health insurance"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="recruiter-remove-btn small"
                                                onClick={() => removePerk(index)}
                                            >
                                                Remove
                                            </button>
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
                            
                            {/* Office Images */}
                            <div className="recruiter-profile-section">
                                <div className="recruiter-section-header">
                                    <h2>Office Images</h2>
                                    <input
                                        type="file"
                                        id="officeImageInput"
                                        accept="image/*"
                                        onChange={handleOfficeImageUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        type="button"
                                        className="recruiter-add-btn"
                                        onClick={() => document.getElementById('officeImageInput').click()}
                                        disabled={uploadingOfficeImage}
                                    >
                                        {uploadingOfficeImage ? 'Uploading...' : '+ Add Image'}
                                    </button>
                                </div>
                                
                                <div className="recruiter-office-images-grid">
                                    {/* Permanent office images */}
                                    {profileForm.officeImages.map((imageUrl, index) => (
                                        <div key={`permanent-${index}`} className="recruiter-office-image-item">
                                            <img 
                                                src={imageUrl} 
                                                alt={`Office ${index + 1}`} 
                                                className="office-image-preview"
                                            />
                                            <button
                                                type="button"
                                                className="recruiter-remove-btn image-remove-btn"
                                                onClick={() => handleDeleteOfficeImage(imageUrl, index, false)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                    
                                    {/* Temporary office images */}
                                    {tempOfficeImages.map((imageUrl, index) => (
                                        <div key={`temp-${index}`} className="recruiter-office-image-item temp-image">
                                            <img 
                                                src={imageUrl} 
                                                alt={`Office ${profileForm.officeImages.length + index + 1}`} 
                                                className="office-image-preview"
                                            />
                                            <button
                                                type="button"
                                                className="recruiter-remove-btn image-remove-btn"
                                                onClick={() => handleDeleteOfficeImage(imageUrl, index, true)}
                                            >
                                                Remove
                                            </button>
                                            <div className="temp-image-badge">Pending</div>
                                        </div>
                                    ))}
                                    
                                    {profileForm.officeImages.length === 0 && tempOfficeImages.length === 0 && (
                                        <div className="no-images-message">
                                            <p>No office images uploaded yet. Add images to showcase your workplace.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Interview Questions */}
                            <div className="recruiter-profile-section">
                                <div className="recruiter-section-header">
                                    <h2>Common Interview Questions</h2>
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
            </div>
        </div>
    );
};

export default RecruiterDashboard;