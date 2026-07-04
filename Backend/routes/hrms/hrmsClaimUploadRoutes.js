'use strict';

const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path     = require('path');
const crypto   = require('crypto');
const { authenticateEmployee } = require('../../middleware/employeeAuth');
const { authenticateToken }    = require('../../middleware/hrmsAuth');
const awsConfig = require('../../config/aws');

// ── Config ───────────────────────────────────────────────────────────────────
const S3_BUCKET   = process.env.S3_BUCKET_NAME || 'staffinn-files';
const MAX_SIZE_MB  = 10;
const ALLOWED_MIME = new Set([
  'image/jpeg','image/jpg','image/png','image/webp',
  'application/pdf'
]);
const ALLOWED_EXT  = new Set(['.jpg','.jpeg','.png','.webp','.pdf']);

const s3 = new S3Client(awsConfig);

// Memory storage — never write to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME.has(file.mimetype) && ALLOWED_EXT.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Allowed: PDF, JPG, JPEG, PNG, WEBP`));
    }
  }
});

// ── Shared upload handler ─────────────────────────────────────────────────────
const handleUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { claimId } = req.params;
    if (!claimId || !/^[a-zA-Z0-9\-_]{8,64}$/.test(claimId)) {
      return res.status(400).json({ success: false, message: 'Invalid claimId' });
    }

    // Build a unique, sanitised S3 key
    const ext       = path.extname(req.file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const userId    = req.user?.userId || req.user?.employeeId || 'unknown';
    const s3Key     = `hrms/claims/${claimId}/${userId}/${uniqueName}`;

    await s3.send(new PutObjectCommand({
      Bucket:      S3_BUCKET,
      Key:         s3Key,
      Body:        req.file.buffer,
      ContentType: req.file.mimetype,
      // No ACL — bucket policy handles access
      Metadata: {
        uploadedBy: userId,
        claimId,
        originalName: Buffer.from(req.file.originalname).toString('base64').substring(0, 200)
      }
    }));

    const region = awsConfig.region || process.env.AWS_REGION || 'ap-south-1';
    const url = `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${s3Key}`;

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { url, key: s3Key, fileName: req.file.originalname, size: req.file.size, mimeType: req.file.mimetype }
    });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: `File too large. Maximum ${MAX_SIZE_MB}MB allowed.` });
    }
    console.error('❌ Claim attachment upload error:', err.message);
    return res.status(500).json({ success: false, message: 'Upload failed. Please try again.' });
  }
};

// ── Routes ───────────────────────────────────────────────────────────────────
// Employee portal upload
router.post(
  '/employee/claims/:claimId/upload',
  authenticateEmployee,
  upload.single('file'),
  handleUpload
);

// HRMS admin upload (for adding docs from admin side)
router.post(
  '/hrms/claims/:claimId/upload',
  authenticateToken,
  upload.single('file'),
  handleUpload
);

module.exports = router;
