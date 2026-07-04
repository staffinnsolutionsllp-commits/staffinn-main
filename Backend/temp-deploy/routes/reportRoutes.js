const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Save Physical Progress Report
router.post('/save-physical-progress', authenticate, async (req, res) => {
  try {
    const { centerId, courseId, batchId, reportType, studentReports } = req.body;
    const dynamoService = require('../services/dynamoService');
    
    const reportId = `RPT-${Date.now()}-${uuidv4().substring(0, 8)}`;
    
    const reportData = {
      reportId,
      centerId,
      courseId,
      batchId,
      reportType,
      studentReports,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await dynamoService.putItem('mis-report', reportData);
    
    res.json({ success: true, data: { reportId } });
  } catch (error) {
    console.error('Error saving physical progress report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;