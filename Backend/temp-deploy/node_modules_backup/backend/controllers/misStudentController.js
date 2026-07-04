const misStudentModel = require('../models/misStudentModel');
const s3Service = require('../services/s3Service');

exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const key = `mis-students/profiles/${Date.now()}-${req.file.originalname}`;
    const uploadResult = await s3Service.uploadFile(req.file, key);
    res.json({ success: true, url: uploadResult.url, key });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    console.log('Creating student with aadharCardUrl:', req.body.aadharCardUrl);
    const data = {
      // Institute ID (from authenticated user)
      instituteId: req.user?.userId || '',
      
      // Basic Details
      studentName: req.body.studentName || '',
      dob: req.body.dob || '',
      qualification: req.body.qualification || '',
      category: req.body.category || '',
      mobile: req.body.mobile || '',
      maritalStatus: req.body.maritalStatus || '',
      email: req.body.email || '',
      gender: req.body.gender || '',
      fatherName: req.body.fatherName || '',
      profilePhotoUrl: req.body.profilePhotoUrl || '',
      
      // Address Details
      address: req.body.address || '',
      pincode: req.body.pincode || '',
      city: req.body.city || '',
      district: req.body.district || '',
      state: req.body.state || '',
      country: req.body.country || 'India',
      
      // 10th Details
      tenth_examination: req.body.tenth_examination || '',
      tenth_board: req.body.tenth_board || '',
      tenth_subject: req.body.tenth_subject || '',
      tenth_marks: req.body.tenth_marks || '',
      tenth_percentage: req.body.tenth_percentage || '',
      tenth_year: req.body.tenth_year || '',
      tenth_documentUrl: req.body.tenth_documentUrl || '',
      
      // 12th Details
      twelfth_examination: req.body.twelfth_examination || '',
      twelfth_board: req.body.twelfth_board || '',
      twelfth_subject: req.body.twelfth_subject || '',
      twelfth_marks: req.body.twelfth_marks || '',
      twelfth_percentage: req.body.twelfth_percentage || '',
      twelfth_year: req.body.twelfth_year || '',
      twelfth_documentUrl: req.body.twelfth_documentUrl || '',
      
      // Graduation Details
      graduation_examination: req.body.graduation_examination || '',
      graduation_university: req.body.graduation_university || '',
      graduation_subject: req.body.graduation_subject || '',
      graduation_marks: req.body.graduation_marks || '',
      graduation_percentage: req.body.graduation_percentage || '',
      graduation_year: req.body.graduation_year || '',
      graduation_documentUrl: req.body.graduation_documentUrl || '',
      
      // Account Details
      bankName: req.body.bankName || '',
      accountName: req.body.accountName || '',
      branchName: req.body.branchName || '',
      ifscCode: req.body.ifscCode || '',
      
      // Training Details
      trainingCenter: req.body.trainingCenter || '',
      course: req.body.course || '',
      
      // Documents
      aadharCardUrl: req.body.aadharCardUrl || ''
    };
    
    console.log('Data being saved:', JSON.stringify(data, null, 2));
    const result = await misStudentModel.create(data);
    console.log('Student created with result:', JSON.stringify(result, null, 2));
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Student create error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    // Filter by institute ID from authenticated user
    const instituteId = req.user?.userId;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    const data = await misStudentModel.getStudentsByInstitute(instituteId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCount = async (req, res) => {
  try {
    // Filter by institute ID from authenticated user
    const instituteId = req.user?.userId;
    if (!instituteId) {
      return res.status(401).json({ success: false, message: 'Institute ID not found' });
    }
    const data = await misStudentModel.getStudentsByInstitute(instituteId);
    const count = data ? data.length : 0;
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await misStudentModel.getById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    console.log('Updating student with aadharCardUrl:', req.body.aadharCardUrl);
    const data = {
      // Keep existing instituteId, don't update it
      studentName: req.body.studentName,
      dob: req.body.dob,
      qualification: req.body.qualification,
      category: req.body.category,
      mobile: req.body.mobile,
      maritalStatus: req.body.maritalStatus,
      email: req.body.email,
      gender: req.body.gender,
      fatherName: req.body.fatherName,
      profilePhotoUrl: req.body.profilePhotoUrl,
      address: req.body.address,
      pincode: req.body.pincode,
      city: req.body.city,
      district: req.body.district,
      state: req.body.state,
      country: req.body.country,
      tenth_examination: req.body.tenth_examination,
      tenth_board: req.body.tenth_board,
      tenth_subject: req.body.tenth_subject,
      tenth_marks: req.body.tenth_marks,
      tenth_percentage: req.body.tenth_percentage,
      tenth_year: req.body.tenth_year,
      tenth_documentUrl: req.body.tenth_documentUrl,
      twelfth_examination: req.body.twelfth_examination,
      twelfth_board: req.body.twelfth_board,
      twelfth_subject: req.body.twelfth_subject,
      twelfth_marks: req.body.twelfth_marks,
      twelfth_percentage: req.body.twelfth_percentage,
      twelfth_year: req.body.twelfth_year,
      twelfth_documentUrl: req.body.twelfth_documentUrl,
      graduation_examination: req.body.graduation_examination,
      graduation_university: req.body.graduation_university,
      graduation_subject: req.body.graduation_subject,
      graduation_marks: req.body.graduation_marks,
      graduation_percentage: req.body.graduation_percentage,
      graduation_year: req.body.graduation_year,
      graduation_documentUrl: req.body.graduation_documentUrl,
      bankName: req.body.bankName,
      accountName: req.body.accountName,
      branchName: req.body.branchName,
      ifscCode: req.body.ifscCode,
      trainingCenter: req.body.trainingCenter,
      course: req.body.course,
      aadharCardUrl: req.body.aadharCardUrl
    };
    
    console.log('Update data:', JSON.stringify(data, null, 2));
    const result = await misStudentModel.update(req.params.id, data);
    console.log('Update result:', JSON.stringify(result, null, 2));
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await misStudentModel.delete(req.params.id);
    res.json({ success: true, message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const key = `mis-students/documents/${Date.now()}-${req.file.originalname}`;
    const uploadResult = await s3Service.uploadFile(req.file, key);
    res.json({ success: true, url: uploadResult.url, key });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStudentsByInstitute = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const students = await misStudentModel.getStudentsByInstitute(instituteId);
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
