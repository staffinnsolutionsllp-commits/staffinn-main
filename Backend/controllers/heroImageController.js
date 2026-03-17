/**
 * Hero Image Controller
 * Handles hero image uploads and management for home page
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const s3Service = require('../services/s3Service');
const awsConfig = require('../config/aws');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const HERO_IMAGES_TABLE = 'Hero-images';

/**
 * Upload hero images for a specific section
 */
const uploadHeroImages = async (req, res) => {
  try {
    const { section } = req.params; // 'home', 'staff', 'institute', or 'recruiter'
    console.log('Upload hero images request received for section:', section);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    // Upload images to S3
    const uploadPromises = req.files.map((file, index) => {
      const key = `hero-images/${section}/${Date.now()}-${index}-${file.originalname}`;
      return s3Service.uploadFile(file, key);
    });

    const uploadResults = await Promise.all(uploadPromises);
    
    // Get existing hero images
    const getCommand = new GetCommand({
      TableName: HERO_IMAGES_TABLE,
      Key: { heroimage: section }
    });
    
    const existingData = await docClient.send(getCommand);
    const existingImages = existingData.Item?.images || [];
    
    // Prepare new images data
    const newImages = uploadResults.map((result, index) => ({
      imageId: `${Date.now()}-${index}`,
      url: result.url,
      key: result.Key,
      uploadedAt: new Date().toISOString(),
      order: existingImages.length + index
    }));
    
    // Combine with existing images
    const allImages = [...existingImages, ...newImages];
    
    // Save to DynamoDB
    const putCommand = new PutCommand({
      TableName: HERO_IMAGES_TABLE,
      Item: {
        heroimage: section,
        images: allImages,
        updatedAt: new Date().toISOString()
      }
    });
    
    await docClient.send(putCommand);
    
    console.log('Hero images uploaded successfully:', newImages.length);
    
    res.status(200).json({
      success: true,
      message: `${newImages.length} image(s) uploaded successfully`,
      data: {
        uploadedImages: newImages,
        totalImages: allImages.length
      }
    });
  } catch (error) {
    console.error('Upload hero images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload hero images',
      error: error.message
    });
  }
};

/**
 * Get hero images for a specific section (PUBLIC - No authentication required)
 */
const getPublicHeroImages = async (req, res) => {
  try {
    const { section } = req.params; // 'home', 'staff', 'institute', or 'recruiter'
    
    const getCommand = new GetCommand({
      TableName: HERO_IMAGES_TABLE,
      Key: { heroimage: section }
    });
    
    const result = await docClient.send(getCommand);
    
    if (!result.Item || !result.Item.images) {
      return res.status(200).json({
        success: true,
        data: {
          images: []
        }
      });
    }
    
    // Sort images by order
    const sortedImages = result.Item.images.sort((a, b) => a.order - b.order);
    
    res.status(200).json({
      success: true,
      data: {
        images: sortedImages
      }
    });
  } catch (error) {
    console.error('Get public hero images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hero images',
      error: error.message
    });
  }
};

/**
 * Get hero images for a specific section
 */
const getHeroImages = async (req, res) => {
  try {
    const { section } = req.params; // 'home', 'staff', 'institute', or 'recruiter'
    
    const getCommand = new GetCommand({
      TableName: HERO_IMAGES_TABLE,
      Key: { heroimage: section }
    });
    
    const result = await docClient.send(getCommand);
    
    if (!result.Item || !result.Item.images) {
      return res.status(200).json({
        success: true,
        data: {
          images: []
        }
      });
    }
    
    // Sort images by order
    const sortedImages = result.Item.images.sort((a, b) => a.order - b.order);
    
    res.status(200).json({
      success: true,
      data: {
        images: sortedImages
      }
    });
  } catch (error) {
    console.error('Get hero images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get hero images',
      error: error.message
    });
  }
};

/**
 * Delete a specific hero image from a section
 */
const deleteHeroImage = async (req, res) => {
  try {
    const { section, imageId } = req.params;
    
    if (!imageId) {
      return res.status(400).json({
        success: false,
        message: 'Image ID is required'
      });
    }
    
    // Get existing hero images
    const getCommand = new GetCommand({
      TableName: HERO_IMAGES_TABLE,
      Key: { heroimage: section }
    });
    
    const existingData = await docClient.send(getCommand);
    
    if (!existingData.Item || !existingData.Item.images) {
      return res.status(404).json({
        success: false,
        message: 'No hero images found'
      });
    }
    
    const images = existingData.Item.images;
    const imageToDelete = images.find(img => img.imageId === imageId);
    
    if (!imageToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Delete from S3
    await s3Service.deleteFile(imageToDelete.key);
    
    // Remove from array
    const updatedImages = images.filter(img => img.imageId !== imageId);
    
    // Update DynamoDB
    const putCommand = new PutCommand({
      TableName: HERO_IMAGES_TABLE,
      Item: {
        heroimage: section,
        images: updatedImages,
        updatedAt: new Date().toISOString()
      }
    });
    
    await docClient.send(putCommand);
    
    res.status(200).json({
      success: true,
      message: 'Hero image deleted successfully',
      data: {
        remainingImages: updatedImages.length
      }
    });
  } catch (error) {
    console.error('Delete hero image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete hero image',
      error: error.message
    });
  }
};

/**
 * Reorder hero images for a section
 */
const reorderHeroImages = async (req, res) => {
  try {
    const { section } = req.params;
    const { imageIds } = req.body;
    
    if (!imageIds || !Array.isArray(imageIds)) {
      return res.status(400).json({
        success: false,
        message: 'Image IDs array is required'
      });
    }
    
    // Get existing hero images
    const getCommand = new GetCommand({
      TableName: HERO_IMAGES_TABLE,
      Key: { heroimage: section }
    });
    
    const existingData = await docClient.send(getCommand);
    
    if (!existingData.Item || !existingData.Item.images) {
      return res.status(404).json({
        success: false,
        message: 'No hero images found'
      });
    }
    
    const images = existingData.Item.images;
    
    // Reorder images based on provided IDs
    const reorderedImages = imageIds.map((id, index) => {
      const image = images.find(img => img.imageId === id);
      if (image) {
        return { ...image, order: index };
      }
      return null;
    }).filter(img => img !== null);
    
    // Update DynamoDB
    const putCommand = new PutCommand({
      TableName: HERO_IMAGES_TABLE,
      Item: {
        heroimage: section,
        images: reorderedImages,
        updatedAt: new Date().toISOString()
      }
    });
    
    await docClient.send(putCommand);
    
    res.status(200).json({
      success: true,
      message: 'Hero images reordered successfully',
      data: {
        images: reorderedImages
      }
    });
  } catch (error) {
    console.error('Reorder hero images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder hero images',
      error: error.message
    });
  }
};

/**
 * Delete all hero images for a section
 */
const deleteAllHeroImages = async (req, res) => {
  try {
    const { section } = req.params;
    
    // Get existing hero images
    const getCommand = new GetCommand({
      TableName: HERO_IMAGES_TABLE,
      Key: { heroimage: section }
    });
    
    const existingData = await docClient.send(getCommand);
    
    if (!existingData.Item || !existingData.Item.images || existingData.Item.images.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No hero images to delete'
      });
    }
    
    const images = existingData.Item.images;
    
    // Delete all images from S3
    const deletePromises = images.map(img => s3Service.deleteFile(img.key));
    await Promise.all(deletePromises);
    
    // Update DynamoDB with empty array
    const putCommand = new PutCommand({
      TableName: HERO_IMAGES_TABLE,
      Item: {
        heroimage: section,
        images: [],
        updatedAt: new Date().toISOString()
      }
    });
    
    await docClient.send(putCommand);
    
    res.status(200).json({
      success: true,
      message: `${images.length} hero image(s) deleted successfully`
    });
  } catch (error) {
    console.error('Delete all hero images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete all hero images',
      error: error.message
    });
  }
};

module.exports = {
  uploadHeroImages,
  getHeroImages,
  getPublicHeroImages,
  deleteHeroImage,
  reorderHeroImages,
  deleteAllHeroImages
};
