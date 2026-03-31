/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import useProfilePhotoSync from '../../hooks/useProfilePhotoSync';
import { useGlobalLoading } from '../../hooks/useGlobalLoading';
import { FaBars } from 'react-icons/fa';

import './InstituteDashboard.css';
import './BadgeStyles.css';
import './ImageUpload.css';
import './HiringStyles.css';
import './PlacementSection.css';
import './EventNewsStyles.css';
import './CourseCardStyles.css';
import CourseQuizManager from './CourseQuizManager';
import GovtSchemeModal from './GovtSchemeModal';

const InstituteDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [loading, setLoading] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    
    // Course management states
    const [selectedCourseId, setSelectedCourseId] = useState(null);

    const [profileData, setProfileData] = useState({
        instituteName: '',
        address: '',
        pincode: '',
        phone: '',
        email: '',
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
        industryPartners: 0
    });
    
    // Filter states for charts
    const [chartFilters, setChartFilters] = useState({
        year: new Date().getFullYear(),
        monthRange: 12 // Default to 12 months
    });
    
    // Chart data states
    const [enrollmentData, setEnrollmentData] = useState([]);
    const [placementData, setPlacementData] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    
    // Use profile photo sync hook
    const { updateAllImages } = useProfilePhotoSync(profileData.profileImage, 'institute');
    
    // Use global loading hook
    const { withLoading } = useGlobalLoading();
    
    // Government schemes states
    const [instituteGovtSchemes, setInstituteGovtSchemes] = useState([]);
    const [governmentSchemes, setGovernmentSchemes] = useState([]);
    const [govtSchemeForm, setGovtSchemeForm] = useState({
        schemeName: '',
        description: '',
        link: ''
    });
    const [selectedGovtScheme, setSelectedGovtScheme] = useState(null);
    const [showGovtSchemeModal, setShowGovtSchemeModal] = useState(false);
    
    // Modal states
    const [showEventNewsModal, setShowEventNewsModal] = useState(false);
    const [showPlacementHistoryModal, setShowPlacementHistoryModal] = useState(false);

    // Load profile data on component mount
    useEffect(() => {
        loadProfileData();
        loadDashboardData();
        loadStudents();
        loadCourses();
        loadPlacementSectionData();
        loadIndustryCollabData();
        loadEventNewsData();
        loadChartData();
        loadInstituteGovtSchemes();
    }, []);
    
    // Load chart data when filters change
    useEffect(() => {
        loadChartData();
    }, [chartFilters]);
    
    // Refresh dashboard data when switching to overview or placements tab
    useEffect(() => {
        if (activeTab === 'overview' || activeTab === 'placements') {
            loadDashboardData();
            if (activeTab === 'placements') {
                loadPlacementSectionData();
            }
        }
    }, [activeTab]);
    
    // Update filtered students when students data changes
    useEffect(() => {
        const updateFilters = async () => {
            if (students.length > 0) {
                await filterStudents(searchQuery, placementStatusFilter);
            }
        };
        updateFilters();
    }, [students]);
    
    // Prevent body scroll when modal is open and fix Lenis conflict
    useEffect(() => {
        const isAnyModalOpen = showModal || showPlacementHistoryModal || showEventNewsModal || showGovtSchemeModal;
        
        if (isAnyModalOpen) {
            // Store original body styles
            const originalOverflow = document.body.style.overflow;
            const originalPaddingRight = document.body.style.paddingRight;
            
            // Disable body scroll and add modal-open class
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
            
            // Calculate scrollbar width to prevent layout shift
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }
            
            // Cleanup function
            return () => {
                document.body.classList.remove('modal-open');
                document.body.style.overflow = originalOverflow;
                document.body.style.paddingRight = originalPaddingRight;
            };
        }
    }, [showModal, showPlacementHistoryModal, showEventNewsModal, showGovtSchemeModal]);
    
    const loadDashboardData = async () => {
        try {
            const [statsResponse, courseCountResponse, industryCollabResponse] = await Promise.all([
                apiService.getDashboardStats(),
                apiService.getActiveCourseCount(),
                apiService.getIndustryCollaborations()
            ]);
            
            // Calculate industry partners from collaboration cards
            const industryPartners = industryCollabResponse.success && industryCollabResponse.data 
                ? (industryCollabResponse.data.collaborationCards || []).length 
                : 0;
            
            setDashboardStats({
                totalStudents: statsResponse.success ? statsResponse.data.totalStudents : 0,
                activeCourses: courseCountResponse.success ? courseCountResponse.data.activeCourses : 0,
                placementRate: statsResponse.success ? statsResponse.data.placementRate : 0,
                placedStudents: statsResponse.success ? statsResponse.data.placedStudents : 0,
                avgSalaryPackage: statsResponse.success ? statsResponse.data.avgSalaryPackage : 0,
                industryPartners: industryPartners
            });
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setDashboardStats({
                totalStudents: 0,
                activeCourses: 0,
                placementRate: 0,
                placedStudents: 0,
                avgSalaryPackage: 0,
                industryPartners: 0
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
                setFilteredStudents(response.data); // Initialize filtered students
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
                console.log('Setting placement section data:', response.data);
                setPlacementSectionData(response.data);
                
                // Only update form if it's empty or if we're loading for the first time
                const isFormEmpty = !placementSectionForm.averageSalary && 
                                   !placementSectionForm.highestPackage && 
                                   placementSectionForm.topHiringCompanies.length === 0 && 
                                   placementSectionForm.recentPlacementSuccess.length === 0;
                
                if (isFormEmpty || !placementSectionData) {
                    const newFormData = {
                        averageSalary: response.data.averageSalary || '',
                        highestPackage: response.data.highestPackage || '',
                        topHiringCompanies: (response.data.topHiringCompanies || []).map((company, index) => {
                            const validLogo = company.logo && typeof company.logo === 'string' && company.logo.includes('http') ? company.logo : null;
                            return {
                                id: `existing_company_${index}_${Date.now()}`,
                                name: company.name || '',
                                logo: validLogo,
                                logoPreview: validLogo,
                                isExisting: true,
                                hasNewFile: false,
                                isRemoved: false
                            };
                        }),
                        recentPlacementSuccess: (response.data.recentPlacementSuccess || []).map((placement, index) => {
                            const validPhoto = placement.photo && typeof placement.photo === 'string' && placement.photo.includes('http') ? placement.photo : null;
                            return {
                                id: `existing_student_${index}_${Date.now()}`,
                                name: placement.name || '',
                                company: placement.company || '',
                                position: placement.position || '',
                                photo: validPhoto,
                                photoPreview: validPhoto,
                                isExisting: true,
                                hasNewFile: false,
                                isRemoved: false
                            };
                        })
                    };
                    
                    console.log('Setting placement form data:', newFormData);
                    setPlacementSectionForm(newFormData);
                }
            } else if (!placementSectionData) {
                // Initialize with empty form only if no existing data
                setPlacementSectionForm({
                    averageSalary: '',
                    highestPackage: '',
                    topHiringCompanies: [],
                    recentPlacementSuccess: []
                });
            }
        } catch (error) {
            console.error('Error loading placement section data:', error);
            // Only initialize with empty form if no existing data
            if (!placementSectionData) {
                setPlacementSectionForm({
                    averageSalary: '',
                    highestPackage: '',
                    topHiringCompanies: [],
                    recentPlacementSuccess: []
                });
            }
        }
    };

    const loadIndustryCollabData = async () => {
        try {
            const response = await apiService.getIndustryCollaborations();
            if (response.success && response.data) {
                console.log('Setting industry collaboration data:', response.data);
                setIndustryCollabData(response.data);
                
                const newFormData = {
                    collaborationCards: (response.data.collaborationCards || []).map((card, index) => {
                        // Check if image is a valid URL string
                        const validImage = card.image && typeof card.image === 'string' && card.image.includes('http') ? card.image : null;
                        return {
                            id: `existing_card_${index}_${Date.now()}`,
                            title: card.title || '',
                            company: card.company || '',
                            type: card.type || '',
                            description: card.description || '',
                            image: validImage,
                            imagePreview: validImage,
                            isExisting: true,
                            hasNewFile: false,
                            isRemoved: false
                        };
                    }),
                    mouItems: (response.data.mouItems || []).map((mou, index) => {
                        // Check if PDF URL is valid - accept any non-empty string URL
                        const validPdf = mou.pdfUrl && typeof mou.pdfUrl === 'string' && mou.pdfUrl.trim() !== '' ? mou.pdfUrl : '';
                        return {
                            id: `existing_mou_${index}_${Date.now()}`,
                            title: mou.title || '',
                            description: mou.description || '',
                            pdfUrl: validPdf,
                            pdfFile: null,
                            isExisting: true,
                            hasNewFile: false,
                            isRemoved: false
                        };
                    })
                };
                
                console.log('Setting industry collaboration form data:', newFormData);
                setIndustryCollabForm(newFormData);
            } else {
                // Initialize with empty form if no data exists
                setIndustryCollabForm({
                    collaborationCards: [],
                    mouItems: []
                });
            }
        } catch (error) {
            console.error('Error loading industry collaboration data:', error);
            // Initialize with empty form on error
            setIndustryCollabForm({
                collaborationCards: [],
                mouItems: []
            });
        }
    };

    const loadInstituteGovtSchemes = async () => {
        try {
            const response = await apiService.getInstituteGovtSchemes();
            if (response.success && response.data) {
                setInstituteGovtSchemes(response.data);
            } else {
                setInstituteGovtSchemes([]);
            }
        } catch (error) {
            console.error('Error loading institute government schemes:', error);
            setInstituteGovtSchemes([]);
        }
    };

    const loadEventNewsData = async () => {
        try {
            console.log('Loading event/news data...');
            const response = await apiService.getEventNews();
            console.log('Event/news API response:', response);
            if (response.success && response.data) {
                console.log('Setting event/news data:', response.data);
                setEventNewsData({
                    events: response.data.events || [],
                    news: response.data.news || []
                });
            } else {
                console.log('No event/news data found, setting empty arrays');
                setEventNewsData({
                    events: [],
                    news: []
                });
            }
        } catch (error) {
            console.error('Error loading event/news data:', error);
            setEventNewsData({
                events: [],
                news: []
            });
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
                    pincode: response.data.pincode || '',
                    phone: response.data.phone || '',
                    email: response.data.email || '',
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
        certification: '',
        thumbnail: null,
        modules: []
    });

    const [eventForm, setEventForm] = useState({
        title: '',
        date: '',
        company: '',
        venue: '',
        expectedParticipants: '',
        details: '',
        type: 'Event',
        verified: false,
        bannerImage: null
    });

    const [newsForm, setNewsForm] = useState({
        title: '',
        date: '',
        company: '',
        venue: '',
        expectedParticipants: '',
        details: '',
        type: 'News',
        verified: false,
        bannerImage: null
    });

    const [eventNewsData, setEventNewsData] = useState({
        events: [],
        news: []
    });

    const [selectedEventNews, setSelectedEventNews] = useState(null);

    const [placementSectionForm, setPlacementSectionForm] = useState({
        averageSalary: '',
        highestPackage: '',
        topHiringCompanies: [],
        recentPlacementSuccess: []
    });
    
    // Use refs to maintain File object references
    const companyFilesRef = useRef(new Map());
    const studentFilesRef = useRef(new Map());

    const [placementSectionData, setPlacementSectionData] = useState(null);

    // Industry Collaboration form state
    const [industryCollabForm, setIndustryCollabForm] = useState({
        collaborationCards: [],
        mouItems: []
    });

    const [industryCollabData, setIndustryCollabData] = useState(null);

    // Student view/edit states
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [editingStudentId, setEditingStudentId] = useState(null);
    const [selectedStudentPlacementHistory, setSelectedStudentPlacementHistory] = useState([]);
    
    // Search and filter states for student management
    const [searchQuery, setSearchQuery] = useState('');
    const [placementStatusFilter, setPlacementStatusFilter] = useState('all');
    const [filteredStudents, setFilteredStudents] = useState([]);

    // Load chart data based on filters
    const loadChartData = async () => {
        try {
            // Load enrollment trends data
            const enrollmentResponse = await apiService.getEnrollmentTrends(chartFilters.year, chartFilters.monthRange);
            if (enrollmentResponse.success) {
                setEnrollmentData(enrollmentResponse.data);
            }
            
            // Load placement success rate data
            const placementResponse = await apiService.getPlacementTrends(chartFilters.year, chartFilters.monthRange);
            if (placementResponse.success) {
                setPlacementData(placementResponse.data);
            }
        } catch (error) {
            console.error('Error loading chart data:', error);
            // Set fallback data
            setEnrollmentData([
                { name: 'Jan', students: 0, completed: 0 },
                { name: 'Feb', students: 0, completed: 0 },
                { name: 'Mar', students: 0, completed: 0 },
                { name: 'Apr', students: 0, completed: 0 },
                { name: 'May', students: 0, completed: 0 },
            ]);
            setPlacementData([
                { name: 'Jan', rate: 0 },
                { name: 'Feb', rate: 0 },
                { name: 'Mar', rate: 0 },
                { name: 'Apr', rate: 0 },
                { name: 'May', rate: 0 },
            ]);
        }
    };



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
            mode: 'Offline', prerequisites: '', syllabus: '', certification: '', thumbnail: null, modules: []
        });
        setSelectedCourseId(null);
        setEventForm({
            title: '', date: '', company: '', venue: '', expectedParticipants: '', details: '', type: 'Event', verified: false, bannerImage: null
        });
        setNewsForm({
            title: '', date: '', company: '', venue: '', expectedParticipants: '', details: '', type: 'News', verified: false, bannerImage: null
        });
        setGovtSchemeForm({
            schemeName: '', description: '', link: ''
        });
        setSelectedGovtScheme(null);
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
    
    // Search and filter functionality
    const handleSearch = async () => {
        await withLoading(
            () => filterStudents(searchQuery, placementStatusFilter),
            'Searching students...'
        );
    };
    
    const filterStudents = async (query, statusFilter) => {
        let filtered = [...students];
        
        // If no search query and no status filter, show all students
        if (!query.trim() && statusFilter === 'all') {
            setFilteredStudents(filtered);
            return;
        }
        
        // Create a map to store placement history for each student
        const studentPlacementMap = new Map();
        
        // Fetch placement history for students that need it
        const studentsNeedingHistory = query.trim() || statusFilter !== 'all' ? filtered : [];
        
        for (const student of studentsNeedingHistory) {
            try {
                const response = await apiService.getStudentApplicationHistory(student.instituteStudntsID);
                if (response.success && response.data) {
                    studentPlacementMap.set(student.instituteStudntsID, response.data);
                }
            } catch (error) {
                console.error('Error fetching placement history for student:', student.instituteStudntsID, error);
                studentPlacementMap.set(student.instituteStudntsID, []);
            }
        }
        
        // Apply search filter
        if (query.trim()) {
            const searchTerm = query.toLowerCase().trim();
            
            filtered = students.filter(student => {
                // Search by student name
                const nameMatch = student.fullName?.toLowerCase().includes(searchTerm);
                
                // Search by company name in placement history
                const placementHistory = studentPlacementMap.get(student.instituteStudntsID) || [];
                const companyMatch = placementHistory.some(record => 
                    record.companyName?.toLowerCase().includes(searchTerm)
                );
                
                return nameMatch || companyMatch;
            });
        }
        
        // Apply placement status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(student => {
                const placementHistory = studentPlacementMap.get(student.instituteStudntsID) || [];
                return placementHistory.some(record => {
                    const status = record.status?.toLowerCase();
                    if (statusFilter === 'hired') {
                        return status === 'hired';
                    } else if (statusFilter === 'rejected') {
                        return status === 'rejected';
                    }
                    return false;
                });
            });
        }
        
        setFilteredStudents(filtered);
    };
    
    // Handle search input change
    const handleSearchInputChange = async (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        
        // If search is cleared, reset to show all students
        if (!value.trim()) {
            await filterStudents('', placementStatusFilter);
        }
    };
    
    // Handle placement status filter change
    const handlePlacementStatusFilterChange = async (e) => {
        const value = e.target.value;
        setPlacementStatusFilter(value);
        await withLoading(
            () => filterStudents(searchQuery, value),
            'Filtering students...'
        );
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
                // Reapply current filters after loading students
                setTimeout(async () => {
                    await filterStudents(searchQuery, placementStatusFilter);
                }, 100);
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
            
            // Create FormData for file uploads
            const formData = new FormData();
            
            // Add basic course data
            Object.keys(courseForm).forEach(key => {
                if (key !== 'thumbnail' && key !== 'modules' && courseForm[key]) {
                    formData.append(key, courseForm[key]);
                }
            });
            
            // Add thumbnail
            if (courseForm.thumbnail) {
                formData.append('thumbnail', courseForm.thumbnail);
            }
            
            // Add modules data
            if (courseForm.modules.length > 0) {
                formData.append('modules', JSON.stringify(courseForm.modules.map(module => ({
                    title: module.title,
                    description: module.description,
                    order: module.order,
                    content: module.content.map(content => ({
                        title: content.title,
                        type: content.type,
                        order: content.order
                    })),
                    quiz: module.quiz || null
                }))));
                
                // Add content files
                courseForm.modules.forEach((module, moduleIndex) => {
                    module.content.forEach((content, contentIndex) => {
                        if (content.file) {
                            const fieldName = `content_${moduleIndex}_${contentIndex}`;
                            formData.append(fieldName, content.file);
                        }
                    });
                });
            }
            
            let response;
            if (modalType === 'editCourse' && selectedCourseId) {
                // Update existing course
                response = await apiService.updateCourse(selectedCourseId, formData);
                if (response.success) {
                    alert('Course updated successfully!');
                }
            } else {
                // Create new course
                response = await apiService.addCourse(formData);
                if (response.success) {
                    alert('Course created successfully!');
                }
            }
            
            if (response.success) {
                await Promise.all([
                    loadDashboardData(), // Refresh dashboard stats
                    loadCourses() // Refresh course list
                ]);
                closeModal();
            } else {
                alert(response.message || `Failed to ${modalType === 'editCourse' ? 'update' : 'create'} course`);
            }
        } catch (error) {
            console.error(`Error ${modalType === 'editCourse' ? 'updating' : 'creating'} course:`, error);
            alert(`Failed to ${modalType === 'editCourse' ? 'update' : 'create'} course. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const handleEventSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            const formData = {
                ...eventForm,
                expectedParticipants: eventForm.expectedParticipants ? parseInt(eventForm.expectedParticipants) : null
            };
            
            let response;
            if (modalType === 'editEvent' && selectedEventNews) {
                response = await apiService.updateEventNews(selectedEventNews.eventNewsId, formData);
            } else {
                response = await apiService.addEventNews(formData);
            }
            
            if (response.success) {
                alert(`${eventForm.type} ${modalType === 'editEvent' ? 'updated' : 'added'} successfully!`);
                await loadEventNewsData(); // Refresh data
                closeModal();
            } else {
                alert(response.message || `Failed to ${modalType === 'editEvent' ? 'update' : 'add'} ${eventForm.type.toLowerCase()}`);
            }
        } catch (error) {
            console.error(`Error ${modalType === 'editEvent' ? 'updating' : 'adding'} ${eventForm.type.toLowerCase()}:`, error);
            alert(`Failed to ${modalType === 'editEvent' ? 'update' : 'add'} ${eventForm.type.toLowerCase()}. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const handleNewsSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            const formData = {
                ...newsForm,
                expectedParticipants: newsForm.expectedParticipants ? parseInt(newsForm.expectedParticipants) : null
            };
            
            let response;
            if (modalType === 'editNews' && selectedEventNews) {
                response = await apiService.updateEventNews(selectedEventNews.eventNewsId, formData);
            } else {
                response = await apiService.addEventNews(formData);
            }
            
            if (response.success) {
                alert(`${newsForm.type} ${modalType === 'editNews' ? 'updated' : 'added'} successfully!`);
                await loadEventNewsData(); // Refresh data
                closeModal();
            } else {
                alert(response.message || `Failed to ${modalType === 'editNews' ? 'update' : 'add'} ${newsForm.type.toLowerCase()}`);
            }
        } catch (error) {
            console.error(`Error ${modalType === 'editNews' ? 'updating' : 'adding'} ${newsForm.type.toLowerCase()}:`, error);
            alert(`Failed to ${modalType === 'editNews' ? 'update' : 'add'} ${newsForm.type.toLowerCase()}. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEventNews = async (eventNewsId, title, type) => {
        if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
            try {
                setLoading(true);
                const response = await apiService.deleteEventNews(eventNewsId);
                if (response.success) {
                    alert(`${type} deleted successfully!`);
                    await loadEventNewsData(); // Refresh data
                } else {
                    alert(response.message || `Failed to delete ${type.toLowerCase()}`);
                }
            } catch (error) {
                console.error(`Error deleting ${type.toLowerCase()}:`, error);
                alert(`Failed to delete ${type.toLowerCase()}`);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleViewEventNews = (item) => {
        setSelectedEventNews(item);
        setShowEventNewsModal(true);
    };

    const handleEditEventNews = (item) => {
        if (item.type === 'Event') {
            setEventForm({
                title: item.title || '',
                date: item.date || '',
                company: item.company || '',
                venue: item.venue || '',
                expectedParticipants: item.expectedParticipants || '',
                details: item.details || '',
                type: 'Event',
                verified: item.verified || false,
                bannerImage: null
            });
            setSelectedEventNews(item);
            openModal('editEvent');
        } else {
            setNewsForm({
                title: item.title || '',
                date: item.date || '',
                company: item.company || '',
                venue: item.venue || '',
                expectedParticipants: item.expectedParticipants || '',
                details: item.details || '',
                type: 'News',
                verified: item.verified || false,
                bannerImage: null
            });
            setSelectedEventNews(item);
            openModal('editNews');
        }
    };

    const handlePlacementSectionSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            // Validate form data before submission
            if (!placementSectionForm.averageSalary && !placementSectionForm.highestPackage && 
                placementSectionForm.topHiringCompanies.length === 0 && 
                placementSectionForm.recentPlacementSuccess.length === 0) {
                alert('Please fill at least one field before submitting.');
                return;
            }
            
            // Prepare placement data for submission
            const placementData = {
                averageSalary: placementSectionForm.averageSalary || '',
                highestPackage: placementSectionForm.highestPackage || '',
                topHiringCompanies: placementSectionForm.topHiringCompanies.map((company, index) => {
                    const companyData = {
                        name: company.name || ''
                    };
                    
                    // Handle logo file or existing URL
                    if (company.logoFileId && companyFilesRef.current.has(company.logoFileId)) {
                        companyData.logo = companyFilesRef.current.get(company.logoFileId);
                    } else if (typeof company.logo === 'string' && company.logo.includes('http') && !company.logo.startsWith('blob:')) {
                        companyData.logo = company.logo;
                    } else {
                        companyData.logo = null;
                    }
                    
                    return companyData;
                }),
                recentPlacementSuccess: placementSectionForm.recentPlacementSuccess.map((placement, index) => {
                    const placementData_item = {
                        name: placement.name || '',
                        company: placement.company || '',
                        position: placement.position || ''
                    };
                    
                    // Handle photo file or existing URL
                    if (placement.photoFileId && studentFilesRef.current.has(placement.photoFileId)) {
                        placementData_item.photo = studentFilesRef.current.get(placement.photoFileId);
                    } else if (typeof placement.photo === 'string' && placement.photo.includes('http') && !placement.photo.startsWith('blob:')) {
                        placementData_item.photo = placement.photo;
                    } else {
                        placementData_item.photo = null;
                    }
                    
                    return placementData_item;
                })
            };
            
            console.log('Submitting placement data:', placementData);
            
            const response = await apiService.updatePlacementSection(placementData);
            
            if (response.success) {
                alert('Placement section updated successfully!');
                
                // Clear file refs after successful upload
                companyFilesRef.current.clear();
                studentFilesRef.current.clear();
                
                // Wait for backend processing
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Reload placement section data to get the updated URLs
                await loadPlacementSectionData();
                
                // Refresh dashboard stats to ensure real-time sync
                await loadDashboardData();
                
                console.log('Placement section updated and data reloaded');
            } else {
                console.error('Placement section update failed:', response);
                alert(response.message || 'Failed to update placement section');
            }
        } catch (error) {
            console.error('Error updating placement section:', error);
            alert('Failed to update placement section. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGovtSchemeSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            // Transform form data to match backend expectations
            const submitData = {
                schemeName: govtSchemeForm.schemeName,
                schemeDescription: govtSchemeForm.description,
                link: govtSchemeForm.link
            };
            
            let response;
            if (modalType === 'editGovtScheme' && selectedGovtScheme) {
                response = await apiService.updateInstituteGovtScheme(selectedGovtScheme.instituteSchemeId, submitData);
            } else {
                response = await apiService.addInstituteGovtScheme(submitData);
            }
            
            if (response.success) {
                alert(`Government scheme ${modalType === 'editGovtScheme' ? 'updated' : 'added'} successfully!`);
                await loadInstituteGovtSchemes();
                closeModal();
            } else {
                alert(response.message || `Failed to ${modalType === 'editGovtScheme' ? 'update' : 'add'} government scheme`);
            }
        } catch (error) {
            console.error(`Error ${modalType === 'editGovtScheme' ? 'updating' : 'adding'} government scheme:`, error);
            alert(`Failed to ${modalType === 'editGovtScheme' ? 'update' : 'add'} government scheme. Please try again.`);
        } finally {
            setLoading(false);
        }
    };
    
    const handleViewGovtScheme = (scheme) => {
        setSelectedGovtScheme(scheme);
        setShowGovtSchemeModal(true);
    };
    
    const handleEditGovtScheme = (scheme) => {
        setGovtSchemeForm({
            schemeName: scheme.schemeName || '',
            description: scheme.description || '',
            link: scheme.link || ''
        });
        setSelectedGovtScheme(scheme);
        openModal('editGovtScheme');
    };
    
    const handleDeleteGovtScheme = async (schemeId, schemeName) => {
        if (window.confirm(`Are you sure you want to delete "${schemeName}"? This action cannot be undone.`)) {
            try {
                setLoading(true);
                const response = await apiService.deleteInstituteGovtScheme(schemeId);
                if (response.success) {
                    alert('Government scheme deleted successfully!');
                    await loadInstituteGovtSchemes();
                } else {
                    alert(response.message || 'Failed to delete government scheme');
                }
            } catch (error) {
                console.error('Error deleting government scheme:', error);
                alert('Failed to delete government scheme');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleIndustryCollabSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            
            // Create a deep copy of the form data for submission
            const collabData = {
                collaborationCards: industryCollabForm.collaborationCards.map(card => ({
                    id: card.id,
                    title: card.title,
                    company: card.company,
                    type: card.type,
                    description: card.description,
                    image: card.image, // Keep the File object for upload
                    imagePreview: card.imagePreview,
                    hasNewFile: card.hasNewFile,
                    isExisting: card.isExisting,
                    isRemoved: card.isRemoved
                })),
                mouItems: industryCollabForm.mouItems.map(mou => ({
                    id: mou.id,
                    title: mou.title,
                    description: mou.description,
                    pdfUrl: mou.pdfUrl,
                    pdfFile: mou.pdfFile, // Direct File object reference
                    hasNewFile: !!mou.pdfFile,
                    isExisting: mou.isExisting,
                    isRemoved: mou.isRemoved
                }))
            };
            
            console.log('🚀 Submitting industry collaboration data:', {
                collaborationCards: collabData.collaborationCards.length,
                mouItems: collabData.mouItems.length,
                mouItemsWithFiles: collabData.mouItems.filter(mou => mou.pdfFile).length,
                mouDetails: collabData.mouItems.map(mou => ({
                    title: mou.title,
                    hasFile: !!mou.pdfFile,
                    hasNewFile: mou.hasNewFile,
                    fileName: mou.pdfFile?.name
                }))
            });
            
            const response = await apiService.updateIndustryCollaborations(collabData);
            
            if (response.success) {
                alert('Industry collaborations updated successfully!');
                
                // Wait a moment for the backend to process
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Reload industry collaboration data to get the updated URLs
                await loadIndustryCollabData();
                
                console.log('Industry collaborations updated and data reloaded');
            } else {
                alert(response.message || 'Failed to update industry collaborations');
            }
        } catch (error) {
            console.error('Error updating industry collaborations:', error);
            alert('Failed to update industry collaborations. Please try again.');
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
                    // Reapply current filters after loading students
                    setTimeout(async () => {
                        await filterStudents(searchQuery, placementStatusFilter);
                    }, 100);
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

    // Quiz update handler
    const handleQuizUpdate = (moduleIndex, quizData) => {
        const updatedModules = [...courseForm.modules];
        if (quizData) {
            updatedModules[moduleIndex].quiz = quizData;
        } else {
            delete updatedModules[moduleIndex].quiz;
        }
        setCourseForm({...courseForm, modules: updatedModules});
    };

    // Course management handlers
    const handleViewCourseDetails = (course) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const courseId = course.coursesId || course.instituteCourseID;
        
        // Navigate to CourseLearningPage with institute context
        navigate(`/course/${courseId}?preview=true&institute=${user.id}`);
    };

    const handleEditCourse = async (course) => {
        const courseId = course.coursesId || course.instituteCourseID;
        
        try {
            setLoading(true);
            
            // Fetch complete course details from API
            const response = await apiService.getCourseById(courseId);
            
            let courseData = course; // fallback to course list data
            if (response.success && response.data) {
                courseData = response.data;
                console.log('📚 Loaded course data for editing:', {
                    courseName: courseData.courseName || courseData.name,
                    modulesCount: courseData.modules?.length || 0,
                    modules: courseData.modules
                });
            } else {
                console.warn('Failed to fetch complete course details, using course list data');
            }
            
            // Process modules to ensure proper structure for editing
            const processedModules = (courseData.modules || []).map((module, index) => ({
                title: module.moduleTitle || module.title || '',
                description: module.moduleDescription || module.description || '',
                order: module.order || index + 1,
                content: (module.content || []).map((content, contentIndex) => ({
                    title: content.contentTitle || content.title || '',
                    type: content.contentType || content.type || 'video',
                    file: null, // Don't pre-load existing files
                    order: content.order || contentIndex + 1
                }))
            }));
            
            console.log('📝 Processed modules for form:', processedModules);
            
            // Pre-fill the course form with complete course data
            setCourseForm({
                name: courseData.courseName || courseData.name || '',
                duration: courseData.duration || '',
                fees: courseData.fees || '',
                instructor: courseData.instructor || '',
                description: courseData.description || '',
                category: courseData.category || '',
                mode: courseData.mode || 'Offline',
                prerequisites: courseData.prerequisites || '',
                syllabus: courseData.syllabus || courseData.syllabusOverview || '',
                certification: courseData.certification || '',
                thumbnail: null, // File input will be empty, but existing thumbnail will be shown via thumbnailUrl
                modules: processedModules
            });
            
            // Set edit mode and course ID
            setSelectedCourseId(courseId);
            openModal('editCourse');
            
        } catch (error) {
            console.error('Error fetching course details for edit:', error);
            
            // Fallback: use course list data if API fails
            const fallbackModules = (course.modules || []).map((module, index) => ({
                title: module.moduleTitle || module.title || '',
                description: module.moduleDescription || module.description || '',
                order: module.order || index + 1,
                content: (module.content || []).map((content, contentIndex) => ({
                    title: content.contentTitle || content.title || '',
                    type: content.contentType || content.type || 'video',
                    file: null,
                    order: content.order || contentIndex + 1
                }))
            }));
            
            setCourseForm({
                name: course.courseName || course.name || '',
                duration: course.duration || '',
                fees: course.fees || '',
                instructor: course.instructor || '',
                description: course.description || '',
                category: course.category || '',
                mode: course.mode || 'Offline',
                prerequisites: course.prerequisites || '',
                syllabus: course.syllabus || course.syllabusOverview || '',
                certification: course.certification || '',
                thumbnail: null,
                modules: fallbackModules
            });
            
            setSelectedCourseId(courseId);
            openModal('editCourse');
        } finally {
            setLoading(false);
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



    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setIsMobileSidebarOpen(false);
    };

    return (
        <div className="institute-dashboard">
            <button className="mobile-hamburger" onClick={toggleMobileSidebar}>
                <FaBars />
            </button>
            <div className={`institute-dashboard-sidebar ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
                <div className="institute-info">
                    <img 
                        src={profileData.profileImage || "/institute-logo-placeholder.png"} 
                        alt="Institute Logo" 
                        className="institute-logo" 
                    />
                    <h3>{profileData.instituteName}</h3>
                </div>
                <ul className="institute-sidebar-menu">
                    <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => handleTabChange('profile')}>
                        My Profile
                    </li>
                    <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => handleTabChange('overview')}>
                        Dashboard
                    </li>
                    <li className={activeTab === 'students' ? 'active' : ''} onClick={() => handleTabChange('students')}>
                        Student Management
                    </li>
                    <li className={activeTab === 'courses' ? 'active' : ''} onClick={() => handleTabChange('courses')}>
                        Course Management
                    </li>
                    <li className={activeTab === 'placements' ? 'active' : ''} onClick={() => handleTabChange('placements')}>
                        Placements
                    </li>
                    <li className={activeTab === 'collaborations' ? 'active' : ''} onClick={() => handleTabChange('collaborations')}>
                        Industry Collaborations
                    </li>
                    <li className={activeTab === 'govt' ? 'active' : ''} onClick={() => handleTabChange('govt')}>
                        Government Schemes
                    </li>
                    <li className={activeTab === 'events' ? 'active' : ''} onClick={() => handleTabChange('events')}>
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
                                    <strong>Pincode:</strong>
                                    <span>{profileData.pincode}</span>
                                </div>
                                <div className="institute-contact-item">
                                    <strong>Phone:</strong>
                                    <span>{profileData.phone}</span>
                                </div>
                                <div className="institute-contact-item">
                                    <strong>Email:</strong>
                                    <span>{profileData.email}</span>
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
                            {/* Events Section */}
                            <div className="institute-events-section">
                                <h3>Events ({eventNewsData.events.length})</h3>
                                {eventNewsData.events.length > 0 ? (
                                    <div className="institute-events-grid">
                                        {eventNewsData.events.map(event => (
                                            <div className="institute-event-management-card" key={event.eventNewsId}>
                                                {event.bannerImage && (
                                                    <div className="institute-event-banner">
                                                        <img src={event.bannerImage} alt={event.title} />
                                                    </div>
                                                )}
                                                <div className="institute-event-card-header">
                                                    <h3>{event.title}</h3>
                                                    <span className={`institute-event-type-badge ${event.type.toLowerCase()}`}>
                                                        {event.type}
                                                    </span>
                                                </div>
                                                <div className="institute-event-card-details">
                                                    <p><strong>Company:</strong> {event.company}</p>
                                                    <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                                    {event.venue && (
                                                        <p><strong>Venue:</strong> {event.venue}</p>
                                                    )}
                                                    {event.expectedParticipants && (
                                                        <p><strong>Expected Participants:</strong> {event.expectedParticipants}</p>
                                                    )}
                                                    <p><strong>Details:</strong> {event.details.substring(0, 100)}...</p>
                                                    <p><strong>Status:</strong> 
                                                        <span className={`institute-verification-badge ${event.verified ? 'verified' : 'pending'}`}>
                                                            {event.verified ? '✓ Verified' : '⏳ Pending'}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="institute-event-card-actions">
                                                    <button 
                                                        className="institute-table-action view" 
                                                        onClick={() => handleViewEventNews(event)}
                                                    >
                                                        View
                                                    </button>
                                                    <button 
                                                        className="institute-table-action edit" 
                                                        onClick={() => handleEditEventNews(event)}
                                                        style={{backgroundColor: '#28a745', color: 'white', marginRight: '5px'}}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="institute-table-action delete" 
                                                        onClick={() => handleDeleteEventNews(event.eventNewsId, event.title, event.type)}
                                                        disabled={loading}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                                        <p>No events added yet. Click "Add Event" to get started.</p>
                                    </div>
                                )}
                            </div>

                            {/* News Section */}
                            <div className="institute-news-section">
                                <h3>News ({eventNewsData.news.length})</h3>
                                {eventNewsData.news.length > 0 ? (
                                    <div className="institute-news-grid">
                                        {eventNewsData.news.map(newsItem => (
                                            <div className="institute-event-management-card" key={newsItem.eventNewsId}>
                                                {newsItem.bannerImage && (
                                                    <div className="institute-event-banner">
                                                        <img src={newsItem.bannerImage} alt={newsItem.title} />
                                                    </div>
                                                )}
                                                <div className="institute-event-card-header">
                                                    <h3>{newsItem.title}</h3>
                                                    <span className={`institute-event-type-badge ${newsItem.type.toLowerCase()}`}>
                                                        {newsItem.type}
                                                    </span>
                                                </div>
                                                <div className="institute-event-card-details">
                                                    <p><strong>Company:</strong> {newsItem.company}</p>
                                                    <p><strong>Date:</strong> {new Date(newsItem.date).toLocaleDateString()}</p>
                                                    {newsItem.venue && (
                                                        <p><strong>Venue:</strong> {newsItem.venue}</p>
                                                    )}
                                                    {newsItem.expectedParticipants && (
                                                        <p><strong>Expected Participants:</strong> {newsItem.expectedParticipants}</p>
                                                    )}
                                                    <p><strong>Details:</strong> {newsItem.details.substring(0, 100)}...</p>
                                                    <p><strong>Status:</strong> 
                                                        <span className={`institute-verification-badge ${newsItem.verified ? 'verified' : 'pending'}`}>
                                                            {newsItem.verified ? '✓ Verified' : '⏳ Pending'}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="institute-event-card-actions">
                                                    <button 
                                                        className="institute-table-action view" 
                                                        onClick={() => handleViewEventNews(newsItem)}
                                                    >
                                                        View
                                                    </button>
                                                    <button 
                                                        className="institute-table-action edit" 
                                                        onClick={() => handleEditEventNews(newsItem)}
                                                        style={{backgroundColor: '#28a745', color: 'white', marginRight: '5px'}}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="institute-table-action delete" 
                                                        onClick={() => handleDeleteEventNews(newsItem.eventNewsId, newsItem.title, newsItem.type)}
                                                        disabled={loading}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                                        <p>No news added yet. Click "Add News" to get started.</p>
                                    </div>
                                )}
                            </div>
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
                                <p className="institute-metric-trend positive">Real-time data</p>
                            </div>
                        </div>

                        <div className="institute-chart-filters">
                            <div className="institute-filter-group">
                                <label>Year:</label>
                                <select 
                                    value={chartFilters.year} 
                                    onChange={(e) => setChartFilters({...chartFilters, year: parseInt(e.target.value)})}
                                    className="institute-filter-select"
                                >
                                    {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="institute-filter-group">
                                <label>Time Range:</label>
                                <select 
                                    value={chartFilters.monthRange} 
                                    onChange={(e) => setChartFilters({...chartFilters, monthRange: parseInt(e.target.value)})}
                                    className="institute-filter-select"
                                >
                                    <option value={3}>Up to 3 months</option>
                                    <option value={6}>Up to 6 months</option>
                                    <option value={9}>Up to 9 months</option>
                                    <option value={12}>Up to 12 months</option>
                                </select>
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
                                <input 
                                    type="text" 
                                    placeholder="Search by student name or company name..." 
                                    className="institute-search-input large"
                                    value={searchQuery}
                                    onChange={handleSearchInputChange}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch();
                                        }
                                    }}
                                />
                                <button 
                                    className="institute-primary-button"
                                    onClick={handleSearch}
                                >
                                    Search
                                </button>
                            </div>
                            <div className="institute-filter-row">
                                <select 
                                    className="institute-filter-select"
                                    value={placementStatusFilter}
                                    onChange={handlePlacementStatusFilterChange}
                                    disabled={loading}
                                >
                                    <option value="all">All Placement Status</option>
                                    <option value="hired">Hired</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                                {(searchQuery.trim() || placementStatusFilter !== 'all') && (
                                    <div style={{display: 'flex', alignItems: 'center', marginLeft: '15px', color: '#64748b', fontSize: '0.9rem'}}>
                                        Showing {filteredStudents.length} of {students.length} students
                                    </div>
                                )}
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
                                {filteredStudents.length > 0 ? filteredStudents.map(student => (
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
                                <div className="institute-course-card" key={course.coursesId || course.instituteCourseID}>
                                    {course.thumbnailUrl && (
                                        <div className="institute-course-thumbnail">
                                            <img src={course.thumbnailUrl} alt={course.courseName || course.name} />
                                        </div>
                                    )}
                                    <div className="institute-course-content">
                                        <h3>{course.courseName || course.name}</h3>
                                        <div className="institute-course-details">
                                            <div className="institute-detail-item">
                                                <span className="institute-label">Duration:</span>
                                                <span className="institute-value">{course.duration}</span>
                                            </div>
                                            <div className="institute-detail-item">
                                                <span className="institute-label">Fees:</span>
                                                <span className="institute-value">₹{course.fees}</span>
                                            </div>
                                            <div className="institute-detail-item">
                                                <span className="institute-label">Instructor:</span>
                                                <span className="institute-value">{course.instructor}</span>
                                            </div>
                                            <div className="institute-detail-item">
                                                <span className="institute-label">Category:</span>
                                                <span className="institute-value">{course.category}</span>
                                            </div>
                                            <div className="institute-detail-item">
                                                <span className="institute-label">Mode:</span>
                                                <span className="institute-value">{course.mode}</span>
                                            </div>
                                            <div className="institute-detail-item">
                                                <span className="institute-label">Modules:</span>
                                                <span className="institute-value">{course.modules?.length || 0}</span>
                                            </div>
                                            <div className="institute-detail-item">
                                                <span className="institute-label">Status:</span>
                                                <span className={`institute-value ${course.isActive ? 'active' : 'inactive'}`}>
                                                    {course.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="institute-course-actions">
                                            <button 
                                                className="institute-action-button"
                                                onClick={() => handleViewCourseDetails(course)}
                                            >
                                                View Details
                                            </button>
                                            <button 
                                                className="institute-action-button"
                                                onClick={() => handleEditCourse(course)}
                                            >
                                                Edit Course
                                            </button>
                                        </div>
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
                                                                // Validate file size (max 5MB)
                                                                if (file.size > 5 * 1024 * 1024) {
                                                                    alert('Image size should be less than 5MB');
                                                                    return;
                                                                }
                                                                
                                                                // Validate file type
                                                                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                                                                if (!allowedTypes.includes(file.type)) {
                                                                    alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
                                                                    return;
                                                                }
                                                                
                                                                // Store File object in ref to prevent loss during state updates
                                                                const fileId = `company_${index}_${Date.now()}`;
                                                                companyFilesRef.current.set(fileId, file);
                                                                
                                                                setPlacementSectionForm(prevForm => {
                                                                    const updatedCompanies = [...prevForm.topHiringCompanies];
                                                                    // Clean up previous blob URL if it exists
                                                                    if (updatedCompanies[index].logoPreview && updatedCompanies[index].logoPreview.startsWith('blob:')) {
                                                                        URL.revokeObjectURL(updatedCompanies[index].logoPreview);
                                                                    }
                                                                    // Store file reference ID instead of File object
                                                                    updatedCompanies[index] = {
                                                                        ...updatedCompanies[index],
                                                                        logoFileId: fileId,
                                                                        logoPreview: URL.createObjectURL(file),
                                                                        hasNewFile: true
                                                                    };
                                                                    return {...prevForm, topHiringCompanies: updatedCompanies};
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    {company.logoPreview && (
                                                        <div className="image-preview-container">
                                                            <img 
                                                                src={company.logoPreview} 
                                                                alt="Company Logo" 
                                                                className="image-preview"
                                                                onError={(e) => {
                                                                    console.error('Image load error:', e.target.src);
                                                                    e.target.style.display = 'none';
                                                                }}
                                                                onLoad={() => console.log('Company logo loaded successfully:', company.logoPreview)}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updatedCompanies = [...placementSectionForm.topHiringCompanies];
                                                                    // Clean up file ref if exists
                                                                    if (updatedCompanies[index].logoFileId) {
                                                                        companyFilesRef.current.delete(updatedCompanies[index].logoFileId);
                                                                    }
                                                                    // Only revoke blob URLs, not server URLs
                                                                    if (updatedCompanies[index].logoPreview && updatedCompanies[index].logoPreview.startsWith('blob:')) {
                                                                        URL.revokeObjectURL(updatedCompanies[index].logoPreview);
                                                                    }
                                                                    updatedCompanies[index].logoFileId = null;
                                                                    updatedCompanies[index].logoPreview = null;
                                                                    updatedCompanies[index].hasNewFile = false;
                                                                    updatedCompanies[index].isRemoved = true;
                                                                    setPlacementSectionForm({...placementSectionForm, topHiringCompanies: updatedCompanies});
                                                                }}
                                                                className="image-remove-btn"
                                                                title="Remove Image"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}
                                                    {!company.logoPreview && (
                                                        <div className="image-placeholder">
                                                            <span>No image selected</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedCompanies = placementSectionForm.topHiringCompanies.filter((_, i) => i !== index);
                                                        // Only revoke blob URLs, not server URLs
                                                        if (company.logoPreview && company.logoPreview.startsWith('blob:')) {
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
                                                    topHiringCompanies: [...placementSectionForm.topHiringCompanies, { 
                                                        id: `new_company_${Date.now()}_${Math.random()}`,
                                                        name: '', 
                                                        logo: null, 
                                                        logoPreview: null,
                                                        hasNewFile: false,
                                                        isExisting: false,
                                                        isRemoved: false
                                                    }]
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
                                                                // Validate file size (max 5MB)
                                                                if (file.size > 5 * 1024 * 1024) {
                                                                    alert('Image size should be less than 5MB');
                                                                    return;
                                                                }
                                                                
                                                                // Validate file type
                                                                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                                                                if (!allowedTypes.includes(file.type)) {
                                                                    alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
                                                                    return;
                                                                }
                                                                
                                                                // Store File object in ref to prevent loss during state updates
                                                                const fileId = `student_${index}_${Date.now()}`;
                                                                studentFilesRef.current.set(fileId, file);
                                                                
                                                                setPlacementSectionForm(prevForm => {
                                                                    const updatedPlacements = [...prevForm.recentPlacementSuccess];
                                                                    // Clean up previous blob URL if it exists
                                                                    if (updatedPlacements[index].photoPreview && updatedPlacements[index].photoPreview.startsWith('blob:')) {
                                                                        URL.revokeObjectURL(updatedPlacements[index].photoPreview);
                                                                    }
                                                                    // Store file reference ID instead of File object
                                                                    updatedPlacements[index] = {
                                                                        ...updatedPlacements[index],
                                                                        photoFileId: fileId,
                                                                        photoPreview: URL.createObjectURL(file),
                                                                        hasNewFile: true
                                                                    };
                                                                    return {...prevForm, recentPlacementSuccess: updatedPlacements};
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    {placement.photoPreview && (
                                                        <div className="image-preview-container">
                                                            <img 
                                                                src={placement.photoPreview} 
                                                                alt="Student Photo" 
                                                                className="image-preview"
                                                                onError={(e) => {
                                                                    console.error('Image load error:', e.target.src);
                                                                    e.target.style.display = 'none';
                                                                }}
                                                                onLoad={() => console.log('Student photo loaded successfully:', placement.photoPreview)}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const updatedPlacements = [...placementSectionForm.recentPlacementSuccess];
                                                                    // Clean up file ref if exists
                                                                    if (updatedPlacements[index].photoFileId) {
                                                                        studentFilesRef.current.delete(updatedPlacements[index].photoFileId);
                                                                    }
                                                                    // Only revoke blob URLs, not server URLs
                                                                    if (updatedPlacements[index].photoPreview && updatedPlacements[index].photoPreview.startsWith('blob:')) {
                                                                        URL.revokeObjectURL(updatedPlacements[index].photoPreview);
                                                                    }
                                                                    updatedPlacements[index].photoFileId = null;
                                                                    updatedPlacements[index].photoPreview = null;
                                                                    updatedPlacements[index].hasNewFile = false;
                                                                    updatedPlacements[index].isRemoved = true;
                                                                    setPlacementSectionForm({...placementSectionForm, recentPlacementSuccess: updatedPlacements});
                                                                }}
                                                                className="image-remove-btn"
                                                                title="Remove Image"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}
                                                    {!placement.photoPreview && (
                                                        <div className="image-placeholder">
                                                            <span>No image selected</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedPlacements = placementSectionForm.recentPlacementSuccess.filter((_, i) => i !== index);
                                                        // Only revoke blob URLs, not server URLs
                                                        if (placement.photoPreview && placement.photoPreview.startsWith('blob:')) {
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
                                                    recentPlacementSuccess: [...placementSectionForm.recentPlacementSuccess, { 
                                                        id: `new_student_${Date.now()}_${Math.random()}`,
                                                        name: '', 
                                                        company: '', 
                                                        position: '', 
                                                        photo: null, 
                                                        photoPreview: null,
                                                        hasNewFile: false,
                                                        isExisting: false,
                                                        isRemoved: false
                                                    }]
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

                {/* Industry Collaborations Tab */}
                {activeTab === 'collaborations' && (
                    <div className="institute-collaborations-tab">
                        <div className="institute-tab-header">
                            <h1>Industry Collaborations</h1>
                            <p>Manage your industry partnerships and collaboration initiatives</p>
                        </div>

                        <div className="institute-tab-section">
                            <form onSubmit={handleIndustryCollabSubmit} className="institute-collaboration-form">
                                {/* Collaboration Cards Section */}
                                <div className="institute-form-group">
                                    <label>Collaboration Cards</label>
                                    <div className="institute-collaboration-cards-section">
                                        {industryCollabForm.collaborationCards.map((card, index) => (
                                            <div key={index} className="institute-collaboration-card-item">
                                                <input
                                                    type="text"
                                                    value={card.title}
                                                    onChange={(e) => {
                                                        const updatedCards = [...industryCollabForm.collaborationCards];
                                                        updatedCards[index].title = e.target.value;
                                                        setIndustryCollabForm({...industryCollabForm, collaborationCards: updatedCards});
                                                    }}
                                                    placeholder="Collaboration Title"
                                                />
                                                <input
                                                    type="text"
                                                    value={card.company}
                                                    onChange={(e) => {
                                                        const updatedCards = [...industryCollabForm.collaborationCards];
                                                        updatedCards[index].company = e.target.value;
                                                        setIndustryCollabForm({...industryCollabForm, collaborationCards: updatedCards});
                                                    }}
                                                    placeholder="Company Name"
                                                />
                                                <input
                                                    type="text"
                                                    value={card.type}
                                                    onChange={(e) => {
                                                        const updatedCards = [...industryCollabForm.collaborationCards];
                                                        updatedCards[index].type = e.target.value;
                                                        setIndustryCollabForm({...industryCollabForm, collaborationCards: updatedCards});
                                                    }}
                                                    placeholder="Collaboration Type (e.g., Training Partner)"
                                                />
                                                <textarea
                                                    value={card.description}
                                                    onChange={(e) => {
                                                        const updatedCards = [...industryCollabForm.collaborationCards];
                                                        updatedCards[index].description = e.target.value;
                                                        setIndustryCollabForm({...industryCollabForm, collaborationCards: updatedCards});
                                                    }}
                                                    placeholder="Description"
                                                    rows="3"
                                                />
                                                <div className="file-input-container">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                if (file.size > 5 * 1024 * 1024) {
                                                                    alert('Image size should be less than 5MB');
                                                                    return;
                                                                }
                                                                
                                                                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                                                                if (!allowedTypes.includes(file.type)) {
                                                                    alert('Please select a valid image file (JPEG, PNG, GIF, WebP)');
                                                                    return;
                                                                }
                                                                
                                                                // Show loading state
                                                                const updatedCards = [...industryCollabForm.collaborationCards];
                                                                updatedCards[index].imagePreview = 'uploading';
                                                                setIndustryCollabForm({...industryCollabForm, collaborationCards: updatedCards});
                                                                
                                                                try {
                                                                    // Upload image in real-time
                                                                    const uploadResult = await apiService.uploadCollaborationImage(file);
                                                                    
                                                                    if (uploadResult.success) {
                                                                        const finalUpdatedCards = [...industryCollabForm.collaborationCards];
                                                                        // Clean up previous blob URL if it exists
                                                                        if (finalUpdatedCards[index].imagePreview && finalUpdatedCards[index].imagePreview.startsWith('blob:')) {
                                                                            URL.revokeObjectURL(finalUpdatedCards[index].imagePreview);
                                                                        }
                                                                        finalUpdatedCards[index].image = uploadResult.data.imageUrl;
                                                                        finalUpdatedCards[index].imagePreview = uploadResult.data.imageUrl;
                                                                        finalUpdatedCards[index].hasNewFile = false;
                                                                        finalUpdatedCards[index].isRemoved = false;
                                                                        console.log(`Image uploaded for collaboration card: ${uploadResult.data.imageUrl}`);
                                                                        setIndustryCollabForm({...industryCollabForm, collaborationCards: finalUpdatedCards});
                                                                    } else {
                                                                        alert(uploadResult.message || 'Failed to upload image');
                                                                        // Reset to previous state
                                                                        const resetCards = [...industryCollabForm.collaborationCards];
                                                                        resetCards[index].imagePreview = resetCards[index].image;
                                                                        setIndustryCollabForm({...industryCollabForm, collaborationCards: resetCards});
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Image upload error:', error);
                                                                    alert('Failed to upload image. Please try again.');
                                                                    // Reset to previous state
                                                                    const resetCards = [...industryCollabForm.collaborationCards];
                                                                    resetCards[index].imagePreview = resetCards[index].image;
                                                                    setIndustryCollabForm({...industryCollabForm, collaborationCards: resetCards});
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    {card.imagePreview === 'uploading' ? (
                                                        <div className="image-preview-container">
                                                            <div className="upload-progress">
                                                                <span>Uploading...</span>
                                                            </div>
                                                        </div>
                                                    ) : card.imagePreview && (
                                                        <div className="image-preview-container">
                                                            <img 
                                                                src={card.imagePreview} 
                                                                alt="Collaboration Image" 
                                                                className="image-preview"
                                                                onError={(e) => {
                                                                    console.error('Image load error:', e.target.src);
                                                                    e.target.style.display = 'none';
                                                                }}
                                                                onLoad={() => console.log('Collaboration image loaded successfully:', card.imagePreview)}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    const updatedCards = [...industryCollabForm.collaborationCards];
                                                                    const imageUrl = updatedCards[index].image;
                                                                    
                                                                    // Delete from S3 if it's a server URL
                                                                    if (imageUrl && typeof imageUrl === 'string' && imageUrl.includes('http')) {
                                                                        try {
                                                                            await apiService.deleteCollaborationImage(imageUrl);
                                                                        } catch (error) {
                                                                            console.error('Failed to delete image from S3:', error);
                                                                        }
                                                                    }
                                                                    
                                                                    // Only revoke blob URLs, not server URLs
                                                                    if (updatedCards[index].imagePreview && updatedCards[index].imagePreview.startsWith('blob:')) {
                                                                        URL.revokeObjectURL(updatedCards[index].imagePreview);
                                                                    }
                                                                    updatedCards[index].image = null;
                                                                    updatedCards[index].imagePreview = null;
                                                                    updatedCards[index].hasNewFile = false;
                                                                    updatedCards[index].isRemoved = true;
                                                                    console.log(`Image removed for collaboration card: ${card.title}`);
                                                                    setIndustryCollabForm({...industryCollabForm, collaborationCards: updatedCards});
                                                                }}
                                                                className="image-remove-btn"
                                                                title="Remove Image"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}
                                                    {!card.imagePreview && (
                                                        <div className="image-placeholder">
                                                            <span>No image selected</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedCards = industryCollabForm.collaborationCards.filter((_, i) => i !== index);
                                                        if (card.imagePreview && card.imagePreview.startsWith('blob:')) {
                                                            URL.revokeObjectURL(card.imagePreview);
                                                        }
                                                        setIndustryCollabForm({...industryCollabForm, collaborationCards: updatedCards});
                                                    }}
                                                    className="institute-remove-btn"
                                                >
                                                    Remove Card
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIndustryCollabForm({
                                                    ...industryCollabForm,
                                                    collaborationCards: [...industryCollabForm.collaborationCards, { 
                                                        id: `new_card_${Date.now()}_${Math.random()}`,
                                                        title: '',
                                                        company: '',
                                                        type: '',
                                                        description: '',
                                                        image: null,
                                                        imagePreview: null,
                                                        hasNewFile: false,
                                                        isExisting: false,
                                                        isRemoved: false
                                                    }]
                                                });
                                            }}
                                            className="institute-add-btn"
                                        >
                                            Add Collaboration Card
                                        </button>
                                    </div>
                                </div>
                                
                                {/* MOU Items Section */}
                                <div className="institute-form-group">
                                    <label>MOU (Memorandum of Understanding) Items</label>
                                    <div className="institute-mou-items-section">
                                        {industryCollabForm.mouItems.map((mou, index) => (
                                            <div key={index} className="institute-mou-item">
                                                <input
                                                    type="text"
                                                    value={mou.title}
                                                    onChange={(e) => {
                                                        const updatedMous = [...industryCollabForm.mouItems];
                                                        updatedMous[index].title = e.target.value;
                                                        setIndustryCollabForm({...industryCollabForm, mouItems: updatedMous});
                                                    }}
                                                    placeholder="MOU Title"
                                                />
                                                <textarea
                                                    value={mou.description}
                                                    onChange={(e) => {
                                                        const updatedMous = [...industryCollabForm.mouItems];
                                                        updatedMous[index].description = e.target.value;
                                                        setIndustryCollabForm({...industryCollabForm, mouItems: updatedMous});
                                                    }}
                                                    placeholder="MOU Description"
                                                    rows="3"
                                                />
                                                <div className="file-input-container">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={async (e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                console.log(`📄 PDF file selected:`, {
                                                                    name: file.name,
                                                                    size: file.size,
                                                                    type: file.type
                                                                });
                                                                
                                                                if (file.size > 10 * 1024 * 1024) {
                                                                    alert('PDF size should be less than 10MB');
                                                                    return;
                                                                }
                                                                
                                                                if (file.type !== 'application/pdf') {
                                                                    alert('Please select a valid PDF file');
                                                                    return;
                                                                }
                                                                
                                                                // Show loading state
                                                                const updatedMous = [...industryCollabForm.mouItems];
                                                                updatedMous[index].pdfUrl = 'uploading';
                                                                setIndustryCollabForm({...industryCollabForm, mouItems: updatedMous});
                                                                
                                                                try {
                                                                    // Upload PDF in real-time
                                                                    const uploadResult = await apiService.uploadMouPdf(file);
                                                                    
                                                                    if (uploadResult.success) {
                                                                        const finalUpdatedMous = [...industryCollabForm.mouItems];
                                                                        finalUpdatedMous[index] = {
                                                                            ...finalUpdatedMous[index],
                                                                            pdfFile: null,
                                                                            pdfUrl: uploadResult.data.pdfUrl,
                                                                            hasNewFile: false,
                                                                            isRemoved: false
                                                                        };
                                                                        console.log(`📁 PDF uploaded for MOU:`, {
                                                                            mouTitle: finalUpdatedMous[index].title,
                                                                            pdfUrl: uploadResult.data.pdfUrl
                                                                        });
                                                                        setIndustryCollabForm({...industryCollabForm, mouItems: finalUpdatedMous});
                                                                    } else {
                                                                        alert(uploadResult.message || 'Failed to upload PDF');
                                                                        // Reset to previous state
                                                                        const resetMous = [...industryCollabForm.mouItems];
                                                                        resetMous[index].pdfUrl = resetMous[index].pdfUrl === 'uploading' ? '' : resetMous[index].pdfUrl;
                                                                        setIndustryCollabForm({...industryCollabForm, mouItems: resetMous});
                                                                    }
                                                                } catch (error) {
                                                                    console.error('PDF upload error:', error);
                                                                    alert('Failed to upload PDF. Please try again.');
                                                                    // Reset to previous state
                                                                    const resetMous = [...industryCollabForm.mouItems];
                                                                    resetMous[index].pdfUrl = resetMous[index].pdfUrl === 'uploading' ? '' : resetMous[index].pdfUrl;
                                                                    setIndustryCollabForm({...industryCollabForm, mouItems: resetMous});
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    {mou.pdfUrl === 'uploading' ? (
                                                        <div className="pdf-preview-container">
                                                            <div className="upload-progress">
                                                                <span>Uploading PDF...</span>
                                                            </div>
                                                        </div>
                                                    ) : (mou.pdfFile || (mou.pdfUrl && mou.pdfUrl.trim() !== '')) && (
                                                        <div className="pdf-preview-container">
                                                            <span className="pdf-indicator">📄 {mou.pdfFile ? mou.pdfFile.name : 'PDF Document'}</span>
                                                            {mou.pdfUrl && mou.pdfUrl.trim() !== '' && !mou.pdfFile && (
                                                                <a 
                                                                    href={mou.pdfUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="pdf-view-link"
                                                                    style={{marginLeft: '10px', color: '#007bff', textDecoration: 'none', cursor: 'pointer'}}
                                                                    onClick={(e) => {
                                                                        console.log('Dashboard PDF link clicked:', mou.pdfUrl);
                                                                    }}
                                                                >
                                                                    View PDF
                                                                </a>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    const updatedMous = [...industryCollabForm.mouItems];
                                                                    const pdfUrl = updatedMous[index].pdfUrl;
                                                                    
                                                                    // Delete from S3 if it's a server URL
                                                                    if (pdfUrl && typeof pdfUrl === 'string' && pdfUrl.includes('http')) {
                                                                        try {
                                                                            await apiService.deleteMouPdf(pdfUrl);
                                                                        } catch (error) {
                                                                            console.error('Failed to delete PDF from S3:', error);
                                                                        }
                                                                    }
                                                                    
                                                                    updatedMous[index].pdfFile = null;
                                                                    updatedMous[index].pdfUrl = '';
                                                                    updatedMous[index].hasNewFile = false;
                                                                    updatedMous[index].isRemoved = true;
                                                                    console.log(`PDF removed for MOU: ${mou.title}`);
                                                                    setIndustryCollabForm({...industryCollabForm, mouItems: updatedMous});
                                                                }}
                                                                className="pdf-remove-btn"
                                                                title="Remove PDF"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}
                                                    {!mou.pdfFile && (!mou.pdfUrl || mou.pdfUrl.trim() === '') && mou.pdfUrl !== 'uploading' && (
                                                        <div className="pdf-placeholder">
                                                            <span>No PDF selected</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedMous = industryCollabForm.mouItems.filter((_, i) => i !== index);
                                                        setIndustryCollabForm({...industryCollabForm, mouItems: updatedMous});
                                                    }}
                                                    className="institute-remove-btn"
                                                >
                                                    Remove MOU
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIndustryCollabForm({
                                                    ...industryCollabForm,
                                                    mouItems: [...industryCollabForm.mouItems, { 
                                                        id: `new_mou_${Date.now()}_${Math.random()}`,
                                                        title: '',
                                                        description: '',
                                                        pdfUrl: '',
                                                        pdfFile: null,
                                                        hasNewFile: false,
                                                        isExisting: false,
                                                        isRemoved: false
                                                    }]
                                                });
                                            }}
                                            className="institute-add-btn"
                                        >
                                            Add MOU Item
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="institute-form-buttons">
                                    <button type="submit" className="institute-primary-button" disabled={loading}>
                                        {loading ? 'Updating...' : 'Update Industry Collaborations'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'govt' && (
                    <div className="institute-govt-tab">
                        <div className="institute-tab-header">
                            <h1>Government Schemes & Projects</h1>
                            <button className="institute-primary-button" onClick={() => openModal('govtScheme')}>+ Add Government Scheme</button>
                        </div>
                        
                        <div className="institute-govt-schemes-grid">
                            {instituteGovtSchemes.length > 0 ? instituteGovtSchemes.map(scheme => (
                                <div className="institute-govt-scheme-card" key={scheme.instituteSchemeId}>
                                    <div className="institute-scheme-header">
                                        <h3>{scheme.schemeName}</h3>
                                        <span className={`institute-scheme-status ${scheme.status ? scheme.status.toLowerCase() : 'pending'}`}>
                                            {scheme.status}
                                        </span>
                                    </div>
                                    <div className="institute-scheme-details">
                                        <p><strong>Description:</strong> {scheme.description ? scheme.description.substring(0, 100) + '...' : 'No description available'}</p>
                                        <p><strong>Link:</strong> <a href={scheme.link} target="_blank" rel="noopener noreferrer">View Details</a></p>
                                    </div>
                                    <div className="institute-scheme-actions">
                                        <button 
                                            className="institute-table-action view" 
                                            onClick={() => handleViewGovtScheme(scheme)}
                                        >
                                            View Details
                                        </button>
                                        <button 
                                            className="institute-table-action edit" 
                                            onClick={() => handleEditGovtScheme(scheme)}
                                            style={{backgroundColor: '#28a745', color: 'white', marginRight: '5px'}}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className="institute-table-action delete" 
                                            onClick={() => handleDeleteGovtScheme(scheme.instituteSchemeId, scheme.schemeName)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div style={{textAlign: 'center', padding: '40px', color: '#666', gridColumn: '1 / -1'}}>
                                    <p>No government schemes added yet. Click "Add Government Scheme" to get started.</p>
                                </div>
                            )}
                        </div>
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

            {/* Event/News View Modal */}
            {showEventNewsModal && selectedEventNews && (
                <div className="institute-modal-overlay" onClick={() => setShowEventNewsModal(false)}>
                    <div className="institute-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="institute-modal-header">
                            <h2>{selectedEventNews.type} Details</h2>
                            <button className="institute-close-button" onClick={() => setShowEventNewsModal(false)}>×</button>
                        </div>
                        
                        <div className="institute-event-news-details">
                            {selectedEventNews.bannerImage && (
                                <div className="institute-event-news-banner">
                                    <img src={selectedEventNews.bannerImage} alt={selectedEventNews.title} />
                                </div>
                            )}
                            
                            <div className="institute-event-news-info">
                                <h3>{selectedEventNews.title}</h3>
                                <div className="institute-event-news-meta">
                                    <p><strong>Type:</strong> {selectedEventNews.type}</p>
                                    <p><strong>Date:</strong> {new Date(selectedEventNews.date).toLocaleDateString()}</p>
                                    <p><strong>Company/Organizer:</strong> {selectedEventNews.company}</p>
                                    {selectedEventNews.venue && (
                                        <p><strong>Venue:</strong> {selectedEventNews.venue}</p>
                                    )}
                                    {selectedEventNews.expectedParticipants && (
                                        <p><strong>Expected Participants:</strong> {selectedEventNews.expectedParticipants}</p>
                                    )}
                                    <p><strong>Status:</strong> 
                                        <span className={`institute-verification-badge ${selectedEventNews.verified ? 'verified' : 'pending'}`}>
                                            {selectedEventNews.verified ? '✓ Verified' : '⏳ Pending'}
                                        </span>
                                    </p>
                                </div>
                                
                                <div className="institute-event-news-description">
                                    <h4>Details:</h4>
                                    <p>{selectedEventNews.details}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="institute-form-buttons">
                            <button 
                                type="button" 
                                className="institute-secondary-button" 
                                onClick={() => setShowEventNewsModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Government Scheme View Modal */}
            <GovtSchemeModal 
                showGovtSchemeModal={showGovtSchemeModal}
                selectedGovtScheme={selectedGovtScheme}
                setShowGovtSchemeModal={setShowGovtSchemeModal}
            />

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
                                {modalType === 'editCourse' && 'Edit Course'}
                                {modalType === 'event' && 'Add New Event'}
                                {modalType === 'editEvent' && 'Edit Event'}
                                {modalType === 'news' && 'Add News'}
                                {modalType === 'editNews' && 'Edit News'}
                                {modalType === 'govtScheme' && 'Add Government Scheme'}
                                {modalType === 'editGovtScheme' && 'Edit Government Scheme'}
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

                        {/* Government Scheme Form */}
                        {(modalType === 'govtScheme' || modalType === 'editGovtScheme') && (
                            <form onSubmit={handleGovtSchemeSubmit} className="institute-modal-form">
                                <div className="institute-form-group">
                                    <label>Scheme Name *</label>
                                    <input
                                        type="text"
                                        value={govtSchemeForm.schemeName}
                                        onChange={(e) => setGovtSchemeForm({...govtSchemeForm, schemeName: e.target.value})}
                                        required
                                    />
                                </div>
                                
                                <div className="institute-form-group">
                                    <label>Description *</label>
                                    <textarea
                                        value={govtSchemeForm.description}
                                        onChange={(e) => setGovtSchemeForm({...govtSchemeForm, description: e.target.value})}
                                        rows="4"
                                        placeholder="Describe the government scheme..."
                                        required
                                    />
                                </div>
                                
                                <div className="institute-form-group">
                                    <label>Link *</label>
                                    <input
                                        type="url"
                                        value={govtSchemeForm.link}
                                        onChange={(e) => setGovtSchemeForm({...govtSchemeForm, link: e.target.value})}
                                        placeholder="https://example.com/scheme-details"
                                        required
                                    />
                                </div>
                                
                                <div className="institute-form-buttons">
                                    <button type="button" className="institute-secondary-button" onClick={closeModal}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="institute-primary-button" disabled={loading}>
                                        {loading ? 'Saving...' : (modalType === 'editGovtScheme' ? 'Update Scheme' : 'Add Scheme')}
                                    </button>
                                </div>
                            </form>
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
                        {(modalType === 'course' || modalType === 'editCourse') && (
                            <form onSubmit={handleCourseSubmit} className="institute-modal-form">
                                {modalType === 'editCourse' && (
                                    <div style={{backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '12px', color: '#666'}}>
                                        <strong>Debug Info:</strong> Editing course with {courseForm.modules.length} modules loaded
                                        {courseForm.modules.length > 0 && (
                                            <div style={{marginTop: '5px'}}>
                                                Modules: {courseForm.modules.map((m, i) => `${i + 1}. ${m.title || 'Untitled'} (${m.content?.length || 0} content items)`).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                )}
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
                                    <label>Course Thumbnail</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setCourseForm({...courseForm, thumbnail: e.target.files[0]})}
                                    />
                                    {modalType === 'editCourse' && selectedCourseId && (
                                        <div style={{marginTop: '10px'}}>
                                            {courses.find(c => (c.coursesId || c.instituteCourseID) === selectedCourseId)?.thumbnailUrl && (
                                                <div className="current-thumbnail-preview">
                                                    <p style={{fontSize: '14px', color: '#666', marginBottom: '5px'}}>Current thumbnail:</p>
                                                    <img 
                                                        src={courses.find(c => (c.coursesId || c.instituteCourseID) === selectedCourseId)?.thumbnailUrl} 
                                                        alt="Current Thumbnail" 
                                                        style={{width: '150px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd'}}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {courseForm.thumbnail && (
                                        <div className="new-thumbnail-preview" style={{marginTop: '10px'}}>
                                            <p style={{fontSize: '14px', color: '#666', marginBottom: '5px'}}>New thumbnail:</p>
                                            <img 
                                                src={URL.createObjectURL(courseForm.thumbnail)} 
                                                alt="New Thumbnail Preview" 
                                                style={{width: '150px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd'}}
                                            />
                                        </div>
                                    )}
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
                                    {modalType === 'editCourse' && !courseForm.syllabus && (
                                        <p style={{fontSize: '12px', color: '#999', marginTop: '5px', fontStyle: 'italic'}}>
                                            No syllabus data found for this course. You can add it here.
                                        </p>
                                    )}
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
                                    {modalType === 'editCourse' && !courseForm.certification && (
                                        <p style={{fontSize: '12px', color: '#999', marginTop: '5px', fontStyle: 'italic'}}>
                                            No certification type set for this course. You can select one above.
                                        </p>
                                    )}
                                </div>
                                
                                {/* Course Modules Section */}
                                <div className="institute-form-group">
                                    <label>Course Modules ({courseForm.modules.length})</label>
                                    {modalType === 'editCourse' && courseForm.modules.length === 0 && (
                                        <p style={{fontSize: '12px', color: '#999', marginBottom: '10px', fontStyle: 'italic'}}>
                                            No modules found for this course. You can add modules below.
                                        </p>
                                    )}
                                    {modalType === 'editCourse' && courseForm.modules.length > 0 && (
                                        <p style={{fontSize: '12px', color: '#28a745', marginBottom: '10px', fontStyle: 'italic'}}>
                                            Found {courseForm.modules.length} existing modules. You can edit them below or add new ones.
                                        </p>
                                    )}
                                    <div className="course-modules-section">
                                        {courseForm.modules.map((module, moduleIndex) => (
                                            <div key={moduleIndex} className="course-module-item">
                                                <div className="module-header">
                                                    <input
                                                        type="text"
                                                        placeholder="Module Title"
                                                        value={module.title}
                                                        onChange={(e) => {
                                                            const updatedModules = [...courseForm.modules];
                                                            updatedModules[moduleIndex].title = e.target.value;
                                                            setCourseForm({...courseForm, modules: updatedModules});
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updatedModules = courseForm.modules.filter((_, i) => i !== moduleIndex);
                                                            setCourseForm({...courseForm, modules: updatedModules});
                                                        }}
                                                        className="institute-remove-btn"
                                                    >
                                                        Remove Module
                                                    </button>
                                                </div>
                                                <textarea
                                                    placeholder="Module Description"
                                                    value={module.description}
                                                    onChange={(e) => {
                                                        const updatedModules = [...courseForm.modules];
                                                        updatedModules[moduleIndex].description = e.target.value;
                                                        setCourseForm({...courseForm, modules: updatedModules});
                                                    }}
                                                    rows="2"
                                                />
                                                
                                                {/* Module Content */}
                                                <div className="module-content-section">
                                                    <h5>Module Content ({module.content?.length || 0})</h5>
                                                    {module.content && module.content.length > 0 ? (
                                                        module.content.map((content, contentIndex) => (
                                                            <div key={contentIndex} className="content-item">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Content Title"
                                                                    value={content.title || ''}
                                                                    onChange={(e) => {
                                                                        const updatedModules = [...courseForm.modules];
                                                                        updatedModules[moduleIndex].content[contentIndex].title = e.target.value;
                                                                        setCourseForm({...courseForm, modules: updatedModules});
                                                                    }}
                                                                />
                                                                <select
                                                                    value={content.type || 'video'}
                                                                    onChange={(e) => {
                                                                        const updatedModules = [...courseForm.modules];
                                                                        updatedModules[moduleIndex].content[contentIndex].type = e.target.value;
                                                                        setCourseForm({...courseForm, modules: updatedModules});
                                                                    }}
                                                                >
                                                                    <option value="video">Video</option>
                                                                    <option value="assignment">Assignment</option>
                                                                </select>
                                                                <input
                                                                    type="file"
                                                                    accept={content.type === 'video' ? 'video/*' : content.type === 'pdf' ? '.pdf' : '*'}
                                                                    onChange={(e) => {
                                                                        const updatedModules = [...courseForm.modules];
                                                                        updatedModules[moduleIndex].content[contentIndex].file = e.target.files[0];
                                                                        setCourseForm({...courseForm, modules: updatedModules});
                                                                    }}
                                                                />
                                                                {modalType === 'editCourse' && (
                                                                    <small style={{fontSize: '11px', color: '#666', display: 'block', marginTop: '2px'}}>
                                                                        Existing content will be preserved unless you upload a new file
                                                                    </small>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updatedModules = [...courseForm.modules];
                                                                        updatedModules[moduleIndex].content = updatedModules[moduleIndex].content.filter((_, i) => i !== contentIndex);
                                                                        setCourseForm({...courseForm, modules: updatedModules});
                                                                    }}
                                                                    className="institute-remove-btn"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p style={{fontSize: '12px', color: '#999', fontStyle: 'italic', margin: '10px 0'}}>
                                                            No content in this module yet. Add content below.
                                                        </p>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updatedModules = [...courseForm.modules];
                                                            // Ensure content array exists
                                                            if (!updatedModules[moduleIndex].content) {
                                                                updatedModules[moduleIndex].content = [];
                                                            }
                                                            updatedModules[moduleIndex].content.push({
                                                                title: '',
                                                                type: 'video',
                                                                file: null,
                                                                order: updatedModules[moduleIndex].content.length + 1
                                                            });
                                                            setCourseForm({...courseForm, modules: updatedModules});
                                                        }}
                                                        className="institute-add-btn"
                                                    >
                                                        Add Content
                                                    </button>
                                                    <CourseQuizManager 
                                                        moduleIndex={moduleIndex}
                                                        onQuizUpdate={handleQuizUpdate}
                                                        existingQuiz={module.quiz}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCourseForm({
                                                    ...courseForm,
                                                    modules: [...courseForm.modules, {
                                                        title: '',
                                                        description: '',
                                                        order: courseForm.modules.length + 1,
                                                        content: []
                                                    }]
                                                });
                                            }}
                                            className="institute-add-btn"
                                        >
                                            Add Module
                                        </button>
                                    </div>
                                    {modalType === 'editCourse' && (
                                        <p style={{fontSize: '12px', color: '#666', marginTop: '10px', fontStyle: 'italic'}}>
                                            Note: Existing module content files will be preserved. Only add new files if you want to replace them.
                                        </p>
                                    )}
                                </div>
                                
                                <div className="institute-form-buttons">
                                    <button type="submit" className="institute-primary-button" disabled={loading}>
                                        {loading ? (modalType === 'editCourse' ? 'Updating...' : 'Creating...') : (modalType === 'editCourse' ? 'Update Course' : 'Create Course')}
                                    </button>
                                    <button type="button" className="institute-secondary-button" onClick={closeModal}>Cancel</button>
                                </div>
                            </form>
                        )}

                        {/* Event Form */}
                        {(modalType === 'event' || modalType === 'editEvent') && (
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
                                        <label>Date * (dd-mm-yyyy)</label>
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
                                        <label>Venue</label>
                                        <input
                                            type="text"
                                            value={eventForm.venue}
                                            onChange={(e) => setEventForm({...eventForm, venue: e.target.value})}
                                            placeholder="Event venue/location"
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Venue</label>
                                        <input
                                            type="text"
                                            value={eventForm.venue}
                                            onChange={(e) => setEventForm({...eventForm, venue: e.target.value})}
                                            placeholder="Event venue/location"
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Expected Participants (Number of participants)</label>
                                        <input
                                            type="number"
                                            value={eventForm.expectedParticipants}
                                            onChange={(e) => setEventForm({...eventForm, expectedParticipants: e.target.value})}
                                            placeholder="Number of participants"
                                        />
                                    </div>
                                </div>
                                <div className="institute-form-group">
                                    <label>Details * (Event details and description)</label>
                                    <textarea
                                        value={eventForm.details}
                                        onChange={(e) => setEventForm({...eventForm, details: e.target.value})}
                                        rows="4"
                                        placeholder="Event details and description"
                                        required
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Banner Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setEventForm({...eventForm, bannerImage: e.target.files[0]})}
                                    />
                                    {eventForm.bannerImage && (
                                        <div className="image-preview" style={{marginTop: '10px'}}>
                                            <img 
                                                src={URL.createObjectURL(eventForm.bannerImage)} 
                                                alt="Banner Preview" 
                                                style={{width: '200px', height: '120px', objectFit: 'cover', borderRadius: '4px'}}
                                            />
                                        </div>
                                    )}
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
                                    <button type="submit" className="institute-primary-button" disabled={loading}>
                                        {loading ? (modalType === 'editEvent' ? 'Updating...' : 'Adding...') : (modalType === 'editEvent' ? 'Update Event' : 'Add Event')}
                                    </button>
                                    <button type="button" className="institute-secondary-button" onClick={closeModal}>Cancel</button>
                                </div>
                            </form>
                        )}

                        {/* News Form */}
                        {(modalType === 'news' || modalType === 'editNews') && (
                            <form onSubmit={handleNewsSubmit} className="institute-modal-form">
                                <div className="institute-form-grid">
                                    <div className="institute-form-group">
                                        <label>Title *</label>
                                        <input
                                            type="text"
                                            value={newsForm.title}
                                            onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Date * (dd-mm-yyyy)</label>
                                        <input
                                            type="date"
                                            value={newsForm.date}
                                            onChange={(e) => setNewsForm({...newsForm, date: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Company/Organizer *</label>
                                        <input
                                            type="text"
                                            value={newsForm.company}
                                            onChange={(e) => setNewsForm({...newsForm, company: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Venue</label>
                                        <input
                                            type="text"
                                            value={newsForm.venue}
                                            onChange={(e) => setNewsForm({...newsForm, venue: e.target.value})}
                                            placeholder="News venue/location (if applicable)"
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Venue</label>
                                        <input
                                            type="text"
                                            value={newsForm.venue}
                                            onChange={(e) => setNewsForm({...newsForm, venue: e.target.value})}
                                            placeholder="News venue/location (if applicable)"
                                        />
                                    </div>
                                    <div className="institute-form-group">
                                        <label>Expected Participants (Number of participants)</label>
                                        <input
                                            type="number"
                                            value={newsForm.expectedParticipants}
                                            onChange={(e) => setNewsForm({...newsForm, expectedParticipants: e.target.value})}
                                            placeholder="Number of participants"
                                        />
                                    </div>
                                </div>
                                <div className="institute-form-group">
                                    <label>Details * (News details and description)</label>
                                    <textarea
                                        value={newsForm.details}
                                        onChange={(e) => setNewsForm({...newsForm, details: e.target.value})}
                                        rows="4"
                                        placeholder="News details and description"
                                        required
                                    />
                                </div>
                                <div className="institute-form-group">
                                    <label>Banner Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setNewsForm({...newsForm, bannerImage: e.target.files[0]})}
                                    />
                                    {newsForm.bannerImage && (
                                        <div className="image-preview" style={{marginTop: '10px'}}>
                                            <img 
                                                src={URL.createObjectURL(newsForm.bannerImage)} 
                                                alt="Banner Preview" 
                                                style={{width: '200px', height: '120px', objectFit: 'cover', borderRadius: '4px'}}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="institute-form-group institute-checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={newsForm.verified}
                                            onChange={(e) => setNewsForm({...newsForm, verified: e.target.checked})}
                                        />
                                        Mark as Verified (Institute Verified)
                                    </label>
                                </div>
                                <div className="institute-form-buttons">
                                    <button type="submit" className="institute-primary-button" disabled={loading}>
                                        {loading ? (modalType === 'editNews' ? 'Updating...' : 'Adding...') : (modalType === 'editNews' ? 'Update News' : 'Add News')}
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
                                            readOnly
                                            disabled
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
                                    <label>Pincode *</label>
                                    <input
                                        type="text"
                                        value={profileData.pincode}
                                        onChange={(e) => setProfileData(prev => ({...prev, pincode: e.target.value}))}
                                        placeholder="e.g., 110001"
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