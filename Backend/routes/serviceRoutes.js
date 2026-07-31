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

module.exports = router;
