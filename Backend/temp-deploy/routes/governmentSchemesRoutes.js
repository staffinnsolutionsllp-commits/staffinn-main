const express = require('express');
const router = express.Router();
const governmentSchemeController = require('../controllers/governmentSchemeController');
const { authenticate } = require('../middleware/auth');

// Public routes for government schemes
router.get('/', governmentSchemeController.getAllActiveSchemes);

// Authenticated routes for government schemes
router.get('/by-visibility', authenticate, governmentSchemeController.getSchemesByVisibility);

module.exports = router;