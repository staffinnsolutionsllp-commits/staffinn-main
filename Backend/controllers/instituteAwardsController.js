const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const awsConfig = require('../config/aws');
const {
  createAward,
  getAwardsByInstituteId,
  updateAward,
  deleteAward
} = require('../models/instituteAwardsModel');

const s3Client = new S3Client(awsConfig);
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
  try {
    const key = `institute-awards/${fileName}`;
    
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType
    }));
    
    return `https://${S3_BUCKET_NAME}.s3.${awsConfig.region}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

const deleteFromS3 = async (s3Url) => {
  try {
    const urlParts = s3Url.split('/');
    const key = urlParts.slice(3).join('/');
    
    await s3Client.send(new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key
    }));
    
    return true;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    return false;
  }
};

const addAward = async (req, res) => {
  try {
    const { title, description } = req.body;
    const instituteId = req.user?.userId;

    if (!instituteId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    let photoUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        const photoUrl = await uploadToS3(file.buffer, fileName, file.mimetype);
        photoUrls.push(photoUrl);
      }
    }

    const awardData = {
      title,
      description,
      photos: photoUrls
    };

    const createdAward = await createAward(instituteId, awardData);

    res.status(201).json({
      success: true,
      message: 'Award added successfully',
      data: createdAward
    });

  } catch (error) {
    console.error('Error adding award:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add award'
    });
  }
};

const getAwards = async (req, res) => {
  try {
    const instituteId = req.user?.userId;

    if (!instituteId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const awards = await getAwardsByInstituteId(instituteId);

    res.json({
      success: true,
      data: awards
    });

  } catch (error) {
    console.error('Error getting awards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get awards'
    });
  }
};

const updateAwardItem = async (req, res) => {
  try {
    const { awardId } = req.params;
    const { title, description } = req.body;
    const instituteId = req.user.userId;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    if (req.files && req.files.length > 0) {
      let photoUrls = [];
      for (const file of req.files) {
        const fileName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        const photoUrl = await uploadToS3(file.buffer, fileName, file.mimetype);
        photoUrls.push(photoUrl);
      }
      updateData.photos = photoUrls;
    }

    const updatedAward = await updateAward(instituteId, awardId, updateData);

    res.json({
      success: true,
      message: 'Award updated successfully',
      data: updatedAward
    });

  } catch (error) {
    console.error('Error updating award:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update award'
    });
  }
};

const deleteAwardItem = async (req, res) => {
  try {
    const { awardId } = req.params;
    const instituteId = req.user.userId;

    const awards = await getAwardsByInstituteId(instituteId);
    const existingAward = awards.find(a => a.awardId === awardId);

    if (existingAward && existingAward.photos) {
      for (const photoUrl of existingAward.photos) {
        await deleteFromS3(photoUrl);
      }
    }

    await deleteAward(instituteId, awardId);

    res.json({
      success: true,
      message: 'Award deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting award:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete award'
    });
  }
};

const getPublicAwards = async (req, res) => {
  try {
    const { instituteId } = req.params;

    const awards = await getAwardsByInstituteId(instituteId);

    res.json({
      success: true,
      data: awards
    });

  } catch (error) {
    console.error('Error getting public awards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get awards'
    });
  }
};

module.exports = {
  upload,
  addAward,
  getAwards,
  updateAwardItem,
  deleteAwardItem,
  getPublicAwards
};
