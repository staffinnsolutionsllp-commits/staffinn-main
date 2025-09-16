import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { debugVideoContent, logVideoError } from '../../utils/videoUtils';
import { calculateCourseProgress } from '../../utils/progressUtils';

import './StaffCourses.css';

const StaffCourses = () => {
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    loadEnrolledCourses();
  }, []);

  const loadEnrolledCourses = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading enrolled courses...');
      const response = await apiService.getUserEnrollments();
      console.log('📚 Enrolled courses response:', response);
      console.log('📚 Response success:', response?.success);
      console.log('📚 Response data length:', response?.data?.length);
      
      if (response.success && response.data) {
        // Process the enrollment data to ensure proper structure
        const processedCourses = response.data.map(enrollment => {
          // Handle both old and new course data structures
          const course = enrollment.course || {};
          return {
            ...enrollment,
            courseId: enrollment.courseId || course.coursesId || course.instituteCourseID,
            course: {
              ...course,
              courseName: course.courseName || course.name,
              duration: course.duration || 'Not specified',
              instructor: course.instructor || 'Not specified',
              thumbnailUrl: course.thumbnailUrl || course.thumbnail
            },
            progressPercentage: enrollment.progressPercentage || 0
          };
        });
        
        // Calculate real-time progress for each course
        const coursesWithProgress = await Promise.all(
          processedCourses.map(async (enrollment) => {
            try {
              const [courseContent, userProgress] = await Promise.all([
                apiService.getCourseContent(enrollment.courseId),
                apiService.getUserProgress(enrollment.courseId)
              ]);
              
              if (courseContent.success && userProgress.success) {
                const realTimeProgress = calculateCourseProgress(courseContent.data, userProgress.data);
                
                return {
                  ...enrollment,
                  progressPercentage: realTimeProgress
                };
              }
            } catch (error) {
              console.error('Error calculating progress for course:', enrollment.courseId, error);
            }
            return enrollment;
          })
        );
        setEnrolledCourses(coursesWithProgress);
      } else {
        console.error('Failed to load enrolled courses:', response.message);
        // If no enrollments found, show appropriate message
        if (response.message && response.message.includes('not found')) {
          console.log('No enrollments found for user');
        }
        setEnrolledCourses([]);
      }
    } catch (error) {
      console.error('Error loading enrolled courses:', error);
      // Check if it's a network error
      if (error.message.includes('fetch')) {
        console.error('Network error - check if backend is running');
      }
      setEnrolledCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccessCourse = async (courseId) => {
    try {
      console.log('🎯 Navigating to course:', courseId);
      console.log('🎯 Course ID type:', typeof courseId);
      console.log('🎯 Course ID value:', courseId);
      
      if (!courseId) {
        console.error('❌ Course ID is undefined or null');
        alert('Course ID is missing. Please try again.');
        return;
      }
      
      // Navigate directly to the CourseLearningPage
      navigate(`/course/${courseId}`);
    } catch (error) {
      console.error('Error navigating to course:', error);
      alert('Failed to navigate to course. Please try again.');
    }
  };

  const handleTakeQuiz = async (moduleId) => {
    try {
      const quizResponse = await apiService.getModuleQuiz(moduleId);
      if (quizResponse.success && quizResponse.data) {
        setSelectedQuiz(quizResponse.data);
        setQuizAnswers({});
        setQuizResults(null);
        setShowQuizModal(true);
      } else {
        alert('No quiz available for this module');
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      alert('Failed to load quiz');
    }
  };

  const handleQuizSubmit = async () => {
    try {
      const response = await apiService.submitQuiz(selectedQuiz.quizId, quizAnswers);
      if (response.success) {
        setQuizResults(response.data);
        alert(`Quiz completed! Score: ${response.data.score}% (${response.data.correctAnswers}/${response.data.totalQuestions})`);
        // Refresh courses to update progress
        loadEnrolledCourses();
      } else {
        alert(response.message || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz');
    }
  };

  const markContentComplete = async (contentId) => {
    try {
      const response = await apiService.updateProgress(contentId, {
        progressPercentage: 100,
        completed: true
      });
      if (response.success) {
        // Refresh courses to update progress
        loadEnrolledCourses();
      }
    } catch (error) {
      console.error('Error marking content complete:', error);
    }
  };

  if (loading) {
    return (
      <div className="staff-courses-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-courses-container">
      <div className="page-header">
        <h1 className="page-title">My Enrolled Courses</h1>
        <p className="page-subtitle">Access your enrolled courses and track your progress</p>
      </div>
      


      {enrolledCourses.length === 0 ? (
        <div className="no-courses">
          <h3>No Enrolled Courses</h3>
          <p>You haven't enrolled in any courses yet. Visit institute pages to explore available courses.</p>
          <div className="debug-info" style={{marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px', fontSize: '12px'}}>
            <p><strong>Debug Info:</strong></p>
            <p>Check browser console for detailed logs</p>
            <p>Make sure you're logged in as a staff member</p>
            <p>Ensure backend server is running on port 4001</p>
          </div>
        </div>
      ) : (
        <div className="courses-grid">
          {enrolledCourses.map((enrollment) => (
            <div key={enrollment.courseId} className="course-card">
              {enrollment.course?.thumbnailUrl && (
                <div className="course-thumbnail">
                  <img src={enrollment.course.thumbnailUrl} alt={enrollment.course.name} />
                </div>
              )}
              <div className="course-content">
                <h3 className="course-title">{enrollment.course?.courseName || enrollment.course?.name || 'Course Name'}</h3>
                <div className="course-details">
                  <p><strong>Duration:</strong> {enrollment.course?.duration || 'Not specified'}</p>
                  <p><strong>Instructor:</strong> {enrollment.course?.instructor || 'Not specified'}</p>
                  <p><strong>Progress:</strong> {enrollment.progressPercentage || 0}%</p>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${enrollment.progressPercentage || 0}%` }}
                  ></div>
                </div>
                <div className="course-actions">
                  <button 
                    className="access-course-btn"
                    onClick={() => handleAccessCourse(enrollment.courseId)}
                  >
                    Continue Learning
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}



      {/* Quiz Modal */}
      {showQuizModal && selectedQuiz && (
        <div className="modal-overlay" onClick={() => setShowQuizModal(false)}>
          <div className="quiz-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quiz-modal-header">
              <h2>{selectedQuiz.title}</h2>
              <button className="modal-close" onClick={() => setShowQuizModal(false)}>×</button>
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
                      disabled={Object.keys(quizAnswers).length !== selectedQuiz.questions?.length}
                    >
                      Submit Quiz
                    </button>
                  </div>
                </>
              ) : (
                <div className="quiz-results">
                  <h3>Quiz Results</h3>
                  <div className="results-summary">
                    <div className="score-display">
                      <span className="score">{quizResults.score}%</span>
                      <span className="status">{quizResults.passed ? 'PASSED' : 'FAILED'}</span>
                    </div>
                    <p>You answered {quizResults.correctAnswers} out of {quizResults.totalQuestions} questions correctly.</p>
                  </div>
                  
                  <div className="detailed-results">
                    <h4>Question Review</h4>
                    {quizResults.detailedResults?.map((result, index) => (
                      <div key={index} className={`result-item ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                        <p><strong>Q{index + 1}:</strong> {result.question}</p>
                        <p><strong>Your Answer:</strong> {result.userAnswer}</p>
                        <p><strong>Correct Answer:</strong> {result.correctAnswer}</p>
                        <span className="result-status">{result.isCorrect ? '✓' : '✗'}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    className="close-results-btn"
                    onClick={() => {
                      setShowQuizModal(false);
                      setQuizResults(null);
                    }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className="modal-overlay" onClick={() => setShowVideoModal(false)}>
          <div className="video-modal" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <h3>{selectedVideo.title}</h3>
              <button className="modal-close" onClick={() => setShowVideoModal(false)}>×</button>
            </div>
            <div className="video-container">
              {selectedVideo.fileUrl ? (
                <video 
                  controls 
                  width="100%" 
                  height="400px"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error('Video error:', e);
                  }}
                  onLoadStart={() => console.log('Video loading started:', selectedVideo.fileUrl)}
                  onEnded={() => {
                    if (!selectedVideo.progress?.completedAt) {
                      markContentComplete(selectedVideo.contentId);
                    }
                  }}
                >
                  <source src={selectedVideo.fileUrl} type="video/mp4" />
                  <source src={selectedVideo.fileUrl} type="video/webm" />
                  <source src={selectedVideo.fileUrl} type="video/ogg" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="video-error">
                  <h4>Video Not Available</h4>
                  <p>Video URL: {selectedVideo.fileUrl || 'No URL found'}</p>
                  <p>Content ID: {selectedVideo.contentId}</p>
                  <p>Content Type: {selectedVideo.type}</p>
                </div>
              )}
            </div>
            <div className="video-actions">
              <button 
                className="mark-complete-btn"
                onClick={() => {
                  markContentComplete(selectedVideo.contentId);
                  setShowVideoModal(false);
                }}
              >
                Mark as Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && selectedAssignment && (
        <div className="modal-overlay" onClick={() => setShowAssignmentModal(false)}>
          <div className="assignment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="assignment-modal-header">
              <h3>{selectedAssignment.title}</h3>
              <button className="modal-close" onClick={() => setShowAssignmentModal(false)}>×</button>
            </div>
            <div className="assignment-content">
              <p>{selectedAssignment.description}</p>
              {selectedAssignment.fileUrl && (
                <div className="assignment-file">
                  <a 
                    href={selectedAssignment.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="assignment-download"
                  >
                    📄 Download Assignment PDF
                  </a>
                </div>
              )}
              <div className="assignment-submission">
                <h4>Submit Your Work</h4>
                <textarea 
                  placeholder="Write your answer or paste your solution here..."
                  rows="6"
                  className="submission-text"
                ></textarea>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.txt"
                  className="submission-file"
                />
                <button className="submit-assignment-btn">
                  Submit Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffCourses;