const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');
const s3Service = require('../services/s3Service');

const ASSIGNMENT_SUBMISSIONS_TABLE = 'AssignmentSubmissions';

const submitAssignment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { assignmentId } = req.params;
    const { textSubmission } = req.body;
    const file = req.file;

    const submissionId = uuidv4();
    const timestamp = new Date().toISOString();

    let fileUrl = null;
    if (file) {
      const ext = file.originalname.split('.').pop();
      const s3Key = `user-submissions/${userId}/${assignmentId}/${submissionId}.${ext}`;
      const uploadResult = await s3Service.uploadFile(file, s3Key);
      fileUrl = uploadResult.Location || uploadResult;
    }

    const submission = {
      submissionId,
      assignmentId,
      userId,
      textSubmission: textSubmission || '',
      fileUrl,
      submittedAt: timestamp,
      status: 'submitted'
    };

    await dynamoService.putItem(ASSIGNMENT_SUBMISSIONS_TABLE, submission);

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit assignment'
    });
  }
};

const getUserSubmissions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { assignmentId } = req.params;

    const params = {
      FilterExpression: 'userId = :userId AND assignmentId = :assignmentId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':assignmentId': assignmentId
      }
    };

    const submissions = await dynamoService.scanItems(ASSIGNMENT_SUBMISSIONS_TABLE, params);

    res.status(200).json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Error getting user submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get submissions'
    });
  }
};

module.exports = {
  submitAssignment,
  getUserSubmissions
};