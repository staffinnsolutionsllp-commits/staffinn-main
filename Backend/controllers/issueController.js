/**
 * Issue Controller
 * Handles issue operations for blocked users requesting help
 */

const issueModel = require('../models/issueModel');
const userModel = require('../models/userModel');

/**
 * Create a new issue (help request from blocked user)
 * @route POST /api/v1/issues/create
 */
const createIssue = async (req, res) => {
  try {
    const { name, email, query } = req.body;
    
    if (!name || !email || !query) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and query are required'
      });
    }
    
    // Get user ID from email
    const user = await userModel.findUserByEmail(email);
    const userId = user ? user.userId : null;
    
    const issueData = {
      userId,
      name,
      email,
      query
    };
    
    const issue = await issueModel.createIssue(issueData);
    
    res.status(201).json({
      success: true,
      message: 'Help request submitted successfully',
      data: issue
    });
    
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit help request'
    });
  }
};

/**
 * Get all issues (for admin)
 * @route GET /api/v1/admin/issues
 */
const getAllIssues = async (req, res) => {
  try {
    const issues = await issueModel.getAllIssues();
    
    // Enrich issues with user profile data
    const enrichedIssues = await Promise.all(
      issues.map(async (issue) => {
        let userProfile = null;
        
        if (issue.userId) {
          try {
            userProfile = await userModel.findUserById(issue.userId);
          } catch (error) {
            console.error('Error getting user profile for issue:', issue.issuesection, error);
          }
        }
        
        return {
          ...issue,
          userProfile
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: enrichedIssues
    });
    
  } catch (error) {
    console.error('Get all issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get issues'
    });
  }
};

/**
 * Resolve issue and unblock user
 * @route PUT /api/v1/admin/issues/:issueId/resolve
 */
const resolveIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    
    // Get the issue
    const issue = await issueModel.getIssueById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    // Find user by email and unblock
    if (issue.email) {
      const user = await userModel.findUserByEmail(issue.email);
      if (user) {
        await userModel.updateUser(user.userId, { 
          isBlocked: false,
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    // Update issue status to resolved
    await issueModel.updateIssueStatus(issueId, 'resolved');
    
    res.status(200).json({
      success: true,
      message: 'Issue resolved and user unblocked successfully'
    });
    
  } catch (error) {
    console.error('Resolve issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve issue'
    });
  }
};

/**
 * Delete issue
 * @route DELETE /api/v1/admin/issues/:issueId
 */
const deleteIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    
    const success = await issueModel.deleteIssue(issueId);
    
    if (success) {
      res.status(200).json({
        success: true,
        message: 'Issue deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
  } catch (error) {
    console.error('Delete issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete issue'
    });
  }
};

module.exports = {
  createIssue,
  getAllIssues,
  resolveIssue,
  deleteIssue
};