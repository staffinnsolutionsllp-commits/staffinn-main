/**
 * Recruiter Campus Invite Routes
 * Handles routes for RECRUITER → INSTITUTE campus invite flow
 */

const express = require('express');
const router = express.Router();
const recruiterInviteController = require('../controllers/recruiterCampusInviteController');
const { authenticate } = require('../middleware/auth');

// Recruiter sends invite to institute
router.post('/send', authenticate, recruiterInviteController.sendRecruiterInvite);

// Recruiter gets all invites they sent
router.get('/sent', authenticate, recruiterInviteController.getRecruiterSentInvites);

// Institute gets all invites received from recruiters
router.get('/received', authenticate, recruiterInviteController.getInstituteReceivedInvites);

// Institute updates invite status (accept/decline)
router.put('/:inviteId/status', authenticate, recruiterInviteController.updateInviteStatus);

// Institute saves full acceptance response
router.put('/:inviteId/respond', authenticate, recruiterInviteController.respondToRecruiterInvite);

// Get institute's On-Campus courses (for recruiter to view)
router.get('/institute-courses/:instituteId', authenticate, recruiterInviteController.getInstituteCourses);

// Get institute's placement planner dates (for recruiter to view)
router.get('/institute-planner/:instituteId', authenticate, recruiterInviteController.getInstitutePlanner);

// Delete an invite
router.delete('/:inviteId', authenticate, recruiterInviteController.deleteInvite);

module.exports = router;


// Check if recruiter already sent invite to this institute
router.get('/check/:instituteId', authenticate, async (req, res) => {
  try {
    const { instituteId } = req.params;
    const recruiterId = req.user.userId;

    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const recruiterInviteModel = require('../models/recruiterCampusInviteModel');
    const allInvites = await recruiterInviteModel.getInvitesByRecruiter(recruiterId);
    const existing = allInvites.find(inv => inv.instituteId === instituteId && inv.status !== 'declined');

    res.status(200).json({ 
      success: true, 
      exists: !!existing,
      invite: existing || null
    });
  } catch (error) {
    console.error('Check invite exists error:', error);
    res.status(500).json({ success: false, message: 'Failed to check invite', exists: false });
  }
});
