const facultyListModel = require('../models/facultyListModel');
const s3Service = require('../services/s3Service');

exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const key = `faculty-profiles/${Date.now()}-${req.file.originalname}`;
    const uploadResult = await s3Service.uploadFile(req.file, key);
    res.json({ success: true, url: uploadResult.url, key });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    console.log('Creating faculty...');
    const data = {
      instituteId: req.user?.id || req.user?.userId || req.user?.instituteId || '',
      profilePhotoUrl: req.body.profilePhotoUrl || '',
      enrollmentNo: req.body.enrollmentNo || '',
      dob: req.body.dob || '',
      name: req.body.name || '',
      mobile: req.body.mobile || '',
      gender: req.body.gender || '',
      email: req.body.email || '',
      maritalStatus: req.body.maritalStatus || '',
      registrationDate: req.body.registrationDate || '',
      qualification: req.body.qualification || '',
      educationStream: req.body.educationStream || '',
      skills: req.body.skills || '',
      trainerCode: req.body.trainerCode || '',
      currentAddress: req.body.currentAddress || '',
      currentVillage: req.body.currentVillage || '',
      currentState: req.body.currentState || '',
      currentCity: req.body.currentCity || '',
      currentDistrict: req.body.currentDistrict || '',
      selectedCourses: req.body.selectedCourses ? JSON.parse(req.body.selectedCourses) : []
    };
    
    if (req.file) {
      const key = `faculty-certificates/${Date.now()}-${req.file.originalname}`;
      const uploadResult = await s3Service.uploadFile(req.file, key);
      data.certificateUrl = uploadResult.url;
    }
    
    const result = await facultyListModel.create(data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Faculty create error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    // Decode JWT token to get institute ID
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    const jwtUtils = require('../utils/jwtUtils');
    const decoded = jwtUtils.verifyToken(token);
    const instituteId = decoded?.userId;
    
    console.log('Decoded token:', decoded);
    console.log('Institute ID from token:', instituteId);
    
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found in token' });
    }
    
    const data = await facultyListModel.getByInstitute(instituteId);
    console.log('Faculty data found for institute:', data.length);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Faculty getAll error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = {
      instituteId: req.body.instituteId,
      profilePhotoUrl: req.body.profilePhotoUrl,
      enrollmentNo: req.body.enrollmentNo,
      dob: req.body.dob,
      name: req.body.name,
      mobile: req.body.mobile,
      gender: req.body.gender,
      email: req.body.email,
      maritalStatus: req.body.maritalStatus,
      registrationDate: req.body.registrationDate,
      qualification: req.body.qualification,
      educationStream: req.body.educationStream,
      skills: req.body.skills,
      trainerCode: req.body.trainerCode,
      currentAddress: req.body.currentAddress,
      currentVillage: req.body.currentVillage,
      currentState: req.body.currentState,
      currentCity: req.body.currentCity,
      currentDistrict: req.body.currentDistrict,
      selectedCourses: req.body.selectedCourses ? JSON.parse(req.body.selectedCourses) : []
    };
    
    if (req.file) {
      const key = `faculty-certificates/${Date.now()}-${req.file.originalname}`;
      const uploadResult = await s3Service.uploadFile(req.file, key);
      data.certificateUrl = uploadResult.url;
    }
    
    const result = await facultyListModel.update(req.params.id, data);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Faculty update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await facultyListModel.delete(req.params.id);
    res.json({ success: true, message: 'Faculty deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getByInstitute = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const data = await facultyListModel.getByInstitute(instituteId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
