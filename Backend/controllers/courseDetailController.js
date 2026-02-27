const CourseDetailModel = require('../models/courseDetailModel');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

// Configure multer for classroom photos
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for better quality photos
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed'));
    }
  }
});

// Upload classroom photos to S3
const uploadClassroomPhotos = async (files) => {
  const uploadedPhotos = [];
  
  for (const file of files) {
    try {
      const fileExtension = file.originalname.split('.').pop().toLowerCase();
      const fileName = `classroom-${uuidv4()}-${Date.now()}.${fileExtension}`;
      const key = `classroom-photos/${fileName}`;
      
      const uploadCommand = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'max-age=31536000'
      });
      
      await s3Client.send(uploadCommand);
      
      const photoUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
      uploadedPhotos.push({
        url: photoUrl,
        fileName: file.originalname,
        uploadedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error uploading classroom photo:', error);
      throw new Error(`Failed to upload photo ${file.originalname}: ${error.message}`);
    }
  }
  
  return uploadedPhotos;
};

exports.create = async (req, res) => {
    try {
        console.log('Course detail creation request received');
        console.log('Request body:', req.body);
        
        const instituteId = req.user.userId || req.user.id;
        
        if (!instituteId) {
            return res.status(400).json({
                success: false,
                message: 'Institute ID is required'
            });
        }
        
        // Parse JSON strings from FormData
        let trainingCentres = [];
        let classrooms = [];
        
        if (req.body.trainingCentres) {
            try {
                trainingCentres = JSON.parse(req.body.trainingCentres);
            } catch (e) {
                console.error('Error parsing trainingCentres:', e);
                trainingCentres = req.body.trainingCentres;
            }
        }
        
        if (req.body.classrooms) {
            try {
                classrooms = JSON.parse(req.body.classrooms);
            } catch (e) {
                console.error('Error parsing classrooms:', e);
                classrooms = req.body.classrooms;
            }
        }
        
        let data = {
            instituteId,
            trainingCentres,
            sector: req.body.sector,
            course: req.body.course,
            minBatchProposed: parseInt(req.body.minBatchProposed),
            classrooms
        };

        // Handle classroom photos if files are uploaded
        if (req.files && req.files.length > 0) {
            const photosByClassroom = {};
            
            // Group files by classroom index
            req.files.forEach(file => {
                const match = file.fieldname.match(/classroomPhotos_(\d+)/);
                if (match) {
                    const classroomIndex = parseInt(match[1]);
                    if (!photosByClassroom[classroomIndex]) {
                        photosByClassroom[classroomIndex] = [];
                    }
                    photosByClassroom[classroomIndex].push(file);
                }
            });
            
            // Upload photos and update classroom data
            if (data.classrooms && Array.isArray(data.classrooms)) {
                for (let i = 0; i < data.classrooms.length; i++) {
                    if (photosByClassroom[i]) {
                        const uploadedPhotos = await uploadClassroomPhotos(photosByClassroom[i]);
                        data.classrooms[i].photos = uploadedPhotos;
                    } else if (!data.classrooms[i].photos) {
                        data.classrooms[i].photos = [];
                    }
                    
                    // Ensure classroomType is set
                    if (!data.classrooms[i].classroomType) {
                        data.classrooms[i].classroomType = 'Classroom';
                    }
                }
            }
        } else {
            // Ensure all classrooms have photos array and classroomType
            if (data.classrooms && Array.isArray(data.classrooms)) {
                data.classrooms = data.classrooms.map(classroom => ({
                    ...classroom,
                    photos: classroom.photos || [],
                    classroomType: classroom.classroomType || 'Classroom'
                }));
            }
        }

        console.log('Final data to be saved:', JSON.stringify(data, null, 2));
        const courseDetail = await CourseDetailModel.create(data);
        console.log('Course detail created successfully:', courseDetail.id);

        res.status(201).json({
            success: true,
            message: 'Course detail created successfully',
            data: courseDetail
        });
    } catch (error) {
        console.error('Error creating course detail:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create course detail',
            error: error.message
        });
    }
};

exports.getAll = async (req, res) => {
    try {
        // Filter by institute ID from authenticated user
        const instituteId = req.user?.userId || req.user?.id;
        if (!instituteId) {
            return res.status(401).json({ success: false, message: 'Institute ID not found' });
        }
        const courseDetails = await CourseDetailModel.getByInstitute(instituteId);

        res.status(200).json({
            success: true,
            data: courseDetails
        });
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course details',
            error: error.message
        });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Parse JSON strings from FormData
        let trainingCentres = [];
        let classrooms = [];
        
        if (req.body.trainingCentres) {
            try {
                trainingCentres = JSON.parse(req.body.trainingCentres);
            } catch (e) {
                trainingCentres = req.body.trainingCentres;
            }
        }
        
        if (req.body.classrooms) {
            try {
                classrooms = JSON.parse(req.body.classrooms);
            } catch (e) {
                classrooms = req.body.classrooms;
            }
        }
        
        let data = {
            trainingCentres,
            sector: req.body.sector,
            course: req.body.course,
            minBatchProposed: parseInt(req.body.minBatchProposed),
            classrooms
        };

        // Handle classroom photos if files are uploaded
        if (req.files && req.files.length > 0) {
            const photosByClassroom = {};
            
            // Group files by classroom index
            req.files.forEach(file => {
                const match = file.fieldname.match(/classroomPhotos_(\d+)/);
                if (match) {
                    const classroomIndex = parseInt(match[1]);
                    if (!photosByClassroom[classroomIndex]) {
                        photosByClassroom[classroomIndex] = [];
                    }
                    photosByClassroom[classroomIndex].push(file);
                }
            });
            
            // Upload photos and update classroom data
            if (data.classrooms && Array.isArray(data.classrooms)) {
                for (let i = 0; i < data.classrooms.length; i++) {
                    if (photosByClassroom[i]) {
                        const uploadedPhotos = await uploadClassroomPhotos(photosByClassroom[i]);
                        data.classrooms[i].photos = [...(data.classrooms[i].photos || []), ...uploadedPhotos];
                    } else if (!data.classrooms[i].photos) {
                        data.classrooms[i].photos = [];
                    }
                    
                    // Ensure classroomType is set
                    if (!data.classrooms[i].classroomType) {
                        data.classrooms[i].classroomType = 'Classroom';
                    }
                }
            }
        }

        const updated = await CourseDetailModel.update(id, data);

        res.status(200).json({
            success: true,
            message: 'Course detail updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error updating course detail:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update course detail',
            error: error.message
        });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await CourseDetailModel.delete(id);

        res.status(200).json({
            success: true,
            message: 'Course detail deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting course detail:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete course detail',
            error: error.message
        });
    }
};

module.exports = {
    create: exports.create,
    getAll: exports.getAll,
    update: exports.update,
    delete: exports.delete,
    upload
};
