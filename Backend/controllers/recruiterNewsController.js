const RecruiterNewsModel = require('../models/recruiterNewsModel');
const s3Service = require('../services/s3Service');

const RecruiterNewsController = {
    // Add news
    addNews: async (req, res) => {
        try {
            const recruiterId = req.user.userId;
            const recruiterName = req.user.companyName || req.user.fullName || req.user.instituteName || 'Unknown Recruiter';
            const { title, date, company, venue, expectedParticipants, details, verified } = req.body;

            console.log('Adding news with recruiter info:', {
                recruiterId,
                recruiterName,
                title,
                company
            });

            // Validate required fields
            if (!title || !date || !company || !details) {
                return res.status(400).json({
                    success: false,
                    message: 'Title, date, company, and details are required'
                });
            }

            let bannerImageUrl = null;

            // Handle banner image upload
            if (req.file) {
                try {
                    const key = `recruiter-news/${recruiterId}/banner-${Date.now()}-${req.file.originalname}`;
                    const uploadResult = await s3Service.uploadFile(req.file, key);
                    // Use the Location from upload result or generate URL from key
                    bannerImageUrl = uploadResult.Location || s3Service.getFileUrl(key);
                    console.log('Banner image uploaded successfully:', bannerImageUrl);
                } catch (uploadError) {
                    console.error('Error uploading banner image:', uploadError);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to upload banner image'
                    });
                }
            }

            const newsData = {
                recruiterId,
                recruiterName,
                title,
                date,
                company,
                venue,
                expectedParticipants: expectedParticipants ? parseInt(expectedParticipants) : null,
                details,
                verified: verified === 'true',
                bannerImage: bannerImageUrl
            };

            const result = await RecruiterNewsModel.create(newsData);

            if (result.success) {
                // Emit real-time update to News Admin Panel
                const io = req.app.get('io');
                if (io) {
                    io.emit('recruiterNewsCreated', result.data);
                }

                res.status(201).json({
                    success: true,
                    message: 'News added successfully',
                    data: result.data
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Error in addNews:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get all news for the authenticated recruiter
    getNews: async (req, res) => {
        try {
            const recruiterId = req.user.userId;
            const result = await RecruiterNewsModel.getByRecruiterId(recruiterId);

            if (result.success) {
                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Error in getNews:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get news by ID
    getNewsById: async (req, res) => {
        try {
            const { newsId } = req.params;
            const result = await RecruiterNewsModel.getById(newsId);

            if (result.success) {
                // Check if the news belongs to the authenticated recruiter
                if (result.data.recruiterId !== req.user.userId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Access denied'
                    });
                }

                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Error in getNewsById:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Update news
    updateNews: async (req, res) => {
        try {
            const { newsId } = req.params;
            const { title, date, company, venue, expectedParticipants, details, verified } = req.body;

            // First, check if the news exists and belongs to the authenticated recruiter
            const existingNews = await RecruiterNewsModel.getById(newsId);
            if (!existingNews.success) {
                return res.status(404).json({
                    success: false,
                    message: 'News not found'
                });
            }

            if (existingNews.data.recruiterId !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            let bannerImageUrl = existingNews.data.bannerImage;

            // Handle banner image upload
            if (req.file) {
                try {
                    const key = `recruiter-news/${req.user.userId}/banner-${Date.now()}-${req.file.originalname}`;
                    const uploadResult = await s3Service.uploadFile(req.file, key);
                    // Use the Location from upload result or generate URL from key
                    bannerImageUrl = uploadResult.Location || s3Service.getFileUrl(key);
                    console.log('Banner image updated successfully:', bannerImageUrl);
                } catch (uploadError) {
                    console.error('Error uploading banner image:', uploadError);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to upload banner image'
                    });
                }
            }

            const updateData = {
                title,
                date,
                company,
                venue,
                expectedParticipants: expectedParticipants ? parseInt(expectedParticipants) : null,
                details,
                verified: verified === 'true',
                bannerImage: bannerImageUrl
            };

            const result = await RecruiterNewsModel.update(newsId, updateData);

            if (result.success) {
                // Emit real-time update to News Admin Panel
                const io = req.app.get('io');
                if (io) {
                    io.emit('recruiterNewsUpdated', result.data);
                }

                res.json({
                    success: true,
                    message: 'News updated successfully',
                    data: result.data
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Error in updateNews:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Delete news
    deleteNews: async (req, res) => {
        try {
            const { newsId } = req.params;

            // First, check if the news exists and belongs to the authenticated recruiter
            const existingNews = await RecruiterNewsModel.getById(newsId);
            if (!existingNews.success) {
                return res.status(404).json({
                    success: false,
                    message: 'News not found'
                });
            }

            if (existingNews.data.recruiterId !== req.user.userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            const result = await RecruiterNewsModel.delete(newsId);

            if (result.success) {
                // Emit real-time update to News Admin Panel
                const io = req.app.get('io');
                if (io) {
                    io.emit('recruiterNewsDeleted', { recruiterNewsID: newsId });
                }

                res.json({
                    success: true,
                    message: 'News deleted successfully'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Error in deleteNews:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get public news for a recruiter (for public viewing)
    getPublicNews: async (req, res) => {
        try {
            const { recruiterId } = req.params;
            const result = await RecruiterNewsModel.getPublicByRecruiterId(recruiterId);

            if (result.success) {
                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Error in getPublicNews:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    },

    // Get all recruiter news (for admin panel)
    getAllNews: async (req, res) => {
        try {
            const result = await RecruiterNewsModel.getAllPublic();

            if (result.success) {
                res.json({
                    success: true,
                    data: result.data
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Error in getAllNews:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
};

module.exports = RecruiterNewsController;