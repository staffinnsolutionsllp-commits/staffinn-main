const express = require('express');
const router = express.Router();
const { login, changePassword, getProfile } = require('../../controllers/hrms/employeeAuthController');
const { 
  getDashboardStats, 
  getMyAttendance, 
  markAttendance, 
  getMyLeaves, 
  getLeaveBalance,
  getLeaveTypes, 
  applyLeave, 
  cancelLeave, 
  getMyPayslips, 
  updateProfile,
  getMyClaims,
  getClaimCategories,
  submitClaim,
  getMyTasks,
  updateMyTask,
  getMyRatings,
  getMyGrievances,
  submitGrievance,
  getAssignedGrievances,
  updateGrievanceStatus,
  getMyHierarchy,
  getFullOrganogram,
  getNodeDetails,
  getSubordinatesHierarchy,
  assignTask,
  getTasksAssignedByMe,
  // Warning system
  issueWarning,
  getMyIssuedWarnings,
  getMyReceivedWarnings,
  getFlaggedEmployees,
  getSubordinatesForWarning,
  getAllWarnings,
} = require('../../controllers/hrms/employeePortalController');

// Import grievance-specific controllers
const { 
  getReportingManagers, 
  getOrganizationEmployees 
} = require('../../controllers/hrms/hrmsGrievanceController');

// Import notification controller
const {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../../controllers/hrms/notificationController');

const { authenticateEmployee, checkPermission } = require('../../middleware/employeeAuth');

// Forgot-password routes (public — no auth required)
const hrmsPasswordReset = require('../../controllers/hrms/hrmsPasswordResetController');
router.post('/auth/forgot-password/send-otp',  hrmsPasswordReset.sendOTP);
router.post('/auth/forgot-password/verify-otp', hrmsPasswordReset.verifyOTP);
router.post('/auth/forgot-password/reset',      hrmsPasswordReset.resetPassword);
router.post('/auth/forgot-password/resend-otp', hrmsPasswordReset.resendOTP);

// Auth routes
router.post('/auth/login', login);
router.post('/auth/change-password', authenticateEmployee, changePassword);
router.get('/auth/profile', authenticateEmployee, getProfile);

// Dashboard
router.get('/dashboard/stats', authenticateEmployee, getDashboardStats);

// Profile
router.put('/profile', authenticateEmployee, updateProfile);

// Attendance routes
router.get('/attendance', authenticateEmployee, getMyAttendance);
router.post('/attendance/mark', authenticateEmployee, checkPermission('mark_attendance'), markAttendance);

// Leave routes
router.get('/leaves', authenticateEmployee, getMyLeaves);
router.get('/leaves/balance', authenticateEmployee, getLeaveBalance);
router.get('/leaves/types', authenticateEmployee, getLeaveTypes);
router.post('/leaves/apply', authenticateEmployee, applyLeave);
router.delete('/leaves/:id', authenticateEmployee, cancelLeave);

// Payroll routes
router.get('/payslips', authenticateEmployee, getMyPayslips);

// Claim routes (legacy v1)
router.get('/claims', authenticateEmployee, getMyClaims);
router.get('/claims/categories', authenticateEmployee, getClaimCategories);
router.post('/claims', authenticateEmployee, submitClaim);

// ── Claim V2 routes (enterprise) ──────────────────────────────────────────
const claimV2 = require('../../controllers/hrms/hrmsClaimV2Controller');
router.get   ('/v2/claim-types',                            authenticateEmployee, claimV2.getClaimTypes);
router.get   ('/v2/claims/my',                              authenticateEmployee, claimV2.getMyClaims);
router.get   ('/v2/claims/stats',                           authenticateEmployee, claimV2.getClaimStats);
router.get   ('/v2/claims/:claimId',                        authenticateEmployee, claimV2.getClaimById);
router.post  ('/v2/claims',                                 authenticateEmployee, claimV2.createClaim);
router.put   ('/v2/claims/:claimId',                        authenticateEmployee, claimV2.updateClaim);
router.post  ('/v2/claims/:claimId/submit',                 authenticateEmployee, claimV2.submitClaim);
router.post  ('/v2/claims/:claimId/line-items',             authenticateEmployee, claimV2.addLineItem);
router.delete('/v2/claims/:claimId/line-items/:lineItemId', authenticateEmployee, claimV2.deleteLineItem);

// ── Claim attachment upload ────────────────────────────────────────────────
// POST /api/v1/employee/claims/:claimId/upload  (multipart/form-data)
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path   = require('path');
const crypto = require('crypto');
const awsConfig = require('../../config/aws');

const S3_BUCKET_EMP  = process.env.S3_BUCKET_NAME || 'staffinn-files';
const MAX_MB_EMP     = 10;
const ALLOWED_MIME_EMP = new Set([
  'image/jpeg','image/jpg','image/png','image/webp','application/pdf'
]);
const ALLOWED_EXT_EMP = new Set(['.jpg','.jpeg','.png','.webp','.pdf']);

const s3Emp = new S3Client(awsConfig);

const uploadEmp = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_MB_EMP * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME_EMP.has(file.mimetype) && ALLOWED_EXT_EMP.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Allowed: PDF, JPG, JPEG, PNG, WEBP'));
    }
  }
});

const handleClaimUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { claimId } = req.params;
    if (!claimId || !/^[a-zA-Z0-9\-_]{4,64}$/.test(claimId)) {
      return res.status(400).json({ success: false, message: 'Invalid claimId' });
    }

    const ext        = path.extname(req.file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const userId     = req.user?.userId || req.user?.employeeId || 'unknown';
    const s3Key      = `hrms/claims/${claimId}/${userId}/${uniqueName}`;

    await s3Emp.send(new PutObjectCommand({
      Bucket:      S3_BUCKET_EMP,
      Key:         s3Key,
      Body:        req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        uploadedBy:   userId,
        claimId,
        originalName: Buffer.from(req.file.originalname).toString('base64').substring(0, 200)
      }
    }));

    const region = (awsConfig.region || process.env.AWS_REGION || 'ap-south-1');
    const url    = `https://${S3_BUCKET_EMP}.s3.${region}.amazonaws.com/${s3Key}`;

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { url, key: s3Key, fileName: req.file.originalname, size: req.file.size, mimeType: req.file.mimetype }
    });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: `File too large. Maximum ${MAX_MB_EMP}MB allowed.` });
    }
    console.error('❌ Employee claim upload error:', err.message);
    return res.status(500).json({ success: false, message: 'Upload failed. Please try again.' });
  }
};

router.post(
  '/claims/:claimId/upload',
  authenticateEmployee,
  uploadEmp.single('file'),
  handleClaimUpload
);

// Task routes
router.get('/tasks', authenticateEmployee, getMyTasks);
router.get('/tasks/assigned-by-me', authenticateEmployee, getTasksAssignedByMe);
router.put('/tasks/:taskId', authenticateEmployee, updateMyTask);
router.post('/tasks/assign', authenticateEmployee, assignTask);
router.get('/performance/ratings', authenticateEmployee, getMyRatings);

// ── Daily Task Report (DTR) routes ──────────────────────────────────────────
const {
  submitDTR,
  updateDTR,
  getMyDTRs,
  getDTRStatus,
  uploadDTRAttachment,
  getMyMissingDTRs
} = require('../../controllers/hrms/dtrController');
const multerDTR = require('multer');

const MAX_MB_DTR = 10;
const ALLOWED_MIME_DTR = new Set(['image/jpeg','image/jpg','image/png','image/webp','application/pdf','image/gif']);
const ALLOWED_EXT_DTR = new Set(['.jpg','.jpeg','.png','.webp','.pdf','.gif']);

const uploadDTRMiddleware = multerDTR({
  storage: multerDTR.memoryStorage(),
  limits: { fileSize: MAX_MB_DTR * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = require('path').extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME_DTR.has(file.mimetype) && ALLOWED_EXT_DTR.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Allowed: PDF, JPG, JPEG, PNG, WEBP, GIF'));
    }
  }
});

router.get('/dtr/status', authenticateEmployee, getDTRStatus);
router.get('/dtr/missing', authenticateEmployee, getMyMissingDTRs);
router.get('/dtr', authenticateEmployee, getMyDTRs);
router.post('/dtr', authenticateEmployee, submitDTR);
router.put('/dtr/:reportId', authenticateEmployee, updateDTR);
router.post('/dtr/:reportId/upload', authenticateEmployee, uploadDTRMiddleware.single('file'), uploadDTRAttachment);

// Grievance routes
router.get('/grievances', authenticateEmployee, getMyGrievances);
router.post('/grievances', authenticateEmployee, submitGrievance);
router.get('/grievances/assigned', authenticateEmployee, getAssignedGrievances);
router.get('/grievances/reporting-managers', authenticateEmployee, getReportingManagers);
router.get('/grievances/organization-employees', authenticateEmployee, getOrganizationEmployees);
router.put('/grievances/:grievanceId/status', authenticateEmployee, updateGrievanceStatus);

// ── Grievance document upload ───────────────────────────────────────────────
const multerGrv = require('multer');
const { S3Client: S3Grv, PutObjectCommand: PutGrv } = require('@aws-sdk/client-s3');
const pathGrv   = require('path');
const cryptoGrv = require('crypto');
const awsConfigGrv = require('../../config/aws');

const S3_BUCKET_GRV   = process.env.S3_BUCKET_NAME || 'staffinn-files';
const MAX_MB_GRV       = 10;
const ALLOWED_MIME_GRV = new Set(['image/jpeg','image/jpg','image/png','image/webp','application/pdf']);
const ALLOWED_EXT_GRV  = new Set(['.jpg','.jpeg','.png','.webp','.pdf']);

const s3Grv = new S3Grv(awsConfigGrv);
const uploadGrv = multerGrv({
  storage: multerGrv.memoryStorage(),
  limits:  { fileSize: MAX_MB_GRV * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = pathGrv.extname(file.originalname).toLowerCase();
    ALLOWED_MIME_GRV.has(file.mimetype) && ALLOWED_EXT_GRV.has(ext)
      ? cb(null, true)
      : cb(new Error('File type not allowed. Allowed: PDF, JPG, JPEG, PNG, WEBP'));
  }
});

const handleGrvUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { grievanceId } = req.params;
    if (!grievanceId || !/^[a-zA-Z0-9\-_]{4,64}$/.test(grievanceId)) {
      return res.status(400).json({ success: false, message: 'Invalid grievanceId' });
    }
    const ext        = pathGrv.extname(req.file.originalname).toLowerCase();
    const uniqueName = `${cryptoGrv.randomBytes(16).toString('hex')}${ext}`;
    const userId     = req.user?.userId || req.user?.employeeId || 'unknown';
    const s3Key      = `hrms/grievances/${grievanceId}/${userId}/${uniqueName}`;

    await s3Grv.send(new PutGrv({
      Bucket: S3_BUCKET_GRV,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        uploadedBy:   userId,
        grievanceId,
        originalName: Buffer.from(req.file.originalname).toString('base64').substring(0, 200)
      }
    }));

    const region = (awsConfigGrv.region || process.env.AWS_REGION || 'ap-south-1');
    const url    = `https://${S3_BUCKET_GRV}.s3.${region}.amazonaws.com/${s3Key}`;
    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { url, key: s3Key, fileName: req.file.originalname, size: req.file.size, mimeType: req.file.mimetype }
    });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: `File too large. Maximum ${MAX_MB_GRV}MB allowed.` });
    }
    console.error('❌ Grievance document upload error:', err.message);
    return res.status(500).json({ success: false, message: 'Upload failed. Please try again.' });
  }
};

router.post('/grievances/:grievanceId/upload', authenticateEmployee, uploadGrv.single('file'), handleGrvUpload);

// Organogram routes
router.get('/organogram', authenticateEmployee, getMyHierarchy);
router.get('/organogram/subordinates', authenticateEmployee, getSubordinatesHierarchy);
router.get('/organogram/full', authenticateEmployee, getFullOrganogram);
router.get('/organogram/node/:nodeId', authenticateEmployee, getNodeDetails);

// ── Warning system routes ────────────────────────────────────────────────────
// GET  /employee/warnings/subordinates   — who can I warn?
// POST /employee/warnings                — issue a warning
// GET  /employee/warnings/issued         — warnings I have issued
// GET  /employee/warnings/received       — warnings I have received
// GET  /employee/warnings/flagged        — employees with 3+ warnings (HR admin)
router.get ('/warnings/subordinates', authenticateEmployee, getSubordinatesForWarning);
router.get ('/warnings/issued',       authenticateEmployee, getMyIssuedWarnings);
router.get ('/warnings/received',     authenticateEmployee, getMyReceivedWarnings);
router.get ('/warnings/flagged',      authenticateEmployee, getFlaggedEmployees);
router.get ('/warnings/all',          authenticateEmployee, getAllWarnings);
router.post('/warnings',              authenticateEmployee, issueWarning);

// Notification routes
router.get('/notifications', authenticateEmployee, getMyNotifications);
router.get('/notifications/unread-count', authenticateEmployee, getUnreadNotificationCount);
router.put('/notifications/:notificationId/read', authenticateEmployee, markNotificationAsRead);
router.put('/notifications/mark-all-read', authenticateEmployee, markAllNotificationsAsRead);

// ── Separation / Resignation (Employee Self-Service) ────────────────────
const {
  employeeInitiatedResignation,
  getMyResignation,
  getMyNDC,
  submitEmployeeDeclaration
} = require('../../controllers/hrms/hrmsSeparationController');

router.post('/separation/resign',                       authenticateEmployee, employeeInitiatedResignation);
router.get ('/separation/my',                           authenticateEmployee, getMyResignation);
router.get ('/separation/:separationId/ndc',            authenticateEmployee, getMyNDC);
router.put ('/separation/:separationId/declaration',    authenticateEmployee, submitEmployeeDeclaration);

module.exports = router;
