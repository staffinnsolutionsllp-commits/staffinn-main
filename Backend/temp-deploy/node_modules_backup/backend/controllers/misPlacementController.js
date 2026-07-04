const MisPlacementAnalytics = require('../models/misPlacementAnalyticsModel');

const getMisPlacementAnalytics = async (req, res) => {
  try {
    const instituteId = req.user?.userId;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    const analytics = await MisPlacementAnalytics.getPlacementsByInstitute(instituteId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getMisPlacementStats = async (req, res) => {
  try {
    const instituteId = req.user?.userId;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    const stats = await MisPlacementAnalytics.getPlacementStatsByInstitute(instituteId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getMisPlacementAnalytics,
  getMisPlacementStats
};