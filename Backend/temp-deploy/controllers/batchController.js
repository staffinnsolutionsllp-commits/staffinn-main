const batchModel = require('../models/batchModel');

exports.create = async (req, res) => {
  try {
    console.log('Creating batch, user:', req.user);
    const instituteId = req.user?.userId || req.user?.id;
    console.log('Using instituteId:', instituteId);
    const data = {
      instituteId: instituteId,
      trainingCentreId: req.body.trainingCentreId,
      trainingCentreName: req.body.trainingCentreName,
      courseId: req.body.courseId,
      courseName: req.body.courseName,
      trainerId: req.body.trainerId,
      trainerName: req.body.trainerName,
      trainerCode: req.body.trainerCode || '',
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      startTime: req.body.startTime || '',
      endTime: req.body.endTime || '',
      selectedStudents: req.body.selectedStudents || []
    };
    
    console.log('Batch data to save:', JSON.stringify(data, null, 2));
    const result = await batchModel.create(data);
    console.log('Batch created successfully:', result.batchId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Batch create error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    console.log('Getting batches for user:', req.user);
    const instituteId = req.user?.userId || req.user?.id;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    console.log('Institute ID:', instituteId);
    const data = await batchModel.getAll(instituteId);
    console.log('Batches found:', data.length);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await batchModel.getById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = {
      trainingCentreId: req.body.trainingCentreId,
      trainingCentreName: req.body.trainingCentreName,
      courseId: req.body.courseId,
      courseName: req.body.courseName,
      trainerId: req.body.trainerId,
      trainerName: req.body.trainerName,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      startTime: req.body.startTime || '',
      endTime: req.body.endTime || '',
      selectedStudents: req.body.selectedStudents
    };
    
    const result = await batchModel.update(req.params.id, data);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await batchModel.delete(req.params.id);
    res.json({ success: true, message: 'Batch deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await batchModel.updateStatus(req.params.id, status);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
