# Institute Job Application Feature

## Overview
This feature allows institutes to apply their students to recruiter job postings through a student selection modal interface. The system supports both initial applications and reapplications with new students.

## Features

### ✅ Student Selection Modal
- **Confirmation Modal**: Before applying, institutes see a modal with all their students
- **Student Table**: Displays student name, email, phone, degree, and selection checkbox
- **Apply Button**: Only enabled when students are selected

### 🔄 Reapplication Support
- **Already Applied Status**: Jobs show "Applied (X)" where X is the number of students applied
- **Reapplication**: Institutes can click on already applied jobs to apply more students
- **Smart Selection**: Previously applied students appear with disabled checkboxes
- **New Students Only**: Only newly added students can be selected for reapplication

## Technical Implementation

### Backend Components

#### 1. Database Model
- **File**: `Backend/models/instituteJobApplicationModel.js`
- **Table**: `staffinn-institute-job-applications`
- **Functions**:
  - `applyStudentsToJob()` - Create new application
  - `getJobApplication()` - Get existing application
  - `updateJobApplication()` - Update with new students
  - `getInstituteApplications()` - Get all institute applications

#### 2. Controller
- **File**: `Backend/controllers/instituteJobApplicationController.js`
- **Endpoints**:
  - `POST /api/institutes/apply-students-to-job` - Apply students to job
  - `GET /api/institutes/job-application-status/:jobId` - Get application status
  - `GET /api/institutes/my-job-applications` - Get all applications

#### 3. Routes
- **File**: `Backend/routes/instituteRoutes.js`
- **Added Routes**:
  ```javascript
  router.post('/apply-students-to-job', applyStudentsToJob);
  router.get('/job-application-status/:jobId', getJobApplicationStatus);
  router.get('/my-job-applications', getMyJobApplications);
  ```

### Frontend Components

#### 1. Student Selection Modal
- **File**: `Frontend/src/Components/common/StudentSelectionModal.jsx`
- **Features**:
  - Student table with selection checkboxes
  - Previously applied students shown as disabled
  - Real-time selection count
  - Apply button with loading state

#### 2. Updated RecruiterPage
- **File**: `Frontend/src/Components/Pages/RecruiterPage.jsx`
- **Changes**:
  - Different apply button behavior for institutes vs staff
  - Job application status tracking
  - Student modal integration
  - Reapplication support

#### 3. API Service
- **File**: `Frontend/src/services/api.js`
- **New Methods**:
  - `applyStudentsToJob()` - Apply selected students
  - `getJobApplicationStatus()` - Check application status
  - `getMyJobApplications()` - Get all applications

### Database Schema

#### Institute Job Applications Table
```javascript
{
  applicationId: "uuid", // Primary key
  instituteId: "string", // Institute ID
  recruiterId: "string", // Recruiter ID
  jobId: "string", // Job ID
  jobTitle: "string", // Job title
  companyName: "string", // Company name
  selectedStudents: [ // Array of applied students
    {
      studentId: "string",
      fullName: "string",
      email: "string",
      phoneNumber: "string",
      degreeName: "string",
      specialization: "string"
    }
  ],
  appliedAt: "ISO string", // Application timestamp
  status: "pending" // Application status
}
```

## User Flow

### Initial Application
1. Institute visits recruiter's job page
2. Clicks "Apply Students" button
3. Student selection modal opens
4. Selects students from the table
5. Clicks "Apply X Students" button
6. Students are applied to the job
7. Button changes to "Applied (X)"

### Reapplication
1. Institute sees "Applied (X)" button on previously applied job
2. Clicks the button to apply more students
3. Modal opens showing:
   - Previously applied students (disabled checkboxes)
   - New students (selectable checkboxes)
4. Selects new students
5. Clicks "Apply X Students" button
6. Only new students are applied
7. Button updates count: "Applied (X+Y)"

## Installation & Setup

### 1. Database Setup
Run the table creation script:
```bash
node Backend/scripts/createInstituteJobApplicationsTable.js
```

### 2. Backend Dependencies
No new dependencies required - uses existing DynamoDB and Express setup.

### 3. Frontend Dependencies
No new dependencies required - uses existing React components and API service.

## API Endpoints

### Apply Students to Job
```http
POST /api/v1/institutes/apply-students-to-job
Authorization: Bearer <token>
Content-Type: application/json

{
  "recruiterId": "string",
  "jobId": "string", 
  "jobTitle": "string",
  "companyName": "string",
  "selectedStudents": [
    {
      "studentId": "string",
      "fullName": "string",
      "email": "string",
      "phoneNumber": "string",
      "degreeName": "string",
      "specialization": "string"
    }
  ]
}
```

### Get Job Application Status
```http
GET /api/v1/institutes/job-application-status/:jobId
Authorization: Bearer <token>
```

### Get All Applications
```http
GET /api/v1/institutes/my-job-applications
Authorization: Bearer <token>
```

## Error Handling

### Backend Validation
- Validates user authentication and role
- Ensures all required fields are provided
- Checks if selectedStudents is a valid array
- Handles duplicate applications gracefully

### Frontend Error Handling
- Shows loading states during API calls
- Displays error messages for failed operations
- Validates student selection before submission
- Handles network errors gracefully

## Security Considerations

### Authentication
- All endpoints require valid JWT token
- Role-based access control (institute users only)
- User ID extracted from token for data isolation

### Data Validation
- Input sanitization on all endpoints
- Proper error messages without sensitive data exposure
- Rate limiting through existing middleware

## Testing

### Manual Testing Checklist
- [ ] Institute can see student selection modal
- [ ] Student table displays correctly
- [ ] Apply button works with selected students
- [ ] Job status updates after application
- [ ] Reapplication shows previously applied students as disabled
- [ ] Only new students can be selected for reapplication
- [ ] Button count updates correctly after reapplication
- [ ] Error handling works for various scenarios

### Test Data Setup
1. Create institute user account
2. Add students in Student Management
3. Find recruiter with active jobs
4. Test initial application
5. Add more students
6. Test reapplication functionality

## Future Enhancements

### Potential Improvements
1. **Bulk Actions**: Select all/none buttons
2. **Student Filtering**: Search and filter students
3. **Application History**: View detailed application timeline
4. **Email Notifications**: Notify students when applied
5. **Application Status**: Track application progress
6. **Recruiter Dashboard**: View applied students from institutes

### Performance Optimizations
1. **Pagination**: For large student lists
2. **Caching**: Cache application status
3. **Lazy Loading**: Load student data on demand
4. **Batch Operations**: Optimize database queries

## Troubleshooting

### Common Issues
1. **Modal not opening**: Check if user role is 'institute'
2. **Students not loading**: Verify student management API
3. **Application failing**: Check network and authentication
4. **Status not updating**: Refresh job application data

### Debug Steps
1. Check browser console for errors
2. Verify API responses in Network tab
3. Confirm user authentication status
4. Check DynamoDB table data
5. Review server logs for backend errors

## Conclusion

This feature successfully implements the requested institute job application flow with student selection and reapplication capabilities. The implementation maintains backward compatibility with existing staff application functionality while adding the new institute-specific workflow.

The feature is designed to be scalable, maintainable, and user-friendly, following the existing codebase patterns and conventions.