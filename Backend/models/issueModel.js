/**
 * Issue Model
 * Handles issue operations for blocked users requesting help
 */

const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

// Get table name from environment variables
const ISSUES_TABLE = process.env.DYNAMODB_ISSUES_TABLE || 'staffinn-issue-section';

/**
 * Create a new issue
 * @param {object} issueData - Issue data
 * @returns {Promise<object>} - Created issue object
 */
const createIssue = async (issueData) => {
  try {
    const issueId = uuidv4();
    
    const issue = {
      issuesection: issueId, // Partition key
      userId: issueData.userId,
      name: issueData.name,
      email: issueData.email,
      query: issueData.query,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.putItem(ISSUES_TABLE, issue);
    return issue;
  } catch (error) {
    console.error('Error creating issue:', error);
    throw error;
  }
};

/**
 * Get all issues
 * @returns {Promise<Array>} - Array of issues
 */
const getAllIssues = async () => {
  try {
    const issues = await dynamoService.scanItems(ISSUES_TABLE);
    return issues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error getting all issues:', error);
    return [];
  }
};

/**
 * Get issue by ID
 * @param {string} issueId - Issue ID
 * @returns {Promise<object|null>} - Issue object or null
 */
const getIssueById = async (issueId) => {
  try {
    const issue = await dynamoService.getItem(ISSUES_TABLE, { issuesection: issueId });
    return issue;
  } catch (error) {
    console.error('Error getting issue by ID:', error);
    return null;
  }
};

/**
 * Update issue status
 * @param {string} issueId - Issue ID
 * @param {string} status - New status
 * @returns {Promise<object|null>} - Updated issue or null
 */
const updateIssueStatus = async (issueId, status) => {
  try {
    const issue = await getIssueById(issueId);
    if (!issue) {
      return null;
    }
    
    const updatedIssue = {
      ...issue,
      status,
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.putItem(ISSUES_TABLE, updatedIssue);
    return updatedIssue;
  } catch (error) {
    console.error('Error updating issue status:', error);
    throw error;
  }
};

/**
 * Delete issue
 * @param {string} issueId - Issue ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteIssue = async (issueId) => {
  try {
    await dynamoService.deleteItem(ISSUES_TABLE, { issuesection: issueId });
    return true;
  } catch (error) {
    console.error('Error deleting issue:', error);
    return false;
  }
};

module.exports = {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssueStatus,
  deleteIssue
};