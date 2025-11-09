const GovernmentScheme = require('../models/governmentSchemeModel');

// Get all active government schemes for public access
const getAllActiveSchemes = async (req, res) => {
    try {
        const schemes = await GovernmentScheme.getAllActiveSchemes();
        
        res.status(200).json({
            success: true,
            data: schemes,
            message: 'Government schemes retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching government schemes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch government schemes',
            error: error.message
        });
    }
};

// Get schemes by visibility for authenticated users
const getSchemesByVisibility = async (req, res) => {
    try {
        const { visibility } = req.query;
        const userRole = req.user?.role;
        
        let schemes;
        if (visibility && ['All', 'Staff', 'Recruiter'].includes(visibility)) {
            schemes = await GovernmentScheme.getSchemesByVisibility(visibility);
        } else if (userRole) {
            // Get schemes based on user role
            const roleVisibility = userRole === 'staff' ? 'Staff' : userRole === 'recruiter' ? 'Recruiter' : 'All';
            schemes = await GovernmentScheme.getSchemesByVisibility(roleVisibility);
        } else {
            // Default to All schemes for public access
            schemes = await GovernmentScheme.getAllActiveSchemes();
        }
        
        res.status(200).json({
            success: true,
            data: schemes,
            message: 'Government schemes retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching government schemes by visibility:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch government schemes',
            error: error.message
        });
    }
};

module.exports = {
    getAllActiveSchemes,
    getSchemesByVisibility
};