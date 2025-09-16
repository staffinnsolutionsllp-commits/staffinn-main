const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

const { QUIZ_PROGRESS_TABLE } = require('../config/dynamodb-wrapper');

// Check quiz progress status
const checkQuizProgress = async (userId, courseId, quizId) => {
  try {
    const quizprogressId = `${userId}#${courseId}#${quizId}`;
    
    const progress = await dynamoService.getItem(QUIZ_PROGRESS_TABLE, { quizprogressId });
    return progress;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log('Quiz progress table not found, returning null');
      return null;
    }
    console.error('Error checking quiz progress:', error);
    return null;
  }
};

// Save quiz progress
const saveQuizProgress = async (userId, courseId, quizId, moduleId, score, maxScore, passed) => {
  try {
    const quizprogressId = `${userId}#${courseId}#${quizId}`;
    
    // Get existing progress to increment attempt count
    const existing = await checkQuizProgress(userId, courseId, quizId);
    const attemptCount = existing ? existing.attemptCount + 1 : 1;
    
    const progressData = {
      quizprogressId,
      userId,
      courseId,
      quizId,
      moduleId,
      status: passed ? 'completed' : 'failed',
      score,
      maxScore,
      passed,
      completedAt: new Date().toISOString(),
      attemptCount
    };
    
    await dynamoService.putItem(QUIZ_PROGRESS_TABLE, progressData);
    return progressData;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log('Quiz progress table not found, skipping save');
      return {
        quizprogressId: `${userId}#${courseId}#${quizId}`,
        userId,
        courseId,
        quizId,
        moduleId,
        status: passed ? 'completed' : 'failed',
        score,
        maxScore,
        passed,
        completedAt: new Date().toISOString(),
        attemptCount: 1
      };
    }
    console.error('Error saving quiz progress:', error);
    throw error;
  }
};

// Get user's quiz progress for a course
const getUserCourseQuizProgress = async (userId, courseId) => {
  try {
    const params = {
      FilterExpression: 'userId = :userId AND courseId = :courseId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':courseId': courseId
      }
    };
    
    const progressItems = await dynamoService.scanItems(QUIZ_PROGRESS_TABLE, params);
    
    // Convert to map for easy lookup
    const progressMap = {};
    progressItems.forEach(item => {
      progressMap[item.quizId] = item;
    });
    
    return progressMap;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log('Quiz progress table not found, returning empty progress');
      return {};
    }
    console.error('Error getting user course quiz progress:', error);
    return {};
  }
};

module.exports = {
  checkQuizProgress,
  saveQuizProgress,
  getUserCourseQuizProgress
};