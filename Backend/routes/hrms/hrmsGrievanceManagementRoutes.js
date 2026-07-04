const express = require('express');
const router = express.Router();
const multer   = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path     = require('path');
const crypto   = require('crypto');
const {
  createGrievance,
  getGrievances,
  getGrievanceById,
  updateGrievanceStatus,
  addRemark,
  getGrievanceStats
} = require('../../controllers/hrms/hrmsGrievanceManagementController');
const { authenticateToken, authorizeRoles } = require('../../middleware/hrmsAuth');
const awsConfig = require('../../config/aws');

router.use(authenticateToken);

// Debug middleware
router.use((req, res, next) => {
  let rawBody = '';
  req.on('data', chunk => { rawBody += chunk.toString(); });
  req.on('end', () => {
    console.log('Raw body received:', rawBody);
    console.log('Parsed body:', req.body);
  });
  next();
});

router.post('/', createGrievance);
router.get('/', getGrievances);
router.get('/stats', getGrievanceStats);
router.get('/:grievanceId', getGrievanceById);
router.put('/:grievanceId/status', authorizeRoles('admin', 'hr', 'manager'), updateGrievanceStatus);
router.post('/:grievanceId/remarks', addRemark);

// ── Document upload for HRMS admin ─────────────────────────────────────────
const S3_BUCKET_HRMS_GRV  = process.env.S3_BUCKET_NAME || 'staffinn-files';
const MAX_MB_HRMS_GRV     = 10;
const ALLOWED_MIME_HGRV   = new Set(['image/jpeg','image/jpg','image/png','image/webp','application/pdf']);
const ALLOWED_EXT_HGRV    = new Set(['.jpg','.jpeg','.png','.webp','.pdf']);
const s3HrmsGrv = new S3Client(awsConfig);

const uploadHrmsGrv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB_HRMS_GRV * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    ALLOWED_MIME_HGRV.has(file.mimetype) && ALLOWED_EXT_HGRV.has(ext)
      ? cb(null, true)
      : cb(new Error('File type not allowed. Allowed: PDF, JPG, JPEG, PNG, WEBP'));
  }
});

router.post('/:grievanceId/upload', uploadHrmsGrv.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { grievanceId } = req.params;
    if (!grievanceId || !/^[a-zA-Z0-9\-_]{4,64}$/.test(grievanceId)) {
      return res.status(400).json({ success: false, message: 'Invalid grievanceId' });
    }
    const ext        = path.extname(req.file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const userId     = req.user?.userId || 'admin';
    const s3Key      = `hrms/grievances/${grievanceId}/${userId}/${uniqueName}`;

    await s3HrmsGrv.send(new PutObjectCommand({
      Bucket:      S3_BUCKET_HRMS_GRV,
      Key:         s3Key,
      Body:        req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        uploadedBy:   userId,
        grievanceId,
        originalName: Buffer.from(req.file.originalname).toString('base64').substring(0, 200)
      }
    }));

    const region = awsConfig.region || process.env.AWS_REGION || 'ap-south-1';
    const url    = `https://${S3_BUCKET_HRMS_GRV}.s3.${region}.amazonaws.com/${s3Key}`;
    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { url, key: s3Key, fileName: req.file.originalname, size: req.file.size, mimeType: req.file.mimetype }
    });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: `File too large. Maximum ${MAX_MB_HRMS_GRV}MB allowed.` });
    }
    console.error('❌ HRMS grievance upload error:', err.message);
    return res.status(500).json({ success: false, message: 'Upload failed. Please try again.' });
  }
});

module.exports = router;
