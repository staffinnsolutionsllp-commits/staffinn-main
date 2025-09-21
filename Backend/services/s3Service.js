/**
 * S3 Service
 * Handles file uploads to Amazon S3
 */
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const awsConfig = require('../config/aws');

// Initialize S3 client
const s3Client = new S3Client(awsConfig);

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

/**
 * Upload file to S3
 * @param {object} file - File object from multer
 * @param {string} key - S3 object key (file path)
 * @returns {Promise<object>} - Upload result with file URL
 */
const uploadFile = async (file, key) => {
  try {
    console.log('S3 Upload - Starting upload:', {
      key,
      fileSize: file.size,
      mimeType: file.mimetype,
      bucket: BUCKET_NAME
    });

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'max-age=31536000'
    };

    const command = new PutObjectCommand(uploadParams);
    const result = await s3Client.send(command);

    // Return permanent public URL instead of pre-signed URL
    const fileUrl = getFileUrl(key);

    console.log('S3 Upload - Success:', {
      key,
      fileUrl,
      etag: result.ETag,
      bucket: BUCKET_NAME
    });

    // Verify the URL is properly formed
    if (!fileUrl) {
      throw new Error('Failed to generate file URL after upload');
    }

    return {
      success: true,
      Location: fileUrl,
      url: fileUrl, // Add url field for compatibility
      Key: key,
      Bucket: BUCKET_NAME,
      ETag: result.ETag
    };
  } catch (error) {
    console.error('S3 upload error:', {
      key,
      error: error.message,
      stack: error.stack,
      bucket: BUCKET_NAME
    });
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload multiple files to S3
 * @param {Array} files - Array of file objects
 * @param {string} baseKey - Base path for files
 * @returns {Promise<Array>} - Array of upload results
 */
const uploadMultipleFiles = async (files, baseKey) => {
  try {
    const uploadPromises = files.map((file, index) => {
      const key = `${baseKey}/${Date.now()}-${index}-${file.originalname}`;
      return uploadFile(file, key);
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('S3 multiple upload error:', error);
    throw new Error(`Failed to upload multiple files: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>} - Success status
 */
const deleteFile = async (key) => {
  try {
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Delete multiple files from S3
 * @param {Array} keys - Array of S3 object keys
 * @returns {Promise<boolean>} - Success status
 */
const deleteMultipleFiles = async (keys) => {
  try {
    const deletePromises = keys.map(key => deleteFile(key));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('S3 multiple delete error:', error);
    throw new Error(`Failed to delete multiple files: ${error.message}`);
  }
};

/**
 * Generate pre-signed URL for file access
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<string>} - Pre-signed URL
 */
const getPresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('S3 presigned URL error:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

/**
 * Upload profile photo
 * @param {object} file - File object
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Upload result
 */
const uploadProfilePhoto = async (file, userId) => {
  try {
    // Validate file type
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    const key = `staff-profiles/${userId}/profile-photo-${Date.now()}.${file.mimetype.split('/')[1]}`;
    return await uploadFile(file, key);
  } catch (error) {
    console.error('Profile photo upload error:', error);
    throw error;
  }
};

/**
 * Upload resume PDF
 * @param {object} file - File object
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Upload result
 */
const uploadResume = async (file, userId) => {
  try {
    // Validate file type
    if (file.mimetype !== 'application/pdf') {
      throw new Error('Resume must be a PDF file');
    }

    // Validate file size (5GB limit)
    if (file.size > 5 * 1024 * 1024 * 1024) {
      throw new Error('File size must be less than 5GB');
    }

    const key = `staff-profiles/${userId}/resume-${Date.now()}.pdf`;
    return await uploadFile(file, key);
  } catch (error) {
    console.error('Resume upload error:', error);
    throw error;
  }
};

/**
 * Upload certificate PDF
 * @param {object} file - File object
 * @param {string} userId - User ID
 * @param {string} certificateName - Certificate name
 * @returns {Promise<object>} - Upload result
 */
const uploadCertificate = async (file, userId, certificateName = 'certificate') => {
  try {
    // Validate file type
    if (file.mimetype !== 'application/pdf') {
      throw new Error('Certificate must be a PDF file');
    }

    // Validate file size (5GB limit)
    if (file.size > 5 * 1024 * 1024 * 1024) {
      throw new Error('File size must be less than 5GB');
    }

    const sanitizedName = certificateName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const key = `staff-profiles/${userId}/certificates/${sanitizedName}-${Date.now()}.pdf`;
    return await uploadFile(file, key);
  } catch (error) {
    console.error('Certificate upload error:', error);
    throw error;
  }
};

/**
 * Get file URL from key
 * @param {string} key - S3 object key
 * @returns {string} - Public file URL
 */
const getFileUrl = (key) => {
  if (!key) {
    console.error('No key provided for getFileUrl');
    return null;
  }
  
  // Use CloudFront URL if available, otherwise use direct S3 URL
  const cloudFrontUrl = process.env.CLOUDFRONT_URL;
  if (cloudFrontUrl) {
    // Remove leading slash from key if present
    const cleanKey = key.startsWith('/') ? key.substring(1) : key;
    return `${cloudFrontUrl}/${cleanKey}`;
  }
  
  // Generate proper S3 URL with correct region
  const region = process.env.AWS_REGION || 'ap-south-1';
  const cleanKey = key.startsWith('/') ? key.substring(1) : key;
  const url = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${cleanKey}`;
  console.log('Generated S3 URL:', { key, cleanKey, url });
  return url;
};

/**
 * Extract key from S3 URL
 * @param {string} url - S3 file URL
 * @returns {string|null} - S3 object key
 */
const extractKeyFromUrl = (url) => {
  try {
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part.includes('.s3.'));
    if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
      return urlParts.slice(bucketIndex + 1).join('/');
    }
    return null;
  } catch (error) {
    console.error('Extract key from URL error:', error);
    return null;
  }
};

/**
 * Check if file exists in S3
 * @param {string} key - S3 object key
 * @returns {Promise<boolean>} - File existence status
 */
const fileExists = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    console.error('S3 file exists check error:', error);
    throw error;
  }
};

/**
 * Get file metadata
 * @param {string} key - S3 object key
 * @returns {Promise<object>} - File metadata
 */
const getFileMetadata = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const response = await s3Client.send(command);
    
    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      etag: response.ETag
    };
  } catch (error) {
    console.error('S3 get file metadata error:', error);
    throw new Error(`Failed to get file metadata: ${error.message}`);
  }
};

/**
 * List files in a directory
 * @param {string} prefix - Directory prefix
 * @returns {Promise<Array>} - Array of file objects
 */
const listFiles = async (prefix) => {
  try {
    const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
    
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix
    });

    const response = await s3Client.send(command);
    
    return (response.Contents || []).map(obj => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
      url: getFileUrl(obj.Key)
    }));
  } catch (error) {
    console.error('S3 list files error:', error);
    throw new Error(`Failed to list files: ${error.message}`);
  }
};

module.exports = {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  deleteMultipleFiles,
  getPresignedUrl,
  uploadProfilePhoto,
  uploadResume,
  uploadCertificate,
  getFileUrl,
  extractKeyFromUrl,
  fileExists,
  getFileMetadata,
  listFiles,
  s3Client,
  BUCKET_NAME
};