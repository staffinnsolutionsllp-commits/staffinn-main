const reportModel = require('../models/reportModel');

exports.create = async (req, res) => {
  try {
    const instituteId = req.user.instituteId || req.user.id;
    const data = {
      instituteId: instituteId,
      centerId: req.body.centerId,
      courseId: req.body.courseId,
      batchId: req.body.batchId,
      students: req.body.students
    };
    
    const result = await reportModel.create(data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Report create error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const instituteId = req.user.instituteId || req.user.id;
    const data = await reportModel.getAll(instituteId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await reportModel.getById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};