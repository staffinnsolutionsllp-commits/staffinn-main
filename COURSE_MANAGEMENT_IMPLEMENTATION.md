# Course Management System Implementation

## Overview

This document outlines the implementation of the new course management system for Staffinn, which uses a single DynamoDB table approach with real-time S3 file uploads.

## Architecture Changes

### Database Structure

#### 1. `staffinn-courses` Table
- **Partition Key**: `coursesId` (String)
- **Purpose**: Stores all course data including modules and content in a single document
- **Structure**:
```json
{
  "coursesId": "uuid",
  "instituteId": "string",
  "courseName": "string",
  "duration": "string",
  "fees": "number",
  "instructor": "string",
  "category": "string",
  "mode": "Online|Offline",
  "thumbnailUrl": "string|null",
  "description": "string",
  "prerequisites": "string",
  "syllabusOverview": "string",
  "certification": "Basic|Advanced|Professional|None",
  "modules": [
    {
      "moduleId": "uuid",
      "title": "string",
      "description": "string",
      "order": "number",
      "content": [
        {
          "contentId": "uuid",
          "title": "string",
          "type": "video|assignment|quiz",
          "fileUrl": "string|null",
          "order": "number",
          "duration": "number",
          "mandatory": "boolean"
        }
      ]
    }
  ],
  "isActive": "boolean",
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

#### 2. `course-enrolled-user` Table
- **Partition Key**: `enrolledID` (String)
- **Purpose**: Tracks user enrollments in courses
- **Structure**:
```json
{
  "enrolledID": "uuid",
  "userId": "string",
  "courseId": "string",
  "enrollmentDate": "ISO string",
  "progressPercentage": "number",
  "status": "active|completed|suspended",
  "paymentStatus": "free|paid|pending"
}
```

### S3 Directory Structure

All course-related files are stored in S3 with the following structure:
```
staffinn-files/
  staffinn-courses-content/
    courses/
      thumbnails/
        {courseId}.{ext}
      {courseId}_{moduleId}_{contentId}.{ext}
```

## Implementation Details

### Backend Changes

#### 1. Course Controller (`instituteCourseController.js`)
- **Updated**: Uses single table structure
- **Features**:
  - Real-time file uploads to S3
  - Proper error handling
  - Module and content processing
  - Enrollment management

#### 2. Course Model (`instituteCourseModel.js`)
- **Updated**: Simplified for single table approach
- **Features**:
  - Course creation and retrieval
  - Active course counting
  - Error caching to prevent repeated failures

#### 3. S3 Service (`s3Service.js`)
- **Maintained**: Existing service works with new directory structure
- **Features**:
  - File upload with proper naming
  - URL generation
  - File existence checking

### Frontend Changes

#### 1. Enhanced Course Form (`EnhancedCourseForm.jsx`)
- **Updated**: New field structure and content types
- **Features**:
  - Support for Video, Assignment, and Quiz content types
  - Certification dropdown instead of checkbox
  - Additional category options
  - Real-time file upload handling

### API Endpoints

#### Course Management
- `POST /api/v1/institutes/courses` - Create new course
- `GET /api/v1/institutes/courses` - Get institute courses
- `GET /api/v1/institutes/active-courses-count` - Get active course count
- `GET /api/v1/institutes/public/{instituteId}/courses` - Get public courses
- `GET /api/v1/institutes/courses/{courseId}/public` - Get public course by ID

#### Enrollment Management
- `POST /api/v1/institutes/courses/{courseId}/enroll` - Enroll in course
- `GET /api/v1/institutes/courses/{courseId}/enrollment-status` - Check enrollment
- `GET /api/v1/institutes/my-enrollments` - Get user enrollments
- `GET /api/v1/institutes/courses/{courseId}/content` - Get course content (enrolled users)

#### Progress Tracking
- `PUT /api/v1/institutes/courses/content/{contentId}/progress` - Update progress

## Setup Instructions

### 1. Create DynamoDB Tables
```bash
cd Backend
node scripts/createCoursesTables.js
```

### 2. Environment Variables
Ensure these variables are set in your `.env` file:
```env
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket-name
```

### 3. Test the Implementation
```bash
cd Backend
node test-course-workflow.js
```

## Course Creation Workflow

### Institute Dashboard Flow
1. Institute logs into dashboard
2. Navigates to Courses section via sidebar
3. Clicks "Add New Course"
4. Fills out course form:
   - Course Name *
   - Duration * (e.g., "6 months")
   - Fees * (e.g., ₹15,000)
   - Instructor *
   - Category * (dropdown selection)
   - Mode (Online/Offline)
   - Course Thumbnail (file upload)
   - Course Description
   - Prerequisites
   - Syllabus Overview
   - Certification (dropdown selection)

### Module Creation
1. Add multiple modules to the course
2. For each module:
   - Module Title
   - Module Description
   - Add multiple content items:
     - Content Title
     - Content Type (Video/Assignment/Quiz)
     - File Upload (based on content type)

### Real-time Processing
1. **File Upload**: Files are immediately uploaded to S3 with proper naming
2. **URL Storage**: File URLs are stored in the course document
3. **Data Persistence**: All data is saved to `staffinn-courses` table
4. **Enrollment Tracking**: User enrollments are tracked in `course-enrolled-user` table

## User Enrollment Workflow

### Enrollment Process
1. User discovers course through institute's public page
2. Views course details and modules
3. Clicks "Enroll" button
4. System creates enrollment record in `course-enrolled-user` table
5. User gains access to course content

### Content Access
1. Enrolled users can access course content
2. Progress tracking is available (can be enhanced later)
3. File URLs provide direct access to S3 content

## Security Considerations

### File Upload Security
- File type validation
- File size limits
- Proper S3 key naming to prevent conflicts
- Error handling for upload failures

### Access Control
- Authentication required for course creation
- Enrollment verification for content access
- Institute-specific course management

### Data Integrity
- UUID generation for unique identifiers
- Proper error handling and rollback
- Validation of required fields

## Performance Optimizations

### Single Table Benefits
- Reduced database queries
- Atomic operations for course data
- Simplified data relationships

### S3 Optimizations
- Proper file naming for organization
- CloudFront integration ready
- Efficient file URL generation

## Future Enhancements

### Potential Improvements
1. **Progress Tracking**: Enhanced user progress analytics
2. **Quiz System**: Interactive quiz functionality
3. **Assignment Submission**: Student assignment upload system
4. **Video Streaming**: Optimized video delivery
5. **Content Versioning**: Version control for course updates
6. **Bulk Operations**: Batch course operations
7. **Analytics**: Course performance metrics

### Scalability Considerations
- DynamoDB auto-scaling
- S3 lifecycle policies
- CDN integration
- Caching strategies

## Troubleshooting

### Common Issues
1. **File Upload Failures**: Check S3 permissions and bucket configuration
2. **Table Not Found**: Run the table creation script
3. **Authentication Errors**: Verify AWS credentials
4. **Large File Uploads**: Check file size limits and timeout settings

### Debug Endpoints
- `GET /api/v1/institutes/courses/{courseId}/debug` - Debug course content
- Test script: `node test-course-workflow.js`

## Conclusion

This implementation provides a robust, scalable course management system that:
- Uses efficient single-table design
- Provides real-time file uploads
- Supports comprehensive course structures
- Enables proper enrollment tracking
- Maintains data integrity and security

The system is ready for production use and can be extended with additional features as needed.