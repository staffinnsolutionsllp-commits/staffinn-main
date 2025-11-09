#!/bin/bash
cd /home/ec2-user/staffinn-backend

# Create .env.production file
cat > .env.production << EOF
PORT=4001
NODE_ENV=production
JWT_SECRET=StaffInn_2024_Super_Secure_Key_ap-south-1_Production_Ready_243179894822_JWT_Secret
AWS_REGION=ap-south-1
DYNAMODB_USERS_TABLE=staffinn-users
RECRUITER_PROFILES_TABLE=staffinn-recruiter-profiles
STAFF_TABLE=staffinn-staff-profiles
CONTACT_HISTORY_TABLE=staffinn-contact-history
NOTIFICATIONS_TABLE=staffinn-notifications
INSTITUTE_STUDENTS_TABLE=staffinn-institute-students
INSTITUTE_COURSES_TABLE=staffinn-institute-courses
DYNAMODB_ISSUES_TABLE=staffinn-issue-section
ADMIN_TABLE=staffinn-admin
COURSE_REVIEW_TABLE=course-review
S3_BUCKET_NAME=staffinn-files
FROM_EMAIL=otp.staffinn@gmail.com
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=3
OTP_RATE_LIMIT_REQUESTS=3
OTP_RATE_LIMIT_WINDOW_MINUTES=15
WEBSITE_VALIDATION_TIMEOUT=15000
WEBSITE_VALIDATION_CACHE_DURATION=30
REGISTRATION_VALIDATION_CACHE_DURATION=60
REGISTRATION_RATE_LIMIT_REQUESTS=10
REGISTRATION_RATE_LIMIT_WINDOW_MINUTES=5
EMAIL_VALIDATION_CACHE_DURATION=24
EMAIL_RATE_LIMIT_REQUESTS=50
EMAIL_RATE_LIMIT_WINDOW_MINUTES=60
EOF

chmod 600 .env.production
echo "Environment file created successfully"