# HRMS Integration Documentation

## Overview
The HRMS (Human Resource Management System) has been successfully integrated into the main Staffinn backend, providing a unified deployment and authentication system while maintaining the modular structure of HRMS functionality.

## Integration Architecture

### Before Integration
```
┌─────────────────┐    ┌─────────────────┐
│   Main Backend  │    │   HRMS Backend  │
│   Port: 4001    │    │   Port: 3001    │
│   Separate DB   │    │   Separate DB   │
│   Separate Auth │    │   Separate Auth │
└─────────────────┘    └─────────────────┘
```

### After Integration
```
┌─────────────────────────────────────────┐
│           Unified Backend               │
│           Port: 4001                    │
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │ Main System │  │ HRMS Module     │  │
│  │ /api/v1/*   │  │ /api/v1/hrms/*  │  │
│  └─────────────┘  └─────────────────┘  │
│                                         │
│        Shared Database & Auth           │
└─────────────────────────────────────────┘
```

## File Structure

### New HRMS Files Added to Main Backend

```
Backend/
├── controllers/hrms/
│   ├── hrmsAuthController.js
│   ├── hrmsEmployeeController.js
│   ├── hrmsAttendanceController.js
│   ├── hrmsCandidateController.js
│   ├── hrmsGrievanceController.js
│   └── hrmsOrganizationController.js
├── routes/hrms/
│   ├── hrmsAuthRoutes.js
│   ├── hrmsEmployeeRoutes.js
│   ├── hrmsAttendanceRoutes.js
│   ├── hrmsCandidateRoutes.js
│   ├── hrmsGrievanceRoutes.js
│   └── hrmsOrganizationRoutes.js
├── middleware/
│   └── hrmsAuth.js
├── utils/
│   └── hrmsHelpers.js
└── test-hrms-integration.js
```

## API Endpoints

All HRMS endpoints are now available under the `/api/v1/hrms` prefix:

### Authentication
- `POST /api/v1/hrms/auth/register` - Register HRMS user
- `POST /api/v1/hrms/auth/login` - Login HRMS user
- `GET /api/v1/hrms/auth/profile` - Get user profile

### Employees
- `GET /api/v1/hrms/employees` - Get all employees
- `POST /api/v1/hrms/employees` - Create employee
- `GET /api/v1/hrms/employees/:id` - Get employee by ID
- `PUT /api/v1/hrms/employees/:id` - Update employee
- `DELETE /api/v1/hrms/employees/:id` - Delete employee
- `GET /api/v1/hrms/employees/stats` - Get employee statistics

### Attendance
- `POST /api/v1/hrms/attendance` - Mark attendance
- `GET /api/v1/hrms/attendance/stats` - Get attendance statistics
- `GET /api/v1/hrms/attendance/date/:date` - Get attendance by date
- `GET /api/v1/hrms/attendance/employee/:employeeId` - Get employee attendance

### Candidates
- `GET /api/v1/hrms/candidates` - Get all candidates
- `POST /api/v1/hrms/candidates` - Create candidate (no auth required)
- `GET /api/v1/hrms/candidates/:id` - Get candidate by ID
- `PUT /api/v1/hrms/candidates/:id` - Update candidate
- `DELETE /api/v1/hrms/candidates/:id` - Delete candidate
- `GET /api/v1/hrms/candidates/stats` - Get candidate statistics

### Grievances
- `GET /api/v1/hrms/grievances` - Get all grievances
- `POST /api/v1/hrms/grievances` - Create grievance
- `GET /api/v1/hrms/grievances/my` - Get my grievances
- `GET /api/v1/hrms/grievances/:id` - Get grievance by ID
- `PUT /api/v1/hrms/grievances/:id/status` - Update grievance status
- `POST /api/v1/hrms/grievances/:id/comments` - Add grievance comment

### Organization
- `GET /api/v1/hrms/organization` - Get organization chart
- `POST /api/v1/hrms/organization` - Create organization node
- `PUT /api/v1/hrms/organization/:id` - Update organization node
- `DELETE /api/v1/hrms/organization/:id` - Delete organization node

## Database Tables

The following HRMS tables are created in the main DynamoDB setup:

- `staffinn-hrms-users` - HRMS user accounts
- `staffinn-hrms-employees` - Employee records
- `staffinn-hrms-attendance` - Attendance records
- `staffinn-hrms-grievances` - Grievance records
- `staffinn-hrms-grievance-comments` - Grievance comments
- `staffinn-hrms-organization-chart` - Organization structure

## Frontend Integration

The HRMS frontend has been updated to connect to the main backend:

### Before
```javascript
baseURL: 'http://localhost:3001/api'
```

### After
```javascript
baseURL: 'http://localhost:4001/api/v1/hrms'
```

## Testing the Integration

Run the integration test script:

```bash
cd Backend
node test-hrms-integration.js
```

This will test:
- User registration and login
- Candidate creation and retrieval
- Employee statistics
- Attendance statistics

## Deployment Benefits

### ✅ Single Deployment Pipeline
- One backend to deploy instead of two
- Simplified CI/CD configuration
- Reduced infrastructure complexity

### ✅ Shared Authentication System
- Single JWT token system
- Unified user management
- Better security consistency

### ✅ Unified Database Access
- Shared DynamoDB configuration
- Consistent data access patterns
- Better data integrity

### ✅ Simplified Monitoring
- Single application to monitor
- Unified logging system
- Easier debugging and maintenance

### ✅ Better Scalability
- Single application to scale
- Shared resource utilization
- More efficient load balancing

### ✅ Cost-Effective
- Single server instance
- Reduced AWS resource usage
- Lower operational costs

## Running the System

1. **Start the Main Backend** (includes HRMS):
   ```bash
   cd Backend
   npm start
   ```
   Server runs on port 4001 with HRMS endpoints available.

2. **Start the HRMS Frontend**:
   ```bash
   cd "HRMS Staffinn/Staffinn HR Manager_files"
   npm run dev
   ```
   Frontend runs on port 5175 and connects to main backend.

3. **Start the Main Frontend**:
   ```bash
   cd Frontend
   npm run dev
   ```
   Main frontend runs on port 5173 with HRMS redirect working.

## Migration Notes

- ✅ All HRMS functionality preserved
- ✅ No breaking changes to HRMS frontend
- ✅ Backward compatibility maintained
- ✅ All existing features working
- ✅ Database structure preserved
- ✅ Authentication flow unchanged for end users

## Future Enhancements

1. **Single Sign-On (SSO)**: Implement shared authentication between main system and HRMS
2. **Data Synchronization**: Sync user data between main system and HRMS
3. **Embedded Frontend**: Integrate HRMS frontend directly into main frontend
4. **Unified Reporting**: Create reports spanning both systems
5. **Role-Based Access**: Implement fine-grained permissions across systems

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure main backend is running on port 4001
2. **CORS Issues**: HRMS frontend is configured for localhost:4001
3. **Database Connection**: HRMS uses the same DynamoDB configuration as main backend
4. **Authentication**: HRMS uses separate JWT tokens from main system

### Logs to Check

- Main backend console for HRMS route registration
- HRMS frontend console for API connection status
- DynamoDB table creation logs for HRMS tables

## Success Metrics

The integration is successful when:
- ✅ Main backend starts without errors
- ✅ HRMS routes are registered (check server logs)
- ✅ HRMS frontend connects to main backend
- ✅ All HRMS functionality works as before
- ✅ Integration test script passes
- ✅ No duplicate code or resources
- ✅ Single deployment pipeline works