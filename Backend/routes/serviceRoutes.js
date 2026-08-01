/**
 * Phase 2F: Staff Service Routes
 * All routes guarded by serviceFeatureGuard.
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const sc = require('../controllers/serviceController');

// Feature flag guard
router.use(sc.serviceFeatureGuard);

// Public service detail (no auth - must be before authenticated routes)
router.get('/detail/:serviceSlug', sc.getPublicServiceDetail);

// Owner routes (Staff, authenticated)
router.get('/my', authenticate, sc.getMyServices);
router.post('/', authenticate, sc.createService);
router.get('/:serviceId', authenticate, sc.getMyService);
router.put('/:serviceId', authenticate, sc.updateMyService);
router.delete('/:serviceId', authenticate, sc.deleteMyService);

// Lifecycle
router.put('/:serviceId/actions/publish', authenticate, sc.publishMyService);
router.put('/:serviceId/actions/pause', authenticate, sc.pauseMyService);
router.put('/:serviceId/actions/reactivate', authenticate, sc.reactivateMyService);
router.put('/:serviceId/actions/archive', authenticate, sc.archiveMyService);

// Packages, FAQs, Add-ons, Requirements, Availability
router.put('/:serviceId/packages', authenticate, sc.updateMyServicePackages);
router.put('/:serviceId/faqs', authenticate, sc.updateMyServiceFaqs);
router.put('/:serviceId/addons', authenticate, sc.updateMyServiceAddons);
router.put('/:serviceId/requirements', authenticate, sc.updateMyServiceRequirements);
router.put('/:serviceId/availability', authenticate, sc.updateMyServiceAvailability);

// Media upload
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 }, fileFilter: (req, file, cb) => { const allowed = ['image/jpeg', 'image/png', 'image/webp']; cb(null, allowed.includes(file.mimetype)); } });
function handleUpload(fieldName) { return (req, res, next) => { upload.single(fieldName)(req, res, (err) => { if (err) { if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ success: false, message: 'File too large (max 5MB)' }); return res.status(400).json({ success: false, message: err.message || 'Upload error' }); } next(); }); }; }
router.post('/:serviceId/media/cover', authenticate, handleUpload('file'), sc.uploadServiceCover);
router.post('/:serviceId/media/gallery', authenticate, handleUpload('file'), sc.uploadServiceGallery);
router.delete('/:serviceId/media/:mediaType/:mediaIndex', authenticate, sc.deleteServiceMedia);

module.exports = router;
