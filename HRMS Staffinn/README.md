# Staffinn HRMS - Real-time Human Resource Management System

A fully functional, real-time HRMS built with React frontend and Node.js/AWS Lambda backend, integrated with AWS DynamoDB.

## 🚀 Features

- **Real-time Data**: All data stored and retrieved from AWS DynamoDB
- **Organogram**: Interactive organizational chart with hierarchy visualization
- **Onboarding & Recruitment**: Candidate management and hiring pipeline
- **Grievance Management**: Employee grievance submission and tracking system
- **Attendance Management**: Real-time attendance tracking and statistics
- **Authentication**: JWT-based secure authentication
- **Role-based Access**: Admin, HR, Manager, and Employee roles

## 🏗️ Architecture

### Frontend (React + TypeScript)
- Modern React with hooks and context
- Tailwind CSS for styling
- Real-time API integration
- Responsive design

### Backend (Node.js + Express + AWS Lambda)
- RESTful API with Express.js
- AWS Lambda for serverless deployment
- JWT authentication
- Real-time data processing

### Database (AWS DynamoDB)
- 12 DynamoDB tables with proper GSIs
- Optimized for scalability
- Real-time data synchronization

## 📋 Prerequisites

- Node.js 18+ 
- AWS Account with DynamoDB access
- AWS CLI configured
- Git

## 🛠️ Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd "HRMS Staffinn"
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `.env` file with your AWS credentials:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
JWT_SECRET=your_jwt_secret_here
S3_BUCKET_NAME=hrms-staffinn-files
NODE_ENV=development
PORT=3001
```

### 3. AWS DynamoDB Tables

Ensure these tables are created in your AWS DynamoDB:

| Table Name | Partition Key | GSIs |
|------------|---------------|------|
| Staffinn-HRMS-Users-Table | userId (String) | - |
| HRMS-Employees-Table | employeeId (String) | departmentId-index, managerId-index |
| HRMS-Departments-Table | departmentId (String) | - |
| HRMS-Positions-Table | positionId (String) | - |
| HRMS-Attendance-Table | attendanceId (String) | employeeId-date-index, date-index |
| HRMS-AttendanceDevices-Table | deviceId (String) | - |
| HRMS-Leaves-Table | leaveId (String) | employeeId-index, status-index |
| HRMS-Candidates-Table | candidateId (String) | status-index, position-index |
| HRMS-OnboardingTasks-Table | taskId (String) | employeeId-index, status-index |
| HRMS-OrganizationChart-Table | nodeId (String) | level-index, parentId-index |
| HRMS-Payroll-Table | payrollId (String) | employeeId-month-index |
| HRMS-Grievances-Table | grievanceId (String) | employeeId-index, priority-index, status-index |
| HRMS-GrievanceComments-Table | commentId (String) | grievanceId-index |

### 4. Start Backend Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Backend will run on `http://localhost:3001`

### 5. Frontend Setup

```bash
cd "../Staffinn HR Manager_files"

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 6. Deploy to AWS Lambda (Optional)

```bash
cd backend

# Install Serverless Framework
npm install -g serverless

# Deploy to AWS
serverless deploy
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Organization
- `GET /api/organization` - Get organization chart
- `POST /api/organization` - Create org node
- `PUT /api/organization/:id` - Update org node
- `DELETE /api/organization/:id` - Delete org node

### Grievances
- `GET /api/grievances` - Get all grievances
- `POST /api/grievances` - Create grievance
- `PUT /api/grievances/:id/status` - Update grievance status
- `POST /api/grievances/:id/comments` - Add comment

### Attendance
- `GET /api/attendance/stats` - Get attendance statistics
- `GET /api/attendance/date/:date` - Get attendance by date
- `POST /api/attendance` - Mark attendance

### Candidates
- `GET /api/candidates` - Get all candidates
- `POST /api/candidates` - Create candidate
- `PUT /api/candidates/:id/status` - Update candidate status
- `DELETE /api/candidates/:id` - Delete candidate

## 🎯 Key Changes Made

### Sidebar Updates
- ✅ "Recruitment" → "Onboarding"
- ✅ "Employees" → "Organogram" 
- ✅ Added "Grievances" option

### New Components
- ✅ **Organogram**: Interactive organizational chart
- ✅ **Grievances**: Employee grievance management system
- ✅ **Enhanced Onboarding**: Improved candidate management

### Backend Integration
- ✅ Removed all dummy/mock data
- ✅ Real-time AWS DynamoDB integration
- ✅ JWT authentication with AWS
- ✅ RESTful API with proper error handling
- ✅ Serverless deployment ready

## 🔐 Default Admin Account

After setting up, create an admin account:
- Email: `admin@staffinn.com`
- Password: `Admin@123`

## 📱 Usage

1. **Login**: Use admin credentials or register new account
2. **Organogram**: View and manage organizational structure
3. **Onboarding**: Add candidates and track hiring pipeline
4. **Grievances**: Submit and manage employee grievances
5. **Attendance**: Mark attendance and view statistics

## 🚨 Important Notes

- Ensure AWS credentials have proper DynamoDB permissions
- All data is now stored in real AWS DynamoDB tables
- No dummy data - everything is live and functional
- Fingerprint integration is ready for future implementation

## 🔄 Real-time Features

- Live attendance updates every 30 seconds
- Real-time grievance status changes
- Instant organizational chart updates
- Live candidate pipeline tracking

## 📊 Monitoring

- CloudWatch logs for Lambda functions
- DynamoDB metrics and alarms
- API Gateway request/response logging
- Frontend error tracking

## 🛡️ Security

- JWT token-based authentication
- Role-based access control
- Input validation and sanitization
- AWS IAM permissions
- CORS configuration

## 🔧 Troubleshooting

### Common Issues:

1. **AWS Connection Error**: Check credentials and region
2. **DynamoDB Access Denied**: Verify IAM permissions
3. **CORS Error**: Check API Gateway CORS settings
4. **Token Expired**: Re-login to get new JWT token

### Support:
For issues, check the console logs and AWS CloudWatch for detailed error messages.

---

**Built with ❤️ for Staffinn HRMS**