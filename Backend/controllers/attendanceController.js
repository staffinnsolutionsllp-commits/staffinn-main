const attendanceModel = require('../models/attendanceModel');

const markAttendance = async (req, res) => {
  try {
    const { batchId, trainingCentreId, courseId, facultyId, attendanceDate, studentAttendance } = req.body;
    
    // Check if attendance already exists for this batch and date
    const existingAttendance = await attendanceModel.getByBatchAndDate(batchId, attendanceDate);
    
    const presentCount = studentAttendance.filter(s => s.status === 'Present').length;
    const absentCount = studentAttendance.filter(s => s.status === 'Absent').length;
    
    const data = {
      batchId,
      trainingCentreId,
      courseId,
      facultyId,
      attendanceDate,
      studentAttendance,
      totalStudents: studentAttendance.length,
      presentCount,
      absentCount,
      markedBy: req.user.id || req.user.userId
    };

    let result;
    if (existingAttendance) {
      result = await attendanceModel.update(existingAttendance.misattendence, data);
    } else {
      result = await attendanceModel.create(data);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAttendance = async (req, res) => {
  try {
    const { batchId, attendanceDate } = req.query;
    
    if (!batchId || !attendanceDate) {
      return res.status(400).json({ success: false, message: 'Batch ID and date are required' });
    }

    const attendance = await attendanceModel.getByBatchAndDate(batchId, attendanceDate);
    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    // Filter by institute ID from authenticated user
    const instituteId = req.user?.userId || req.user?.id;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    const attendance = await attendanceModel.getByInstitute(instituteId);
    res.json({ success: true, data: attendance });
  } catch (error) {
    console.error('Get all attendance error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  markAttendance,
  getAttendance,
  getAllAttendance
};