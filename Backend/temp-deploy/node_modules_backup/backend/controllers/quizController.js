const quizModel = require('../models/quizModel');
const quizProgressModel = require('../models/quizProgressModel');

// Create quiz for a module
const createQuiz = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const quizData = req.body;

    const quiz = await quizModel.createQuiz(moduleId, quizData);

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz'
    });
  }
};

// Get quiz for a module
const getModuleQuiz = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const quiz = await quizModel.getQuizByModule(moduleId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'No quiz found for this module'
      });
    }

    // Remove correct answers from questions for security
    const sanitizedQuiz = {
      ...quiz,
      questions: quiz.questions.map(q => ({
        questionId: q.questionId,
        question: q.question,
        type: q.type,
        options: q.options,
        points: q.points,
        order: q.order
      }))
    };

    res.status(200).json({
      success: true,
      data: sanitizedQuiz
    });
  } catch (error) {
    console.error('Error getting module quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quiz'
    });
  }
};

// Submit quiz
const submitQuiz = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { quizId } = req.params;
    const { answers, courseId, moduleId } = req.body;

    // Check if user has already passed this quiz
    const existingProgress = await quizProgressModel.checkQuizProgress(userId, courseId, quizId);
    if (existingProgress && existingProgress.passed) {
      return res.status(400).json({
        success: false,
        message: 'You have already passed this quiz and cannot attempt it again'
      });
    }

    const submission = await quizModel.submitQuiz(userId, quizId, answers);

    // Use progress controller to update progress
    if (submission.passed) {
      try {
        const progressController = require('./progressController');
        const mockReq = {
          user: { userId },
          params: { courseId, quizId },
          body: {
            quizType: 'module',
            passed: submission.passed,
            score: submission.score,
            maxScore: submission.totalQuestions,
            moduleId
          }
        };
        
        const mockRes = {
          status: () => mockRes,
          json: (data) => console.log('Progress updated:', data)
        };
        
        await progressController.markQuizComplete(mockReq, mockRes);
      } catch (progressError) {
        console.log('Failed to update progress:', progressError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: submission.passed ? 'Quiz passed successfully!' : 'Quiz completed. You can retry to improve your score.',
      data: {
        submissionId: submission.submissionId,
        score: submission.score,
        passed: submission.passed,
        correctAnswers: submission.correctAnswers,
        totalQuestions: submission.totalQuestions,
        detailedResults: submission.detailedResults,
        canRetry: !submission.passed
      }
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz'
    });
  }
};

// Get user quiz results
const getUserQuizResults = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { quizId } = req.params;

    const submissions = await quizModel.getUserQuizSubmissions(userId, quizId);

    res.status(200).json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error getting user quiz results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quiz results'
    });
  }
};

// Get user quiz progress for a course
const getUserQuizProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;

    const progress = await quizProgressModel.getUserCourseQuizProgress(userId, courseId);

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error getting user quiz progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quiz progress'
    });
  }
};

// Submit content quiz (for inline quizzes)
const submitContentQuiz = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { contentId } = req.params;
    const { answers, courseId, moduleId } = req.body;

    // Check if user has already passed this quiz
    const existingProgress = await quizProgressModel.checkQuizProgress(userId, courseId, contentId);
    if (existingProgress && existingProgress.passed) {
      return res.status(400).json({
        success: false,
        message: 'You have already passed this quiz and cannot attempt it again'
      });
    }

    // For content quizzes, we need to get the quiz data from the course content
    const dynamoService = require('../services/dynamoService');
    const course = await dynamoService.getItem('staffinn-courses', { coursesId: courseId });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Find the quiz content
    let quizContent = null;
    for (const module of course.modules || []) {
      const content = module.content?.find(c => c.contentId === contentId && c.contentType === 'quiz');
      if (content) {
        quizContent = content;
        break;
      }
    }

    if (!quizContent || !quizContent.questions) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Calculate score
    let correctAnswers = 0;
    const totalQuestions = quizContent.questions.length;
    const detailedResults = [];

    quizContent.questions.forEach(question => {
      const userAnswer = answers[question.questionId];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        correctAnswers++;
      }
      
      detailedResults.push({
        questionId: question.questionId,
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        options: question.options
      });
    });

    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const passingScore = quizContent.passingScore || 70;
    const passed = score >= passingScore;

    // Use progress controller to update progress
    if (passed) {
      try {
        const progressController = require('./progressController');
        const mockReq = {
          user: { userId },
          params: { courseId, quizId: contentId },
          body: {
            quizType: 'content',
            passed,
            score,
            maxScore: totalQuestions,
            moduleId
          }
        };
        
        const mockRes = {
          status: () => mockRes,
          json: (data) => console.log('Progress updated:', data)
        };
        
        await progressController.markQuizComplete(mockReq, mockRes);
      } catch (progressError) {
        console.log('Failed to update progress:', progressError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: passed ? 'Quiz passed successfully!' : 'Quiz completed. You can retry to improve your score.',
      data: {
        contentId,
        score,
        passed,
        correctAnswers,
        totalQuestions,
        detailedResults,
        canRetry: !passed
      }
    });
  } catch (error) {
    console.error('Error submitting content quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit quiz'
    });
  }
};

module.exports = {
  createQuiz,
  getModuleQuiz,
  submitQuiz,
  submitContentQuiz,
  getUserQuizResults,
  getUserQuizProgress
};