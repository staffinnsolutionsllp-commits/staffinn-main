/**
 * Campus Request Model
 * Handles campus invite requests between institutes and recruiters
 * Enhanced with full enterprise-grade placement drive schema
 */

const dynamoService = require('../services/dynamoService');
const { v4: uuidv4 } = require('uuid');

const CAMPUS_REQUESTS_TABLE = process.env.CAMPUS_REQUESTS_TABLE || 'campus-requests';

/**
 * Create a new campus request (full enterprise form data)
 */
const createCampusRequest = async (instituteId, recruiterId, instituteData, recruiterData, formData = {}, selectedDates = []) => {
  try {
    const requestId = uuidv4();
    const timestamp = new Date().toISOString();

    const requestData = {
      campusreq: requestId,
      instituteId,
      recruiterId,
      instituteName: instituteData.instituteName || instituteData.name || 'Institute',
      instituteEmail: instituteData.email,
      recruiterName: recruiterData.companyName || 'Company',
      recruiterEmail: recruiterData.email,
      status: 'pending',                    // pending | accepted | tentative | declined | confirmed
      // Selected campus drive dates from planner
      selectedDates,

      // ── Phase 1: Institute Invite Form ──────────────────────────────────
      // TPO / Placement Coordinator
      tpoName: formData.tpoName || '',
      contactNumber: formData.contactNumber || '',
      officialEmail: formData.officialEmail || '',

      // Courses available for recruitment (On-Campus courses only)
      coursesForRecruitment: formData.coursesForRecruitment || [],   // array of { id, name }

      // Student details
      totalEligibleStudents: formData.totalEligibleStudents || '',
      studentQualificationCriteria: formData.studentQualificationCriteria || '',

      // Venue & Infrastructure
      venueDetails: formData.venueDetails || '',
      availableFacilities: formData.availableFacilities || [],       // array of strings

      // Time slots
      availableTimeSlots: formData.availableTimeSlots || [],         // array of strings

      // Drive mode
      driveMode: formData.driveMode || 'Offline',                    // Offline | Virtual | Hybrid

      // ── Phase 3: Recruiter Confirmation Details ──────────────────────────
      recruiterResponse: {
        participationStatus: '',                                      // Accept | Tentative | Decline
        preferredDate: '',
        preferredTimeSlot: '',
        hiringDetails: {
          jobRoles: '',
          numberOfVacancies: '',
          salaryStipend: '',
          eligibilityCriteria: ''
        },
        selectionProcess: [],                                         // array of strings
        systemRequirement: '',
        internetRequirement: '',
        setupRequirement: '',
        otherInstructions: '',
        isDraft: false,
        confirmedAt: null,
        respondedAt: null
      },

      // Legacy fields kept for backward compatibility
      batchName: formData.batchName || '',
      courseName: formData.courseName || '',
      numberOfStudents: formData.totalEligibleStudents || formData.numberOfStudents || '',
      department: formData.department || '',
      passingYear: formData.passingYear || '',
      placementType: formData.placementType || '',
      preferredRoles: formData.preferredRoles || '',
      additionalNotes: formData.additionalNotes || '',
      campusDriveMode: formData.driveMode || formData.campusDriveMode || 'Offline',
      campusLocation: formData.venueDetails || formData.campusLocation || '',
      contactPerson: formData.tpoName || formData.contactPerson || '',
      contactPhone: formData.contactNumber || formData.contactPhone || '',

      createdAt: timestamp,
      updatedAt: timestamp
    };

    await dynamoService.putItem(CAMPUS_REQUESTS_TABLE, requestData);

    return { success: true, data: requestData };
  } catch (error) {
    console.error('Create campus request error:', error);
    throw error;
  }
};

/**
 * Check if request already exists
 */
const checkExistingRequest = async (instituteId, recruiterId) => {
  try {
    const allRequests = await dynamoService.scanItems(CAMPUS_REQUESTS_TABLE);
    const existingRequest = allRequests.find(
      req => req.instituteId === instituteId && req.recruiterId === recruiterId
    );
    return existingRequest || null;
  } catch (error) {
    console.error('Check existing request error:', error);
    throw error;
  }
};

/**
 * Get all requests sent by an institute
 */
const getRequestsByInstitute = async (instituteId) => {
  try {
    const allRequests = await dynamoService.scanItems(CAMPUS_REQUESTS_TABLE);
    return allRequests.filter(req => req.instituteId === instituteId);
  } catch (error) {
    console.error('Get requests by institute error:', error);
    throw error;
  }
};

/**
 * Get all requests received by a recruiter
 */
const getRequestsByRecruiter = async (recruiterId) => {
  try {
    const allRequests = await dynamoService.scanItems(CAMPUS_REQUESTS_TABLE);
    return allRequests.filter(req => req.recruiterId === recruiterId);
  } catch (error) {
    console.error('Get requests by recruiter error:', error);
    throw error;
  }
};

/**
 * Update request status (simple accept/reject — legacy)
 */
const updateRequestStatus = async (requestId, status) => {
  try {
    const existingRequest = await dynamoService.getItem(CAMPUS_REQUESTS_TABLE, { campusreq: requestId });
    if (!existingRequest) throw new Error('Request not found');

    const updatedRequest = {
      ...existingRequest,
      status,
      updatedAt: new Date().toISOString()
    };

    await dynamoService.putItem(CAMPUS_REQUESTS_TABLE, updatedRequest);
    return { success: true, data: updatedRequest };
  } catch (error) {
    console.error('Update request status error:', error);
    throw error;
  }
};

/**
 * Save recruiter response (participation status + confirmation details)
 * Supports draft saving and final confirmation
 */
const saveRecruiterResponse = async (requestId, responseData, isDraft = false) => {
  try {
    const existingRequest = await dynamoService.getItem(CAMPUS_REQUESTS_TABLE, { campusreq: requestId });
    if (!existingRequest) throw new Error('Request not found');

    const timestamp = new Date().toISOString();

    // Determine top-level status
    let topStatus = existingRequest.status;
    if (!isDraft) {
      if (responseData.participationStatus === 'Accept') topStatus = 'confirmed';
      else if (responseData.participationStatus === 'Tentative') topStatus = 'tentative';
      else if (responseData.participationStatus === 'Decline') topStatus = 'declined';
    } else {
      topStatus = 'pending'; // keep pending while draft
    }

    const updatedRequest = {
      ...existingRequest,
      status: topStatus,
      recruiterResponse: {
        participationStatus: responseData.participationStatus || '',
        preferredDate: responseData.preferredDate || '',
        preferredTimeSlot: responseData.preferredTimeSlot || '',
        hiringDetails: {
          jobRoles: responseData.hiringDetails?.jobRoles || '',
          numberOfVacancies: responseData.hiringDetails?.numberOfVacancies || '',
          salaryStipend: responseData.hiringDetails?.salaryStipend || '',
          eligibilityCriteria: responseData.hiringDetails?.eligibilityCriteria || ''
        },
        selectionProcess: responseData.selectionProcess || [],
        systemRequirement: responseData.systemRequirement || '',
        internetRequirement: responseData.internetRequirement || '',
        setupRequirement: responseData.setupRequirement || '',
        otherInstructions: responseData.otherInstructions || '',
        isDraft,
        confirmedAt: !isDraft && responseData.participationStatus === 'Accept' ? timestamp : (existingRequest.recruiterResponse?.confirmedAt || null),
        respondedAt: timestamp
      },
      updatedAt: timestamp
    };

    await dynamoService.putItem(CAMPUS_REQUESTS_TABLE, updatedRequest);

    // ── Slot booking management ──────────────────────────────────
    // Only manage bookings for final (non-draft) responses with a date+slot
    if (!isDraft && responseData.preferredDate && responseData.preferredTimeSlot) {
      const slotBookingModel = require('./campusSlotBookingModel');
      const bookingStatus =
        responseData.participationStatus === 'Accept'    ? 'Confirmed'  :
        responseData.participationStatus === 'Tentative' ? 'Tentative'  :
        'Cancelled';

      await slotBookingModel.upsertBooking({
        campusreqId:   requestId,
        instituteId:   existingRequest.instituteId,
        recruiterId:   existingRequest.recruiterId,
        driveDate:     responseData.preferredDate,
        timeSlot:      responseData.preferredTimeSlot,
        bookingStatus
      });
    } else if (!isDraft && responseData.participationStatus === 'Decline') {
      // Release any existing booking for this request
      const slotBookingModel = require('./campusSlotBookingModel');
      await slotBookingModel.releaseBooking(requestId).catch(() => {});
    }

    return { success: true, data: updatedRequest };
  } catch (error) {
    console.error('Save recruiter response error:', error);
    throw error;
  }
};

/**
 * Delete a campus request
 */
const deleteCampusRequest = async (requestId) => {
  try {
    await dynamoService.deleteItem(CAMPUS_REQUESTS_TABLE, { campusreq: requestId });
    return { success: true, message: 'Request deleted successfully' };
  } catch (error) {
    console.error('Delete campus request error:', error);
    throw error;
  }
};

module.exports = {
  createCampusRequest,
  checkExistingRequest,
  getRequestsByInstitute,
  getRequestsByRecruiter,
  updateRequestStatus,
  saveRecruiterResponse,
  deleteCampusRequest
};
