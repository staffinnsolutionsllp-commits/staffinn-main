const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

const QUIZ_TABLE = 'CourseQuizzes';
const QUIZ_QUESTIONS_TABLE = 'QuizQuestions';
const QUIZ_SUBMISSIONS_TABLE = 'QuizSubmissions';

// Create quiz for a module
const createQuiz = async (moduleId, quizData) => {
  try {
    const quizId = uuidv4();
    const timestamp = new Date().toISOString();

    // Validate quiz data
    if (!quizData.title || !quizData.title.trim()) {
      throw new Error('Quiz title is required');
    }

    if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      throw new Error('At least one question is required');
    }

    // Validate each question
    for (let i = 0; i < quizData.questions.length; i++) {
      const question = quizData.questions[i];
      
      if (!question.question || !question.question.trim()) {
        throw new Error(`Question ${i + 1}: Question text is required`);
      }
      
      if (!question.options || !Array.isArray(question.options) || question.options.length !== 4) {
        throw new Error(`Question ${i + 1}: Exactly 4 options are required`);
      }
      
      // Check if all options are filled
      const emptyOptions = question.options.filter(opt => !opt || !opt.trim()).length;
      if (emptyOptions > 0) {
        throw new Error(`Question ${i + 1}: All 4 options must be filled`);
      }
      
      if (!question.correctAnswer || !question.correctAnswer.trim()) {
        throw new Error(`Question ${i + 1}: Correct answer must be selected`);
      }
      
      if (!question.options.includes(question.correctAnswer)) {
        throw new Error(`Question ${i + 1}: Correct answer must match one of the options`);
      }
    }

    const quiz = {
      quizId,
      moduleId,
      title: quizData.title.trim(),
      description: quizData.description ? quizData.description.trim() : '',
      passingScore: Math.max(0, Math.min(100, parseInt(quizData.passingScore) || 70)),
      timeLimit: Math.max(1, parseInt(quizData.timeLimit) || 30), // minutes
      maxAttempts: Math.max(1, parseInt(quizData.maxAttempts) || 3),
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await dynamoService.putItem(QUIZ_TABLE, quiz);

    // Add questions with validation
    for (let i = 0; i < quizData.questions.length; i++) {
      const questionData = quizData.questions[i];
      await createQuizQuestion(quizId, questionData, i + 1);
    }

    return quiz;
  } catch (error) {
    console.error('Error creating quiz:', error);
    throw error;
  }
};

// Create quiz question
const createQuizQuestion = async (quizId, questionData, order) => {
  try {
    const questionId = uuidv4();
    const timestamp = new Date().toISOString();

    // Clean and validate question data
    const cleanedOptions = questionData.options.map(opt => opt.trim());
    const cleanedCorrectAnswer = questionData.correctAnswer.trim();

    const question = {
      questionId,
      quizId,
      question: questionData.question.trim(),
      type: questionData.type || 'multiple_choice',
      options: cleanedOptions,
      correctAnswer: cleanedCorrectAnswer,
      points: Math.max(1, parseInt(questionData.points) || 1),
      order: order,
      createdAt: timestamp
    };

    await dynamoService.putItem(QUIZ_QUESTIONS_TABLE, question);
    return question;
  } catch (error) {
    console.error('Error creating quiz question:', error);
    throw error;
  }
};

// Get quiz by module
const getQuizByModule = async (moduleId) => {
  try {
    const params = {
      FilterExpression: 'moduleId = :moduleId AND isActive = :isActive',
      ExpressionAttributeValues: {
        ':moduleId': moduleId,
        ':isActive': true
      }
    };

    const quizzes = await dynamoService.scanItems(QUIZ_TABLE, params);
    
    if (quizzes.length > 0) {
      const quiz = quizzes[0];
      const questions = await getQuizQuestions(quiz.quizId);
      return { ...quiz, questions };
    }

    return null;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log('Quiz table not found, returning null');
      return null;
    }
    console.error('Error getting quiz by module:', error);
    return null;
  }
};

// Get quiz questions
const getQuizQuestions = async (quizId) => {
  try {
    const params = {
      FilterExpression: 'quizId = :quizId',
      ExpressionAttributeValues: {
        ':quizId': quizId
      }
    };

    const questions = await dynamoService.scanItems(QUIZ_QUESTIONS_TABLE, params);
    return questions.sort((a, b) => a.order - b.order);
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      console.log('Quiz questions table not found, returning empty array');
      return [];
    }
    console.error('Error getting quiz questions:', error);
    return [];
  }
};

// Submit quiz
const submitQuiz = async (userId, quizId, answers) => {
  try {
    const submissionId = uuidv4();
    const timestamp = new Date().toISOString();

    // Get quiz and questions
    const quiz = await dynamoService.getItem(QUIZ_TABLE, { quizId });
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const questions = await getQuizQuestions(quizId);
    if (questions.length === 0) {
      throw new Error('No questions found for this quiz');
    }

    // Check if user has exceeded max attempts
    const previousSubmissions = await getUserQuizSubmissions(userId, quizId);
    if (previousSubmissions.length >= quiz.maxAttempts) {
      throw new Error(`Maximum attempts (${quiz.maxAttempts}) exceeded`);
    }

    // Validate answers
    if (!answers || typeof answers !== 'object') {
      throw new Error('Invalid answers format');
    }

    // Calculate score
    let correctAnswers = 0;
    let totalQuestions = questions.length;
    let totalPoints = 0;
    let earnedPoints = 0;
    let detailedResults = [];

    questions.forEach(question => {
      const userAnswer = answers[question.questionId];
      const isCorrect = userAnswer && userAnswer.trim() === question.correctAnswer.trim();
      
      totalPoints += question.points;
      
      if (isCorrect) {
        correctAnswers++;
        earnedPoints += question.points;
      }

      detailedResults.push({
        questionId: question.questionId,
        question: question.question,
        userAnswer: userAnswer || '',
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0,
        maxPoints: question.points
      });
    });

    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const pointsPercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passingScore;

    const submission = {
      submissionId,
      userId,
      quizId,
      answers,
      score,
      pointsPercentage,
      correctAnswers,
      totalQuestions,
      earnedPoints,
      totalPoints,
      passed,
      detailedResults,
      submittedAt: timestamp,
      attemptNumber: previousSubmissions.length + 1
    };

    await dynamoService.putItem(QUIZ_SUBMISSIONS_TABLE, submission);
    return submission;
  } catch (error) {
    console.error('Error submitting quiz:', error);
    throw error;
  }
};

// Get user quiz submissions
const getUserQuizSubmissions = async (userId, quizId) => {
  try {
    const params = {
      FilterExpression: 'userId = :userId AND quizId = :quizId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':quizId': quizId
      }
    };

    const submissions = await dynamoService.scanItems(QUIZ_SUBMISSIONS_TABLE, params);
    return submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  } catch (error) {
    console.error('Error getting user quiz submissions:', error);
    return [];
  }
};

// Get quiz by ID
const getQuizById = async (quizId) => {
  try {
    const quiz = await dynamoService.getItem(QUIZ_TABLE, { quizId });
    if (!quiz) {
      return null;
    }

    const questions = await getQuizQuestions(quizId);
    return { ...quiz, questions };
  } catch (error) {
    console.error('Error getting quiz by ID:', error);
    return null;
  }
};

// Update quiz
const updateQuiz = async (quizId, updateData) => {
  try {
    const timestamp = new Date().toISOString();
    
    const updatedQuiz = {
      ...updateData,
      updatedAt: timestamp
    };

    await dynamoService.updateItem(QUIZ_TABLE, { quizId }, updatedQuiz);
    return updatedQuiz;
  } catch (error) {
    console.error('Error updating quiz:', error);
    throw error;
  }
};

// Delete quiz
const deleteQuiz = async (quizId) => {
  try {
    // Delete all questions first
    const questions = await getQuizQuestions(quizId);
    for (const question of questions) {
      await dynamoService.deleteItem(QUIZ_QUESTIONS_TABLE, { questionId: question.questionId });
    }

    // Delete quiz
    await dynamoService.deleteItem(QUIZ_TABLE, { quizId });
    return true;
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
};

module.exports = {
  createQuiz,
  createQuizQuestion,
  getQuizByModule,
  getQuizById,
  getQuizQuestions,
  submitQuiz,
  getUserQuizSubmissions,
  updateQuiz,
  deleteQuiz
};