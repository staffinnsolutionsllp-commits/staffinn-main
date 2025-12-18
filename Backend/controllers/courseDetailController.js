const CourseDetailModel = require('../models/courseDetailModel');

exports.create = async (req, res) => {
    try {
        const instituteId = req.user.userId || req.user.id;
        const data = {
            instituteId,
            ...req.body
        };

        const courseDetail = await CourseDetailModel.create(data);

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
        const updated = await CourseDetailModel.update(id, req.body);

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
