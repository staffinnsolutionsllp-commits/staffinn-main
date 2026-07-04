/**
 * Recruiter Campus Invite Model
 * Handles RECRUITER → INSTITUTE campus invite requests (reverse flow)
 * Completely separate from the existing Institute → Recruiter flow
 */

const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const TABLE = process.env.RECRUITER_CAMPUS_INVITES_TABLE || 'recruiter-campus-invites';

/**
 * Create a new recruiter-to-institute campus invite
 */
const createRecruiterInvite = async (recruiterId, instituteId, recruiterData, instituteData, formData = {}) => {
  try {
    const inviteId = uuidv4();
    const timestamp = new Date().toISOString();

    const inviteData = {
      inviteId,
      inviteDirection: 'RECRUITER_TO_INSTITUTE',
      recruiterId,
      instituteId,
      recruiterName: recruiterData.companyName || recruiterData.name || 'Company',
      recruiterEmail: recruiterData.email,
      instituteName: instituteData.instituteName || instituteData.name || 'Institute',
      instituteEmail: instituteData.email,
      status: 'pending', // pending | accepted | declined

      // Recruiter's selected courses from institute
      selectedCourses: formData.selectedCourses || [],

      // Recruiter's preferred date & time
      preferredDate: formData.preferredDate || '',
      preferredTimeSlot: formData.preferredTimeSlot || '',

      // Hiring details
      jobRoles: formData.jobRoles || '',
      numberOfVacancies: formData.numberOfVacancies || '',
      salaryStipend: formData.salaryStipend || '',
      eligibilityCriteria: formData.eligibilityCriteria || '',

      // Selection process
      selectionProcess: formData.selectionProcess || [],

      // Additional requirements
      systemRequirement: formData.systemRequirement || '',
      internetRequirement: formData.internetRequirement || '',
      setupRequirement: formData.setupRequirement || '',
      otherInstructions: formData.otherInstructions || '',

      // Institute response (filled when institute accepts)
      instituteResponse: {
        tpoName: '',
        contactNumber: '',
        officialEmail: '',
        coursesForRecruitment: [],
        totalEligibleStudents: '',
        studentQualificationCriteria: '',
        venueDetails: '',
        availableFacilities: [],
        availableTimeSlots: [],
        driveMode: '',
        respondedAt: null
      },

      createdAt: timestamp,
      updatedAt: timestamp
    };

    await dynamoService.putItem(TABLE, inviteData);
    return { success: true, data: inviteData };
  } catch (error) {
    console.error('Create recruiter invite error:', error);
    throw error;
  }
};

/**
 * Get all invites sent by a recruiter
 */
const getInvitesByRecruiter = async (recruiterId) => {
  try {
    const allInvites = await dynamoService.scanItems(TABLE);
    return allInvites.filter(inv => inv.recruiterId === recruiterId);
  } catch (error) {
    console.error('Get invites by recruiter error:', error);
    throw error;
  }
};

/**
 * Get all invites received by an institute
 */
const getInvitesByInstitute = async (instituteId) => {
  try {
    const allInvites = await dynamoService.scanItems(TABLE);
    return allInvites.filter(inv => inv.instituteId === instituteId);
  } catch (error) {
    console.error('Get invites by institute error:', error);
    throw error;
  }
};

/**
 * Institute accepts/declines the invite
 */
const updateInviteStatus = async (inviteId, status) => {
  try {
    const existing = await dynamoService.getItem(TABLE, { inviteId });
    if (!existing) throw new Error('Invite not found');

    const updated = {
      ...existing,
      status,
      updatedAt: new Date().toISOString()
    };

    await dynamoService.putItem(TABLE, updated);
    return { success: true, data: updated };
  } catch (error) {
    console.error('Update invite status error:', error);
    throw error;
  }
};

/**
 * Institute saves acceptance response with full details
 */
const saveInstituteResponse = async (inviteId, responseData) => {
  try {
    const existing = await dynamoService.getItem(TABLE, { inviteId });
    if (!existing) throw new Error('Invite not found');

    const timestamp = new Date().toISOString();

    const updated = {
      ...existing,
      status: 'accepted',
      instituteResponse: {
        tpoName: responseData.tpoName || '',
        contactNumber: responseData.contactNumber || '',
        officialEmail: responseData.officialEmail || '',
        coursesForRecruitment: responseData.coursesForRecruitment || [],
        totalEligibleStudents: responseData.totalEligibleStudents || '',
        studentQualificationCriteria: responseData.studentQualificationCriteria || '',
        venueDetails: responseData.venueDetails || '',
        availableFacilities: responseData.availableFacilities || [],
        availableTimeSlots: responseData.availableTimeSlots || [],
        driveMode: responseData.driveMode || 'Offline',
        respondedAt: timestamp
      },
      updatedAt: timestamp
    };

    await dynamoService.putItem(TABLE, updated);
    return { success: true, data: updated };
  } catch (error) {
    console.error('Save institute response error:', error);
    throw error;
  }
};

/**
 * Delete an invite
 */
const deleteInvite = async (inviteId) => {
  try {
    await dynamoService.deleteItem(TABLE, { inviteId });
    return { success: true, message: 'Invite deleted successfully' };
  } catch (error) {
    console.error('Delete invite error:', error);
    throw error;
  }
};

module.exports = {
  createRecruiterInvite,
  getInvitesByRecruiter,
  getInvitesByInstitute,
  updateInviteStatus,
  saveInstituteResponse,
  deleteInvite
};
