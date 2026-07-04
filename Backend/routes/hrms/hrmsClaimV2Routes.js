'use strict';
const express = require('express');
const router  = express.Router();
const c       = require('../../controllers/hrms/hrmsClaimV2Controller');
const { authenticateToken } = require('../../middleware/hrmsAuth');

// All routes require valid HRMS JWT
router.use(authenticateToken);

// ── Claim Type Config (HR Admin) ─────────────────────────────────────────
router.get   ('/claim-types',           c.getClaimTypes);
router.post  ('/claim-types',           c.createClaimType);
router.put   ('/claim-types/:claimTypeId', c.updateClaimType);
router.delete('/claim-types/:claimTypeId', c.deleteClaimType);

// ── Stats & Lists ─────────────────────────────────────────────────────────
router.get('/claims/stats',             c.getClaimStats);
router.get('/claims/my',                c.getMyClaims);
router.get('/claims/pending-approvals', c.getPendingApprovals);
router.get('/claims',                   c.getAllClaims);
router.get('/claims/:claimId',          c.getClaimById);

// ── Claim CRUD ────────────────────────────────────────────────────────────
router.post('/claims',                  c.createClaim);
router.put ('/claims/:claimId',         c.updateClaim);
router.post('/claims/:claimId/submit',  c.submitClaim);
router.post('/claims/:claimId/paid',    c.markAsPaid);

// ── Approval Workflow ─────────────────────────────────────────────────────
router.post('/claims/:claimId/action',  c.processClaimAction);

// ── Line Items ────────────────────────────────────────────────────────────
router.post  ('/claims/:claimId/line-items',              c.addLineItem);
router.delete('/claims/:claimId/line-items/:lineItemId',  c.deleteLineItem);

module.exports = router;
