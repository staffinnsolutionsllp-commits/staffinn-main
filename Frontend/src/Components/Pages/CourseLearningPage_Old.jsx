import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { debugVideoContent, logVideoError } from '../../utils/videoUtils';
import './CourseLearningPage.css';
import { FaPlay, FaLock, FaCheck, FaChevronDown, FaChevronUp, FaStar, FaUsers, FaClock, FaGlobe } from 'react-icons/fa';

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

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
      checkEnrollmentStatus();
    }
  }, [courseId]);

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
      if (publicResponse.success) {
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
      const response = await apiService.enrollInCourse(courseId);
      if (response.success) {
        setEnrollmentStatus({ enrolled: true, hasStarted: false, progressPercentage: 0 });
        fetchCourseData(); // Refresh to get accessible content
      }
    } catch (error) {
      console.error('Error enrolling:', error);
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
      
      // Update progress immediately if passed (backend handles persistence)
      if (resultsData.passed) {
        const quizId = selectedQuiz.contentId || selectedQuiz.quizId;
        
        // Update local state immediately
        setUserProgress(prev => ({
          ...prev,
          completedQuizzes: {
            ...prev.completedQuizzes,
            [quizId]: { passed: true, completedAt: new Date().toISOString() }
          }
        }));
        
        // Also update localStorage for immediate UI feedback
        const progressKey = `course_progress_${courseId}`;
        const existingProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
        if (!existingProgress.completedQuizzes) existingProgress.completedQuizzes = {};
        existingProgress.completedQuizzes[quizId] = { passed: true, completedAt: new Date().toISOString() };
        localStorage.setItem(progressKey, JSON.stringify(existingProgress));
        
        // Refresh progress from backend
        await fetchUserProgress();
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
      
      // Update progress immediately if passed (backend handles persistence)
      if (resultsData.passed) {
        const quizId = selectedQuiz.contentId || selectedQuiz.quizId;
        
        // Update local state immediately
        setUserProgress(prev => ({
          ...prev,
          completedQuizzes: {
            ...prev.completedQuizzes,
            [quizId]: { passed: true, completedAt: new Date().toISOString() }
          }
        }));
        
        // Also update localStorage for immediate UI feedback
        const progressKey = `course_progress_${courseId}`;
        const existingProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
        if (!existingProgress.completedQuizzes) existingProgress.completedQuizzes = {};
        existingProgress.completedQuizzes[quizId] = { passed: true, completedAt: new Date().toISOString() };
        localStorage.setItem(progressKey, JSON.stringify(existingProgress));
        
        // Refresh progress from backend
        await fetchUserProgress();
      }
      
      setQuizResults(resultsData);
    } finally {
      setQuizSubmitting(false);
    }
  };

  const calculateProgress = () => {
    if (!course?.modules || !userProgress) return 0;
    let totalItems = 0;
    let completedItems = 0;
    
    course.modules.forEach(module => {
      if (module.content) {
        totalItems += module.content.length;
        module.content.forEach(content => {
          if (content.contentType === 'quiz') {
            if (userProgress.completedQuizzes && userProgress.completedQuizzes[content.contentId] && userProgress.completedQuizzes[content.contentId].passed) {
              completedItems++;
            }
          } else {
            if (userProgress.completedContent && userProgress.completedContent[content.contentId]) {
              completedItems++;
            }
          }
        });
      }
      if (module.quiz) {
        totalItems += 1;
        const quizKey = module.quiz.quizId;
        if (userProgress.completedQuizzes && userProgress.completedQuizzes[quizKey] && userProgress.completedQuizzes[quizKey].passed) {
          completedItems++;
        }
      }
    });
    
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    return progress;
  };

  const isQuizAnswerComplete = () => {
    if (!selectedQuiz?.questions) return false;
    return Object.keys(quizAnswers).length === selectedQuiz.questions.length;
  };

  const getQuizProgress = () => {
    if (!selectedQuiz?.questions) return 0;
    return Math.round((Object.keys(quizAnswers).length / selectedQuiz.questions.length) * 100);
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

  if (loading) {
    return <div className="course-loading">Loading course...</div>;
  }

  if (!course) {
    return <div className="course-error">Course not found</div>;
  }

  return (
    <div className="course-learning-page">
      {/* Header */}
      <div className="course-header">
        <div className="course-header-content">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <div className="course-title-section">
            <h1>{course.courseName || course.name}</h1>
            <div className="course-meta">
              <span className="rating">
                <FaStar /> 4.7 ({Math.floor(Math.random() * 1000)} ratings)
              </span>
              <span className="students">
                <FaUsers /> {Math.floor(Math.random() * 5000)} students
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="course-main-content">
        {/* Left Content Area */}
        <div className="course-content-area">
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
                      logVideoError(e, selectedContent.contentUrl, {
                        contentId: selectedContent.contentId,
                        contentTitle: selectedContent.contentTitle || selectedContent.title,
                        contentType: selectedContent.contentType
                      });
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
          ) : (
            <div className="course-overview">
              <div className="overview-content">
                <h2>About This Course</h2>
                <p>{course.description}</p>
                
                <div className="course-stats">
                  <div className="stat-item">
                    <FaClock />
                    <span>{course.duration}</span>
                  </div>
                  <div className="stat-item">
                    <FaUsers />
                    <span>{course.instructor}</span>
                  </div>
                  <div className="stat-item">
                    <FaGlobe />
                    <span>{course.mode}</span>
                  </div>
                </div>

                <div className="what-you-learn">
                  <h3>What you'll learn</h3>
                  <div className="learning-points">
                    <div className="point">✓ Master the fundamentals of {course.category}</div>
                    <div className="point">✓ Build real-world projects</div>
                    <div className="point">✓ Get hands-on experience</div>
                    <div className="point">✓ Earn a certificate of completion</div>
                  </div>
                </div>
                
                {course.prerequisites && (
                  <div className="course-prerequisites">
                    <h3>Prerequisites</h3>
                    <p>{course.prerequisites}</p>
                  </div>
                )}
                
                {course.syllabusOverview && (
                  <div className="course-syllabus">
                    <h3>Syllabus Overview</h3>
                    <p>{course.syllabusOverview}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="course-tabs">
            <button 
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab ${activeTab === 'qa' ? 'active' : ''}`}
              onClick={() => setActiveTab('qa')}
            >
              Q&A
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
                <h3>Course Description</h3>
                <p>{course.description}</p>
                {course.prerequisites && (
                  <div>
                    <h4>Prerequisites</h4>
                    <p>{course.prerequisites}</p>
                  </div>
                )}
                {course.syllabusOverview && (
                  <div>
                    <h4>Syllabus Overview</h4>
                    <p>{course.syllabusOverview}</p>
                  </div>
                )}
                {course.certification && (
                  <div>
                    <h4>Certification</h4>
                    <p>{course.certification}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="course-sidebar">
          <div className="sidebar-header">
            <h3>Course content</h3>
            {enrollmentStatus?.enrolled && (
              <div className="progress-info">
                {calculateProgress()}% complete
              </div>
            )}
          </div>

          {!enrollmentStatus?.enrolled && (
            <div className="enrollment-section">
              <div className="price-section">
                <span className="current-price">₹{course.fees}</span>
              </div>
              <button className="enroll-btn" onClick={handleEnroll}>
                Enroll Now
              </button>
              <p className="enrollment-note">
                Enroll to access all course content
              </p>
            </div>
          )}

          <div className="course-sections">
            {course.modules?.map((module, moduleIndex) => (
              <div key={module.moduleId} className="course-section">
                <div 
                  className="section-header"
                  onClick={() => toggleSection(moduleIndex)}
                >
                  <div className="section-info">
                    <h4>Section {moduleIndex + 1}: {module.moduleTitle || module.title}</h4>
                    <span className="section-meta">
                      {module.content?.length || 0} lectures • {module.content?.reduce((acc, c) => acc + (c.durationMinutes || 0), 0)}min
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
                        <div 
                          key={content.contentId} 
                          className={`content-item ${selectedContent?.contentId === content.contentId ? 'active' : ''} ${!enrollmentStatus?.enrolled ? 'locked' : ''} ${isQuizLocked ? 'quiz-locked' : ''}`}
                          onClick={() => !isQuizLocked && handleContentClick(content, moduleIndex, contentIndex)}
                        >
                          <div className={`content-icon ${content.contentType === 'quiz' ? 'quiz-icon' : ''} ${isCompleted ? 'completed' : ''}`}>
                            {!enrollmentStatus?.enrolled ? (
                              <FaLock />
                            ) : isCompleted ? (
                              <FaCheck className="completed" />
                            ) : content.contentType === 'video' ? (
                              <FaPlay />
                            ) : content.contentType === 'quiz' ? (
                              <span>Q</span>
                            ) : content.contentType === 'assignment' ? (
                              <span>📄</span>
                            ) : (
                              <FaPlay />
                            )}
                          </div>
                          <div className="content-info">
                            <span className="content-title">{content.contentTitle || content.title}</span>
                            <span className="content-duration">{content.durationMinutes}min</span>
                            {isQuizLocked && <span className="quiz-status">✅ Completed</span>}
                          </div>
                        </div>
                      );
                    })}

                    {module.quiz && (() => {
                      const isCompleted = isContentCompleted(module.quiz.quizId, 'quiz');
                      const isQuizLocked = isCompleted;
                      
                      return (
                        <div 
                          className={`content-item quiz-item ${selectedContent?.contentId === `module-quiz-${module.quiz.quizId}` ? 'active' : ''} ${!enrollmentStatus?.enrolled ? 'locked' : ''} ${isQuizLocked ? 'quiz-locked' : ''}`}
                          onClick={() => enrollmentStatus?.enrolled && !isQuizLocked && handleTakeQuiz(module.quiz)}
                        >
                          <div className={`content-icon ${isCompleted ? 'completed' : ''}`}>
                            {!enrollmentStatus?.enrolled ? (
                              <FaLock />
                            ) : isCompleted ? (
                              <FaCheck className="completed" />
                            ) : (
                              <span>Q</span>
                            )}
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
            ))}
          </div>
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
    </div>
  );
};

export default CourseLearningPage;