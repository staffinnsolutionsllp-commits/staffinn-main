const instituteStudentModel = require('../models/instituteStudentModel');
const s3Service = require('../services/s3Service');

const addStudent = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    const studentData = req.body;
    
    // Parse skills if it's a JSON string
    if (studentData.skills && typeof studentData.skills === 'string') {
      try {
        studentData.skills = JSON.parse(studentData.skills);
      } catch (e) {
        studentData.skills = [];
      }
    }

    // Handle file uploads if present
    if (req.files) {
      if (req.files.profilePhoto) {
        const profileResult = await s3Service.uploadFile(req.files.profilePhoto[0], `institute-students/${instituteId}/profiles/${Date.now()}-${req.files.profilePhoto[0].originalname}`);
        studentData.profilePhoto = profileResult.Location;
      }
      
      if (req.files.resume) {
        const resumeResult = await s3Service.uploadFile(req.files.resume[0], `institute-students/${instituteId}/resumes/${Date.now()}-${req.files.resume[0].originalname}`);
        studentData.resume = resumeResult.Location;
      }
      
      if (req.files.certificates) {
        const certificateUrls = [];
        for (const cert of req.files.certificates) {
          const certResult = await s3Service.uploadFile(cert, `institute-students/${instituteId}/certificates/${Date.now()}-${cert.originalname}`);
          certificateUrls.push(certResult.Location);
        }
        studentData.certificates = certificateUrls;
      }
    }

    const student = await instituteStudentModel.createStudent(instituteId, studentData);
    
    res.status(201).json({
      success: true,
      message: 'Student added successfully',
      data: student
    });
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add student'
    });
  }
};

const getStudents = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    const students = await instituteStudentModel.getStudentsByInstitute(instituteId);
    
    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error getting students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get students'
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    const stats = await instituteStudentModel.getStudentStats(instituteId);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats'
    });
  }
};

const updatePlacementStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status } = req.body;
    
    const updated = await instituteStudentModel.updateStudentPlacementStatus(studentId, status);
    
    if (updated) {
      res.status(200).json({
        success: true,
        message: 'Placement status updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to update placement status'
      });
    }
  } catch (error) {
    console.error('Error updating placement status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update placement status'
    });
  }
};

const getStudentApplicationHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const jobApplicationModel = require('../models/jobApplicationModel');
    
    const applicationHistory = await jobApplicationModel.getStudentApplicationHistory(studentId);
    
    res.status(200).json({
      success: true,
      data: applicationHistory
    });
  } catch (error) {
    console.error('Error getting student application history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student application history'
    });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await instituteStudentModel.getStudentById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error getting student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student'
    });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const instituteId = req.user.userId;
    const updateData = req.body;
    
    // Parse skills if it's a JSON string
    if (updateData.skills && typeof updateData.skills === 'string') {
      try {
        updateData.skills = JSON.parse(updateData.skills);
      } catch (e) {
        updateData.skills = [];
      }
    }
    
    // Verify student belongs to this institute
    const existingStudent = await instituteStudentModel.getStudentById(studentId);
    if (!existingStudent || existingStudent.instituteId !== instituteId) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Handle file uploads if present
    if (req.files) {
      if (req.files.profilePhoto) {
        const profileResult = await s3Service.uploadFile(req.files.profilePhoto[0], `institute-students/${instituteId}/profiles/${Date.now()}-${req.files.profilePhoto[0].originalname}`);
        updateData.profilePhoto = profileResult.Location;
      }
      
      if (req.files.resume) {
        const resumeResult = await s3Service.uploadFile(req.files.resume[0], `institute-students/${instituteId}/resumes/${Date.now()}-${req.files.resume[0].originalname}`);
        updateData.resume = resumeResult.Location;
      }
      
      if (req.files.certificates) {
        const certificateUrls = [];
        for (const cert of req.files.certificates) {
          const certResult = await s3Service.uploadFile(cert, `institute-students/${instituteId}/certificates/${Date.now()}-${cert.originalname}`);
          certificateUrls.push(certResult.Location);
        }
        updateData.certificates = certificateUrls;
      }
    }
    
    const updated = await instituteStudentModel.updateStudent(studentId, updateData);
    
    if (updated) {
      res.status(200).json({
        success: true,
        message: 'Student updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to update student'
      });
    }
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student'
    });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const instituteId = req.user.userId;
    
    // Verify student belongs to this institute
    const existingStudent = await instituteStudentModel.getStudentById(studentId);
    if (!existingStudent || existingStudent.instituteId !== instituteId) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const deleted = await instituteStudentModel.deleteStudent(studentId);
    
    if (deleted) {
      res.status(200).json({
        success: true,
        message: 'Student deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to delete student'
      });
    }
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student'
    });
  }
};

module.exports = {
  addStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getDashboardStats,
  updatePlacementStatus,
  getStudentApplicationHistory
};