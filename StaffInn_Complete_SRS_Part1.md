# StaffInn - Complete Software Requirements Specification (SRS)
## Part 1: Introduction, System Overview & User Roles

---

## Document Information
- **Project Name**: StaffInn - Complete Workforce & Education Management Platform
- **Version**: 1.0
- **Date**: January 2025
- **Document Type**: Software Requirements Specification (SRS)

---

## Table of Contents (Complete Document)
1. **Part 1**: Introduction, System Overview & User Roles
2. **Part 2**: Frontend Application - Public Pages
3. **Part 3**: Dashboard Features by Role
4. **Part 4**: Admin Panels & HRMS
5. **Part 5**: Backend Architecture & Technical Specifications

---

## 1. INTRODUCTION

### 1.1 Purpose
StaffInn is a comprehensive workforce and education management platform that connects:
- **Staff/Job Seekers** with employment opportunities
- **Recruiters/Companies** with qualified candidates
- **Training Institutes** with students seeking skill development
- **Employees** with their organization's HR management system

### 1.2 Scope
The platform consists of multiple interconnected applications:
1. **Main Frontend Application** (staffinn.com)
2. **Master Admin Panel** (admin.staffinn.com)
3. **News Admin Panel** (news admin interface)
4. **HRMS Portal** (hrms.staffinn.com)
5. **Employee Portal** (employee.staffinn.com)
6. **Backend API Server** (REST API + WebSocket)

### 1.3 System Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    StaffInn Platform                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │ Master Admin │  │ News Admin   │      │
│  │  (Main App)  │  │    Panel     │  │    Panel     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘              │
│                            │                                  │
│                    ┌───────▼────────┐                        │
│                    │  Backend API   │                        │
│                    │   (Node.js)    │                        │
│                    └───────┬────────┘                        │
│                            │                                  │
│         ┌──────────────────┼──────────────────┐             │
│         │                  │                   │             │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌───────▼──────┐     │
│  │     HRMS     │  │   Employee   │  │   DynamoDB   │     │
│  │    Portal    │  │    Portal    │  │   Database   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. USER ROLES & PERMISSIONS

### 2.1 Public Users (Non-Authenticated)
**Access Level**: Limited
**Available Features**:
- View home page with hero images
- Search staff by location, sector, and role
- View trending staff, jobs, and courses
- Browse public job listings
- Browse public recruiter profiles
- Browse public institute profiles
- View news articles
- Access registration and login forms

**Restrictions**:
- Cannot view full staff profiles
- Cannot view staff resumes
- Cannot apply for jobs
- Cannot enroll in courses
- Cannot access messaging system
- Cannot view contact information

---

### 2.2 Staff Role
**Primary Purpose**: Job seekers and professionals looking for employment

#### 2.2.1 Profile Management
- **Personal Information**:
  - Full name, email, phone
  - Profile photo upload
  - Location (state, city, area, pincode)
  - Sector and role selection
  - Availability status (Available, Busy, Open for Offers)

- **Professional Details**:
  - Skills (comma-separated list)
  - Work experience (multiple entries)
    - Job title, company name
    - Start date, end date
    - Salary information
  - Education details
    - 10th grade (school, percentage, year)
    - 12th grade (school, percentage, year)
    - Graduation (degree, college, percentage, dates)
  - Certificates (name, issuer, issued date, duration, URL)
  - Resume upload (PDF)

- **Profile Visibility**:
  - Profile views counter
  - Rating system (0-5 stars)
  - Review system

#### 2.2.2 Dashboard Features
- **Profile Overview**:
  - Profile completion percentage
  - Profile views statistics
  - Rating and reviews display

- **Job Search & Application**:
  - Browse available jobs
  - Filter jobs by sector, role, location
  - Apply for jobs with one click
  - Track application status
  - View application history

- **Course Enrollment**:
  - Browse available courses
  - Enroll in courses
  - Track course progress
  - Access course materials
  - Take quizzes and assignments
  - View certificates upon completion

- **Communication**:
  - Message center for recruiter communication
  - Real-time chat with recruiters
  - Notification system for job updates

- **Reviews & Ratings**:
  - Receive reviews from recruiters
  - View own rating and feedback

#### 2.2.3 Accessible Pages
- Home page (/)
- Staff page (/staff)
- Institute page (/institute)
- News page (/news)
- Recruiter page (/recruiter)
- Staff Dashboard (/dashboard/staff)
- Course Learning Page (/course/:courseId)
- Message Center (/messages)
- Chat Window (/chat/:userId)

---

### 2.3 Recruiter Role
**Primary Purpose**: Companies and recruiters looking to hire staff

#### 2.3.1 Company Profile Management
- **Company Information**:
  - Company name
  - Company logo
  - Industry/sector
  - Company description
  - Location details
  - Contact information
  - Website URL
  - Social media links

- **Verification Status**:
  - Verified badge display
  - Verification request system

#### 2.3.2 Job Management
- **Create Job Postings**:
  - Job title
  - Job description
  - Required skills
  - Experience level
  - Salary range
  - Location
  - Job type (Full-time, Part-time, Contract)
  - Application deadline
  - Number of openings

- **Job Listing Management**:
  - View all posted jobs
  - Edit job details
  - Delete job postings
  - Mark jobs as filled
  - View application statistics

- **Application Management**:
  - View all applications
  - Filter by job posting
  - Review candidate profiles
  - Access candidate resumes
  - Shortlist candidates
  - Reject applications
  - Schedule interviews
  - Track hiring pipeline

#### 2.3.3 Candidate Search & Management
- **Advanced Search**:
  - Search by sector and role
  - Filter by location
  - Filter by experience level
  - Filter by skills
  - Filter by availability

- **Candidate Profiles**:
  - View detailed profiles
  - Access resumes (recruiter-only feature)
  - View certificates
  - Check work experience
  - View education details
  - Read reviews from other recruiters

- **Communication**:
  - Direct messaging with candidates
  - WhatsApp integration
  - Email integration
  - Phone call option
  - Chat history tracking

#### 2.3.4 News & Updates
- **Recruiter News Management**:
  - Post company news
  - Post hiring events
  - Post job fairs
  - Upload banner images
  - Set event details (venue, date, expected participants)
  - Manage news visibility
  - Edit/delete news posts

#### 2.3.5 HRMS Access
- **Company Management**:
  - Create and manage company profile
  - Set up organizational structure
  - Define departments and roles

- **Employee Management**:
  - Add employees
  - Generate employee credentials
  - Manage employee access
  - View employee directory

- **Attendance System**:
  - Biometric device integration
  - Manual attendance marking
  - Attendance reports
  - Leave management

- **Payroll System**:
  - Salary structure setup
  - Payroll processing
  - Salary slips generation
  - Tax calculations

- **Performance Management**:
  - Task assignment
  - Performance tracking
  - Goal setting
  - Performance reviews

- **Grievance Management**:
  - Receive employee grievances
  - Hierarchical escalation system
  - Resolution tracking
  - Grievance reports

#### 2.3.6 Dashboard Features
- **Overview Statistics**:
  - Total jobs posted
  - Total applications received
  - Active job listings
  - Shortlisted candidates
  - Hired candidates

- **Recent Activity**:
  - New applications
  - Messages from candidates
  - Profile views
  - Job post performance

- **Quick Actions**:
  - Post new job
  - Search candidates
  - View applications
  - Access HRMS
  - Post news

#### 2.3.7 Accessible Pages
- Home page (/)
- Recruiter page (/recruiter)
- Recruiter Dashboard (/dashboard/recruiter)
- HRMS Portal (/hrms)
- Attendance Management (/attendance)
- Message Center (/messages)
- Chat Window (/chat/:userId)

---

### 2.4 Institute Role
**Primary Purpose**: Educational institutions offering training and courses

#### 2.4.1 Institute Profile Management
- **Basic Information**:
  - Institute name
  - Institute logo
  - Establishment year
  - Affiliation details
  - Recognition/accreditation
  - Location details
  - Contact information
  - Website URL

- **Infrastructure Details**:
  - Total area
  - Number of classrooms
  - Computer labs
  - Library facilities
  - Hostel facilities
  - Sports facilities
  - Other amenities

- **Training Center Details**:
  - Center name
  - Center code
  - Training sectors
  - Capacity
  - Facilities available

#### 2.4.2 Course Management
- **Create Courses**:
  - Course name
  - Course description
  - Course duration
  - Course fees
  - Course category/sector
  - Prerequisites
  - Course syllabus
  - Learning outcomes
  - Course thumbnail
  - Course banner

- **Course Content**:
  - Upload video lectures
  - Upload study materials (PDFs, documents)
  - Create quizzes
  - Create assignments
  - Set completion criteria

- **Course Enrollment**:
  - View enrolled students
  - Track student progress
  - Issue certificates
  - Manage course capacity

#### 2.4.3 Student Management
- **Student Registration**:
  - Add students manually
  - Bulk student upload
  - Student profile management
  - Student ID generation

- **Student Tracking**:
  - Enrollment history
  - Course progress tracking
  - Attendance records
  - Assessment results
  - Certificate issuance

- **Batch Management**:
  - Create training batches
  - Assign students to batches
  - Set batch schedules
  - Track batch progress
  - Generate batch reports

#### 2.4.4 Faculty Management
- **Faculty Profiles**:
  - Add faculty members
  - Faculty qualifications
  - Subjects taught
  - Experience details
  - Contact information

- **Course Assignment**:
  - Assign faculty to courses
  - Set teaching schedules
  - Track faculty performance

#### 2.4.5 Placement Management
- **Placement Records**:
  - Record student placements
  - Company details
  - Job role
  - Salary package
  - Placement date
  - Upload placement photos

- **Placement Analytics**:
  - Placement statistics
  - Sector-wise analysis
  - Company-wise analysis
  - Salary trends
  - Placement reports

#### 2.4.6 Events & News
- **Institute News**:
  - Post events
  - Post achievements
  - Post news updates
  - Upload event photos
  - Set event details (venue, date, participants)
  - Manage news visibility

#### 2.4.7 Government Schemes
- **Scheme Management**:
  - View available schemes
  - Apply for schemes
  - Track scheme applications
  - Upload scheme documents
  - Manage scheme benefits

#### 2.4.8 Industry Collaboration
- **MOU Management**:
  - Record industry partnerships
  - Upload MOU documents
  - Track collaboration activities
  - Manage partnership details

#### 2.4.9 Dashboard Features
- **Overview Statistics**:
  - Total students enrolled
  - Active courses
  - Total faculty
  - Placement rate
  - Course completion rate

- **Recent Activity**:
  - New enrollments
  - Course completions
  - Placement updates
  - Student queries

- **Quick Actions**:
  - Add new course
  - Enroll student
  - Record placement
  - Post news
  - Generate reports

#### 2.4.10 Accessible Pages
- Home page (/)
- Institute page (/institute)
- Institute List (/institute)
- Institute Dashboard (/dashboard/institute)
- Course Learning Page (/course/:courseId)
- Message Center (/messages)
- Chat Window (/chat/:userId)

---

### 2.5 Admin Role (Master Admin)
**Primary Purpose**: Platform administration and oversight

#### 2.5.1 User Management
- **Registration Requests**:
  - View pending registration requests
  - Approve/reject staff registrations
  - Approve/reject recruiter registrations
  - Approve/reject institute registrations
  - Verify user documents
  - Send approval/rejection notifications

- **User Accounts**:
  - View all users
  - Search users by role
  - Block/unblock users
  - Delete user accounts
  - Reset user passwords
  - Manage user permissions

#### 2.5.2 MIS (Management Information System)
- **MIS Requests**:
  - View MIS access requests from institutes
  - Approve/reject MIS requests
  - Grant MIS dashboard access
  - Manage MIS permissions

- **MIS Student Management**:
  - View all students across institutes
  - Filter students by institute
  - Track student progress
  - Generate student reports

- **MIS Placement Analytics**:
  - View placement data across all institutes
  - Sector-wise placement analysis
  - Institute-wise placement comparison
  - Salary trend analysis
  - Generate placement reports

#### 2.5.3 Content Management
- **Hero Images**:
  - Upload hero images for home page
  - Manage image rotation
  - Set image visibility
  - Delete images

- **Government Schemes**:
  - Add new schemes
  - Edit scheme details
  - Manage scheme visibility
  - Track scheme applications

#### 2.5.4 Platform Monitoring
- **System Health**:
  - Monitor server status
  - View API performance
  - Check database connectivity
  - Monitor WebSocket connections

- **User Activity**:
  - Track user logins
  - Monitor feature usage
  - View platform statistics
  - Generate activity reports

#### 2.5.5 Communication Management
- **Admin Chat**:
  - View all user messages
  - Respond to user queries
  - Broadcast announcements
  - Manage support tickets

- **Notifications**:
  - Send platform-wide notifications
  - Send role-specific notifications
  - Schedule notifications
  - Track notification delivery

#### 2.5.6 Dashboard Features
- **Platform Statistics**:
  - Total users by role
  - Active users
  - Pending registrations
  - Total jobs posted
  - Total courses available
  - Total placements recorded

- **Recent Activity**:
  - New registrations
  - Pending approvals
  - User reports
  - System alerts

- **Quick Actions**:
  - Approve registrations
  - Manage users
  - Post announcements
  - Generate reports

#### 2.5.7 Accessible Pages
- Admin Dashboard (/admin)
- All public pages (for monitoring)

---

### 2.6 News Admin Role
**Primary Purpose**: Manage news content across the platform

#### 2.6.1 Staffinn News Management
- **Hero Section**:
  - Create hero news articles
  - Upload banner images
  - Set article title and content
  - Add tags
  - Set visibility
  - Mark as "Top News of the Day"
  - Edit/delete articles

- **Trending Topics**:
  - Add trending topics (max 15)
  - Upload topic images
  - Set topic description
  - Manage visibility
  - Edit/delete topics

- **Expert Insights**:
  - Add expert interviews
  - Upload expert videos
  - Set video thumbnails
  - Add expert details (name, designation)
  - Manage visibility
  - Edit/delete insights

- **Posted News**:
  - Post general news articles
  - Upload news banners
  - Set news description
  - Manage visibility
  - Edit/delete news

#### 2.6.2 Recruiter News Management
- **View Recruiter News**:
  - View all news posted by recruiters
  - Filter by recruiter/company
  - View news details
  - Check verification status

- **Moderate Recruiter News**:
  - Show/hide recruiter news
  - Delete inappropriate content
  - Verify news authenticity
  - View news statistics

#### 2.6.3 Institute News Management
- **View Institute News**:
  - View all news posted by institutes
  - Filter by institute
  - View event details
  - Check verification status

- **Moderate Institute News**:
  - Show/hide institute news
  - Delete inappropriate content
  - Verify news authenticity
  - View news statistics

#### 2.6.4 Real-time Updates
- **WebSocket Integration**:
  - Real-time news creation notifications
  - Real-time visibility toggle updates
  - Real-time deletion updates
  - Automatic UI refresh

#### 2.6.5 Dashboard Features
- **News Statistics**:
  - Total hero sections
  - Total trending topics
  - Total expert insights
  - Total posted news
  - Total recruiter news
  - Total institute news

- **Recent Activity**:
  - Latest news posts
  - Recent visibility changes
  - Recent deletions

- **Quick Actions**:
  - Create hero section
  - Add trending topic
  - Add expert insight
  - Post news

---

### 2.7 Employee Role (HRMS Employee Portal)
**Primary Purpose**: Employees accessing their company's HRMS

#### 2.7.1 Personal Dashboard
- **Overview**:
  - Employee ID
  - Department
  - Designation
  - Reporting manager
  - Join date
  - Employment status

- **Quick Stats**:
  - Leave balance
  - Attendance percentage
  - Pending tasks
  - Pending claims

#### 2.7.2 Attendance Management
- **View Attendance**:
  - Daily attendance records
  - Monthly attendance summary
  - Attendance calendar view
  - Late arrivals tracking
  - Early departures tracking

- **Attendance Actions**:
  - View punch-in/punch-out times
  - Request attendance correction
  - View attendance reports

#### 2.7.3 Leave Management
- **Leave Application**:
  - Apply for leave
  - Select leave type
  - Set leave dates
  - Add leave reason
  - Upload supporting documents

- **Leave Tracking**:
  - View leave balance by type
  - Track leave application status
  - View leave history
  - View leave calendar

- **Leave Types**:
  - Casual leave
  - Sick leave
  - Earned leave
  - Maternity/paternity leave
  - Compensatory off
  - Leave without pay

#### 2.7.4 Payroll Access
- **Salary Information**:
  - View salary structure
  - Download salary slips
  - View payment history
  - View tax deductions
  - View allowances and benefits

- **Payroll Reports**:
  - Monthly salary reports
  - Annual salary reports
  - Tax computation sheets
  - Form 16 download

#### 2.7.5 Claims Management
- **Submit Claims**:
  - Travel claims
  - Medical claims
  - Food claims
  - Other expense claims
  - Upload claim receipts
  - Add claim description

- **Claim Tracking**:
  - View claim status
  - Track approval workflow
  - View claim history
  - View reimbursement status

#### 2.7.6 Task Management
- **View Tasks**:
  - Assigned tasks list
  - Task priorities
  - Task deadlines
  - Task descriptions

- **Task Actions**:
  - Update task status
  - Add task comments
  - Upload task deliverables
  - Mark tasks complete

- **Performance Tracking**:
  - View task completion rate
  - View performance metrics
  - View feedback from managers

#### 2.7.7 Grievance System
- **Submit Grievances**:
  - Select grievance category
  - Describe issue
  - Upload supporting documents
  - Select complaint against (employee/management)
  - Anonymous submission option

- **Grievance Tracking**:
  - View grievance status
  - Track escalation level
  - View responses
  - View resolution timeline

- **Grievance Categories**:
  - Workplace harassment
  - Salary issues
  - Leave issues
  - Work environment
  - Manager issues
  - Policy violations
  - Other concerns

#### 2.7.8 Organization View
- **Organogram**:
  - View company hierarchy
  - View reporting structure
  - View team members
  - View department structure

#### 2.7.9 Profile Management
- **Personal Information**:
  - View profile details
  - Update contact information
  - Update emergency contacts
  - Upload profile photo

- **Change Password**:
  - Change login password
  - Set security questions
  - Enable two-factor authentication

#### 2.7.10 Accessible Pages
- Login (/login)
- Dashboard (/dashboard)
- Attendance (/attendance)
- Leave (/leave)
- Payroll (/payroll)
- Claims (/claims)
- Tasks (/tasks)
- Grievances (/grievances)
- Organogram (/organogram)
- Profile (/profile)
- Change Password (/change-password)

---

## 3. ROLE INTERCONNECTIONS

### 3.1 Staff ↔ Recruiter
- **Staff Actions**:
  - Apply for recruiter's jobs
  - Send messages to recruiters
  - View recruiter profiles
  - Receive job notifications

- **Recruiter Actions**:
  - View staff profiles
  - Access staff resumes
  - Send job offers
  - Rate and review staff
  - Message staff directly

### 3.2 Staff ↔ Institute
- **Staff Actions**:
  - Enroll in institute courses
  - Access course materials
  - Complete assignments and quizzes
  - Receive certificates
  - View institute profiles

- **Institute Actions**:
  - Manage student enrollments
  - Track student progress
  - Issue certificates
  - Record student placements

### 3.3 Recruiter ↔ Institute
- **Recruiter Actions**:
  - Post job opportunities for institute students
  - Participate in campus placements
  - View institute placement records

- **Institute Actions**:
  - Share student profiles with recruiters
  - Organize placement drives
  - Record recruiter placements

### 3.4 Admin ↔ All Roles
- **Admin Oversight**:
  - Approve/reject all registrations
  - Monitor all user activities
  - Manage platform content
  - Handle user disputes
  - Generate platform-wide reports

### 3.5 News Admin ↔ Content Creators
- **News Admin Actions**:
  - Moderate recruiter news
  - Moderate institute news
  - Manage platform news
  - Control content visibility

### 3.6 Employee ↔ Recruiter (HRMS)
- **Employee Actions**:
  - Access HRMS features
  - Submit leave requests
  - Submit claims
  - Submit grievances
  - View payroll information

- **Recruiter (HR Manager) Actions**:
  - Manage employee records
  - Approve/reject leave requests
  - Process claims
  - Handle grievances
  - Process payroll
  - Assign tasks
  - Track performance

---

## End of Part 1

**Next Parts**:
- Part 2: Frontend Application - Public Pages (Detailed page-wise breakdown)
- Part 3: Dashboard Features by Role (Detailed feature breakdown)
- Part 4: Admin Panels & HRMS (Complete admin functionality)
- Part 5: Backend Architecture & Technical Specifications

---
