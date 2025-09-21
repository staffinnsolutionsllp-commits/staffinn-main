/**
 * Job Routes
 * Routes for job posting and management
 */

const express = require('express');
const jobController = require('../controllers/jobController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/jobs
 * @desc Create a new job posting
 * @access Private (Recruiters only)
 */
router.post('/', authenticate, jobController.createJob);

/**
 * @route GET /api/jobs/recruiter
 * @desc Get all jobs by the authenticated recruiter
 * @access Private (Recruiters only)
 */
router.get('/recruiter', authenticate, jobController.getJobsByRecruiter);

/**
 * @route GET /api/jobs/public
 * @desc Get all active jobs (public access)
 * @access Public
 */
router.get('/public', jobController.getAllActiveJobs);

/**
 * @route GET /api/jobs/trending
 * @desc Get trending jobs sorted by application count (public access)
 * @access Public
 */
router.get('/trending', jobController.getTrendingJobs);

/**
 * @route GET /api/jobs/todays-jobs
 * @desc Get jobs posted today for Job Alerts (public access)
 * @access Public
 */
router.get('/todays-jobs', jobController.getTodaysJobs);

/**
 * @route GET /api/jobs/:jobId
 * @desc Get job by ID with recruiter info
 * @access Public
 */
router.get('/:jobId', jobController.getJobById);

/**
 * @route PUT /api/jobs/:jobId
 * @desc Update job posting
 * @access Private (Job owner only)
 */
router.put('/:jobId', authenticate, jobController.updateJob);

/**
 * @route DELETE /api/jobs/:jobId
 * @desc Delete job posting
 * @access Private (Job owner only)
 */
router.delete('/:jobId', authenticate, jobController.deleteJob);

module.exports = router;