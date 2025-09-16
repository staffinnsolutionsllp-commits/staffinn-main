# Video URL Fix Guide

This guide explains how to fix the "Video not available. URL: No URL" issue in your staff dashboard course section.

## Issues Identified

1. **S3 URL Generation**: The S3 service wasn't properly generating accessible URLs
2. **File Upload Handling**: Content URLs weren't being saved correctly in DynamoDB
3. **Missing Error Handling**: Upload failures weren't properly handled
4. **Region Configuration**: S3 URLs were using wrong region (us-east-1 instead of ap-south-1)

## Fixes Applied

### 1. Backend Fixes

#### S3Service.js
- Fixed URL generation to use correct AWS region (ap-south-1)
- Added proper error handling and validation
- Enhanced logging for debugging
- Added both `Location` and `url` fields for compatibility

#### InstituteCourseController.js
- Improved file upload error handling
- Added validation for video content URLs
- Enhanced logging and debugging information
- Added debug info to content records

#### Routes
- Added debug endpoint: `GET /institutes/courses/:courseId/debug`
- Added fix endpoint: `POST /institutes/courses/:courseId/fix-urls`

### 2. Frontend Fixes

#### API Service
- Added `debugCourseContent()` method
- Added `fixCourseContentUrls()` method

#### Course Learning Page
- Enhanced video error display
- Added debug buttons for troubleshooting
- Improved error handling and user feedback

## How to Fix Existing Issues

### Step 1: Test S3 Connection
```bash
cd Backend
node test-s3-connection.js
```

### Step 2: Fix Existing Course URLs
```bash
cd Backend
node fix-course-urls.js
```

### Step 3: Use Frontend Debug Tools
1. Go to any course with missing video URLs
2. Click "Debug Course" to see detailed information
3. Click "Fix URLs" to attempt automatic repair
4. Refresh the page to see results

### Step 4: Manual Debugging
Use the debug endpoint directly:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:4001/api/v1/institutes/courses/COURSE_ID/debug
```

## Environment Variables Check

Ensure these are properly set in your `.env` file:
```
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=staffinn-files
```

## S3 Bucket Configuration

Your S3 bucket should have:
1. **Public read access** for uploaded files
2. **CORS configuration** for web access
3. **Proper IAM permissions** for your AWS credentials

### Required S3 Bucket Policy
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::staffinn-files/*"
        }
    ]
}
```

### Required CORS Configuration
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## Troubleshooting

### Issue: Videos still not loading
1. Check browser console for CORS errors
2. Verify S3 bucket permissions
3. Test URL accessibility directly in browser
4. Run the debug tools to check URL format

### Issue: Upload fails
1. Check AWS credentials
2. Verify S3 bucket exists and is accessible
3. Check file size limits (500MB max)
4. Verify network connectivity to AWS

### Issue: URLs are generated but videos don't play
1. Check video file format (MP4, WebM, OGG supported)
2. Verify file isn't corrupted
3. Test with different browsers
4. Check video codec compatibility

## Prevention

To prevent future issues:
1. Always test file uploads in development
2. Monitor S3 upload success rates
3. Implement proper error handling in upload forms
4. Use the debug endpoints for troubleshooting
5. Regular backup of course content

## Support

If issues persist:
1. Check the browser console for errors
2. Review server logs for upload failures
3. Use the debug endpoints to gather information
4. Verify AWS service status
5. Test with a simple video file upload

## Files Modified

### Backend
- `services/s3Service.js` - Fixed URL generation and error handling
- `controllers/instituteCourseController.js` - Enhanced upload handling and debugging
- `routes/instituteRoutes.js` - Added debug and fix endpoints

### Frontend
- `services/api.js` - Added debug API methods
- `Components/Pages/CourseLearningPage.jsx` - Enhanced error display and debug tools
- `Components/Pages/CourseLearningPage.css` - Added styling for debug buttons

### New Files
- `test-s3-connection.js` - S3 connectivity test script
- `fix-course-urls.js` - Batch fix script for existing courses
- `VIDEO_URL_FIX_GUIDE.md` - This documentation