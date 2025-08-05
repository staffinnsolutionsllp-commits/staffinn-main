const instituteCourseModel = require('../models/instituteCourseModel');

const addCourse = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    const courseData = req.body;

    const course = await instituteCourseModel.createCourse(instituteId, courseData);
    
    res.status(201).json({
      success: true,
      message: 'Course added successfully',
      data: course
    });
  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add course'
    });
  }
};

const getCourses = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    const courses = await instituteCourseModel.getCoursesByInstitute(instituteId);
    
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error getting courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get courses'
    });
  }
};

const getActiveCourseCount = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    const count = await instituteCourseModel.getActiveCourseCount(instituteId);
    
    res.status(200).json({
      success: true,
      data: { activeCourses: count }
    });
  } catch (error) {
    console.error('Error getting active course count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active course count'
    });
  }
};

module.exports = {
  addCourse,
  getCourses,
  getActiveCourseCount
};