import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import progressSocketService from '../../services/progressSocket';
import { debugVideoContent, logVideoError } from '../../utils/videoUtils';
import { calculateCourseProgress } from '../../utils/progressUtils';
import PaymentModal from '../Dashboard/PaymentModal';
import PaymentOptionModal from '../Dashboard/PaymentOptionModal';
import StudentEnrollmentModal from '../Modals/StudentEnrollmentModal';
import './CourseLearningPage.css';
import { 
  FaPlay, FaLock, FaCheck, FaChevronDown, FaChevronUp, FaStar, 
  FaUsers, FaClock, FaGlobe, FaArrowLeft, FaCheckCircle, 
  FaCircle, FaPause, FaVolumeUp, FaCog, FaExpand, FaFileAlt,
  FaComments, FaDownload, FaBullhorn, FaBookOpen
} from 'react-icons/fa';

const CourseLearningPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({});
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [courseNotes, setCourseNotes] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState({});
  const [userProgress, setUserProgress] = useState({});
  const [courseReviews, setCourseReviews] = useState([]);
  const [courseRatingStats, setCourseRatingStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentOptionModal, setShowPaymentOptionModal] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [currentLearningTab, setCurrentLearningTab] = useState('overview');
  const [moduleExpanded, setModuleExpanded] = useState({});

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
      checkEnrollmentStatus();
      fetchUserProfile();
    }
  }, [courseId]);

  useEffect(() => {
    // Auto-expand first module when enrolled
    if (enrollmentStatus?.enrolled && course?.modules?.length > 0) {
      setModuleExpanded({ 0: true });
    }
  }, [enrollmentStatus, course]);

  const fetchUserProfile = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success) {
        setUserProfile(response.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const isStaffinnPartner = () => {
    return userProfile?.role === 'institute' && userProfile?.instituteType === 'staffinn_partner';
  };

  const isNormalInstitute = () => {
    return userProfile?.role === 'institute' && userProfile?.instituteType !== 'staffinn_partner';
  };

  useEffect(() => {
    if (courseId && activeTab === 'reviews') {
      fetchCourseReviews();
      fetchCourseRatingStats();
    }
  }, [courseId, activeTab]);

  useEffect(() => {
    if (courseId) {
      fetchEnrollmentCount();
      fetchCourseRatingStats();
    }
  }, [courseId]);

  useEffect(() => {
    progressSocketService.connect();
    return () => progressSocketService.disconnect();
  }, []);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      // Try to get course content first (for enrolled users)
      try {
        const response = await apiService.getCourseContent(courseId);
        console.log('📚 Course content response:', response);
        if (response.success) {
          console.log('📚 Course data structure:', {
            courseName: response.data.courseName || response.data.name,
            modulesCount: response.data.modules?.length || 0,
            hasModules: !!response.data.modules,
            firstModuleContent: response.data.modules?.[0]?.content?.length || 0
          });
          setCourse(response.data);
          // Auto-expand first section and select first content
          if (response.data.modules && response.data.modules.length > 0) {
            setExpandedSections({ 0: true });
            const firstModule = response.data.modules[0];
            if (firstModule.content && firstModule.content.length > 0) {
              setSelectedContent(firstModule.content[0]);
            }
          }
          // Fetch progress after course data is loaded
          await fetchUserProgress();
          return;
        }
      } catch (enrolledError) {
        // User might not be enrolled, try to get public course info
        console.log('Not enrolled, fetching public course info');
      }
      
      // Fallback: Get public course information
      const publicResponse = await apiService.getPublicCourseById(courseId);
      console.log('📸 Public course response:', publicResponse);
      if (publicResponse.success) {
        console.log('📸 Course thumbnail:', publicResponse.data.thumbnail);
        console.log('📸 Full course data:', publicResponse.data);
        setCourse(publicResponse.data);
        // Auto-expand first section for preview
        if (publicResponse.data.modules && publicResponse.data.modules.length > 0) {
          setExpandedSections({ 0: true });
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      const response = await apiService.checkEnrollmentStatus(courseId);
      console.log('🔍 Enrollment status response:', response);
      if (response.success) {
        setEnrollmentStatus({
          enrolled: response.enrolled,
          hasStarted: response.hasStarted,
          progressPercentage: response.progressPercentage
        });
      } else {
        setEnrollmentStatus({ enrolled: false, hasStarted: false, progressPercentage: 0 });
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
      setEnrollmentStatus({ enrolled: false, hasStarted: false, progressPercentage: 0 });
    }
  };

  const fetchUserProgress = async () => {
    try {
      const response = await apiService.getUserProgress(courseId);
      console.log('📊 User progress response:', response);
      if (response.success && response.data) {
        setUserProgress(response.data);
        console.log('📊 Progress data set:', response.data);
      } else {
        setUserProgress({ completedContent: {}, completedQuizzes: {} });
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
      setUserProgress({ completedContent: {}, completedQuizzes: {} });
    }
  };

  const handleEnroll = async () => {
    try {
      console.log('🚀 Attempting to enroll in course:', courseId);
      console.log('📊 Course mode:', course.mode);
      console.log('💰 Course fees:', course.fees);
      console.log('👤 User role:', userProfile?.role);
      console.log('🏢 Institute type:', userProfile?.instituteType);
      
      // Check if user is an institute (any type)
      const isInstitute = userProfile?.role === 'institute';
      
      // Check if course is Online
      const isOnline = course.mode && course.mode.toLowerCase() === 'online';
      
      // RESTRICTION: Institute users cannot enroll in Online courses
      if (isInstitute && isOnline) {
        alert('You can only apply to on-campus courses only.');
        return;
      }
      
      // Check if user is a Staffinn Partner or Normal Institute
      const isPartner = isStaffinnPartner();
      const isNormalInstituteUser = isNormalInstitute();
      
      // Check if course is On-Campus
      const isOnCampus = course.mode && (course.mode.toLowerCase() === 'on campus' || course.mode.toLowerCase() === 'offline');
      const isPaid = course.fees && parseFloat(course.fees) > 0;
      
      // For Staffinn Partner or Normal Institute on On-Campus courses
      if ((isPartner || isNormalInstituteUser) && isOnCampus) {
        console.log('🏫 Institute user detected on On-Campus course - showing enrollment modal');
        setShowEnrollmentModal(true);
        return;
      }
      
      // For regular users on On-Campus paid courses
      if (isOnCampus && isPaid && !isPartner && !isNormalInstituteUser) {
        console.log('🏫 Regular user on On-Campus paid course - showing payment option modal');
        setShowPaymentOptionModal(true);
        return;
      }
      
      // Check if course is paid online course
      if (course.mode === 'Online' && parseFloat(course.fees) > 0) {
        console.log('💰 Paid course detected, checking payment status...');
        
        // Check if user has already paid
        try {
          const paymentStatus = await apiService.checkPaymentStatus(courseId);
          console.log('💳 Payment status:', paymentStatus);
          
          if (!paymentStatus.hasPaid) {
            console.log('💳 Payment not found, showing payment modal');
            setShowPaymentModal(true);
            return;
          }
          
          console.log('✅ Payment verified, proceeding with enrollment');
        } catch (paymentError) {
          console.error('❌ Payment check error:', paymentError);
          // If payment check fails, try to enroll anyway (backend will validate)
        }
      }
      
      const response = await apiService.enrollInCourse(courseId);
      
      if (response.success) {
        setEnrollmentStatus({ enrolled: true, hasStarted: false, progressPercentage: 0 });
        
        // For On Campus courses, show only success message
        if (course.mode === 'On Campus' || course.mode === 'Offline') {
          alert('You are successfully enrolled.');
          return;
        }
        
        // For Online courses, refresh to get accessible content
        alert('Successfully enrolled in the course!');
        fetchCourseData();
      }
    } catch (error) {
      console.error('❌ Error enrolling:', error);
      
      // Check if it's a payment required error (402)
      if (error.message && error.message.includes('Payment required')) {
        console.log('💳 Payment required, showing payment modal');
        setShowPaymentModal(true);
      } else {
        alert('Failed to enroll in course. Please try again.');
      }
    }
  };

  const handlePaymentSuccess = async () => {
    console.log('✅ Payment successful, refreshing course data...');
    setShowPaymentModal(false);
    setEnrollmentStatus({ enrolled: true, hasStarted: false, progressPercentage: 0 });
    await fetchCourseData();
    await checkEnrollmentStatus();
  };

  const handlePayHere = () => {
    console.log('💳 User selected: Pay Here (Razorpay)');
    setShowPaymentOptionModal(false);
    setShowPaymentModal(true);
  };

  const handlePayAtInstitute = async () => {
    console.log('🏢 User selected: Pay at Institute');
    try {
      console.log('📤 Calling API: enrollInCoursePayAtInstitute');
      const response = await apiService.enrollInCoursePayAtInstitute(courseId);
      
      console.log('📥 API Response:', response);
      
      if (response.success) {
        setShowPaymentOptionModal(false);
        alert(
          'Enrollment request submitted successfully!\n\n' +
          'The institute has been notified about your enrollment.\n' +
          'Please visit the institute to complete the payment.\n\n' +
          'You will receive further instructions from the institute.'
        );
        // Refresh enrollment status
        await checkEnrollmentStatus();
        await fetchCourseData();
      } else {
        alert(response.message || 'Failed to submit enrollment request');
      }
    } catch (error) {
      console.error('❌ Error submitting enrollment request:', error);
      alert('Failed to submit enrollment request: ' + (error.message || 'Unknown error'));
    }
  };

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleContentClick = async (content, moduleIndex, contentIndex) => {
    if (!enrollmentStatus?.enrolled) return;
    
    if (content.contentType === 'video') {
      console.log('🎥 Selecting video content:', content.contentTitle || content.title);
      await debugVideoContent(content);
      setSelectedContent(content);
      setSelectedQuiz(null);
      setQuizAnswers({});
      setQuizResults(null);
    } else if (content.contentType === 'quiz') {
      handleTakeInlineQuiz(content);
    } else if (content.contentType === 'assignment') {
      setSelectedContent(content);
      setActiveTab('notes');
      setSelectedQuiz(null);
      setQuizAnswers({});
      setQuizResults(null);
      
      // Mark assignment as viewed
      try {
        const markResponse = await apiService.markContentComplete(courseId, content.contentId, 'assignment');
        console.log('✅ Assignment marked complete:', markResponse);
        
        if (markResponse.success) {
          // Update progress immediately from response
          setUserProgress(prev => ({
            ...prev,
            completedContent: {
              ...prev.completedContent,
              [content.contentId]: { completedAt: new Date().toISOString(), contentType: 'assignment' }
            }
          }));
          
          // Refresh progress from backend
          await fetchUserProgress();
        }
      } catch (error) {
        console.error('Error marking assignment complete:', error);
      }
    }
  };

  const handleVideoEnd = async (contentId) => {
    try {
      const markResponse = await apiService.markContentComplete(courseId, contentId, 'video');
      console.log('✅ Video marked complete:', markResponse);
      
      if (markResponse.success) {
        // Update progress immediately from response
        setUserProgress(prev => ({
          ...prev,
          completedContent: {
            ...prev.completedContent,
            [contentId]: { completedAt: new Date().toISOString(), contentType: 'video' }
          }
        }));
        
        // Refresh progress from backend
        await fetchUserProgress();
      }
    } catch (error) {
      console.error('Error marking video complete:', error);
    }
  };

  const isContentCompleted = (contentId, contentType) => {
    if (!userProgress) return false;
    
    if (contentType === 'quiz') {
      const quizKey = contentId.startsWith('module-quiz-') ? contentId : contentId;
      const completed = userProgress.completedQuizzes && userProgress.completedQuizzes[quizKey] && userProgress.completedQuizzes[quizKey].passed;
      return completed;
    }
    const completed = userProgress.completedContent && userProgress.completedContent[contentId];
    return completed;
  };

  const handleTakeInlineQuiz = async (content) => {
    try {
      const quizKey = content.contentId;
      const isCompleted = userProgress.completedQuizzes && userProgress.completedQuizzes[quizKey];
      
      // Check if user has already passed this quiz
      if (isCompleted && isCompleted.passed) {
        alert('You have already passed this quiz and cannot attempt it again.');
        return;
      }
      
      const quizData = {
        contentId: content.contentId,
        title: content.contentTitle || content.title,
        description: content.description || 'Complete this quiz to continue',
        questions: content.questions || [],
        passingScore: content.passingScore || 70,
        timeLimit: content.timeLimit || 30
      };
      
      setSelectedContent(content);
      setSelectedQuiz(quizData);
      setQuizAnswers({});
      setQuizResults(null);
      setQuizSubmitting(false);
    } catch (error) {
      console.error('Error loading inline quiz:', error);
    }
  };

  const handleTakeContentQuiz = async (content) => {
    try {
      // For content-based quiz, we'll use the content data directly
      const quizData = {
        contentId: content.contentId,
        title: content.contentTitle || content.title,
        description: content.description || 'Complete this quiz to continue',
        questions: content.questions || [],
        passingScore: content.passingScore || 70,
        timeLimit: content.timeLimit || 30
      };
      
      setSelectedQuiz(quizData);
      setQuizAnswers({});
      setQuizResults(null);
      setShowQuizModal(true);
    } catch (error) {
      console.error('Error loading quiz:', error);
    }
  };

  const handleTakeQuiz = async (quiz) => {
    const quizKey = quiz.quizId;
    const isCompleted = userProgress.completedQuizzes && userProgress.completedQuizzes[quizKey];
    
    // Check if user has already passed this quiz
    if (isCompleted && isCompleted.passed) {
      alert('You have already passed this quiz and cannot attempt it again.');
      return;
    }
    
    const quizData = {
      quizId: quiz.quizId,
      title: quiz.title,
      description: quiz.description || 'Complete this module quiz',
      questions: quiz.questions || [],
      passingScore: quiz.passingScore || 70,
      timeLimit: quiz.timeLimit || 30
    };
    
    const quizContent = {
      contentId: `module-quiz-${quiz.quizId}`,
      contentType: 'quiz',
      contentTitle: quiz.title,
      title: quiz.title
    };
    
    setSelectedContent(quizContent);
    setSelectedQuiz(quizData);
    setQuizAnswers({});
    setQuizResults(null);
    setQuizSubmitting(false);
  };

  const handleQuizSubmit = async () => {
    try {
      setQuizSubmitting(true);
      let response;
      
      // Calculate score and track answers
      const totalQuestions = selectedQuiz.questions?.length || 0;
      let correctAnswers = 0;
      const questionResults = [];
      
      selectedQuiz.questions?.forEach((question, index) => {
        const userAnswer = quizAnswers[question.questionId];
        // Use stored correct answer (index) to get the actual correct option text
        const correctAnswer = typeof question.correctAnswer === 'number' 
          ? question.options?.[question.correctAnswer] 
          : question.correctAnswer;
        const isCorrect = userAnswer === correctAnswer;
        
        if (isCorrect) {
          correctAnswers++;
        }
        
        questionResults.push({
          questionId: question.questionId,
          question: question.question,
          userAnswer,
          correctAnswer,
          isCorrect,
          options: question.options
        });
      });
      
      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const passed = score >= (selectedQuiz.passingScore || 70);
      
      if (selectedQuiz.contentId) {
        response = await apiService.submitContentQuiz(
          selectedQuiz.contentId, 
          quizAnswers, 
          courseId, 
          selectedContent?.moduleId || 'unknown'
        );
      } else {
        response = await apiService.submitQuiz(
          selectedQuiz.quizId, 
          quizAnswers, 
          courseId, 
          selectedContent?.moduleId || 'unknown'
        );
      }
      
      const resultsData = {
        score,
        passed,
        correctAnswers,
        totalQuestions,
        questionResults,
        message: response?.message || (passed ? 'Quiz passed successfully!' : 'Quiz failed. Review and try again.')
      };
      
      // Store quiz attempt
      const quizKey = selectedQuiz.contentId || selectedQuiz.quizId;
      setQuizAttempts(prev => ({
        ...prev,
        [quizKey]: {
          ...resultsData,
          attemptDate: new Date().toISOString()
        }
      }));
      
      // Update progress if passed
      if (resultsData.passed) {
        const quizId = selectedQuiz.contentId || selectedQuiz.quizId;
        const quizType = selectedQuiz.contentId ? 'content' : 'module';
        
        try {
          const progressResponse = await apiService.markQuizComplete(
            courseId, 
            quizId, 
            quizType, 
            true, 
            resultsData.score, 
            resultsData.totalQuestions,
            selectedContent?.moduleId || 'unknown'
          );
          
          if (progressResponse.success) {
            // Update local state immediately
            setUserProgress(prev => ({
              ...prev,
              completedQuizzes: {
                ...prev.completedQuizzes,
                [quizId]: { passed: true, completedAt: new Date().toISOString() }
              }
            }));
            
            // Refresh progress from backend
            await fetchUserProgress();
          }
        } catch (progressError) {
          console.error('Error updating quiz progress:', progressError);
        }
      }
      
      setQuizResults(resultsData);
      
      if (response?.success) {
        fetchCourseData();
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      
      const totalQuestions = selectedQuiz.questions?.length || 0;
      let correctAnswers = 0;
      const questionResults = [];
      
      selectedQuiz.questions?.forEach((question) => {
        const userAnswer = quizAnswers[question.questionId];
        // Use stored correct answer (index) to get the actual correct option text
        const correctAnswer = typeof question.correctAnswer === 'number' 
          ? question.options?.[question.correctAnswer] 
          : question.correctAnswer;
        const isCorrect = userAnswer === correctAnswer;
        
        if (isCorrect) {
          correctAnswers++;
        }
        
        questionResults.push({
          questionId: question.questionId,
          question: question.question,
          userAnswer,
          correctAnswer,
          isCorrect,
          options: question.options
        });
      });
      
      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      const passed = score >= (selectedQuiz.passingScore || 70);
      
      const resultsData = {
        score,
        passed,
        correctAnswers,
        totalQuestions,
        questionResults,
        message: 'Quiz completed (offline mode)'
      };
      
      const quizKey = selectedQuiz.contentId || selectedQuiz.quizId;
      setQuizAttempts(prev => ({
        ...prev,
        [quizKey]: {
          ...resultsData,
          attemptDate: new Date().toISOString()
        }
      }));
      
      // Update progress if passed (in catch block)
      if (resultsData.passed) {
        const quizId = selectedQuiz.contentId || selectedQuiz.quizId;
        const quizType = selectedQuiz.contentId ? 'content' : 'module';
        
        try {
          const progressResponse = await apiService.markQuizComplete(
            courseId, 
            quizId, 
            quizType, 
            true, 
            resultsData.score, 
            resultsData.totalQuestions,
            selectedContent?.moduleId || 'unknown'
          );
          
          if (progressResponse.success) {
            // Update local state immediately
            setUserProgress(prev => ({
              ...prev,
              completedQuizzes: {
                ...prev.completedQuizzes,
                [quizId]: { passed: true, completedAt: new Date().toISOString() }
              }
            }));
            
            // Refresh progress from backend
            await fetchUserProgress();
          }
        } catch (progressError) {
          console.error('Error updating quiz progress:', progressError);
        }
      }
      
      setQuizResults(resultsData);
    } finally {
      setQuizSubmitting(false);
    }
  };

  const calculateProgress = () => {
    return calculateCourseProgress(course, userProgress);
  };

  const isQuizAnswerComplete = () => {
    if (!selectedQuiz?.questions) return false;
    return Object.keys(quizAnswers).length === selectedQuiz.questions.length;
  };

  const getQuizProgress = () => {
    if (!selectedQuiz?.questions) return 0;
    return Math.round((Object.keys(quizAnswers).length / selectedQuiz.questions.length) * 100);
  };

  const fetchCourseReviews = async () => {
    try {
      const response = await apiService.getCourseReviews(courseId);
      if (response.success) {
        setCourseReviews(response.data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching course reviews:', error);
    }
  };

  const fetchCourseRatingStats = async () => {
    try {
      const response = await apiService.getCourseRatingStats(courseId);
      if (response.success) {
        setCourseRatingStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching course rating stats:', error);
    }
  };

  const fetchEnrollmentCount = async () => {
    try {
      const response = await apiService.getCourseEnrollmentCount(courseId);
      if (response.success) {
        setEnrollmentCount(response.data.enrollmentCount || 0);
      }
    } catch (error) {
      console.error('Error fetching enrollment count:', error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!enrollmentStatus?.enrolled) {
      alert('You must be enrolled in this course to submit a review.');
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await apiService.addCourseReview(courseId, reviewForm.rating, reviewForm.review);
      
      if (response.success) {
        alert('Review submitted successfully!');
        setReviewForm({ rating: 5, review: '' });
        // Refresh all review-related data
        await Promise.all([
          fetchCourseReviews(),
          fetchCourseRatingStats()
        ]);
      } else {
        alert(response.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getCourseNotes = () => {
    if (!course?.modules) return [];
    const notes = [];
    course.modules.forEach(module => {
      if (module.content) {
        module.content.forEach(content => {
          if (content.contentType === 'assignment' && content.contentUrl) {
            notes.push({
              id: content.contentId,
              title: content.contentTitle || content.title,
              url: content.contentUrl,
              moduleTitle: module.moduleTitle || module.title
            });
          }
        });
      }
    });
    return notes;
  };

  // Helper function to calculate total video duration in minutes
  const calculateTotalVideoDuration = () => {
    if (!course?.modules) return 0;
    let totalMinutes = 0;
    
    course.modules.forEach((module) => {
      if (module.content) {
        module.content.forEach((content) => {
          // Only count video content duration
          if (content.contentType === 'video') {
            const duration = parseInt(content.durationMinutes) || 0;
            totalMinutes += duration;
          }
        });
      }
    });
    
    return totalMinutes;
  };

  // Helper function to format duration as "Xh Ym"
  const formatDuration = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FaStar 
        key={index} 
        color={index < rating ? '#f59e0b' : '#e5e7eb'} 
        size={16}
      />
    ));
  };

  const renderRatingStars = (rating, interactive = false, onRatingChange = null) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FaStar 
        key={index} 
        color={index < rating ? '#f59e0b' : '#e5e7eb'} 
        size={20}
        style={{ cursor: interactive ? 'pointer' : 'default', marginRight: '4px' }}
        onClick={interactive ? () => onRatingChange(index + 1) : undefined}
      />
    ));
  };

  if (loading) {
    return <div className="course-loading">Loading course...</div>;
  }

  if (!course) {
    return <div className="course-error">Course not found</div>;
  }

  // If user is enrolled, show the new learning UI
  if (enrollmentStatus?.enrolled && course.mode === 'Online') {
    const completedCount = Object.keys(userProgress?.completedContent || {}).length;
    const totalLectures = course.modules?.reduce((acc, m) => acc + (m.content?.length || 0), 0) || 0;
    const progressPercent = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;
    const lecturesRemaining = totalLectures - completedCount;

    return (
      <div style={{ minHeight: '100vh', background: '#0F172A', color: 'white' }} data-testid="learning-page">
        {/* TOP BAR */}
        <header style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 30, 
          background: '#0B1220', 
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }} data-testid="learning-navbar">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            padding: '0 16px', 
            height: '64px'
          }}>
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255,255,255,0.7)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px'
              }}
              data-testid="back-btn"
            >
              <FaArrowLeft style={{ width: '16px', height: '16px' }} />
              <span style={{ display: window.innerWidth < 640 ? 'none' : 'inline' }}>Back to course</span>
            </button>

            {/* Separator */}
            <span style={{ color: 'rgba(255,255,255,0.3)', display: window.innerWidth < 768 ? 'none' : 'inline' }}>·</span>

            {/* Mini Course Block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FaBookOpen style={{ width: '16px', height: '16px', color: 'white' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {course.courseName || course.name}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {course.instructor}
                </div>
              </div>
            </div>

            {/* Desktop Progress Tracker */}
            <div style={{ 
              display: window.innerWidth < 1024 ? 'none' : 'flex', 
              alignItems: 'center', 
              gap: '16px' 
            }} data-testid="progress-tracker">
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  YOUR PROGRESS
                </div>
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                  {completedCount} / {totalLectures} lectures · {progressPercent}%
                </div>
              </div>
              <div style={{ width: '160px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#2563EB', transition: 'width 0.3s', width: `${progressPercent}%` }}></div>
              </div>
            </div>

            {/* State Pill */}
            {progressPercent < 100 ? (
              <div style={{
                display: window.innerWidth < 640 ? 'none' : 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '9999px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <FaStar style={{ width: '12px', height: '12px', color: '#F59E0B' }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{lecturesRemaining} to go</span>
              </div>
            ) : (
              <button
                style={{
                  borderRadius: '9999px',
                  background: '#10B981',
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
                data-testid="view-certificate-btn"
              >
                <FaCheck style={{ width: '16px', height: '16px' }} />
                Certificate
              </button>
            )}
          </div>

          {/* Mobile Progress Strip */}
          <div style={{ 
            display: window.innerWidth >= 1024 ? 'none' : 'block', 
            padding: '0 16px 12px' 
          }} data-testid="mobile-progress">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Progress</span>
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{progressPercent}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#2563EB', transition: 'width 0.3s', width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth >= 1024 ? '1fr 380px' : '1fr' }}>
          {/* LEFT: PLAYER AREA */}
          <main>
            {/* Video Player */}
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              paddingBottom: '56.25%', 
              background: 'black', 
              maxHeight: '70vh' 
            }} data-testid="player-area">
              {selectedContent && selectedContent.contentType === 'video' && selectedContent.contentUrl ? (
                <video 
                  controls 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                  poster={selectedContent.thumbnailUrl}
                  crossOrigin="anonymous"
                  onError={(e) => {
                    try {
                      logVideoError(e, selectedContent.contentUrl, {
                        contentId: selectedContent.contentId,
                        contentTitle: selectedContent.contentTitle || selectedContent.title,
                        contentType: selectedContent.contentType
                      });
                    } catch (error) {
                      console.warn('Video error handler failed:', error);
                    }
                  }}
                  onLoadStart={() => console.log('Video loading started:', selectedContent.contentUrl)}
                  onEnded={() => handleVideoEnd(selectedContent.contentId)}
                >
                  <source src={selectedContent.contentUrl} type="video/mp4" />
                  <source src={selectedContent.contentUrl} type="video/webm" />
                  <source src={selectedContent.contentUrl} type="video/ogg" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(to bottom right, #1E293B, #0F172A, #000)',
                  color: 'rgba(255,255,255,0.5)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <FaPlay style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.3 }} />
                    <p style={{ fontSize: '18px' }}>Select a lecture to start learning</p>
                  </div>
                </div>
              )}
            </div>

            {/* Lecture Meta Bar */}
            <div style={{
              padding: '20px 40px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              background: '#0F172A'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                alignItems: window.innerWidth < 768 ? 'flex-start' : 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    {selectedContent ? `Module ${course.modules?.findIndex(m => m.content?.some(c => c.contentId === selectedContent.contentId)) + 1 || 1}` : 'Module'}
                  </div>
                  <h1 style={{ fontSize: '22px', fontWeight: '800', margin: '4px 0', letterSpacing: '-0.025em' }}>
                    {selectedContent ? (selectedContent.contentTitle || selectedContent.title) : 'Select a lecture'}
                  </h1>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    Lecture {selectedContent ? (course.modules?.reduce((acc, m, idx) => {
                      const contentIdx = m.content?.findIndex(c => c.contentId === selectedContent.contentId);
                      if (contentIdx !== -1) return acc + contentIdx + 1;
                      return acc + (m.content?.length || 0);
                    }, 0) || 1) : 1} of {totalLectures}{selectedContent?.durationMinutes > 0 ? ` · ${selectedContent.durationMinutes}min` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    style={{
                      borderRadius: '9999px',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'white',
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: selectedContent ? 'pointer' : 'not-allowed',
                      opacity: selectedContent ? 1 : 0.3
                    }}
                    disabled={!selectedContent}
                    data-testid="prev-btn"
                  >
                    <FaArrowLeft style={{ width: '12px', height: '12px' }} />
                    <span style={{ display: window.innerWidth < 640 ? 'none' : 'inline' }}>Prev</span>
                  </button>
                  <button 
                    style={{
                      borderRadius: '9999px',
                      background: '#10B981',
                      color: 'white',
                      fontWeight: 'bold',
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: 'none',
                      cursor: selectedContent ? 'pointer' : 'not-allowed',
                      opacity: selectedContent ? 1 : 0.5
                    }}
                    disabled={!selectedContent}
                    data-testid="mark-complete-btn"
                    onClick={() => {
                      if (selectedContent) {
                        handleVideoEnd(selectedContent.contentId);
                      }
                    }}
                  >
                    <FaCheckCircle style={{ width: '16px', height: '16px' }} />
                    <span style={{ display: window.innerWidth < 640 ? 'none' : 'inline' }}>Mark as complete</span>
                  </button>
                  <button 
                    style={{
                      borderRadius: '9999px',
                      background: '#2563EB',
                      color: 'white',
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: 'none',
                      cursor: selectedContent ? 'pointer' : 'not-allowed',
                      opacity: selectedContent ? 1 : 0.3
                    }}
                    disabled={!selectedContent}
                    data-testid="next-btn"
                  >
                    <span style={{ display: window.innerWidth < 640 ? 'none' : 'inline' }}>Next</span>
                    <FaPlay style={{ width: '12px', height: '12px' }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ background: 'white', color: '#0F172A', padding: '24px 40px' }}>
              <div style={{ borderBottom: '1px solid #E2E8F0', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '24px', overflowX: 'auto' }}>
                  <button 
                    onClick={() => setCurrentLearningTab('overview')}
                    style={{
                      paddingBottom: '12px',
                      paddingLeft: '4px',
                      paddingRight: '4px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentLearningTab === 'overview' ? '#0F172A' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: currentLearningTab === 'overview' ? '2px solid #2563EB' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    data-testid="learn-tab-overview"
                  >
                    <FaBookOpen style={{ width: '16px', height: '16px' }} />
                    Overview
                  </button>
                  <button 
                    onClick={() => setCurrentLearningTab('notes')}
                    style={{
                      paddingBottom: '12px',
                      paddingLeft: '4px',
                      paddingRight: '4px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentLearningTab === 'notes' ? '#0F172A' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: currentLearningTab === 'notes' ? '2px solid #2563EB' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    data-testid="learn-tab-notes"
                  >
                    <FaFileAlt style={{ width: '16px', height: '16px' }} />
                    My Notes
                  </button>
                  <button 
                    onClick={() => setCurrentLearningTab('qa')}
                    style={{
                      paddingBottom: '12px',
                      paddingLeft: '4px',
                      paddingRight: '4px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentLearningTab === 'qa' ? '#0F172A' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: currentLearningTab === 'qa' ? '2px solid #2563EB' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    data-testid="learn-tab-qa"
                  >
                    <FaComments style={{ width: '16px', height: '16px' }} />
                    Q & A
                  </button>
                  <button 
                    onClick={() => setCurrentLearningTab('resources')}
                    style={{
                      paddingBottom: '12px',
                      paddingLeft: '4px',
                      paddingRight: '4px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentLearningTab === 'resources' ? '#0F172A' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: currentLearningTab === 'resources' ? '2px solid #2563EB' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    data-testid="learn-tab-resources"
                  >
                    <FaDownload style={{ width: '16px', height: '16px' }} />
                    Resources
                  </button>
                  <button 
                    onClick={() => setCurrentLearningTab('announcements')}
                    style={{
                      paddingBottom: '12px',
                      paddingLeft: '4px',
                      paddingRight: '4px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: currentLearningTab === 'announcements' ? '#0F172A' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: currentLearningTab === 'announcements' ? '2px solid #2563EB' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    data-testid="learn-tab-announcements"
                  >
                    <FaBullhorn style={{ width: '16px', height: '16px' }} />
                    Announcements
                  </button>
                </div>
              </div>
              
              {/* Tab Content - Overview */}
              {currentLearningTab === 'overview' && (
                <div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: window.innerWidth >= 768 ? 'repeat(3, 1fr)' : '1fr', 
                    gap: '16px', 
                    marginBottom: '24px' 
                  }}>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                        <FaStar style={{ width: '12px', height: '12px' }} />
                        COURSE RATING
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: '800' }}>{(courseRatingStats?.averageRating || 0).toFixed(1)}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{courseRatingStats?.totalReviews || 0} ratings</div>
                    </div>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                        <FaUsers style={{ width: '12px', height: '12px' }} />
                        STUDENTS ENROLLED
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: '800' }}>{enrollmentCount}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Learners</div>
                    </div>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                        <FaBookOpen style={{ width: '12px', height: '12px' }} />
                        LAST UPDATED
                      </div>
                      <div style={{ fontSize: '22px', fontWeight: '800' }}>March 2025</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Hindi, English</div>
                    </div>
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>By the numbers</h3>
                  <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', marginBottom: '24px' }}>{course.description}</p>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Instructor</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                      {course.instructor?.charAt(0) || 'I'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{course.instructor}</div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>Course Instructor</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content - My Notes */}
              {currentLearningTab === 'notes' && (
                <div data-testid="mynotes-tab">
                  <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', display: 'block' }}>
                      Note for: {selectedContent ? (selectedContent.contentTitle || selectedContent.title) : 'Select a lecture'}
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Type your note here... (e.g., '3NF removes transitive dependencies')"
                      style={{ width: '100%', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '12px', fontSize: '14px', resize: 'none', outline: 'none' }}
                      data-testid="note-input"
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                      <button 
                        style={{ borderRadius: '9999px', background: '#2563EB', color: 'white', padding: '8px 16px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                        data-testid="save-note-btn"
                      >
                        Save note
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '48px 0', fontSize: '13px', color: '#64748b' }}>
                    You haven't taken any notes yet.
                  </div>
                </div>
              )}

              {/* Tab Content - Q & A */}
              {currentLearningTab === 'qa' && (
                <div style={{ textAlign: 'center', padding: '48px', border: '2px dashed #E2E8F0', borderRadius: '16px' }}>
                  <FaComments style={{ width: '28px', height: '28px', color: '#cbd5e1', margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#0F172A', marginBottom: '8px' }}>No questions yet</div>
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', maxWidth: '28rem', margin: '0 auto 16px' }}>
                    Be the first to ask a question about this lecture. Other students and the instructor will help out.
                  </p>
                  <button style={{ borderRadius: '9999px', background: '#2563EB', color: 'white', padding: '8px 24px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                    Ask a question
                  </button>
                </div>
              )}

              {/* Tab Content - Resources */}
              {currentLearningTab === 'resources' && (
                <div>
                  {getCourseNotes().length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {getCourseNotes().map(note => (
                        <div key={note.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #E2E8F0', borderRadius: '12px', transition: 'border-color 0.2s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FaFileAlt style={{ width: '20px', height: '20px', color: '#2563EB' }} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{note.title}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{note.moduleTitle}</div>
                            </div>
                          </div>
                          <button style={{ borderRadius: '9999px', border: '1px solid #cbd5e1', background: 'transparent', padding: '8px 16px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <FaDownload style={{ width: '12px', height: '12px' }} />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '48px 0', fontSize: '13px', color: '#64748b' }}>
                      No downloadable resources available.
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content - Announcements */}
              {currentLearningTab === 'announcements' && (
                <div style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                      {course.instructor?.charAt(0) || 'I'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{course.instructor}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Posted 2 days ago</div>
                    </div>
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Welcome to the course!</h4>
                  <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7' }}>
                    Welcome to {course.courseName || course.name}! I'm excited to have you here. 
                    Make sure to complete all lectures and quizzes to get the most out of this course.
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* RIGHT: CURRICULUM SIDEBAR */}
          <aside style={{
            background: 'white',
            color: '#0F172A',
            borderLeft: '1px solid #E2E8F0',
            position: window.innerWidth >= 1024 ? 'sticky' : 'relative',
            top: window.innerWidth >= 1024 ? '64px' : 'auto',
            height: window.innerWidth >= 1024 ? 'calc(100vh - 64px)' : 'auto',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }} data-testid="curriculum-sidebar">
            {/* Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '15px' }}>Course content</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{completedCount}/{totalLectures} done</span>
              </div>
              <div style={{ position: 'relative' }}>
                <FaGlobe style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search lectures..."
                  style={{ width: '100%', height: '36px', paddingLeft: '36px', paddingRight: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none' }}
                  data-testid="lecture-search"
                />
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {course.modules?.map((module, moduleIndex) => {
                const isExpanded = moduleExpanded[moduleIndex];
                const moduleCompletedCount = module.content?.filter(c => isContentCompleted(c.contentId, c.contentType)).length || 0;
                
                return (
                  <div key={module.moduleId} data-testid={`sb-module-${moduleIndex}`}>
                    {/* Module Header */}
                    <button 
                      onClick={() => setModuleExpanded(prev => ({ ...prev, [moduleIndex]: !prev[moduleIndex] }))}
                      style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0F172A' }}>Section {moduleIndex + 1}: {module.moduleTitle || module.title}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{moduleCompletedCount} / {module.content?.length || 0} · {module.content?.length || 0} lectures</div>
                      </div>
                      <FaChevronDown style={{ width: '16px', height: '16px', color: '#94a3b8', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    </button>

                    {/* Lecture List */}
                    {isExpanded && (
                      <div style={{ background: '#F8FAFC' }}>
                        {module.content?.map((content, contentIndex) => {
                          const isCompleted = isContentCompleted(content.contentId, content.contentType);
                          const isCurrent = selectedContent?.contentId === content.contentId;
                          return (
                            <button
                              key={content.contentId}
                              onClick={() => handleContentClick(content, moduleIndex, contentIndex)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                padding: '12px 16px',
                                textAlign: 'left',
                                background: isCurrent ? '#EFF6FF' : 'transparent',
                                borderLeft: isCurrent ? '4px solid #2563EB' : '4px solid transparent',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => !isCurrent && (e.currentTarget.style.background = '#e2e8f0')}
                              onMouseLeave={(e) => !isCurrent && (e.currentTarget.style.background = 'transparent')}
                              data-testid={`sb-lec-${content.contentId}`}
                            >
                              {isCompleted ? (
                                <FaCheckCircle style={{ width: '16px', height: '16px', color: '#10B981', marginTop: '2px', flexShrink: 0 }} />
                              ) : (
                                <FaCircle style={{ width: '16px', height: '16px', color: '#94a3b8', marginTop: '2px', flexShrink: 0, fontSize: '10px' }} />
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: isCurrent ? 'bold' : 'normal', color: isCurrent ? '#0F172A' : '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {content.contentTitle || content.title}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#64748b' }}>
                                  <FaPlay style={{ width: '12px', height: '12px' }} />
                                  <span style={{ textTransform: 'capitalize' }}>{content.contentType}</span>
                                  {content.contentType === 'video' && content.durationMinutes > 0 && (
                                    <>
                                      <span>·</span>
                                      <span>{content.durationMinutes}min</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {isCurrent && (
                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NOW</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // Otherwise show the existing marketing/preview UI
  return (
    <div className="course-learning-page">
      {/* Hero Header */}
      <div className="course-header">
        <div className="course-header-content">
          <div className="hero-left-content">
            <span className="category-badge">{course.category || 'INFORMATION TECHNOLOGY'}</span>
            <h1 className="clp-hero-course-title">{course.courseName || course.name}</h1>
            <p className="course-desc-single">
              {course.description && course.description.length > 120 
                ? course.description.substring(0, 120) + '...' 
                : course.description}
            </p>
            
            <div className="hero-badges-row">
              <span className="new-course-badge">NEW COURSE</span>
              <span className="students-count">• {enrollmentCount} students</span>
            </div>
            
            <div className="creator-row">
              <span>Created by </span>
              <a href="#instructor" className="creator-name">{course.instructor}</a>
            </div>
            
            <div className="meta-info-row">
              <div className="meta-box">
                <FaClock />
                <span>Duration: {course.duration}</span>
              </div>
              <div className="meta-box">
                <FaGlobe />
                <span>Mode: {course.mode}</span>
              </div>
              {course.certification && (
                <div className="meta-box">
                  <FaCheck />
                  <span>{course.certification}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="course-main-content">
        {/* Left Content Area */}
        <div className="course-content-area">
          {/* What You'll Learn Section */}
          <div className="what-you-learn">
            <h3>What You'll Learn</h3>
            <div className="learning-points">
              <div className="point">Master the fundamentals of {course.category || 'Database Management'}</div>
              <div className="point">Build real-world projects</div>
              <div className="point">Get hands-on experience</div>
              <div className="point">Earn a certificate of completion</div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="clp-course-stats">
            <div className="clp-stat-item">
              <FaClock className="clp-stat-icon" />
              <span className="clp-stat-number">{course.duration}</span>
              <span className="clp-stat-label">Duration</span>
            </div>
            <div className="clp-stat-item">
              <svg className="clp-stat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 7H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M3 17H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="clp-stat-number">{course.modules?.length || 0}</span>
              <span className="clp-stat-label">Modules</span>
            </div>
            <div className="clp-stat-item">
              <svg className="clp-stat-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 3L19 12L5 21V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="clp-stat-number">{course.modules?.reduce((acc, m) => acc + (m.content?.length || 0), 0) || 0}</span>
              <span className="clp-stat-label">Lectures</span>
            </div>
            <div className="clp-stat-item">
              <FaUsers className="clp-stat-icon" />
              <span className="clp-stat-number">{enrollmentCount}</span>
              <span className="clp-stat-label">Students</span>
            </div>
          </div>

          {/* Course Content Section */}
          <div className="course-content-section">
            <div className="content-section-header">
              <h2>Course Content</h2>
              <div className="content-meta">
                <span>{course.modules?.length || 0} sections</span>
                <span> • </span>
                <span>{course.modules?.reduce((acc, m) => acc + (m.content?.length || 0), 0) || 0} lectures</span>
                <span> • </span>
                <span>{formatDuration(calculateTotalVideoDuration())} total length</span>
              </div>
              {Object.keys(expandedSections).some(key => expandedSections[key]) ? (
                <button className="expand-all-btn" onClick={() => setExpandedSections({})}>
                  Collapse All
                </button>
              ) : (
                <button className="expand-all-btn" onClick={() => {
                  const allExpanded = {};
                  course.modules?.forEach((_, index) => {
                    allExpanded[index] = true;
                  });
                  setExpandedSections(allExpanded);
                }}>
                  Expand All Sections
                </button>
              )}
            </div>

            <div className="course-sections">
              {(course.mode === 'On Campus' || course.mode === 'Offline') ? (
                <div className="course-section">
                  <div className="section-header">
                    <div className="section-info">
                      <h4>Course Information</h4>
                      <span className="section-meta">On-Campus Learning</span>
                    </div>
                  </div>
                  <div className="section-content">
                    {enrollmentStatus?.enrolled ? (
                      <div className="enrollment-success-message">
                        <div className="success-icon">✅</div>
                        <div className="success-text">
                          <h4>You are successfully enrolled.</h4>
                          <p>Please visit the campus for further instructions and class schedules.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="enrollment-info">
                        <div className="info-icon">ℹ️</div>
                        <div className="info-text">
                          <h4>On-Campus Course</h4>
                          <p>This is an on-campus course. After enrollment, you will receive further instructions about class schedules and campus visits.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                course.modules?.map((module, moduleIndex) => (
                  <div key={module.moduleId} className="course-section">
                    <div className="section-header" onClick={() => toggleSection(moduleIndex)}>
                      <div className="section-info">
                        <h4>Section {moduleIndex + 1}: {module.moduleTitle || module.title}</h4>
                        <span className="section-meta">
                          {module.content?.length || 0} lectures • {module.content?.reduce((acc, c) => {
                            // Only count video duration
                            if (c.contentType === 'video' && c.durationMinutes) {
                              return acc + (parseInt(c.durationMinutes) || 0);
                            }
                            return acc;
                          }, 0) || 0}min
                        </span>
                      </div>
                      {expandedSections[moduleIndex] ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                    {expandedSections[moduleIndex] && (
                      <div className="section-content">
                        {module.content?.map((content, contentIndex) => {
                          const isCompleted = isContentCompleted(content.contentId, content.contentType);
                          const isQuizLocked = content.contentType === 'quiz' && isCompleted;
                          return (
                            <div key={content.contentId} className={`content-item ${selectedContent?.contentId === content.contentId ? 'active' : ''} ${!enrollmentStatus?.enrolled ? 'locked' : ''} ${isQuizLocked ? 'quiz-locked' : ''}`} onClick={() => !isQuizLocked && handleContentClick(content, moduleIndex, contentIndex)}>
                              <div className={`content-icon ${content.contentType === 'quiz' ? 'quiz-icon' : ''} ${isCompleted ? 'completed' : ''}`}>
                                {!enrollmentStatus?.enrolled ? <FaLock /> : isCompleted ? <FaCheck className="completed" /> : content.contentType === 'video' ? <FaPlay /> : content.contentType === 'quiz' ? <span>Q</span> : content.contentType === 'assignment' ? <span>📄</span> : <FaPlay />}
                              </div>
                              <div className="content-info">
                                <span className="content-title">{content.contentTitle || content.title}</span>
                                {content.contentType === 'video' && content.durationMinutes > 0 && (
                                  <span className="content-duration">{content.durationMinutes}min</span>
                                )}
                                {isQuizLocked && <span className="quiz-status">✅ Completed</span>}
                              </div>
                            </div>
                          );
                        })}
                        {module.quiz && (() => {
                          const isCompleted = isContentCompleted(module.quiz.quizId, 'quiz');
                          const isQuizLocked = isCompleted;
                          return (
                            <div className={`content-item quiz-item ${selectedContent?.contentId === `module-quiz-${module.quiz.quizId}` ? 'active' : ''} ${!enrollmentStatus?.enrolled ? 'locked' : ''} ${isQuizLocked ? 'quiz-locked' : ''}`} onClick={() => enrollmentStatus?.enrolled && !isQuizLocked && handleTakeQuiz(module.quiz)}>
                              <div className={`content-icon ${isCompleted ? 'completed' : ''}`}>
                                {!enrollmentStatus?.enrolled ? <FaLock /> : isCompleted ? <FaCheck className="completed" /> : <span>Q</span>}
                              </div>
                              <div className="content-info">
                                <span className="content-title">Quiz: {module.quiz.title}</span>
                                <span className="content-duration">{module.quiz.questions?.length} questions</span>
                                {isQuizLocked && <span className="quiz-status">✅ Completed</span>}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Video Player or Content Display */}
          {selectedContent && selectedContent.contentType === 'video' ? (
            <div className="video-player-section">
              <div className="video-container">
                {selectedContent.contentUrl ? (
                  <video 
                    controls 
                    width="100%" 
                    height="500px"
                    poster={selectedContent.thumbnailUrl}
                    crossOrigin="anonymous"
                    onError={(e) => {
                      try {
                        logVideoError(e, selectedContent.contentUrl, {
                          contentId: selectedContent.contentId,
                          contentTitle: selectedContent.contentTitle || selectedContent.title,
                          contentType: selectedContent.contentType
                        });
                      } catch (error) {
                        console.warn('Video error handler failed:', error);
                      }
                    }}
                    onLoadStart={() => console.log('Video loading started:', selectedContent.contentUrl)}
                    onEnded={() => handleVideoEnd(selectedContent.contentId)}
                  >
                    <source src={selectedContent.contentUrl} type="video/mp4" />
                    <source src={selectedContent.contentUrl} type="video/webm" />
                    <source src={selectedContent.contentUrl} type="video/ogg" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="video-placeholder">
                    <p>Video not available. URL: {selectedContent.contentUrl || 'No URL'}</p>
                    <p>Content ID: {selectedContent.contentId}</p>
                    <div className="debug-buttons">
                      <button onClick={async () => {
                        const debugResult = await debugVideoContent(selectedContent);
                        console.log('🔍 Video Debug Result:', debugResult);
                      }}>Test Video URL</button>
                      
                      <button onClick={async () => {
                        try {
                          const debugResult = await apiService.debugCourseContent(courseId);
                          console.log('🔍 Course Debug Result:', debugResult);
                          alert('Debug info logged to console. Check browser console for details.');
                        } catch (error) {
                          console.error('Debug failed:', error);
                          alert('Debug failed. Check console for details.');
                        }
                      }}>Debug Course</button>
                      
                      <button onClick={async () => {
                        try {
                          const fixResult = await apiService.fixCourseContentUrls(courseId);
                          console.log('🔧 Fix Result:', fixResult);
                          if (fixResult.success) {
                            alert(`Fixed ${fixResult.data?.length || 0} content URLs. Refreshing page...`);
                            window.location.reload();
                          } else {
                            alert('Fix failed: ' + fixResult.message);
                          }
                        } catch (error) {
                          console.error('Fix failed:', error);
                          alert('Fix failed. Check console for details.');
                        }
                      }}>Fix URLs</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="video-info">
                <h2>{selectedContent.contentTitle || selectedContent.title}</h2>
                <p>Duration: {selectedContent.durationMinutes} minutes</p>
                {selectedContent.contentUrl && (
                  <p className="video-url-debug">Video URL: {selectedContent.contentUrl}</p>
                )}
              </div>
            </div>
          ) : selectedContent && selectedContent.contentType === 'quiz' ? (
            <div className="video-player-section">
              <div className="video-container">
                <div className="inline-quiz-container">
                  {!quizResults ? (
                    <div className="inline-quiz-content">
                      <div className="quiz-header">
                        <h2>{selectedQuiz?.title}</h2>
                        <p>{selectedQuiz?.description}</p>
                        <div className="quiz-meta-inline">
                          <span>Questions: {selectedQuiz?.questions?.length}</span>
                          <span>Passing Score: {selectedQuiz?.passingScore}%</span>
                          <span>Time Limit: {selectedQuiz?.timeLimit} minutes</span>
                        </div>
                        <div className="quiz-progress-inline">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${getQuizProgress()}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">
                            {Object.keys(quizAnswers).length} of {selectedQuiz?.questions?.length} answered
                          </span>
                        </div>
                      </div>
                      
                      <div className="quiz-questions-inline">
                        {selectedQuiz?.questions?.map((question, index) => (
                          <div key={question.questionId} className="question-item-inline">
                            <h4>Question {index + 1}</h4>
                            <p>{question.question}</p>
                            <div className="question-options-inline">
                              {question.options?.map((option, optionIndex) => (
                                <label key={optionIndex} className="option-label-inline">
                                  <input
                                    type="radio"
                                    name={question.questionId}
                                    value={option}
                                    onChange={(e) => setQuizAnswers(prev => ({
                                      ...prev,
                                      [question.questionId]: e.target.value
                                    }))}
                                  />
                                  <span>{option}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="quiz-actions-inline">
                        <button 
                          className="submit-quiz-btn-inline"
                          onClick={handleQuizSubmit}
                          disabled={!isQuizAnswerComplete() || quizSubmitting}
                        >
                          {quizSubmitting ? 'Submitting...' : 'Submit Quiz'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="quiz-results-inline">
                      <h2>Quiz Results</h2>
                      <div className="results-summary-inline">
                        <div className="score-display-inline">
                          <span className="score-inline">{quizResults.score}%</span>
                          <span className={`status-inline ${quizResults.passed ? 'passed' : 'failed'}`}>
                            {quizResults.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                        <p>You answered {quizResults.correctAnswers} out of {quizResults.totalQuestions} questions correctly.</p>
                        {quizResults.passed ? (
                          <p className="success-message-inline">Congratulations! You have successfully completed this quiz.</p>
                        ) : (
                          <p className="failure-message-inline">
                            {quizResults.message || `You need ${selectedQuiz?.passingScore}% to pass. Please review the material and try again.`}
                          </p>
                        )}
                      </div>
                      
                      <div className="quiz-attempt-record">
                        <h3>Your Attempt Record</h3>
                        <div className="question-results">
                          {quizResults.questionResults?.map((result, index) => (
                            <div key={result.questionId} className="question-result-item">
                              <div className="question-header">
                                <h4>Question {index + 1}</h4>
                                <span className={`result-status ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                                  {result.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                </span>
                              </div>
                              <p className="question-text">{result.question}</p>
                              <div className="answer-comparison">
                                <div className="user-answer">
                                  <strong>Your Answer:</strong> {result.userAnswer || 'Not answered'}
                                </div>
                                {!result.isCorrect && (
                                  <div className="correct-answer">
                                    <strong>Correct Answer:</strong> {result.correctAnswer}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="quiz-result-actions-inline">
                        {!quizResults.passed && (
                          <button 
                            className="retry-quiz-btn-inline"
                            onClick={() => {
                              setQuizResults(null);
                              setQuizAnswers({});
                            }}
                          >
                            Retry Quiz
                          </button>
                        )}
                        {quizResults.passed && (
                          <div className="quiz-locked-message">
                            ✅ Quiz completed successfully! You cannot retake this quiz.
                          </div>
                        )}
                        <button 
                          className="continue-btn-inline"
                          onClick={() => {
                            setSelectedContent(null);
                            setSelectedQuiz(null);
                            setQuizAnswers({});
                            setQuizResults(null);
                            setActiveTab('overview');
                          }}
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="video-info">
                <h2>{selectedContent.contentTitle || selectedContent.title}</h2>
                <p>Quiz • {selectedQuiz?.questions?.length} questions</p>
              </div>
            </div>
          ) : activeTab === 'notes' ? (
            <div className="video-player-section">
              <div className="video-container">
                <div className="notes-container">
                  <div className="notes-header">
                    <h2>Course Notes</h2>
                    <p>Download and view course materials</p>
                  </div>
                  <div className="notes-list">
                    {getCourseNotes().length > 0 ? (
                      getCourseNotes().map(note => (
                        <div key={note.id} className="note-item">
                          <div className="note-info">
                            <h3>{note.title}</h3>
                            <p>From: {note.moduleTitle}</p>
                          </div>
                          <div className="note-actions">
                            <button 
                              className="view-note-btn"
                              onClick={() => window.open(note.url, '_blank')}
                            >
                              View
                            </button>
                            <a 
                              href={note.url}
                              download
                              className="download-note-btn"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-notes">
                        <p>No notes available for this course.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="video-info">
                <h2>Course Notes</h2>
                <p>{getCourseNotes().length} notes available</p>
              </div>
            </div>
          ) : null}

          {/* Tab Navigation */}
          <div className="course-tabs">
            <button 
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              Notes
            </button>
            <button 
              className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
                <h3>Requirements</h3>
                {course.prerequisites ? (
                  <p>{course.prerequisites}</p>
                ) : (
                  <ul>
                    <li>No prior experience needed — beginners welcome.</li>
                  </ul>
                )}
                
                <h4>About This Course</h4>
                <p>{course.description}</p>
                
                {course.syllabusOverview && (
                  <div>
                    <h4>Syllabus Overview</h4>
                    <p>{course.syllabusOverview}</p>
                  </div>
                )}
                
                {course.certification && (
                  <div>
                    <h4>Certification</h4>
                    <div className="certification-badge">
                      <FaCheck />
                      <span>{course.certification}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'notes' && (
              <div className="notes-tab">
                <h3>Course Notes</h3>
                <div className="notes-list">
                  {getCourseNotes().length > 0 ? (
                    getCourseNotes().map(note => (
                      <div key={note.id} className="note-item">
                        <div className="note-info">
                          <h4>{note.title}</h4>
                          <p>From: {note.moduleTitle}</p>
                        </div>
                        <div className="note-actions">
                          <button 
                            className="view-note-btn"
                            onClick={() => window.open(note.url, '_blank')}
                          >
                            View
                          </button>
                          <a 
                            href={note.url}
                            download
                            className="download-note-btn"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-notes">
                      <p>No notes available for this course.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div className="reviews-tab">
                <div className="reviews-header">
                  <h3>Course Reviews</h3>
                  <div className="rating-summary">
                    <div className="average-rating">
                      <span className="rating-number">{(courseRatingStats?.averageRating || 0).toFixed(1)}</span>
                      <div className="rating-stars">
                        {renderStars(Math.round(courseRatingStats?.averageRating || 0))}
                      </div>
                      <span className="rating-count">({courseRatingStats?.totalReviews || 0} reviews)</span>
                    </div>
                  </div>
                </div>
                
                {enrollmentStatus?.enrolled && (
                  <div className="review-form-section">
                    <h4>Write a Review</h4>
                    <form onSubmit={handleSubmitReview} className="review-form">
                      <div className="rating-input">
                        <label>Rating:</label>
                        <div className="star-rating">
                          {renderRatingStars(reviewForm.rating, true, (rating) => 
                            setReviewForm(prev => ({ ...prev, rating }))
                          )}
                        </div>
                      </div>
                      <div className="review-input">
                        <label>Review:</label>
                        <textarea
                          value={reviewForm.review}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, review: e.target.value }))}
                          placeholder="Share your experience with this course..."
                          rows={4}
                          required
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="submit-review-btn"
                        disabled={submittingReview}
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                )}
                
                <div className="reviews-list">
                  {courseReviews.length > 0 ? (
                    courseReviews.map(review => (
                      <div key={review.coursereviewid} className="review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <div className="reviewer-avatar">
                              {review.userPhoto ? (
                                <img src={review.userPhoto} alt={review.userName} />
                              ) : (
                                <span>{review.userName.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="reviewer-details">
                              <h5>{review.userName}</h5>
                              <div className="review-rating">
                                {renderStars(review.rating)}
                              </div>
                            </div>
                          </div>
                          <div className="review-date">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="review-content">
                          <p>{review.review}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-reviews">
                      <p>No reviews yet. Be the first to review this course!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="course-sidebar">
          {/* Course Banner Preview at Top - Always Visible */}
          <div className="sidebar-course-banner">
            <div className="banner-image-container">
              <img 
                src={course.thumbnail || course.thumbnailUrl || 'https://via.placeholder.com/400x225/1e3a8a/ffffff?text=Course+Preview'} 
                alt={course.courseName || course.name}
                className="banner-thumbnail"
                onLoad={() => console.log('✅ Banner image loaded:', course.thumbnail || course.thumbnailUrl)}
                onError={(e) => {
                  console.log('❌ Banner image error, using fallback');
                  console.log('Tried URL:', course.thumbnail || course.thumbnailUrl);
                  e.target.src = 'https://via.placeholder.com/400x225/1e3a8a/ffffff?text=Course+Preview';
                }}
              />
              <div className="banner-overlay">
                <div className="banner-play-button">
                  <FaPlay />
                </div>
                <span className="banner-preview-text">Preview this course</span>
              </div>
            </div>
          </div>
          
          {!enrollmentStatus?.enrolled ? (
            <>
              <div className="enrollment-section">
                <div className="price-section">
                  <span className="current-price">₹{course.fees}</span>
                  {course.originalFees && (
                    <>
                      <span className="original-price">₹{course.originalFees}</span>
                      <span className="discount-badge">83% off</span>
                    </>
                  )}
                </div>
                <button className="enroll-btn" onClick={handleEnroll}>
                  Enroll Now
                </button>
                <button className="buy-now-btn" onClick={handleEnroll}>
                  Buy Now - ₹{course.fees}
                </button>
              </div>
              
              <div className="sidebar-separator"></div>
              
              <div className="sidebar-includes">
                <h4>This course includes:</h4>
                <div className="includes-list">
                  <div className="include-item">
                    <FaPlay /> {course.modules?.reduce((acc, m) => acc + (m.content?.filter(c => c.contentType === 'video').length || 0), 0) || 0} lectures
                  </div>
                  <div className="include-item">
                    <FaPlay /> Downloadable notes & resources
                  </div>
                  <div className="include-item">
                    <FaGlobe /> Access on mobile & desktop
                  </div>
                  <div className="include-item">
                    <FaClock /> Full lifetime access
                  </div>
                  <div className="include-item">
                    <FaCheck /> Certificate on completion
                  </div>
                </div>
              </div>
              
            </>
          ) : null}
        </div>
      </div>

      {/* Quiz Modal */}
      {showQuizModal && selectedQuiz && (
        <div className="modal-overlay" onClick={() => {
          setShowQuizModal(false);
          setQuizAnswers({});
          setQuizResults(null);
          setQuizSubmitting(false);
        }}>
          <div className="quiz-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quiz-modal-header">
              <h2>{selectedQuiz.title}</h2>
              <button className="modal-close" onClick={() => {
                setShowQuizModal(false);
                setQuizAnswers({});
                setQuizResults(null);
                setQuizSubmitting(false);
              }}>×</button>
            </div>
            
            <div className="quiz-modal-content">
              {!quizResults ? (
                <>
                  <div className="quiz-info">
                    <p>{selectedQuiz.description}</p>
                    <div className="quiz-meta">
                      <span>Questions: {selectedQuiz.questions?.length}</span>
                      <span>Passing Score: {selectedQuiz.passingScore}%</span>
                      <span>Time Limit: {selectedQuiz.timeLimit} minutes</span>
                    </div>
                    <div className="quiz-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${getQuizProgress()}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {Object.keys(quizAnswers).length} of {selectedQuiz.questions?.length} answered
                      </span>
                    </div>
                  </div>
                  
                  <div className="quiz-questions">
                    {selectedQuiz.questions?.map((question, index) => (
                      <div key={question.questionId} className="question-item">
                        <h4>Question {index + 1}</h4>
                        <p>{question.question}</p>
                        <div className="question-options">
                          {question.options?.map((option, optionIndex) => (
                            <label key={optionIndex} className="option-label">
                              <input
                                type="radio"
                                name={question.questionId}
                                value={option}
                                onChange={(e) => setQuizAnswers(prev => ({
                                  ...prev,
                                  [question.questionId]: e.target.value
                                }))}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="quiz-actions">
                    <button 
                      className="submit-quiz-btn"
                      onClick={handleQuizSubmit}
                      disabled={!isQuizAnswerComplete() || quizSubmitting}
                    >
                      {quizSubmitting ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="quiz-results">
                  <h3>Quiz Results</h3>
                  <div className="results-summary">
                    <div className="score-display">
                      <span className="score">{quizResults.score}%</span>
                      <span className={`status ${quizResults.passed ? 'passed' : 'failed'}`}>
                        {quizResults.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <p>You answered {quizResults.correctAnswers} out of {quizResults.totalQuestions} questions correctly.</p>
                    {quizResults.passed ? (
                      <p className="success-message">Congratulations! You have successfully completed this quiz.</p>
                    ) : (
                      <p className="failure-message">You need {selectedQuiz.passingScore}% to pass. Please review the material and try again.</p>
                    )}
                  </div>
                  
                  <div className="quiz-result-actions">
                    {!quizResults.passed && (
                      <button 
                        className="retry-quiz-btn"
                        onClick={() => {
                          setQuizResults(null);
                          setQuizAnswers({});
                        }}
                      >
                        Retry Quiz
                      </button>
                    )}
                    {quizResults.passed && (
                      <div className="quiz-locked-message">
                        ✅ Quiz completed successfully! You cannot retake this quiz.
                      </div>
                    )}
                    <button 
                      className="close-results-btn"
                      onClick={() => {
                        setShowQuizModal(false);
                        setQuizAnswers({});
                        setQuizResults(null);
                        setQuizSubmitting(false);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Enrollment Modal for Institutes */}
      {showEnrollmentModal && course && (
        <StudentEnrollmentModal
          isOpen={showEnrollmentModal}
          onClose={() => setShowEnrollmentModal(false)}
          course={{
            coursesId: courseId,
            courseName: course.courseName || course.name,
            name: course.courseName || course.name,
            instructor: course.instructor,
            duration: course.duration,
            fees: course.fees,
            mode: course.mode
          }}
          instituteId={userProfile?.instituteId}
        />
      )}

      {/* Payment Option Modal for On-Campus Courses */}
      {showPaymentOptionModal && course && (
        <PaymentOptionModal
          course={{
            coursesId: courseId,
            courseName: course.courseName || course.name,
            name: course.courseName || course.name,
            instructor: course.instructor,
            duration: course.duration,
            fees: course.fees,
            mode: course.mode
          }}
          onClose={() => setShowPaymentOptionModal(false)}
          onPayHere={handlePayHere}
          onPayAtInstitute={handlePayAtInstitute}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && course && (
        <PaymentModal
          course={{
            coursesId: courseId,
            courseName: course.courseName || course.name,
            name: course.courseName || course.name,
            instructor: course.instructor,
            duration: course.duration,
            fees: course.fees
          }}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default CourseLearningPage;