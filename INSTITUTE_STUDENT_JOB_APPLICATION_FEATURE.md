# Institute Student Job Application Feature

## Overview
This feature allows Institute users to apply their students to recruiter job postings through a confirmation modal with student selection capabilities.

## Feature Flow

### 1. Initial Application
- Institute visits a recruiter's job posting
- Clicks "Apply Students" button
- Confirmation modal opens showing all students from Student Management
- Institute selects students and clicks "Apply"
- Selected students are applied to the job

### 2. Reapplication with New Students
- If Institute adds more students after initial application
- Returns to the same job posting
- Can click "Apply Students" again
- Modal shows:
  - Previously applied students (checked and disabled)
  - New students (selectable checkboxes)
- Only newly selected students are applied

## Technical Implementation

### Backend Changes

#### New Model Functions (`jobApplicationModel.js`)
- `getAppliedStudentIds(jobID, instituteID)` - Get students already applied by institute
- `createBulkJobApplications(applicationDataArray)` - Apply multiple students at once

#### New Controller Functions (`applicationController.js`)
- `applyStudentsToJob()` - Handle bulk student applications
- `getStudentsApplicationStatus()` - Get students with application status

#### New API Endpoints
- `POST /api/applications/apply-students` - Apply selected students to job
- `GET /api/applications/job/:jobId/students-status` - Get students with application status

### Frontend Changes

#### New Components
- `StudentSelectionModal.jsx` - Modal for student selection
- `StudentSelectionModal.css` - Styling for the modal

#### Updated Components
- `RecruiterPage.jsx` - Integrated student selection modal
- `api.js` - Added new API service functions

## Database Schema

### Job Applications Table
```
staffinnjob (PK) - Composite key: jobID_studentID
studentID - Student identifier
jobID - Job identifier  
recruiterID - Recruiter identifier
instituteID - Institute identifier
status - Application status (pending, hired, rejected)
timestamp - Application timestamp
```

## API Documentation

### Apply Students to Job
```
POST /api/applications/apply-students
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobId": "job123",
  "recruiterId": "recruiter456", 
  "studentIds": ["student1", "student2", "student3"]
}

Response:
{
  "success": true,
  "message": "Successfully applied 3 students to the job",
  "data": {
    "appliedCount": 3,
    "applications": [...]
  }
}
```

### Get Students Application Status
```
GET /api/applications/job/:jobId/students-status
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "instituteStudntsID": "student1",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "1234567890",
      "degreeName": "Computer Science",
      "hasApplied": true
    },
    {
      "instituteStudntsID": "student2", 
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "phoneNumber": "0987654321",
      "degreeName": "Information Technology",
      "hasApplied": false
    }
  ]
}
```

## User Experience

### Modal Features
- **Student Table**: Shows Name, Email, Phone, Degree, and Selection checkbox
- **Applied Students Section**: Shows previously applied students (disabled checkboxes)
- **Available Students Section**: Shows new students available for application
- **Bulk Selection**: Select multiple students at once
- **Validation**: Prevents submission without student selection
- **Loading States**: Shows loading during API calls
- **Responsive Design**: Works on mobile and desktop

### Button States
- **Initial State**: "Apply Students" button
- **After Application**: Button remains "Apply Students" (allows reapplication)
- **Staff Users**: Shows "Apply Now" (existing functionality unchanged)

## Error Handling
- Validates user authentication and role
- Checks for required parameters
- Handles duplicate applications gracefully
- Provides meaningful error messages
- Maintains data consistency

## Testing
Run the test script to verify functionality:
```bash
node test-institute-job-application.js
```

## Security Considerations
- Only authenticated institutes can apply students
- Students can only be applied by their own institute
- Prevents duplicate applications for same student-job combination
- Validates all input parameters

## Future Enhancements
- Bulk student selection (Select All/None)
- Student filtering and search
- Application status tracking
- Email notifications to students
- Application withdrawal functionality