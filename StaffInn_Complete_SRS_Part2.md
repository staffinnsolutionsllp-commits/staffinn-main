# StaffInn - Complete Software Requirements Specification (SRS)
## Part 2: Frontend Application - Public Pages

---

## 4. FRONTEND APPLICATION - PUBLIC PAGES

### 4.1 Home Page (/)

#### 4.1.1 Page Overview
The home page serves as the main landing page for all users, featuring dynamic hero images, search functionality, and trending content.

#### 4.1.2 Hero Section
**Visual Elements**:
- Dynamic hero image carousel (changes every 5 seconds)
- Multiple hero images uploaded by admin
- Slideshow indicators (dots) for navigation
- Full-width banner display

**Search Container**:
Located on top of hero image with 4 dropdowns + 2 buttons:

1. **State Dropdown**
   - Label: "Select State"
   - Populated from Country State City API
   - Triggers city dropdown population on selection

2. **City Dropdown**
   - Label: "Select City"
   - Populated based on selected state
   - Disabled until state is selected

3. **Sector Dropdown**
   - Label: "Select Sector"
   - Options: All available sectors (Healthcare, IT, Manufacturing, etc.)
   - Triggers role dropdown population on selection

4. **Role Dropdown**
   - Label: "Select Role"
   - Populated based on selected sector
   - Disabled until sector is selected

5. **Search Button**
   - Text: "Search" or "Searching..."
   - Action: Searches staff based on selected criteria
   - Shows search results in Trending Staff section
   - Disabled during search operation

6. **Clear Button**
   - Text: "Clear"
   - Visibility: Only shown when search results are displayed
   - Action: Clears all search filters and shows trending staff again

#### 4.1.3 Trending Staff Section
**Section Header**:
- Title: "Trending Staff" (default) or "Search Results" (after search)
- Subtitle: "Top staff members based on profile views" or "Staff matching your search criteria"

**Staff Card Components** (Clean Design):
Each card displays:
- **Profile Photo**: Avatar or placeholder with initial
- **Name**: Staff member's full name
- **Profession**: Primary skill or sector-role combination
- **Sector & Role**: Displayed if available
- **Location**: Area, city, state, pincode (if available)
- **Rating**: Star rating (0-5) with review count
- **Availability Badge**: 
  - "Available ✓" (green)
  - "Busy ✗" (red)
  - "Open for Offers" (yellow)
- **Location Icon**: 📍 with full address
- **Experience**: Years of experience or "Fresher"
- **Rate**: "Contact by Chat"
- **Skills**: First 2 skills + "+X more" indicator
- **View Profile Button**: Opens detailed profile modal

**View Profile Button Actions**:
- **If Not Logged In**: Shows login popup with message
- **If Logged In**: Opens staff profile modal with tabs:
  - Profile Details tab
  - Resume tab (Recruiter only)
  - Certificates tab
  - Reviews tab

**Staff Profile Modal Tabs**:

1. **Profile Details Tab**:
   - Full profile information
   - Location details
   - Sector and role
   - Email address
   - Availability status
   - Skills list (all skills displayed)
   - Work Experience section (if available)
   - Education section (10th, 12th, Graduation)
   - Contact Options:
     - **Chat Button**: Opens chat window
     - **Email Button**: Opens email client
     - **WhatsApp Button**: Opens WhatsApp (Recruiter only)

2. **Resume Tab** (Recruiter Only):
   - Resume preview in iframe
   - Download button (📥 Download)
   - Opens resume in new tab

3. **Certificates Tab**:
   - Certificate cards with:
     - Certificate badge icon (🏆)
     - Certificate name
     - Issuer name
     - Issue date
     - Duration
     - "View Certificate" link (if URL available)

4. **Reviews Tab**:
   - **Write Review Section**:
     - Rating input (1-5 stars)
     - Feedback textarea
     - "Submit Review" button
   - **Previous Reviews Section**:
     - Reviewer name
     - Star rating (filled/empty stars)
     - Review date
     - Feedback text
     - "View More Reviews" button (if more available)

**Modal Close Button**: × (top right corner)

#### 4.1.4 Trending Jobs Section
**Section Header**:
- Title: "Trending Jobs"
- Subtitle: "Most applied jobs from top recruiters"

**Job Card Components**:
Each card displays:
- **Company Logo**: Recruiter's company logo
- **Job Title**: Position name
- **Company Name**: Recruiter's company
- **Location**: Job location
- **Experience Required**: Experience level
- **Salary Range**: Salary information
- **Job Type**: Full-time, Part-time, Contract
- **Skills Required**: Key skills (first 3)
- **Posted Date**: Time since posting
- **Application Count**: Number of applications
- **View Job Button**: 
  - **If Not Logged In**: Shows login popup
  - **If Logged In**: Redirects to recruiter page (/recruiter/:recruiterId)

#### 4.1.5 Trending Courses Section
**Section Header**:
- Title: "Trending Courses"
- Subtitle: "Popular courses from top institutes"

**Course Card Components**:
Each card displays:
- **Course Thumbnail**: Course image
- **Course Title**: Course name
- **Institute Name**: Offering institute
- **Course Duration**: Length of course
- **Course Fees**: Price information
- **Course Category**: Sector/category
- **Enrollment Count**: Number of students
- **Rating**: Course rating
- **View Course Button**:
  - **If Not Logged In**: Shows login popup
  - **If Logged In**: Redirects to institute page (/institute/:instituteId)

#### 4.1.6 Footer Section
- Company information
- Quick links
- Contact details
- Social media links
- Copyright information

---

### 4.2 Staff Page (/staff)

#### 4.2.1 Page Overview
Dedicated page for browsing and searching staff profiles with advanced filtering.

#### 4.2.2 Search & Filter Section
**Search Bar**:
- Text input for name/skill search
- Search button
- Real-time search suggestions

**Filter Options**:
1. **Location Filters**:
   - State dropdown
   - City dropdown
   - Area input

2. **Professional Filters**:
   - Sector dropdown
   - Role dropdown
   - Experience level (Fresher, Junior, Mid-Level, Senior)

3. **Availability Filter**:
   - Available
   - Busy
   - Open for Offers

4. **Rating Filter**:
   - Minimum rating slider (0-5 stars)

**Filter Buttons**:
- **Apply Filters**: Applies selected filters
- **Clear Filters**: Resets all filters
- **Advanced Search**: Expands more filter options

#### 4.2.3 Staff Listing
**Display Options**:
- Grid view (default)
- List view
- Sort by: Relevance, Rating, Experience, Recent

**Staff Cards**: Same as home page trending staff cards

**Pagination**:
- Page numbers
- Previous/Next buttons
- Items per page selector (10, 20, 50)

#### 4.2.4 Staff Profile Modal
Same as home page staff profile modal with all tabs and features.

---

### 4.3 Institute Page (/institute)

#### 4.3.1 Institute List Page (/institute)
**Page Overview**: Lists all registered institutes

**Search & Filter Section**:
- **Search Bar**: Search by institute name
- **Location Filter**: State and city dropdowns
- **Affiliation Filter**: Filter by affiliation type
- **Sort Options**: Name, Rating, Established Year

**Institute Card Components**:
Each card displays:
- **Institute Logo**: Institute branding
- **Institute Name**: Full name
- **Location**: City, State
- **Establishment Year**: Year founded
- **Affiliation**: Accreditation details
- **Total Courses**: Number of courses offered
- **Total Students**: Enrollment count
- **Rating**: Institute rating
- **View Institute Button**: Opens institute detail page

#### 4.3.2 Institute Detail Page (/institute/:id)

**Page Sections**:

1. **Institute Header**:
   - Institute logo
   - Institute name
   - Location
   - Contact information
   - Website link
   - Social media links
   - Verification badge (if verified)

2. **About Section**:
   - Institute description
   - Establishment year
   - Affiliation details
   - Recognition/accreditation
   - Vision and mission

3. **Infrastructure Section**:
   - Total area
   - Number of classrooms
   - Computer labs
   - Library facilities
   - Hostel facilities
   - Sports facilities
   - Other amenities
   - Infrastructure photos

4. **Courses Section**:
   **Course Cards** display:
   - Course thumbnail
   - Course name
   - Duration
   - Fees
   - Category
   - Enrollment count
   - **Enroll Button**:
     - **If Not Logged In**: Shows login popup
     - **If Logged In as Staff**: Opens enrollment modal
     - **Other Roles**: Shows "Not available for your role"

   **Enrollment Modal**:
   - Course details confirmation
   - Student information form
   - Payment options (if applicable)
   - Terms and conditions checkbox
   - **Confirm Enrollment Button**: Enrolls student
   - **Cancel Button**: Closes modal

5. **Faculty Section**:
   **Faculty Cards** display:
   - Faculty photo
   - Name
   - Qualification
   - Subjects taught
   - Experience
   - Contact information

6. **Placement Section**:
   - Placement statistics
   - Placement photos gallery
   - Company-wise placement data
   - Sector-wise analysis
   - Salary trends
   - **View More Placements Button**: Expands full list

7. **Events & News Section**:
   **Event/News Cards** display:
   - Event banner image
   - Event title
   - Event type (Event/News)
   - Event date
   - Venue
   - Expected participants
   - Event details
   - **Read More Button**: Expands full details

8. **Government Schemes Section**:
   - Available schemes list
   - Scheme details
   - Eligibility criteria
   - Application process
   - **Apply Button**: Opens application form

9. **Industry Collaborations Section**:
   - Partner companies list
   - MOU details
   - Collaboration activities
   - **View MOU Button**: Opens MOU document

10. **Contact Section**:
    - Contact form
    - Institute address
    - Phone numbers
    - Email addresses
    - Map location
    - **Send Message Button**: Submits contact form

---

### 4.4 Recruiter Page (/recruiter)

#### 4.4.1 Recruiter List Page (/recruiter)
**Page Overview**: Lists all registered recruiters/companies

**Search & Filter Section**:
- **Search Bar**: Search by company name
- **Industry Filter**: Filter by industry/sector
- **Location Filter**: State and city dropdowns
- **Verification Filter**: Verified companies only
- **Sort Options**: Name, Rating, Jobs Posted

**Recruiter Card Components**:
Each card displays:
- **Company Logo**: Company branding
- **Company Name**: Full company name
- **Industry**: Business sector
- **Location**: City, State
- **Total Jobs**: Number of active jobs
- **Verification Badge**: If verified
- **Rating**: Company rating
- **View Company Button**: Opens recruiter detail page

#### 4.4.2 Recruiter Detail Page (/recruiter/:recruiterId)

**Page Sections**:

1. **Company Header**:
   - Company logo
   - Company name
   - Industry
   - Location
   - Website link
   - Social media links
   - Verification badge
   - **Follow Button**: Follow company for updates

2. **About Company Section**:
   - Company description
   - Company size
   - Founded year
   - Company culture
   - Values and mission

3. **Active Jobs Section**:
   **Job Cards** display:
   - Job title
   - Location
   - Experience required
   - Salary range
   - Job type
   - Skills required
   - Posted date
   - Application count
   - **Apply Now Button**:
     - **If Not Logged In**: Shows login popup
     - **If Logged In as Staff**: Opens application modal
     - **Other Roles**: Shows "Only staff can apply"

   **Application Modal**:
   - Job details confirmation
   - Resume selection (from profile)
   - Cover letter textarea
   - Additional documents upload
   - **Submit Application Button**: Submits application
   - **Cancel Button**: Closes modal

4. **Company News Section**:
   **News Cards** display:
   - News banner image
   - News title
   - Posted date
   - Venue (if event)
   - Expected participants (if event)
   - News details
   - **Read More Button**: Expands full details

5. **Company Reviews Section**:
   - Overall rating
   - Review count
   - **Write Review Button**: Opens review form
   - **Review Cards** display:
     - Reviewer name
     - Rating
     - Review date
     - Review text
   - **Load More Reviews Button**: Loads more reviews

6. **Contact Section**:
   - Contact form
   - Company address
   - Phone numbers
   - Email addresses
   - **Send Message Button**: Submits contact form
   - **Chat Button**: Opens chat window (if logged in)

---

### 4.5 News Page (/news)

#### 4.5.1 Page Overview
Displays all news content from Staffinn, recruiters, and institutes.

#### 4.5.2 Hero Section
**Top News of the Day**:
- Large banner display
- Featured news article
- "TOP NEWS OF THE DAY" badge
- Full article preview
- **Read Full Article Button**: Expands complete article

#### 4.5.3 Trending Topics Section
**Section Header**: "Trending Topics"

**Topic Cards** (Max 15):
- Topic image
- Topic title
- Topic description (truncated)
- Posted date
- Tags
- **Read More Button**: Expands full topic

#### 4.5.4 Expert Insights Section
**Section Header**: "Expert Insights & Interviews"

**Insight Cards**:
- Video thumbnail
- Expert name
- Expert designation
- Video title
- **Play Button**: Plays video
- **Watch Full Interview Button**: Opens video player

**Video Player Modal**:
- Full video player
- Video controls
- Expert information
- **Close Button**: Closes modal

#### 4.5.5 Posted News Section
**Section Header**: "Latest News"

**News Cards**:
- News banner image
- News title
- News description (truncated)
- Posted date
- **Read Full Article Button**: Expands complete article

#### 4.5.6 Recruiter News Section
**Section Header**: "Recruiter News & Events"

**Filter Options**:
- Filter by company
- Filter by date
- Filter by event type

**Recruiter News Cards**:
- Company logo
- Company name
- News banner image
- News title
- Event date (if event)
- Venue (if event)
- Expected participants (if event)
- News details (truncated)
- **Read More Button**: Expands full details

#### 4.5.7 Institute News Section
**Section Header**: "Institute News & Events"

**Filter Options**:
- Filter by institute
- Filter by date
- Filter by type (Event/News)

**Institute News Cards**:
- Institute logo
- Institute name
- News banner image
- News title
- Event type (Event/News)
- Event date (if event)
- Venue (if event)
- Expected participants (if event)
- News details (truncated)
- **Read More Button**: Expands full details

#### 4.5.8 News Article Modal
**Full Article View**:
- Article banner image
- Article title
- Posted date
- Author/Source
- Full article content
- Tags
- Share buttons (Social media)
- **Close Button**: Closes modal

---

### 4.6 Course Learning Page (/course/:courseId)

#### 4.6.1 Page Overview
Dedicated page for enrolled students to access course content and complete coursework.

**Access Control**:
- Only accessible to enrolled students
- Redirects to login if not authenticated
- Shows "Not enrolled" message if not enrolled

#### 4.6.2 Course Header
- Course title
- Institute name
- Course progress bar (percentage)
- Enrollment date
- Expected completion date
- Certificate status

#### 4.6.3 Course Navigation Sidebar
**Sections**:
1. **Overview**: Course introduction
2. **Syllabus**: Course outline
3. **Lectures**: Video lectures list
4. **Materials**: Study materials
5. **Assignments**: Assignment list
6. **Quizzes**: Quiz list
7. **Progress**: Progress tracking
8. **Certificate**: Certificate download

#### 4.6.4 Overview Section
- Course description
- Learning outcomes
- Prerequisites
- Duration
- Instructor information
- **Start Learning Button**: Navigates to first lecture

#### 4.6.5 Syllabus Section
**Module List**:
- Module number and title
- Module description
- Topics covered
- Duration
- **Expand/Collapse Button**: Shows/hides module details

#### 4.6.6 Lectures Section
**Lecture List**:
Each lecture displays:
- Lecture number
- Lecture title
- Duration
- Completion status (✓ or ○)
- **Play Button**: Plays video lecture

**Video Player**:
- Full video player
- Video controls (play, pause, volume, fullscreen)
- Playback speed control
- Quality selector
- **Mark as Complete Button**: Marks lecture as watched
- **Next Lecture Button**: Navigates to next lecture
- **Previous Lecture Button**: Navigates to previous lecture

#### 4.6.7 Materials Section
**Material List**:
Each material displays:
- Material title
- Material type (PDF, Document, Link)
- File size
- Upload date
- **Download Button**: Downloads material
- **View Button**: Opens material in new tab

#### 4.6.8 Assignments Section
**Assignment List**:
Each assignment displays:
- Assignment title
- Due date
- Status (Not Started, In Progress, Submitted, Graded)
- Score (if graded)
- **View Assignment Button**: Opens assignment details

**Assignment Detail View**:
- Assignment description
- Instructions
- Submission deadline
- Maximum marks
- **Upload Solution Button**: Opens file upload
- **Submit Assignment Button**: Submits assignment
- **View Feedback Button**: Shows grading feedback (if graded)

#### 4.6.9 Quizzes Section
**Quiz List**:
Each quiz displays:
- Quiz title
- Number of questions
- Duration
- Attempts allowed
- Best score
- Status (Not Attempted, In Progress, Completed)
- **Start Quiz Button**: Begins quiz
- **Resume Quiz Button**: Continues incomplete quiz
- **View Results Button**: Shows quiz results

**Quiz Interface**:
- Question number indicator
- Question text
- Answer options (MCQ, True/False, Fill in the blank)
- **Previous Question Button**: Goes to previous question
- **Next Question Button**: Goes to next question
- **Submit Quiz Button**: Submits quiz for grading
- Timer display (if timed quiz)

**Quiz Results View**:
- Total score
- Percentage
- Correct answers count
- Wrong answers count
- Time taken
- **Question-wise breakdown**:
  - Question text
  - Your answer
  - Correct answer
  - Explanation (if available)
- **Retake Quiz Button**: Starts new attempt (if allowed)

#### 4.6.10 Progress Section
**Progress Dashboard**:
- Overall progress percentage
- Lectures completed
- Assignments submitted
- Quizzes completed
- Time spent on course
- **Progress Chart**: Visual representation
- **Activity Timeline**: Recent activities

#### 4.6.11 Certificate Section
**Certificate Status**:
- **If Not Completed**:
  - Completion requirements list
  - Progress towards completion
  - Estimated completion date
  
- **If Completed**:
  - Certificate preview
  - Issue date
  - Certificate ID
  - **Download Certificate Button**: Downloads PDF certificate
  - **Share Certificate Button**: Share on social media

---

### 4.7 Message Center (/messages)

#### 4.7.1 Page Overview
Central hub for all user communications.

**Access Control**: Only accessible to logged-in users

#### 4.7.2 Message List Sidebar
**Header**:
- "Messages" title
- **Compose New Message Button**: Opens compose modal
- Search messages input

**Conversation List**:
Each conversation displays:
- Contact profile photo
- Contact name
- Last message preview
- Timestamp
- Unread message count badge
- Online status indicator
- **Click Action**: Opens chat window

**Filter Tabs**:
- All Messages
- Unread
- Archived
- Starred

#### 4.7.3 Compose Message Modal
**Form Fields**:
- **To**: Recipient selection dropdown
  - Search users by name
  - Filter by role
- **Subject**: Message subject line
- **Message**: Message content textarea
- **Attachments**: File upload (optional)
- **Send Button**: Sends message
- **Cancel Button**: Closes modal

#### 4.7.4 Message Detail View
**Message Header**:
- Contact profile photo
- Contact name
- Contact role
- Online status
- **Actions**:
  - **Call Button**: Initiates call (if available)
  - **Video Call Button**: Starts video call (if available)
  - **More Options**: Archive, Delete, Block

**Message Thread**:
- Messages displayed in chronological order
- Sender's messages (right-aligned)
- Recipient's messages (left-aligned)
- Message timestamp
- Read receipts (✓✓)
- Message status (Sent, Delivered, Read)

**Message Input**:
- Text input area
- **Emoji Button**: Opens emoji picker
- **Attachment Button**: Opens file picker
- **Send Button**: Sends message
- Typing indicator (when recipient is typing)

#### 4.7.5 Contact History Modal
**Contact Information**:
- Contact profile photo
- Contact name
- Contact role
- Contact details
- **View Profile Button**: Opens full profile

**Communication History**:
- All messages exchanged
- Call history
- Meeting history
- Shared files
- **Export History Button**: Downloads history

---

### 4.8 Chat Window (/chat/:userId)

#### 4.8.1 Page Overview
Dedicated chat page for one-on-one conversations.

**Access Control**: Only accessible to logged-in users

#### 4.8.2 Chat Header
- Contact profile photo
- Contact name
- Contact role
- Online status
- Last seen timestamp
- **Actions**:
  - **Call Button**: Initiates call
  - **Video Call Button**: Starts video call
  - **Info Button**: Shows contact info
  - **Back Button**: Returns to message center

#### 4.8.3 Chat Area
**Message Display**:
- Messages in chronological order
- Sender's messages (right-aligned, blue background)
- Recipient's messages (left-aligned, gray background)
- Message timestamp
- Read receipts
- Message status indicators
- **Scroll to Bottom Button**: Appears when scrolled up

**Message Types**:
- Text messages
- Image messages (with preview)
- File attachments (with download option)
- Voice messages (with play button)
- Location sharing (with map)

#### 4.8.4 Message Input Area
**Input Components**:
- Text input field
- **Emoji Button**: Opens emoji picker
- **Attachment Button**: Opens file picker
  - Images
  - Documents
  - Videos
  - Audio
- **Voice Message Button**: Records voice message
- **Send Button**: Sends message

**Typing Indicator**: Shows when recipient is typing

#### 4.8.5 Quick Actions
**Quick Reply Buttons** (if configured):
- Pre-defined quick responses
- One-click sending

**Message Templates** (for recruiters):
- Interview invitation
- Job offer
- Rejection message
- Follow-up message

---

### 4.9 Login & Registration

#### 4.9.1 Login Popup
**Form Fields**:
- **Email**: Email input field
- **Password**: Password input field with show/hide toggle
- **Remember Me**: Checkbox
- **Login Button**: Submits login form
- **Forgot Password Link**: Opens password reset modal

**Alternative Login**:
- **Register Link**: Opens registration popup
- Social login options (if configured)

**Error Handling**:
- Invalid credentials message
- Account blocked message
- Email not verified message

#### 4.9.2 Registration Popup
**Role Selection**:
- **Staff**: For job seekers
- **Recruiter**: For companies
- **Institute**: For training institutes

**Common Fields**:
- Full Name
- Email
- Phone Number
- Password (with strength indicator)
- Confirm Password
- Terms and Conditions checkbox

**Staff-Specific Fields**:
- Location (State, City, Area)
- Sector
- Role
- Skills

**Recruiter-Specific Fields**:
- Company Name
- Industry
- Company Size
- Website URL
- Company Description

**Institute-Specific Fields**:
- Institute Name
- Affiliation
- Establishment Year
- Institute Type
- Website URL

**Buttons**:
- **Register Button**: Submits registration
- **Login Link**: Opens login popup
- **Cancel Button**: Closes popup

**Post-Registration**:
- Email verification sent message
- Pending approval message (for recruiters and institutes)
- Redirect to login

#### 4.9.3 Email Verification
**Verification Page**:
- Verification code input
- **Verify Button**: Verifies email
- **Resend Code Button**: Sends new verification code
- Success message
- Redirect to login

---

### 4.10 Blocked User Page

#### 4.10.1 Page Display
**When User is Blocked**:
- Blocked status message
- Reason for blocking (if provided)
- Contact admin information
- **Request Help Button**: Opens support form

**Support Form**:
- User email (pre-filled)
- Subject
- Message
- **Submit Request Button**: Sends request to admin

---

### 4.11 Hidden User Page

#### 4.11.1 Page Display
**When User is Hidden**:
- Hidden status message
- Reason for hiding (if provided)
- Contact admin information
- **Request Help Button**: Opens support form

---

## End of Part 2

**Next Parts**:
- Part 3: Dashboard Features by Role (Detailed dashboard breakdown)
- Part 4: Admin Panels & HRMS (Complete admin functionality)
- Part 5: Backend Architecture & Technical Specifications

---
