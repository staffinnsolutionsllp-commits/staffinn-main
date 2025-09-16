const dynamoService = require('../services/dynamoService');
const quizProgressModel = require('../models/quizProgressModel');

const COURSE_ENROLLMENTS_TABLE = 'course-enrolled-user';
const COURSES_TABLE = 'staffinn-courses';

// Mark content as complete
const markContentComplete = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId, contentId } = req.params;
    const { contentType } = req.body;

    // Get enrollment record
    const params = {
      FilterExpression: 'userId = :userId AND courseId = :courseId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':courseId': courseId
      }
    };

    const enrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, params);
    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    const enrollment = enrollments[0];
    
    // Initialize progress data if not exists
    if (!enrollment.progressData) {
      enrollment.progressData = { completedContent: {}, completedQuizzes: {} };
    }

    // Mark content as complete
    enrollment.progressData.completedContent[contentId] = {
      completedAt: new Date().toISOString(),
      contentType
    };

    // Calculate new progress percentage
    const progressPercentage = await calculateProgressPercentage(courseId, enrollment.progressData);
    enrollment.progressPercentage = progressPercentage;

    // Update enrollment record
    await dynamoService.putItem(COURSE_ENROLLMENTS_TABLE, enrollment);

    res.status(200).json({
      success: true,
      message: 'Content marked as complete',
      data: {
        contentId,
        progressPercentage,
        completedAt: enrollment.progressData.completedContent[contentId].completedAt
      }
    });
  } catch (error) {
    console.error('Error marking content complete:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark content as complete'
    });
  }
};

// Mark quiz as complete
const markQuizComplete = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId, quizId } = req.params;
    const { quizType, passed, score, maxScore, moduleId } = req.body;

    // Save to quiz progress table
    await quizProgressModel.saveQuizProgress(userId, courseId, quizId, moduleId, score || 0, maxScore || 1, passed);

    // Get enrollment record
    const params = {
      FilterExpression: 'userId = :userId AND courseId = :courseId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':courseId': courseId
      }
    };

    const enrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, params);
    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    const enrollment = enrollments[0];
    
    // Initialize progress data if not exists
    if (!enrollment.progressData) {
      enrollment.progressData = { completedContent: {}, completedQuizzes: {} };
    }

    // Mark quiz as complete only if passed
    if (passed) {
      enrollment.progressData.completedQuizzes[quizId] = {
        passed: true,
        completedAt: new Date().toISOString(),
        quizType,
        score
      };

      // Calculate new progress percentage
      const progressPercentage = await calculateProgressPercentage(courseId, enrollment.progressData);
      enrollment.progressPercentage = progressPercentage;

      // Update enrollment record
      await dynamoService.putItem(COURSE_ENROLLMENTS_TABLE, enrollment);
    }

    res.status(200).json({
      success: true,
      message: passed ? 'Quiz completed successfully' : 'Quiz attempted but not passed',
      data: {
        quizId,
        passed,
        progressPercentage: enrollment.progressPercentage,
        completedAt: passed ? enrollment.progressData.completedQuizzes[quizId].completedAt : null
      }
    });
  } catch (error) {
    console.error('Error marking quiz complete:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark quiz as complete'
    });
  }
};

// Get user progress for a course
const getUserProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;

    // Get enrollment record
    const params = {
      FilterExpression: 'userId = :userId AND courseId = :courseId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':courseId': courseId
      }
    };

    const enrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, params);
    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    const enrollment = enrollments[0];
    const progressData = enrollment.progressData || { completedContent: {}, completedQuizzes: {} };

    res.status(200).json({
      success: true,
      data: {
        completedContent: progressData.completedContent || {},
        completedQuizzes: progressData.completedQuizzes || {},
        progressPercentage: enrollment.progressPercentage || 0
      }
    });
  } catch (error) {
    console.error('Error getting user progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user progress'
    });
  }
};

// Calculate progress percentage
const calculateProgressPercentage = async (courseId, progressData) => {
  try {
    // Get course data
    const course = await dynamoService.getItem(COURSES_TABLE, { coursesId: courseId });
    if (!course || !course.modules) return 0;

    let totalItems = 0;
    let completedItems = 0;

    course.modules.forEach(module => {
      // Count content items
      if (module.content) {
        totalItems += module.content.length;
        module.content.forEach(content => {
          if (content.contentType === 'quiz') {
            if (progressData.completedQuizzes && progressData.completedQuizzes[content.contentId] && progressData.completedQuizzes[content.contentId].passed) {
              completedItems++;
            }
          } else {
            if (progressData.completedContent && progressData.completedContent[content.contentId]) {
              completedItems++;
            }
          }
        });
      }

      // Count module quiz
      if (module.quiz) {
        totalItems += 1;
        if (progressData.completedQuizzes && progressData.completedQuizzes[module.quiz.quizId] && progressData.completedQuizzes[module.quiz.quizId].passed) {
          completedItems++;
        }
      }
    });

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  } catch (error) {
    console.error('Error calculating progress:', error);
    return 0;
  }
};

module.exports = {
  markContentComplete,
  markQuizComplete,
  getUserProgress
};