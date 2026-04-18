const TrainingCenterModel = require('../models/trainingCenterModel');

exports.createTrainingCenter = async (req, res) => {
    try {
        const instituteId = req.user.userId || req.user.id;
        const trainingCenterData = {
            instituteId,
            ...req.body
        };

        const trainingCenter = await TrainingCenterModel.create(trainingCenterData);

        res.status(201).json({
            success: true,
            message: 'Training center created successfully',
            data: trainingCenter
        });
    } catch (error) {
        console.error('Error creating training center:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create training center',
            error: error.message
        });
    }
};

exports.getTrainingCenters = async (req, res) => {
    try {
        const instituteId = req.user?.id || req.user?.userId;
        console.log('Fetching training centers for institute:', instituteId);
        console.log('req.user:', req.user);
        
        // Get training centers - if no instituteId, get all
        const trainingCenters = await TrainingCenterModel.getByInstituteId(instituteId);
        console.log('Found training centers:', trainingCenters.length);

        res.status(200).json({
            success: true,
            data: trainingCenters
        });
    } catch (error) {
        console.error('Error fetching training centers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch training centers',
            error: error.message
        });
    }
};

exports.updateTrainingCenter = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedCenter = await TrainingCenterModel.update(id, updateData);

        res.status(200).json({
            success: true,
            message: 'Training center updated successfully',
            data: updatedCenter
        });
    } catch (error) {
        console.error('Error updating training center:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update training center',
            error: error.message
        });
    }
};

exports.deleteTrainingCenter = async (req, res) => {
    try {
        const { id } = req.params;
        await TrainingCenterModel.delete(id);

        res.status(200).json({
            success: true,
            message: 'Training center deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting training center:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete training center',
            error: error.message
        });
    }
};
