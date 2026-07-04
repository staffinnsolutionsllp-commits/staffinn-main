/**
 * Campus Planner Routes
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const campusPlannerModel = require('../models/campusPlannerModel');

const router = express.Router();

// GET /api/v1/campus-planner — get planner for logged-in institute
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'institute') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const planner = await campusPlannerModel.getPlannerByInstitute(req.user.userId);
    res.json({ success: true, data: planner || { selectedDates: [], dateRanges: [], notes: '' } });
  } catch (error) {
    console.error('Get planner error:', error);
    res.status(500).json({ success: false, message: 'Failed to get planner' });
  }
});

// POST /api/v1/campus-planner — save/update planner
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'institute') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const result = await campusPlannerModel.savePlanner(req.user.userId, req.body);
    res.json(result);
  } catch (error) {
    console.error('Save planner error:', error);
    res.status(500).json({ success: false, message: 'Failed to save planner' });
  }
});

module.exports = router;
