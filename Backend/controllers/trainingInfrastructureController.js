const TrainingInfrastructureModel = require('../models/trainingInfrastructureModel');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
const upload = multer({ storage: multer.memoryStorage() });

exports.create = async (req, res) => {
    try {
        const instituteId = req.user.userId || req.user.id;
        const data = {
            instituteId,
            ...req.body
        };

        const infrastructure = await TrainingInfrastructureModel.create(data);

        res.status(201).json({
            success: true,
            message: 'Training infrastructure created successfully',
            data: infrastructure
        });
    } catch (error) {
        console.error('Error creating training infrastructure:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create training infrastructure',
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
        const infrastructures = await TrainingInfrastructureModel.getByInstitute(instituteId);

        res.status(200).json({
            success: true,
            data: infrastructures
        });
    } catch (error) {
        console.error('Error fetching training infrastructures:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch training infrastructures',
            error: error.message
        });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await TrainingInfrastructureModel.update(id, req.body);

        res.status(200).json({
            success: true,
            message: 'Training infrastructure updated successfully',
            data: updated
        });
    } catch (error) {
        console.error('Error updating training infrastructure:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update training infrastructure',
            error: error.message
        });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await TrainingInfrastructureModel.delete(id);

        res.status(200).json({
            success: true,
            message: 'Training infrastructure deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting training infrastructure:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete training infrastructure',
            error: error.message
        });
    }
};

exports.uploadPhotos = async (req, res) => {
    try {
        const { id } = req.params;
        const files = req.files;
        
        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const uploadPromises = files.map(async (file) => {
            const fileKey = `training-infrastructure/${id}/${uuidv4()}-${file.originalname}`;
            
            const uploadParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: fileKey,
                Body: file.buffer,
                ContentType: file.mimetype
            };

            await s3Client.send(new PutObjectCommand(uploadParams));
            
            return {
                url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
                filename: file.originalname,
                uploadedAt: new Date().toISOString()
            };
        });

        const uploadedPhotos = await Promise.all(uploadPromises);
        
        // Get existing infrastructure
        const existing = await TrainingInfrastructureModel.getById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Training infrastructure not found'
            });
        }

        // Update with new photos
        const existingPhotos = existing.photos || [];
        const updatedPhotos = [...existingPhotos, ...uploadedPhotos];
        
        await TrainingInfrastructureModel.update(id, {
            ...existing,
            photos: updatedPhotos
        });

        res.status(200).json({
            success: true,
            message: 'Photos uploaded successfully',
            data: uploadedPhotos
        });
    } catch (error) {
        console.error('Error uploading photos:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload photos',
            error: error.message
        });
    }
};

exports.uploadMiddleware = upload.array('photos', 50);
