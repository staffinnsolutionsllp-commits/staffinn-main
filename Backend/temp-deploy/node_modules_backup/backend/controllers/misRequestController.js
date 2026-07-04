/**
 * MIS Request Controller
 * Handles MIS requests for Staffinn Partner institutes
 */

const misRequestModel = require('../models/misRequestModel');
const userModel = require('../models/userModel');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const { emitMisStatusUpdate } = require('../websocket/websocketServer');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

/**
 * Upload signed PDF for MIS request
 * @route POST /api/institute/mis-request/upload
 */
const uploadSignedPdf = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file provided'
      });
    }

    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid PDF file'
      });
    }

    // Get institute details
    const institute = await userModel.getUserById(userId);
    if (!institute || institute.role !== 'institute') {
      return res.status(404).json({
        success: false,
        message: 'Institute not found'
      });
    }

    // Check if institute is Staffinn Partner
    if (institute.instituteType !== 'staffinn_partner') {
      return res.status(403).json({
        success: false,
        message: 'Only Staffinn Partner institutes can upload MIS requests'
      });
    }

    // Generate unique filename
    const fileName = `mis-${userId}-${Date.now()}.pdf`;
    const key = `mis-agreements/${fileName}`;

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      CacheControl: 'max-age=31536000'
    });

    await s3Client.send(uploadCommand);

    // Create S3 URL
    const pdfUrl = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Create MIS request
    const misRequestData = {
      instituteId: userId,
      instituteName: institute.instituteName,
      email: institute.email,
      instituteNumber: institute.phoneNumber,
      pdfUrl: pdfUrl
    };

    const misRequest = await misRequestModel.createMisRequest(misRequestData);

    res.status(200).json({
      success: true,
      message: 'MIS request submitted successfully',
      data: misRequest
    });

  } catch (error) {
    console.error('Upload signed PDF error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload PDF'
    });
  }
};

/**
 * Get all MIS requests (Admin only)
 * @route GET /api/admin/mis-requests
 */
const getAllMisRequests = async (req, res) => {
  try {
    const requests = await misRequestModel.getAllMisRequests();
    
    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get MIS requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch MIS requests'
    });
  }
};

/**
 * Approve MIS request (Admin only)
 * @route PUT /api/admin/mis-requests/:requestId/approve
 */
const approveMisRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Get MIS request details
    const misRequest = await misRequestModel.getMisRequestById(requestId);
    if (!misRequest) {
      return res.status(404).json({
        success: false,
        message: 'MIS request not found'
      });
    }

    // Update MIS request status
    await misRequestModel.updateMisRequestStatus(requestId, 'approved');

    // Update institute to mark MIS as approved
    await userModel.updateUser(misRequest.instituteId, {
      misApproved: true,
      misApprovalStatus: 'approved'
    });

    // Emit real-time status update
    console.log(`📡 About to emit MIS status update to institute ${misRequest.instituteId}`);
    emitMisStatusUpdate(misRequest.instituteId, 'approved');
    console.log(`📡 MIS status update emitted successfully`);

    console.log(`✅ MIS request ${requestId} approved for institute ${misRequest.instituteId}`);
    console.log(`🎉 Institute ${misRequest.instituteName} now has access to full Staffinn Partner features`);
    console.log(`📡 Real-time update sent to institute ${misRequest.instituteId}`);

    res.status(200).json({
      success: true,
      message: 'MIS request approved successfully'
    });
  } catch (error) {
    console.error('Approve MIS request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve MIS request'
    });
  }
};

/**
 * Reject MIS request (Admin only)
 * @route PUT /api/admin/mis-requests/:requestId/reject
 */
const rejectMisRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Get MIS request details
    const misRequest = await misRequestModel.getMisRequestById(requestId);
    if (!misRequest) {
      return res.status(404).json({
        success: false,
        message: 'MIS request not found'
      });
    }

    // Update MIS request status
    await misRequestModel.updateMisRequestStatus(requestId, 'rejected');

    // Update institute to mark MIS as rejected
    await userModel.updateUser(misRequest.instituteId, {
      misApproved: false,
      misApprovalStatus: 'rejected'
    });

    // Emit real-time status update
    console.log(`📡 About to emit MIS status update to institute ${misRequest.instituteId}`);
    emitMisStatusUpdate(misRequest.instituteId, 'rejected');
    console.log(`📡 MIS status update emitted successfully`);

    console.log(`❌ MIS request ${requestId} rejected for institute ${misRequest.instituteId}`);
    console.log(`📡 Real-time update sent to institute ${misRequest.instituteId}`);

    res.status(200).json({
      success: true,
      message: 'MIS request rejected successfully'
    });
  } catch (error) {
    console.error('Reject MIS request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject MIS request'
    });
  }
};

/**
 * Delete MIS request (Admin only)
 * @route DELETE /api/admin/mis-requests/:requestId
 */
const deleteMisRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Get MIS request to get PDF URL for deletion
    const misRequest = await misRequestModel.getMisRequestById(requestId);
    
    if (misRequest && misRequest.pdfUrl) {
      try {
        // Extract key from URL and delete from S3
        const key = misRequest.pdfUrl.split('/').slice(-2).join('/');
        const deleteCommand = new DeleteObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: key
        });
        await s3Client.send(deleteCommand);
      } catch (s3Error) {
        console.error('Error deleting PDF from S3:', s3Error);
      }
    }

    // Delete MIS request
    await misRequestModel.deleteMisRequest(requestId);

    res.status(200).json({
      success: true,
      message: 'MIS request deleted successfully'
    });
  } catch (error) {
    console.error('Delete MIS request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete MIS request'
    });
  }
};

module.exports = {
  uploadSignedPdf,
  getAllMisRequests,
  approveMisRequest,
  rejectMisRequest,
  deleteMisRequest
};