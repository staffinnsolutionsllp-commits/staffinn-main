# Backend Requirements for File Upload Feature

## Overview
The chat system now supports file uploads (documents, photos, videos) with AWS S3 storage. This document outlines the backend API requirements.

## New API Endpoint Required

### POST `/api/v1/messages/send-file`

**Purpose**: Upload files to AWS S3 and create a message with file attachment

**Request Type**: `multipart/form-data`

**Request Body**:
```
- file: File (binary)
- receiverId: String (userId of recipient)
- fileType: String ('document' | 'photo' | 'video')
- subject: String (message subject)
```

**Response Format**:
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "messageId": "msg_123456",
    "fileUrl": "https://s3.amazonaws.com/bucket-name/files/user123/filename.pdf",
    "fileName": "document.pdf",
    "fileType": "document",
    "fileSize": 1024000,
    "createdAt": "2024-01-08T10:30:00Z"
  }
}
```

## AWS S3 Configuration

### Bucket Structure
```
staffinn-chat-files/
├── documents/
│   ├── {userId}/
│   │   └── {timestamp}_{filename}
├── photos/
│   ├── {userId}/
│   │   └── {timestamp}_{filename}
└── videos/
    ├── {userId}/
        └── {timestamp}_{filename}
```

### File Naming Convention
- Format: `{userId}_{timestamp}_{originalFilename}`
- Example: `user123_1704710400000_document.pdf`

### Security Requirements
1. **File Size Limits**:
   - Documents: Max 10MB
   - Photos: Max 5MB
   - Videos: Max 50MB

2. **Allowed File Types**:
   - Documents: `.pdf`, `.doc`, `.docx`, `.txt`, `.xls`, `.xlsx`, `.ppt`, `.pptx`
   - Photos: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
   - Videos: `.mp4`, `.mov`, `.avi`, `.mkv`

3. **Access Control**:
   - Files should be private by default
   - Generate signed URLs with 1-hour expiration for viewing
   - Only sender and receiver should have access

4. **Data Isolation**:
   - Each conversation's files are isolated
   - Files are organized by userId
   - No cross-user file access

## Database Schema Updates

### Messages Table
Add new fields to existing messages table:

```javascript
{
  messageId: String,
  senderId: String,
  receiverId: String,
  subject: String,
  message: String,
  messageType: String, // 'text' | 'document' | 'photo' | 'video'
  fileUrl: String,     // S3 URL (NEW)
  fileName: String,    // Original filename (NEW)
  fileSize: Number,    // File size in bytes (NEW)
  fileType: String,    // MIME type (NEW)
  createdAt: String,
  status: String,
  // ... other existing fields
}
```

## Implementation Steps

### 1. Install Required Packages
```bash
npm install aws-sdk multer multer-s3
```

### 2. AWS S3 Setup
```javascript
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});
```

### 3. Multer Configuration
```javascript
const multer = require('multer');
const multerS3 = require('multer-s3');

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: 'private',
    metadata: function (req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        uploadedBy: req.user.userId
      });
    },
    key: function (req, file, cb) {
      const fileType = req.body.fileType;
      const userId = req.user.userId;
      const timestamp = Date.now();
      const filename = `${userId}_${timestamp}_${file.originalname}`;
      cb(null, `${fileType}s/${userId}/${filename}`);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = {
      'document': ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx'],
      'photo': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'video': ['.mp4', '.mov', '.avi', '.mkv']
    };
    
    const ext = path.extname(file.originalname).toLowerCase();
    const fileType = req.body.fileType;
    
    if (allowedTypes[fileType] && allowedTypes[fileType].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

### 4. Route Handler
```javascript
router.post('/send-file', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { receiverId, fileType, subject } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Create message in database
    const message = {
      messageId: generateMessageId(),
      senderId: req.user.userId,
      receiverId: receiverId,
      subject: subject,
      message: file.originalname,
      messageType: fileType,
      fileUrl: file.location, // S3 URL
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      createdAt: new Date().toISOString(),
      status: 'sent'
    };
    
    // Save to DynamoDB
    await saveMessage(message);
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: message
    });
    
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file'
    });
  }
});
```

### 5. Generate Signed URLs for Viewing
```javascript
const getSignedUrl = (fileKey) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileKey,
    Expires: 3600 // 1 hour
  };
  
  return s3.getSignedUrl('getObject', params);
};
```

### 6. Update getConversation API
Modify the existing conversation API to return signed URLs for files:

```javascript
router.get('/conversation/:userId', authenticate, async (req, res) => {
  try {
    const messages = await getConversationMessages(
      req.user.userId,
      req.params.userId
    );
    
    // Generate signed URLs for file messages
    const messagesWithSignedUrls = messages.map(msg => {
      if (msg.fileUrl && msg.messageType !== 'text') {
        const fileKey = msg.fileUrl.split('.com/')[1]; // Extract key from URL
        msg.fileUrl = getSignedUrl(fileKey);
      }
      return msg;
    });
    
    res.json({
      success: true,
      data: {
        messages: messagesWithSignedUrls
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation'
    });
  }
});
```

## Environment Variables Required

Add these to your `.env` file:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=staffinn-chat-files
```

## Testing Checklist

- [ ] File upload works for documents
- [ ] File upload works for photos
- [ ] File upload works for videos
- [ ] File size limits are enforced
- [ ] File type validation works
- [ ] Files are stored in correct S3 folders
- [ ] Signed URLs are generated correctly
- [ ] Only sender and receiver can access files
- [ ] Files are isolated per conversation
- [ ] Error handling works for failed uploads
- [ ] Messages with files appear in conversation

## Security Considerations

1. **Authentication**: All file upload requests must be authenticated
2. **Authorization**: Users can only upload files to their own conversations
3. **Validation**: Strict file type and size validation
4. **Encryption**: Use S3 server-side encryption (SSE-S3 or SSE-KMS)
5. **Access Control**: Private ACL with signed URLs only
6. **Rate Limiting**: Implement rate limiting to prevent abuse
7. **Virus Scanning**: Consider integrating AWS Lambda for virus scanning

## Frontend Integration Complete

The frontend has been updated with:
- ✅ File upload UI with + button
- ✅ Document/Photo/Video selection menu
- ✅ File upload progress handling
- ✅ Display of different file types in chat
- ✅ Profile photo display in chat header
- ✅ Proper send icon (paper plane)
- ✅ Real-time message updates

## Next Steps

1. Implement the backend API endpoint as described above
2. Set up AWS S3 bucket with proper permissions
3. Configure environment variables
4. Test file uploads thoroughly
5. Monitor S3 storage usage and costs
6. Set up S3 lifecycle policies for old files (optional)
