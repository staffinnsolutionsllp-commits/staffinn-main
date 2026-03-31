# StaffInn - Complete Software Requirements Specification (SRS)
## Part 3: Dashboard Features by Role

---

## 5. STAFF DASHBOARD (/dashboard/staff)

### 5.1 Dashboard Overview
**Access**: Only accessible to users with Staff role

### 5.2 Dashboard Header
- Welcome message with user name
- Profile completion percentage
- **Complete Profile Button**: Navigates to incomplete sections
- Notification bell icon with unread count
- Profile dropdown menu

### 5.3 Profile Section

#### 5.3.1 Profile Overview Card
**Displays**:
- Profile photo with upload option
- Full name
- Email
- Phone number
- Location (State, City, Area, Pincode)
- Sector and Role
- Profile views count
- Rating (stars)
- Review count
- **Edit Profile Button**: Opens profile edit modal

#### 5.3.2 Edit Profile Modal
**Tabs**:

1. **Personal Information Tab**:
   - Full Name input
   - Email input (read-only)
   - Phone input
   - Profile Photo upload
   - **Upload Photo Button**: Opens file picker
   - **Remove Photo Button**: Removes current photo
   - **Save Changes Button**: Updates personal info

2. **Location Tab**:
   - State dropdown
   - City dropdown
   - Area input
   - Pincode input
   - Address textarea
   - **Save Location Button**: Updates location

3. **Professional Details Tab**:
   - Sector dropdown
   - Role dropdown
   - Skills input (comma-separated)
   - Availability dropdown (Available, Busy, Open for Offers)
   - **Save Professional Details Button**: Updates details

4. **Work Experience Tab**:
   - **Add Experience Button**: Opens experience form
   - **Experience List**:
     - Job Title
     - Company Name
     - Start Date
     - End Date (or "Currently Working" checkbox)
     - Salary
     - **Edit Button**: Edits experience
     - **Delete Button**: Removes experience
   - **Save Experience Button**: Saves all experiences

5. **Education Tab**:
   - **10th Grade Section**:
     - School Name
     - Percentage
     - Year
   - **12th Grade Section**:
     - School Name
     - Percentage
     - Year
   - **Graduation Section**:
     - Degree
     - College Name
     - Percentage
     - Start Date
     - End Date
   - **Save Education Button**: Updates education

6. **Certificates Tab**:
   - **Add Certificate Button**: Opens certificate form
   - **Certificate List**:
     - Certificate Name
     - Issuer
     - Issue Date
     - Duration
     - Certificate URL
     - **Edit Button**: Edits certificate
     - **Delete Button**: Removes certificate
   - **Save Certificates Button**: Saves all certificates

7. **Resume Tab**:
   - Current resume preview (if uploaded)
   - **Upload Resume Button**: Opens file picker (PDF only)
   - **Download Resume Button**: Downloads current resume
   - **Remove Resume Button**: Deletes current resume

### 5.4 Job Search Section

#### 5.4.1 Search & Filter
**Search Bar**:
- Job title/keyword search
- **Search Button**: Searches jobs

**Filters**:
- Location (State, City)
- Sector
- Role
- Experience Level
- Salary Range
- Job Type (Full-time, Part-time, Contract)
- **Apply Filters Button**: Applies filters
- **Clear Filters Button**: Resets filters

#### 5.4.2 Job Listings
**Job Cards** display:
- Company logo
- Job title
- Company name
- Location
- Experience required
- Salary range
- Job type
- Skills required
- Posted date
- Application status (if already applied)
- **Apply Now Button**: Opens application modal
- **View Details Button**: Shows full job description

**Application Modal**:
- Job details summary
- Resume selection (from profile)
- Cover letter textarea
- Additional documents upload
- **Submit Application Button**: Submits application
- **Cancel Button**: Closes modal

### 5.5 My Applications Section

#### 5.5.1 Application Status Tabs
- **All Applications**: Shows all applications
- **Pending**: Applications under review
- **Shortlisted**: Shortlisted applications
- **Rejected**: Rejected applications
- **Hired**: Successful applications

#### 5.5.2 Application Cards
Each application displays:
- Company logo
- Job title
- Company name
- Applied date
- Application status badge
- **View Application Button**: Shows application details
- **Withdraw Application Button**: Withdraws application (if pending)

**Application Details Modal**:
- Job details
- Application date
- Status timeline
- Submitted resume
- Cover letter
- Additional documents
- Recruiter feedback (if available)
- **Close Button**: Closes modal

### 5.6 Course Enrollment Section

#### 5.6.1 Available Courses
**Course Cards** display:
- Course thumbnail
- Course title
- Institute name
- Duration
- Fees
- Category
- Rating
- **Enroll Now Button**: Opens enrollment modal
- **View Details Button**: Shows course details

**Enrollment Modal**:
- Course details
- Student information form
- Payment options
- Terms and conditions
- **Confirm Enrollment Button**: Enrolls in course
- **Cancel Button**: Closes modal

#### 5.6.2 My Courses
**Enrolled Courses Tabs**:
- **In Progress**: Currently enrolled courses
- **Completed**: Finished courses
- **Certificates**: Earned certificates

**Course Cards** display:
- Course thumbnail
- Course title
- Institute name
- Progress percentage
- Enrollment date
- **Continue Learning Button**: Opens course page
- **View Certificate Button**: Downloads certificate (if completed)

### 5.7 Messages Section

#### 5.7.1 Recent Messages
- List of recent conversations
- Unread message count
- **View All Messages Button**: Opens message center

#### 5.7.2 Quick Message
- **Compose Message Button**: Opens compose modal
- Recent contacts list
- **Start Chat Button**: Opens chat window

### 5.8 Notifications Section

#### 5.8.1 Notification List
**Notification Types**:
- Job application updates
- Course enrollment confirmations
- New job recommendations
- Message notifications
- Profile view notifications
- Review notifications

**Notification Actions**:
- **Mark as Read Button**: Marks notification as read
- **Delete Button**: Removes notification
- **View Details Button**: Opens related content

### 5.9 Profile Statistics

#### 5.9.1 Statistics Cards
- **Profile Views**: Total profile views with trend
- **Applications Sent**: Total applications with status breakdown
- **Courses Enrolled**: Total enrollments with completion rate
- **Messages**: Total conversations

#### 5.9.2 Activity Chart
- Profile views over time
- Application activity
- Course progress

---

## 6. RECRUITER DASHBOARD (/dashboard/recruiter)

### 6.1 Dashboard Overview
**Access**: Only accessible to users with Recruiter role

### 6.2 Dashboard Header
- Welcome message with company name
- Verification status badge
- **Request Verification Button**: Opens verification request form
- Notification bell icon
- Profile dropdown menu

### 6.3 Company Profile Section

#### 6.3.1 Company Overview Card
**Displays**:
- Company logo with upload option
- Company name
- Industry
- Location
- Website URL
- Total jobs posted
- Total applications received
- Verification status
- **Edit Company Profile Button**: Opens profile edit modal

#### 6.3.2 Edit Company Profile Modal
**Tabs**:

1. **Basic Information Tab**:
   - Company Name
   - Industry dropdown
   - Company Size
   - Founded Year
   - Website URL
   - **Save Basic Info Button**: Updates info

2. **Company Logo Tab**:
   - Current logo preview
   - **Upload Logo Button**: Opens file picker
   - **Remove Logo Button**: Removes logo
   - **Save Logo Button**: Updates logo

3. **Location Tab**:
   - State dropdown
   - City dropdown
   - Address textarea
   - Pincode
   - **Save Location Button**: Updates location

4. **About Company Tab**:
   - Company Description textarea
   - Company Culture textarea
   - Values and Mission textarea
   - **Save About Info Button**: Updates about section

5. **Social Media Tab**:
   - LinkedIn URL
   - Facebook URL
   - Twitter URL
   - Instagram URL
   - **Save Social Links Button**: Updates links

### 6.4 Job Management Section

#### 6.4.1 Job Overview Cards
- **Active Jobs**: Count with trend
- **Total Applications**: Count with trend
- **Shortlisted Candidates**: Count
- **Hired Candidates**: Count

#### 6.4.2 Create Job Posting
**Create Job Button**: Opens job creation form

**Job Creation Form**:
- **Job Details Tab**:
  - Job Title
  - Job Description (rich text editor)
  - Job Type (Full-time, Part-time, Contract)
  - Number of Openings
  - Application Deadline
  
- **Requirements Tab**:
  - Required Skills (multi-select)
  - Experience Level (Fresher, Junior, Mid-Level, Senior)
  - Education Qualification
  - Certifications (optional)
  
- **Compensation Tab**:
  - Salary Range (Min-Max)
  - Currency
  - Salary Type (Monthly, Annual)
  - Additional Benefits textarea
  
- **Location Tab**:
  - Job Location (State, City)
  - Remote Work Option checkbox
  - Relocation Assistance checkbox
  
- **Preview Tab**:
  - Preview of job posting
  - **Publish Job Button**: Publishes job
  - **Save as Draft Button**: Saves without publishing
  - **Cancel Button**: Discards job

#### 6.4.3 Manage Jobs
**Job Listing Tabs**:
- **Active Jobs**: Currently open positions
- **Draft Jobs**: Unpublished jobs
- **Closed Jobs**: Filled or expired positions

**Job Cards** display:
- Job title
- Posted date
- Application count
- Views count
- Status badge
- **Actions**:
  - **View Applications Button**: Shows applications
  - **Edit Job Button**: Opens edit form
  - **Close Job Button**: Marks job as filled
  - **Delete Job Button**: Removes job
  - **Duplicate Job Button**: Creates copy

### 6.5 Application Management Section

#### 6.5.1 Application Overview
**Filter Options**:
- Filter by job posting
- Filter by status
- Filter by date
- Sort by: Recent, Rating, Experience

#### 6.5.2 Application Tabs
- **New Applications**: Unreviewed applications
- **Shortlisted**: Shortlisted candidates
- **Rejected**: Rejected applications
- **Hired**: Successful hires

#### 6.5.3 Application Cards
Each application displays:
- Candidate photo
- Candidate name
- Applied for (job title)
- Applied date
- Candidate rating
- Experience level
- Key skills (first 3)
- **Actions**:
  - **View Profile Button**: Opens candidate profile
  - **View Resume Button**: Opens resume
  - **Shortlist Button**: Moves to shortlisted
  - **Reject Button**: Rejects application
  - **Schedule Interview Button**: Opens scheduling form
  - **Send Message Button**: Opens chat

**Candidate Profile Modal**:
- Full profile details
- Work experience
- Education
- Certificates
- Reviews from other recruiters
- **Download Resume Button**: Downloads resume
- **Contact Options**:
  - **Chat Button**: Opens chat
  - **Email Button**: Sends email
  - **WhatsApp Button**: Opens WhatsApp
  - **Call Button**: Initiates call

### 6.6 Candidate Search Section

#### 6.6.1 Advanced Search
**Search Filters**:
- Sector dropdown
- Role dropdown
- Location (State, City)
- Experience Level
- Skills (multi-select)
- Availability status
- Minimum Rating
- **Search Button**: Searches candidates
- **Clear Filters Button**: Resets filters

#### 6.6.2 Search Results
**Candidate Cards** display:
- Profile photo
- Name
- Profession
- Location
- Experience
- Rating
- Availability status
- Key skills
- **View Profile Button**: Opens profile
- **Send Message Button**: Opens chat
- **Save Candidate Button**: Saves to favorites

### 6.7 News Management Section

#### 6.7.1 Company News Overview
- Total news posted
- Total views
- **Post News Button**: Opens news creation form

#### 6.7.2 Create News/Event
**News Creation Form**:
- **News Type**: Event or News
- **Title**: News title
- **Details**: News description (rich text)
- **Banner Image**: Image upload
- **Date**: Event/news date
- **Venue**: Event location (if event)
- **Expected Participants**: Number (if event)
- **Visibility**: Public or Private
- **Publish Button**: Publishes news
- **Save as Draft Button**: Saves without publishing
- **Cancel Button**: Discards news

#### 6.7.3 Manage News
**News Listing**:
Each news item displays:
- Banner image thumbnail
- Title
- Posted date
- Views count
- Visibility status
- **Actions**:
  - **View Button**: Shows full news
  - **Edit Button**: Opens edit form
  - **Hide/Show Button**: Toggles visibility
  - **Delete Button**: Removes news

### 6.8 HRMS Access Section

#### 6.8.1 HRMS Quick Access
**HRMS Cards**:
- **Company Management**:
  - Setup company
  - Manage departments
  - **Go to HRMS Button**: Opens HRMS portal
  
- **Employee Management**:
  - Total employees count
  - Add employees
  - **Manage Employees Button**: Opens employee list
  
- **Attendance System**:
  - Today's attendance summary
  - **View Attendance Button**: Opens attendance page
  
- **Payroll System**:
  - Pending payroll count
  - **Process Payroll Button**: Opens payroll page

### 6.9 Messages Section

#### 6.9.1 Recent Conversations
- List of recent chats with candidates
- Unread message count
- **View All Messages Button**: Opens message center

#### 6.9.2 Quick Actions
- **Message Candidate Button**: Opens candidate search
- **Broadcast Message Button**: Sends message to multiple candidates

### 6.10 Analytics Section

#### 6.10.1 Job Performance Analytics
**Charts**:
- Applications over time
- Job views vs applications
- Source of applications
- Time to hire

#### 6.10.2 Candidate Analytics
**Charts**:
- Candidate demographics
- Skills distribution
- Experience levels
- Location distribution

#### 6.10.3 Hiring Pipeline
**Pipeline Stages**:
- Applied
- Screening
- Interview
- Offer
- Hired
- Rejected

**Stage Cards** display:
- Stage name
- Candidate count
- Average time in stage
- **View Candidates Button**: Shows candidates in stage

---

## 7. INSTITUTE DASHBOARD (/dashboard/institute)

### 7.1 Dashboard Overview
**Access**: Only accessible to users with Institute role

### 7.2 Dashboard Header
- Welcome message with institute name
- Verification status badge
- **Request Verification Button**: Opens verification request
- Notification bell icon
- Profile dropdown menu

### 7.3 Institute Profile Section

#### 7.3.1 Institute Overview Card
**Displays**:
- Institute logo with upload option
- Institute name
- Location
- Affiliation
- Total students
- Total courses
- Total faculty
- Verification status
- **Edit Institute Profile Button**: Opens profile edit modal

#### 7.3.2 Edit Institute Profile Modal
**Tabs**:

1. **Basic Information Tab**:
   - Institute Name
   - Establishment Year
   - Affiliation
   - Recognition/Accreditation
   - Website URL
   - **Save Basic Info Button**: Updates info

2. **Institute Logo Tab**:
   - Current logo preview
   - **Upload Logo Button**: Opens file picker
   - **Remove Logo Button**: Removes logo
   - **Save Logo Button**: Updates logo

3. **Location Tab**:
   - State dropdown
   - City dropdown
   - Address textarea
   - Pincode
   - **Save Location Button**: Updates location

4. **About Institute Tab**:
   - Institute Description textarea
   - Vision textarea
   - Mission textarea
   - **Save About Info Button**: Updates about section

5. **Infrastructure Tab**:
   - Total Area
   - Number of Classrooms
   - Computer Labs
   - Library Facilities
   - Hostel Facilities
   - Sports Facilities
   - Other Amenities
   - **Upload Infrastructure Photos Button**: Uploads photos
   - **Save Infrastructure Button**: Updates infrastructure

6. **Training Center Tab**:
   - Center Name
   - Center Code
   - Training Sectors (multi-select)
   - Capacity
   - Facilities Available
   - **Save Training Center Button**: Updates center info

### 7.4 Course Management Section

#### 7.4.1 Course Overview Cards
- **Total Courses**: Count with trend
- **Active Enrollments**: Count
- **Course Completion Rate**: Percentage
- **Average Rating**: Stars

#### 7.4.2 Create Course
**Create Course Button**: Opens course creation form

**Course Creation Form**:

1. **Basic Details Tab**:
   - Course Name
   - Course Description (rich text)
   - Course Category/Sector
   - Course Duration
   - Course Fees
   - Prerequisites
   - **Next Button**: Goes to next tab

2. **Course Content Tab**:
   - **Syllabus Section**:
     - **Add Module Button**: Adds new module
     - Module Title
     - Module Description
     - Topics Covered
     - **Save Module Button**: Saves module
   
   - **Lectures Section**:
     - **Add Lecture Button**: Adds new lecture
     - Lecture Title
     - Lecture Video Upload
     - Lecture Duration
     - **Save Lecture Button**: Saves lecture
   
   - **Materials Section**:
     - **Add Material Button**: Adds new material
     - Material Title
     - Material File Upload (PDF, DOC, etc.)
     - **Save Material Button**: Saves material
   
   - **Next Button**: Goes to next tab

3. **Assessments Tab**:
   - **Quizzes Section**:
     - **Create Quiz Button**: Opens quiz builder
     - Quiz Title
     - Number of Questions
     - Duration
     - Passing Marks
     - **Add Question Button**: Adds question
       - Question Text
       - Question Type (MCQ, True/False, Fill in blank)
       - Options (for MCQ)
       - Correct Answer
       - Explanation
     - **Save Quiz Button**: Saves quiz
   
   - **Assignments Section**:
     - **Create Assignment Button**: Opens assignment form
     - Assignment Title
     - Assignment Description
     - Due Date
     - Maximum Marks
     - **Save Assignment Button**: Saves assignment
   
   - **Next Button**: Goes to next tab

4. **Media Tab**:
   - Course Thumbnail Upload
   - Course Banner Upload
   - Course Preview Video Upload
   - **Next Button**: Goes to next tab

5. **Settings Tab**:
   - Course Visibility (Public/Private)
   - Enrollment Limit
   - Certificate Issuance (Yes/No)
   - Certificate Template Upload
   - **Next Button**: Goes to preview

6. **Preview Tab**:
   - Preview of complete course
   - **Publish Course Button**: Publishes course
   - **Save as Draft Button**: Saves without publishing
   - **Back Button**: Goes to previous tab
   - **Cancel Button**: Discards course

#### 7.4.3 Manage Courses
**Course Listing Tabs**:
- **Active Courses**: Published courses
- **Draft Courses**: Unpublished courses
- **Archived Courses**: Inactive courses

**Course Cards** display:
- Course thumbnail
- Course title
- Category
- Enrollment count
- Completion rate
- Rating
- Status badge
- **Actions**:
  - **View Course Button**: Opens course page
  - **Edit Course Button**: Opens edit form
  - **Manage Enrollments Button**: Shows enrolled students
  - **View Analytics Button**: Shows course analytics
  - **Archive Course Button**: Archives course
  - **Delete Course Button**: Removes course

### 7.5 Student Management Section

#### 7.5.1 Student Overview Cards
- **Total Students**: Count with trend
- **Active Students**: Currently enrolled
- **Completed Courses**: Total completions
- **Certificates Issued**: Count

#### 7.5.2 Add Student
**Add Student Button**: Opens student registration form

**Student Registration Form**:
- **Personal Details Tab**:
  - Student Name
  - Email
  - Phone
  - Date of Birth
  - Gender
  - **Next Button**: Goes to next tab

- **Address Tab**:
  - State dropdown
  - City dropdown
  - Address textarea
  - Pincode
  - **Next Button**: Goes to next tab

- **Education Tab**:
  - Highest Qualification
  - Institution Name
  - Year of Passing
  - Percentage/CGPA
  - **Next Button**: Goes to next tab

- **Course Enrollment Tab**:
  - Select Course dropdown
  - Enrollment Date
  - Batch Selection
  - Payment Status
  - **Register Student Button**: Registers student
  - **Cancel Button**: Discards registration

#### 7.5.3 Manage Students
**Student Listing**:
**Filter Options**:
- Filter by course
- Filter by batch
- Filter by status
- Search by name/email

**Student Cards** display:
- Student photo
- Student name
- Student ID
- Enrolled courses
- Progress percentage
- Status badge
- **Actions**:
  - **View Profile Button**: Opens student profile
  - **View Progress Button**: Shows course progress
  - **Issue Certificate Button**: Issues certificate
  - **Edit Student Button**: Opens edit form
  - **Delete Student Button**: Removes student

**Student Profile Modal**:
- Personal details
- Enrolled courses
- Course progress
- Certificates earned
- Attendance records
- Assessment results
- **Close Button**: Closes modal

#### 7.5.4 Bulk Student Upload
**Bulk Upload Button**: Opens bulk upload form

**Bulk Upload Form**:
- **Download Template Button**: Downloads CSV template
- **Upload CSV Button**: Uploads student data
- **Validate Data Button**: Validates uploaded data
- **Import Students Button**: Imports validated students
- **Cancel Button**: Cancels upload

### 7.6 Batch Management Section

#### 7.6.1 Batch Overview
- Total batches
- Active batches
- Completed batches

#### 7.6.2 Create Batch
**Create Batch Button**: Opens batch creation form

**Batch Creation Form**:
- Batch Name
- Course Selection
- Start Date
- End Date
- Batch Capacity
- Faculty Assignment
- Schedule (Days and Timings)
- **Create Batch Button**: Creates batch
- **Cancel Button**: Discards batch

#### 7.6.3 Manage Batches
**Batch Listing Tabs**:
- **Active Batches**: Ongoing batches
- **Upcoming Batches**: Scheduled batches
- **Completed Batches**: Finished batches

**Batch Cards** display:
- Batch name
- Course name
- Start date
- End date
- Student count
- Faculty assigned
- Status badge
- **Actions**:
  - **View Batch Button**: Shows batch details
  - **Manage Students Button**: Shows enrolled students
  - **Edit Batch Button**: Opens edit form
  - **Mark Complete Button**: Marks batch as complete
  - **Delete Batch Button**: Removes batch

### 7.7 Faculty Management Section

#### 7.7.1 Faculty Overview
- Total faculty
- Active faculty
- Courses assigned

#### 7.7.2 Add Faculty
**Add Faculty Button**: Opens faculty registration form

**Faculty Registration Form**:
- Faculty Name
- Email
- Phone
- Qualification
- Specialization
- Experience (years)
- Subjects Taught (multi-select)
- Faculty Photo Upload
- **Add Faculty Button**: Adds faculty
- **Cancel Button**: Discards registration

#### 7.7.3 Manage Faculty
**Faculty Listing**:
Each faculty card displays:
- Faculty photo
- Faculty name
- Qualification
- Specialization
- Courses assigned
- **Actions**:
  - **View Profile Button**: Opens faculty profile
  - **Assign Courses Button**: Opens course assignment
  - **Edit Faculty Button**: Opens edit form
  - **Delete Faculty Button**: Removes faculty

### 7.8 Placement Management Section

#### 7.8.1 Placement Overview Cards
- **Total Placements**: Count with trend
- **Average Package**: Amount
- **Placement Rate**: Percentage
- **Top Recruiters**: List

#### 7.8.2 Record Placement
**Record Placement Button**: Opens placement form

**Placement Form**:
- Student Selection dropdown
- Company Name
- Job Role
- Salary Package
- Placement Date
- Placement Type (Campus/Off-Campus)
- **Upload Placement Photos Button**: Uploads photos
- **Record Placement Button**: Records placement
- **Cancel Button**: Discards placement

#### 7.8.3 Placement Analytics
**Analytics Tabs**:
- **Sector-wise Analysis**: Placements by sector
- **Company-wise Analysis**: Placements by company
- **Salary Trends**: Salary distribution
- **Placement Timeline**: Placements over time

**Charts**:
- Bar charts
- Pie charts
- Line graphs
- **Export Report Button**: Downloads analytics report

#### 7.8.4 Manage Placements
**Placement Listing**:
Each placement displays:
- Student name
- Company name
- Job role
- Salary package
- Placement date
- Placement photos
- **Actions**:
  - **View Details Button**: Shows full details
  - **Edit Placement Button**: Opens edit form
  - **Delete Placement Button**: Removes placement

### 7.9 Events & News Section

#### 7.9.1 News Overview
- Total news posted
- Total views
- **Post News Button**: Opens news creation form

#### 7.9.2 Create Event/News
**News Creation Form**:
- **Type**: Event or News
- **Title**: Event/news title
- **Details**: Description (rich text)
- **Banner Image**: Image upload
- **Date**: Event/news date
- **Venue**: Event location (if event)
- **Expected Participants**: Number (if event)
- **Visibility**: Public or Private
- **Publish Button**: Publishes news
- **Save as Draft Button**: Saves without publishing
- **Cancel Button**: Discards news

#### 7.9.3 Manage News
**News Listing**:
Each news item displays:
- Banner image thumbnail
- Title
- Type badge
- Posted date
- Views count
- Visibility status
- **Actions**:
  - **View Button**: Shows full news
  - **Edit Button**: Opens edit form
  - **Hide/Show Button**: Toggles visibility
  - **Delete Button**: Removes news

### 7.10 Government Schemes Section

#### 7.10.1 Available Schemes
**Scheme Cards** display:
- Scheme name
- Scheme description
- Eligibility criteria
- Benefits
- Application deadline
- **Apply Button**: Opens application form
- **View Details Button**: Shows full scheme details

#### 7.10.2 Applied Schemes
**Application Tabs**:
- **Pending**: Under review
- **Approved**: Approved applications
- **Rejected**: Rejected applications

**Application Cards** display:
- Scheme name
- Applied date
- Status badge
- **View Application Button**: Shows application details
- **Upload Documents Button**: Uploads required documents

### 7.11 Industry Collaboration Section

#### 7.11.1 Collaboration Overview
- Total collaborations
- Active MOUs
- **Add Collaboration Button**: Opens collaboration form

#### 7.11.2 Add Collaboration
**Collaboration Form**:
- Company Name
- Industry
- Collaboration Type
- MOU Start Date
- MOU End Date
- **Upload MOU Document Button**: Uploads MOU PDF
- Collaboration Activities textarea
- **Add Collaboration Button**: Adds collaboration
- **Cancel Button**: Discards collaboration

#### 7.11.3 Manage Collaborations
**Collaboration Listing**:
Each collaboration displays:
- Company name
- Industry
- Collaboration type
- MOU period
- Status badge
- **Actions**:
  - **View MOU Button**: Opens MOU document
  - **Edit Collaboration Button**: Opens edit form
  - **Delete Collaboration Button**: Removes collaboration

### 7.12 Reports Section

#### 7.12.1 Report Types
- **Student Reports**:
  - Enrollment report
  - Progress report
  - Completion report
  - Certificate report

- **Course Reports**:
  - Course performance
  - Enrollment trends
  - Completion rates
  - Rating analysis

- **Placement Reports**:
  - Placement statistics
  - Sector-wise analysis
  - Company-wise analysis
  - Salary trends

- **Financial Reports**:
  - Fee collection
  - Outstanding fees
  - Revenue analysis

**Report Actions**:
- **Generate Report Button**: Generates selected report
- **Export to PDF Button**: Downloads PDF
- **Export to Excel Button**: Downloads Excel
- **Schedule Report Button**: Sets up automated reports

### 7.13 Messages Section

#### 7.13.1 Recent Messages
- List of recent conversations
- Unread message count
- **View All Messages Button**: Opens message center

#### 7.13.2 Quick Actions
- **Message Student Button**: Opens student search
- **Message Faculty Button**: Opens faculty search
- **Broadcast Message Button**: Sends message to multiple recipients

---

## End of Part 3

**Next Parts**:
- Part 4: Admin Panels & HRMS (Complete admin functionality and HRMS features)
- Part 5: Backend Architecture & Technical Specifications

---
