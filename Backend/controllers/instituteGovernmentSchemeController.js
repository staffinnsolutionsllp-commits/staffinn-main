/**
 * Institute Government Scheme Controller
 * Handles institute-specific government schemes operations
 */

const InstituteGovernmentScheme = require('../models/instituteGovernmentSchemeModel');

/**
 * Add new government scheme for institute
 */
const addInstituteGovernmentScheme = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    const { schemeName, schemeDescription, link } = req.body;

    // Validate required fields
    if (!schemeName || !link) {
      return res.status(400).json({
        success: false,
        message: 'Scheme name and link are required'
      });
    }

    // Validate description length (max 30 words)
    if (schemeDescription) {
      const wordCount = schemeDescription.trim().split(/\s+/).length;
      if (wordCount > 30) {
        return res.status(400).json({
          success: false,
          message: 'Scheme description must be 30 words or less'
        });
      }
    }

    // Validate URL format
    try {
      new URL(link);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid URL for the scheme link'
      });
    }

    const schemeData = {
      schemeName: schemeName.trim(),
      schemeDescription: schemeDescription ? schemeDescription.trim() : '',
      link: link.trim()
    };

    const newScheme = await InstituteGovernmentScheme.addInstituteScheme(instituteId, schemeData);

    res.status(201).json({
      success: true,
      data: newScheme,
      message: 'Government scheme added successfully'
    });
  } catch (error) {
    console.error('Error adding institute government scheme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add government scheme',
      error: error.message
    });
  }
};

/**
 * Get all government schemes for institute
 */
const getInstituteGovernmentSchemes = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    const schemes = await InstituteGovernmentScheme.getInstituteSchemes(instituteId);

    res.status(200).json({
      success: true,
      data: schemes,
      message: 'Government schemes retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting institute government schemes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get government schemes',
      error: error.message
    });
  }
};

/**
 * Get government schemes for public institute page
 */
const getPublicInstituteGovernmentSchemes = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const schemes = await InstituteGovernmentScheme.getInstituteSchemes(instituteId);

    res.status(200).json({
      success: true,
      data: schemes,
      message: 'Government schemes retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting public institute government schemes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get government schemes',
      error: error.message
    });
  }
};

/**
 * Update government scheme for institute
 */
const updateInstituteGovernmentScheme = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    const { schemeId } = req.params;
    const { schemeName, schemeDescription, link } = req.body;

    // Validate required fields
    if (!schemeName || !link) {
      return res.status(400).json({
        success: false,
        message: 'Scheme name and link are required'
      });
    }

    // Validate description length (max 30 words)
    if (schemeDescription) {
      const wordCount = schemeDescription.trim().split(/\s+/).length;
      if (wordCount > 30) {
        return res.status(400).json({
          success: false,
          message: 'Scheme description must be 30 words or less'
        });
      }
    }

    // Validate URL format
    try {
      new URL(link);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid URL for the scheme link'
      });
    }

    const updateData = {
      schemeName: schemeName.trim(),
      schemeDescription: schemeDescription ? schemeDescription.trim() : '',
      link: link.trim()
    };

    const updatedScheme = await InstituteGovernmentScheme.updateInstituteScheme(
      instituteId, 
      schemeId, 
      updateData
    );

    res.status(200).json({
      success: true,
      data: updatedScheme,
      message: 'Government scheme updated successfully'
    });
  } catch (error) {
    console.error('Error updating institute government scheme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update government scheme',
      error: error.message
    });
  }
};

/**
 * Delete government scheme for institute
 */
const deleteInstituteGovernmentScheme = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    const { schemeId } = req.params;

    await InstituteGovernmentScheme.deleteInstituteScheme(instituteId, schemeId);

    res.status(200).json({
      success: true,
      message: 'Government scheme deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting institute government scheme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete government scheme',
      error: error.message
    });
  }
};

module.exports = {
  addInstituteGovernmentScheme,
  getInstituteGovernmentSchemes,
  getPublicInstituteGovernmentSchemes,
  updateInstituteGovernmentScheme,
  deleteInstituteGovernmentScheme
};