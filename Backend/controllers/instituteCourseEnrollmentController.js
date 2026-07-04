const { scanTable, getItem, putItem } = require('../config/dynamoDB');
const { v4: uuidv4 } = require('uuid');

const enrollStudentsInCourse = async (req, res) => {
  try {
    console.log('🎓 [BACKEND] ========== STARTING ENROLLMENT PROCESS ==========');
    const { courseId } = req.params;
    const { studentIds, paymentDetails, studentType } = req.body;
    const instituteId = req.user?.userId;
    
    console.log('🎓 [BACKEND] Course ID:', courseId);
    console.log('🎓 [BACKEND] Institute ID:', instituteId);
    console.log('🎓 [BACKEND] Student IDs:', studentIds);
    console.log('🎓 [BACKEND] Student Type:', studentType || 'institute');
    console.log('🎓 [BACKEND] Number of students:', studentIds?.length);
    
    if (!studentIds || studentIds.length === 0) {
      console.log('⚠️ [BACKEND] No students selected');
      return res.status(400).json({ 
        success: false,
        message: 'No students selected for enrollment' 
      });
    }
    
    // Get course details
    const courseParams = {
      TableName: 'staffinn-courses',
      FilterExpression: 'coursesId = :courseId OR instituteCourseID = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    };
    const courses = await scanTable(courseParams);
    const course = courses && courses.length > 0 ? courses[0] : null;
    const courseInstituteId = course?.instituteId || course?.institutesId;
    
    console.log('📚 [BACKEND] Course found:', course?.courseName || 'Unknown');
    console.log('🏢 [BACKEND] Course Institute ID:', courseInstituteId);
    
    // Fetch student details
    const userModel = require('../models/userModel');
    const instituteUser = await userModel.findUserById(instituteId);
    const isStaffinnPartner = instituteUser && (instituteUser.instituteType === 'staffinn_partner' || instituteUser.misApproved === true);
    
    let studentDetails = [];
    
    if (studentType === 'mis' && isStaffinnPartner) {
      // Fetch MIS students
      const misStudentModel = require('../models/misStudentModel');
      const allMisStudents = await misStudentModel.getStudentsByInstitute(instituteId);
      studentDetails = studentIds.map(studentId => {
        const student = allMisStudents.find(s => s.studentsId === studentId);
        return {
          studentId: studentId,
          studentName: student?.fatherName || student?.studentName || 'Unknown',
          studentEmail: student?.email || 'N/A'
        };
      });
    } else {
      // Fetch regular institute students
      const studentParams = {
        TableName: 'staffinn-institute-students',
        FilterExpression: 'instituteId = :instituteId',
        ExpressionAttributeValues: {
          ':instituteId': instituteId
        }
      };
      const allStudents = await scanTable(studentParams);
      studentDetails = studentIds.map(studentId => {
        const student = allStudents.find(s => 
          (s.instituteStudntsID || s.studentsId) === studentId
        );
        return {
          studentId: studentId,
          studentName: student?.studentName || student?.fullName || student?.name || 'Unknown',
          studentEmail: student?.email || 'N/A'
        };
      });
    }
    
    console.log('👥 [BACKEND] Student details fetched:', studentDetails.length);
    
    // Check for existing enrollments
    const checkParams = {
      TableName: 'staffinn-institute-course-enrollments',
      FilterExpression: 'courseId = :courseId AND enrollingInstituteId = :instituteId',
      ExpressionAttributeValues: {
        ':courseId': courseId,
        ':instituteId': instituteId
      }
    };
    
    const existingEnrollments = await scanTable(checkParams);
    console.log('🔍 [BACKEND] Existing enrollments found:', existingEnrollments?.length || 0);
    
    // Get already enrolled student IDs
    const alreadyEnrolledIds = new Set();
    if (existingEnrollments && existingEnrollments.length > 0) {
      existingEnrollments.forEach(enrollment => {
        if (enrollment.enrolledStudents && Array.isArray(enrollment.enrolledStudents)) {
          enrollment.enrolledStudents.forEach(s => {
            alreadyEnrolledIds.add(s.studentId);
          });
        }
      });
    }
    
    console.log('📋 [BACKEND] Already enrolled student IDs:', Array.from(alreadyEnrolledIds));
    
    // Filter out already enrolled students
    const newStudents = studentDetails.filter(s => !alreadyEnrolledIds.has(s.studentId));
    const skippedCount = studentDetails.length - newStudents.length;
    
    console.log('✅ [BACKEND] New students to enroll:', newStudents.length);
    console.log('⚠️ [BACKEND] Already enrolled (skipped):', skippedCount);
    
    if (newStudents.length === 0) {
      console.log('⚠️ [BACKEND] All students already enrolled');
      return res.status(200).json({
        success: true,
        message: 'All selected students are already enrolled',
        stats: {
          enrolled: 0,
          skipped: skippedCount,
          notFound: 0
        }
      });
    }
    
    // Create batch enrollment record with CORRECT field names
    const timestamp = new Date().toISOString();
    const enrollmentsId = uuidv4();
    const transactionId = paymentDetails?.transactionId || `TXN-${Date.now()}`;
    
    const enrolledStudentsArray = newStudents.map(student => ({
      studentId: student.studentId,
      studentName: student.studentName,
      studentEmail: student.studentEmail,
      enrollmentDate: timestamp,
      status: 'active'
    }));
    
    const batchEnrollment = {
      enrollmentsId: enrollmentsId,                    // ✅ Correct primary key
      courseId: courseId,                              // ✅ Correct field name
      courseInstituteId: courseInstituteId,            // ✅ Institute offering the course
      enrollingInstituteId: instituteId,               // ✅ Institute enrolling students
      studentType: studentType || 'institute',         // ✅ ADDED: Student type (institute/mis)
      enrolledStudents: enrolledStudentsArray,         // ✅ Array of students
      totalStudentsEnrolled: newStudents.length,
      enrollmentDate: timestamp,
      paymentStatus: paymentDetails?.paymentStatus || 'completed',
      totalAmount: (parseFloat(course?.fees) || 0) * newStudents.length,
      paymentDetails: {
        paymentMethod: paymentDetails?.paymentMethod || 'institute_enrollment',
        paymentDate: paymentDetails?.paymentDate || timestamp,
        paymentStatus: paymentDetails?.paymentStatus || 'completed',
        transactionId: transactionId
      },
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    console.log('💾 [BACKEND] Creating BATCH enrollment record:');
    console.log('💾 [BACKEND] Primary Key (enrollmentsId):', enrollmentsId);
    console.log('💾 [BACKEND] Course ID:', courseId);
    console.log('💾 [BACKEND] Students in batch:', newStudents.length);
    console.log('💾 [BACKEND] Full record:', JSON.stringify(batchEnrollment, null, 2));
    
    // Save batch enrollment
    await putItem('staffinn-institute-course-enrollments', batchEnrollment);
    console.log('✅ [BACKEND] Batch enrollment saved successfully!');
    
    // Also save individual student enrollments to course-enrolled-user table for progress tracking
    console.log('💾 [BACKEND] Saving individual student records to course-enrolled-user...');
    
    const individualEnrollments = [];
    for (const student of newStudents) {
      const individualEnrollment = {
        enrolledID: uuidv4(),
        courseId: courseId,
        courseName: course?.courseName || course?.name || 'Unknown Course',
        userId: student.studentId,
        studentName: student.studentName,
        studentEmail: student.studentEmail,
        enrollmentDate: timestamp,
        enrollmentType: 'institute',
        enrollmentSource: 'institute',  // ✅ ADDED: Mark as institute enrollment
        enrollingInstituteId: instituteId,
        instituteId: courseInstituteId,
        parentEnrollmentId: enrollmentsId,
        progressPercentage: 0,
        completedModules: [],
        paymentStatus: paymentDetails?.paymentStatus || 'completed',
        paymentMode: paymentDetails?.paymentMethod || 'institute_enrollment',
        transactionId: transactionId,
        status: 'active',
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await putItem('course-enrolled-user', individualEnrollment);
      individualEnrollments.push(individualEnrollment);
      console.log(`✅ [BACKEND] Saved ${student.studentName} to course-enrolled-user`);
    }
    
    console.log('✅ [BACKEND] All individual enrollments saved!');
    
    // Verify the save
    console.log('🔍 [BACKEND] Verifying batch enrollment save...');
    const verifyParams = {
      TableName: 'staffinn-institute-course-enrollments',
      FilterExpression: 'enrollmentsId = :id',
      ExpressionAttributeValues: {
        ':id': enrollmentsId
      }
    };
    const verified = await scanTable(verifyParams);
    console.log('✅ [BACKEND] Verification result:', verified?.length > 0 ? 'FOUND ✓' : 'NOT FOUND ✗');
    
    const stats = {
      enrolled: newStudents.length,
      skipped: skippedCount,
      notFound: 0
    };
    
    console.log('📊 [BACKEND] Final enrollment stats:', stats);
    console.log('🎓 [BACKEND] ========== ENROLLMENT PROCESS COMPLETE ==========');
    
    res.status(201).json({ 
      success: true,
      message: `Successfully enrolled ${stats.enrolled} student(s)${stats.skipped > 0 ? ` (${stats.skipped} already enrolled)` : ''}`, 
      enrollmentId: enrollmentsId,
      stats
    });
  } catch (error) {
    console.error('❌ [BACKEND] Error in enrollStudentsInCourse:', error);
    console.error('❌ [BACKEND] Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Failed to enroll students', 
      error: error.message 
    });
  }
};

const getEnrollmentHistory = async (req, res) => {
  try {
    const instituteId = req.user?.userId;
    if (!instituteId) {
      return res.status(400).json({ success: false, message: 'Institute ID not found' });
    }

    console.log('📚 [BACKEND] ========== FETCHING ENROLLMENT HISTORY ==========');
    console.log('📚 [BACKEND] Institute ID:', instituteId);

    // Fetch batch enrollments where THIS institute enrolled students
    const params = {
      TableName: 'staffinn-institute-course-enrollments',
      FilterExpression: 'enrollingInstituteId = :instituteId',  // ✅ FIXED: was instituteId
      ExpressionAttributeValues: {
        ':instituteId': instituteId
      }
    };

    console.log('🔍 [BACKEND] Scanning batch enrollments...');
    const batchEnrollments = await scanTable(params);
    console.log('✅ [BACKEND] Found batch enrollments:', batchEnrollments?.length || 0);

    if (!batchEnrollments || batchEnrollments.length === 0) {
      console.log('ℹ️ [BACKEND] No enrollment history found for this institute');
      return res.status(200).json({ success: true, data: [] });
    }

    // Enrich each batch enrollment with course details
    const enriched = await Promise.all(batchEnrollments.map(async (enrollment) => {
      let courseDetails = {};
      let courseInstituteDetails = {};
      
      try {
        // Fetch course details using correct field name
        const courseRows = await scanTable({
          TableName: 'staffinn-courses',
          FilterExpression: 'coursesId = :cid OR instituteCourseID = :cid',  // ✅ Support both field names
          ExpressionAttributeValues: { ':cid': enrollment.courseId }  // ✅ FIXED: was enrollment.coursesId
        });
        
        const course = courseRows && courseRows[0];
        if (course) {
          courseDetails = {
            courseName: course.courseName || course.name,
            duration: course.duration,
            mode: course.mode
          };
          
          // Fetch course institute details
          const courseInstituteId = course.instituteId || course.institutesId;
          if (courseInstituteId) {
            try {
              const userModel = require('../models/userModel');
              const instituteUser = await userModel.findUserById(courseInstituteId);
              if (instituteUser) {
                courseInstituteDetails = {
                  instituteName: instituteUser.instituteName || 'Institute'
                };
              }
            } catch (err) {
              console.error('❌ [BACKEND] Error fetching institute details:', err);
            }
          }
        }
      } catch (err) {
        console.error('❌ [BACKEND] Error fetching course details:', err);
      }

      // Extract enrolled students from the batch enrollment
      const enrolledStudents = enrollment.enrolledStudents || [];
      
      console.log(`📋 [BACKEND] Enrollment ${enrollment.enrollmentsId}:`);
      console.log(`   - Course: ${courseDetails.courseName || 'Unknown'}`);
      console.log(`   - Students: ${enrolledStudents.length}`);
      console.log(`   - Total Amount: ${enrollment.totalAmount || 0}`);

      return {
        enrollmentsId: enrollment.enrollmentsId,  // ✅ FIXED: was enrollment.instituteCourseEnrollmentID
        courseDetails,
        courseInstituteDetails,
        studentType: enrollment.studentType || 'institute',  // ✅ ADDED: Student type
        enrollmentDate: enrollment.enrollmentDate,
        paymentStatus: enrollment.paymentStatus || 'completed',
        totalAmount: enrollment.totalAmount || 0,
        totalStudentsEnrolled: enrolledStudents.length,
        enrolledStudents: enrolledStudents.map(student => ({
          studentName: student.studentName || 'Student',
          studentEmail: student.studentEmail || '',
          status: student.status || 'active',
          enrollmentDate: student.enrollmentDate
        }))
      };
    }));

    console.log('✅ [BACKEND] Enriched enrollments:', enriched.length);
    console.log('📤 [BACKEND] Sending enrollment history');
    console.log('📚 [BACKEND] ========== FETCH COMPLETE ==========');

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('❌ [BACKEND] Error in getEnrollmentHistory:', error);
    console.error('❌ [BACKEND] Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to fetch enrollment history', error: error.message });
  }
};

const getCourseEnrollmentTracking = async (req, res) => {
  try {
    const instituteId = req.user?.userId;
    
    if (!instituteId) {
      return res.status(400).json({ 
        success: false,
        message: 'Institute ID not found' 
      });
    }
    
    console.log('📊 [BACKEND] Fetching enrollment tracking for institute:', instituteId);
    
    // Fetch all courses for this institute
    const courseParams = {
      TableName: 'staffinn-courses',
      FilterExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': instituteId
      }
    };
    
    let courses = [];
    try {
      courses = await scanTable(courseParams);
      console.log('📚 [BACKEND] Found courses:', courses?.length || 0);
    } catch (error) {
      console.error('❌ [BACKEND] Error fetching courses:', error);
      return res.status(200).json({ 
        success: true,
        data: [] 
      });
    }
    
    if (!courses || courses.length === 0) {
      console.log('ℹ️ [BACKEND] No courses found for institute');
      return res.status(200).json({ 
        success: true,
        data: [] 
      });
    }
    
    // Fetch all enrollments for this institute's courses
    const enrollmentParams = {
      TableName: 'staffinn-institute-course-enrollments',
      FilterExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': instituteId
      }
    };
    
    let allEnrollments = [];
    try {
      allEnrollments = await scanTable(enrollmentParams);
      console.log('📝 [BACKEND] Found institute enrollments:', allEnrollments?.length || 0);
    } catch (error) {
      console.error('❌ [BACKEND] Error fetching enrollments:', error);
      allEnrollments = [];
    }
    
    // Fetch regular enrollments from course-enrolled-user table
    let regularEnrollments = [];
    try {
      const regularEnrollmentParams = {
        TableName: 'course-enrolled-user'
      };
      regularEnrollments = await scanTable(regularEnrollmentParams);
      console.log('📝 [BACKEND] Found regular enrollments:', regularEnrollments?.length || 0);
    } catch (error) {
      console.error('❌ [BACKEND] Error fetching regular enrollments:', error);
      regularEnrollments = [];
    }
    
    // Fetch pending payments for this institute
    const pendingPaymentModel = require('../models/pendingInstitutePaymentModel');
    let pendingPayments = [];
    try {
      pendingPayments = await pendingPaymentModel.getPendingPaymentsByInstitute(instituteId);
      console.log('💰 [BACKEND] Found pending payments:', pendingPayments?.length || 0);
    } catch (error) {
      console.error('❌ [BACKEND] Error fetching pending payments:', error);
      pendingPayments = [];
    }
    
    // Fetch all students (both MIS and regular)
    let allStudents = [];
    try {
      const userModel = require('../models/userModel');
      const instituteUser = await userModel.findUserById(instituteId);
      const isStaffinnPartner = instituteUser && (instituteUser.instituteType === 'staffinn_partner' || instituteUser.misApproved === true);
      
      if (isStaffinnPartner) {
        const misStudentModel = require('../models/misStudentModel');
        const misStudents = await misStudentModel.getStudentsByInstitute(instituteId);
        allStudents = (misStudents || []).map(s => ({
          studentsId: s.studentsId,
          studentName: s.fatherName || s.studentName || 'MIS Student',
          email: s.email,
          mobile: s.mobile || s.phone,
          isMisStudent: true
        }));
      } else {
        const studentParams = {
          TableName: 'staffinn-institute-students',
          FilterExpression: 'instituteId = :instituteId',
          ExpressionAttributeValues: {
            ':instituteId': instituteId
          }
        };
        const regularStudents = await scanTable(studentParams);
        allStudents = (regularStudents || []).map(s => ({
          studentsId: s.instituteStudntsID || s.studentsId,
          studentName: s.studentName || s.fullName || s.name,
          email: s.email,
          mobile: s.mobile || s.phoneNumber || s.phone,
          isMisStudent: false
        }));
      }
      console.log('👥 [BACKEND] Found students:', allStudents.length);
    } catch (error) {
      console.error('❌ [BACKEND] Error fetching students:', error);
      allStudents = [];
    }
    
    // Fetch all users to map enrollment data
    let allUsers = [];
    try {
      const userParams = {
        TableName: 'staffinn-users'
      };
      allUsers = await scanTable(userParams);
      console.log('👥 [BACKEND] Found users:', allUsers?.length || 0);
    } catch (error) {
      console.error('❌ [BACKEND] Error fetching users:', error);
      allUsers = [];
    }
    
    // Build tracking data for each course
    const trackingData = await Promise.all(courses.map(async (course) => {
      const courseId = course.coursesId || course.instituteCourseID;
      
      // Get batch enrollments for this course (using correct field name: courseId)
      const courseBatchEnrollments = (allEnrollments || []).filter(e => e.courseId === courseId);
      
      console.log(`📊 [BACKEND] Course: ${course.courseName || course.name}`);
      console.log(`   - Course ID: ${courseId}`);
      console.log(`   - Batch enrollments found: ${courseBatchEnrollments.length}`);
      
      // Extract all students from batch enrollments
      const instituteEnrollmentDetails = [];
      courseBatchEnrollments.forEach(batchEnrollment => {
        if (batchEnrollment.enrolledStudents && Array.isArray(batchEnrollment.enrolledStudents)) {
          batchEnrollment.enrolledStudents.forEach(student => {
            instituteEnrollmentDetails.push({
              enrolledID: `${batchEnrollment.enrollmentsId}_${student.studentId}`,
              userName: student.studentName || 'Unknown',
              userEmail: student.studentEmail || 'N/A',
              enrollmentDate: student.enrollmentDate || batchEnrollment.enrollmentDate,
              progressPercentage: 0,
              paymentStatus: batchEnrollment.paymentStatus || 'completed',
              batchEnrollmentId: batchEnrollment.enrollmentsId,
              enrollingInstitute: batchEnrollment.enrollingInstituteId
            });
          });
        }
      });
      
      console.log(`   - Total students from batch enrollments: ${instituteEnrollmentDetails.length}`);
      
      // ALSO get institute enrollments from course-enrolled-user table
      // These are individual records created during batch enrollment
      const instituteEnrollmentsFromTable = (regularEnrollments || []).filter(e => {
        if (e.courseId !== courseId) return false;
        
        // Check if it's an institute enrollment
        if (e.enrollmentSource === 'institute') return true;
        
        // For old enrollments: check institute-related fields
        return e.enrollingInstituteId || e.parentEnrollmentId || e.enrollmentType === 'institute';
      });
      
      console.log(`   - Institute enrollments from table: ${instituteEnrollmentsFromTable.length}`);
      
      // Merge both sources of institute enrollments
      instituteEnrollmentsFromTable.forEach(enrollment => {
        // Check if not already in instituteEnrollmentDetails
        const alreadyExists = instituteEnrollmentDetails.find(e => 
          e.enrolledID === enrollment.enrolledID || 
          (e.enrolledID && e.enrolledID.includes(enrollment.userId))
        );
        
        if (!alreadyExists) {
          instituteEnrollmentDetails.push({
            enrolledID: enrollment.enrolledID,
            userName: enrollment.studentName || enrollment.userName || 'Unknown',
            userEmail: enrollment.studentEmail || enrollment.userEmail || 'N/A',
            enrollmentDate: enrollment.enrollmentDate,
            progressPercentage: enrollment.progressPercentage || 0,
            paymentStatus: enrollment.paymentStatus || 'completed',
            enrollingInstitute: enrollment.enrollingInstituteId
          });
        }
      });
      
      console.log(`   - Total institute enrollments (merged): ${instituteEnrollmentDetails.length}`);
      
      // Get individual enrollments for this course (from course-enrollments table)
      // Filter to only include TRUE individual enrollments:
      // - Must NOT have enrollmentSource='institute'
      // - Must NOT have enrollingInstituteId (old institute enrollments)
      // - Must NOT have parentEnrollmentId (old institute enrollments)
      // - Must NOT have enrollmentType='institute'
      const individualEnrollments = (regularEnrollments || []).filter(e => {
        if (e.courseId !== courseId) return false;
        
        // STRICT FILTERING: Exclude ALL institute-related enrollments
        
        // Check enrollmentSource field (new enrollments)
        if (e.enrollmentSource === 'institute') {
          console.log(`   ⛔ Excluding institute enrollment (source): ${e.enrolledID}`);
          return false;
        }
        
        // Check for ANY institute-related fields (old enrollments)
        if (e.enrollingInstituteId) {
          console.log(`   ⛔ Excluding enrollment with enrollingInstituteId: ${e.enrolledID}`);
          return false;
        }
        
        if (e.parentEnrollmentId) {
          console.log(`   ⛔ Excluding enrollment with parentEnrollmentId: ${e.enrolledID}`);
          return false;
        }
        
        if (e.enrollmentType === 'institute') {
          console.log(`   ⛔ Excluding enrollment with enrollmentType=institute: ${e.enrolledID}`);
          return false;
        }
        
        // If enrollmentSource is explicitly 'individual', include it
        if (e.enrollmentSource === 'individual') {
          console.log(`   ✅ Including individual enrollment (source): ${e.enrolledID}`);
          return true;
        }
        
        // For old enrollments without enrollmentSource:
        // Only include if it has NO institute-related fields at all
        const hasNoInstituteFields = !e.enrollingInstituteId && !e.parentEnrollmentId && e.enrollmentType !== 'institute';
        
        if (hasNoInstituteFields) {
          console.log(`   ✅ Including individual enrollment (no institute fields): ${e.enrolledID}`);
          return true;
        }
        
        console.log(`   ⛔ Excluding enrollment (default): ${e.enrolledID}`);
        return false;
      });
      
      // Get pending payments for this course
      const coursePendingPayments = (pendingPayments || []).filter(p => p.courseId === courseId && p.paymentStatus === 'pending');
      
      console.log(`   - Individual enrollments found: ${individualEnrollments.length}`);
      
      const individualEnrollmentDetails = individualEnrollments.map(enrollment => {
        console.log('🔍 [BACKEND] Processing individual enrollment:', enrollment.enrolledID);
        console.log('   - Full enrollment object:', JSON.stringify(enrollment, null, 2));
        
        // Extract userId from multiple possible field names
        const userId = enrollment.userId || enrollment.userID || enrollment.user_id || enrollment.staffId || enrollment.seekerId;
        console.log('   - Extracted userId:', userId);
        
        // Try to get user details from the enrollment record itself
        let userName = enrollment.userName || enrollment.studentName || enrollment.name || enrollment.fullName;
        let userEmail = enrollment.userEmail || enrollment.studentEmail || enrollment.email;
        let paymentStatus = enrollment.paymentStatus || 'completed';
        // Normalize pending_at_institute → pending so frontend shows "Pending" correctly
        if (paymentStatus === 'pending_at_institute') paymentStatus = 'pending';
        
        console.log('   - Initial userName:', userName);
        console.log('   - Initial userEmail:', userEmail);
        console.log('   - Initial paymentStatus:', paymentStatus);
        
        // If not found in enrollment, fetch from users table
        if ((!userName || userName === 'Unknown' || !userEmail) && userId) {
          console.log('   - Fetching from users table for userId:', userId);
          
          const user = allUsers.find(u => u.userId === userId || u.userID === userId);
          if (user) {
            console.log('   - User object found:', JSON.stringify(user, null, 2));
            
            // Check user type and extract name accordingly
            if (user.userType === 'staff' || user.userType === 'seeker') {
              // For Staff/Seeker: use firstName + lastName or fullName
              userName = user.fullName || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || user.lastName) || user.name || user.userName || userName;
            } else if (user.userType === 'institute') {
              // For Institute: use instituteName
              userName = user.instituteName || user.fullName || user.name || userName;
            } else {
              // Generic fallback
              userName = user.fullName || user.name || user.userName || user.firstName || user.lastName || userName;
            }
            
            userEmail = user.email || userEmail;
            console.log('   - Found user in users table:', userName, userEmail);
          } else {
            console.log('   - User not found in users table');
            
            // Try to find in students table
            const student = allStudents.find(s => s.studentsId === userId);
            if (student) {
              userName = student.studentName || userName;
              userEmail = student.email || userEmail;
              console.log('   - Found user in students table:', userName, userEmail);
            }
          }
        }
        
        // Check if this enrollment has pending payment
        const hasPendingPayment = coursePendingPayments.find(p => p.userId === userId);
        if (hasPendingPayment) {
          paymentStatus = 'pending';
          console.log('   - Found pending payment, status set to pending');
        }
        
        console.log('   - Final userName:', userName);
        console.log('   - Final userEmail:', userEmail);
        console.log('   - Final paymentStatus:', paymentStatus);
        
        return {
          enrolledID: enrollment.enrolledID || enrollment.id,
          userName: userName || 'Unknown',
          userEmail: userEmail || 'N/A',
          enrollmentDate: enrollment.enrolledAt || enrollment.enrollmentDate || enrollment.createdAt,
          progressPercentage: enrollment.progressPercentage || enrollment.progress || 0,
          paymentStatus: paymentStatus,
          paymentMode: enrollment.paymentMode || null,
          receiptNumber: enrollment.receiptNumber || null,
          pendingPaymentId: hasPendingPayment?.pendingPaymentId
        };
      });
      
      // Group batch enrollments by enrolling institute
      const instituteEnrollmentGroups = {};
      
      // Fetch institute names for all enrolling institutes
      const instituteNamesCache = {};
      const userModel = require('../models/userModel');
      
      // First, add from batch enrollments
      for (const batchEnrollment of courseBatchEnrollments) {
        const enrollingInstituteId = batchEnrollment.enrollingInstituteId;
        
        // Fetch institute name if not cached
        if (!instituteNamesCache[enrollingInstituteId]) {
          try {
            const instituteUser = await userModel.findUserById(enrollingInstituteId);
            instituteNamesCache[enrollingInstituteId] = instituteUser?.instituteName || 'Institute';
          } catch (err) {
            console.error('❌ [BACKEND] Error fetching institute name:', err);
            instituteNamesCache[enrollingInstituteId] = 'Institute';
          }
        }
        
        if (!instituteEnrollmentGroups[enrollingInstituteId]) {
          instituteEnrollmentGroups[enrollingInstituteId] = {
            enrollmentsId: batchEnrollment.enrollmentsId,
            enrollingInstituteId: enrollingInstituteId,
            enrollingInstituteName: instituteNamesCache[enrollingInstituteId],
            totalStudentsEnrolled: 0,
            enrollmentDate: batchEnrollment.enrollmentDate,
            paymentStatus: batchEnrollment.paymentStatus || 'completed',
            totalAmount: batchEnrollment.totalAmount || 0,
            studentType: batchEnrollment.studentType || 'institute',
            students: []
          };
        }
        
        if (batchEnrollment.enrolledStudents && Array.isArray(batchEnrollment.enrolledStudents)) {
          batchEnrollment.enrolledStudents.forEach(student => {
            instituteEnrollmentGroups[enrollingInstituteId].students.push({
              enrolledID: `${batchEnrollment.enrollmentsId}_${student.studentId}`,
              userName: student.studentName || 'Unknown',
              userEmail: student.studentEmail || 'N/A',
              enrollmentDate: student.enrollmentDate,
              progressPercentage: 0,
              paymentStatus: batchEnrollment.paymentStatus || 'completed'
            });
            instituteEnrollmentGroups[enrollingInstituteId].totalStudentsEnrolled++;
          });
        }
      }
      
      // Then, add from course-enrolled-user table (for enrollments not in batch)
      for (const enrollment of instituteEnrollmentsFromTable) {
        const enrollingInstituteId = enrollment.enrollingInstituteId;
        
        if (!enrollingInstituteId) continue; // Skip if no institute ID
        
        // Check if this enrollment is already in a batch
        const alreadyInBatch = courseBatchEnrollments.some(batch => 
          batch.enrolledStudents && batch.enrolledStudents.some(s => s.studentId === enrollment.userId)
        );
        
        if (alreadyInBatch) continue; // Skip if already counted in batch
        
        // Fetch institute name if not cached
        if (!instituteNamesCache[enrollingInstituteId]) {
          try {
            const instituteUser = await userModel.findUserById(enrollingInstituteId);
            instituteNamesCache[enrollingInstituteId] = instituteUser?.instituteName || 'Institute';
          } catch (err) {
            console.error('❌ [BACKEND] Error fetching institute name:', err);
            instituteNamesCache[enrollingInstituteId] = 'Institute';
          }
        }
        
        // Create group if doesn't exist
        if (!instituteEnrollmentGroups[enrollingInstituteId]) {
          instituteEnrollmentGroups[enrollingInstituteId] = {
            enrollmentsId: enrollment.parentEnrollmentId || 'individual',
            enrollingInstituteId: enrollingInstituteId,
            enrollingInstituteName: instituteNamesCache[enrollingInstituteId],
            totalStudentsEnrolled: 0,
            enrollmentDate: enrollment.enrollmentDate,
            paymentStatus: enrollment.paymentStatus || 'completed',
            totalAmount: 0,
            studentType: enrollment.studentType || 'institute',
            students: []
          };
        }
        
        // Add student to group
        instituteEnrollmentGroups[enrollingInstituteId].students.push({
          enrolledID: enrollment.enrolledID,
          userName: enrollment.studentName || enrollment.userName || 'Unknown',
          userEmail: enrollment.studentEmail || enrollment.userEmail || 'N/A',
          enrollmentDate: enrollment.enrollmentDate,
          progressPercentage: enrollment.progressPercentage || 0,
          paymentStatus: enrollment.paymentStatus || 'completed'
        });
        instituteEnrollmentGroups[enrollingInstituteId].totalStudentsEnrolled++;
      }
      
      const instituteEnrollmentsArray = Object.values(instituteEnrollmentGroups);
      
      return {
        courseId: courseId,
        courseName: course.courseName || course.name,
        courseMode: course.mode === 'Offline' ? 'On Campus' : course.mode,
        courseDuration: course.duration,
        courseFees: course.fees,
        totalIndividualEnrollments: individualEnrollmentDetails.length,
        totalInstituteEnrollments: instituteEnrollmentsArray.length, // Count of unique institutes, not students
        totalStudentsFromInstitutes: instituteEnrollmentDetails.length,
        totalPendingPayments: coursePendingPayments.length,
        individualEnrollments: individualEnrollmentDetails,
        instituteEnrollments: instituteEnrollmentsArray
      };
    }));
    
    // Filter out courses with no enrollments
    const filteredData = trackingData.filter(course => 
      course.totalIndividualEnrollments > 0 || course.totalInstituteEnrollments > 0
    );
    
    console.log('📤 [BACKEND] Sending tracking data for', filteredData.length, 'courses with enrollments');
    console.log('📤 [BACKEND] Total courses:', trackingData.length);
    
    res.status(200).json({ 
      success: true,
      data: filteredData 
    });
  } catch (error) {
    console.error('❌ [BACKEND] Error in getCourseEnrollmentTracking:', error);
    console.error('❌ [BACKEND] Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch enrollment tracking', 
      error: error.message 
    });
  }
};

const getEnrollmentDetails = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const instituteId = req.user?.userId;
    
    console.log('🔍 [BACKEND] Fetching enrollment details:', enrollmentId);
    
    // Parse the enrollmentId to get courseId
    const courseId = enrollmentId.replace('institute_', '');
    
    // Fetch course details
    const courseParams = {
      TableName: 'staffinn-courses',
      FilterExpression: 'coursesId = :courseId OR instituteCourseID = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    };
    
    const courses = await scanTable(courseParams);
    const course = courses && courses.length > 0 ? courses[0] : null;
    
    // Fetch enrollments for this course
    const enrollmentParams = {
      TableName: 'staffinn-institute-course-enrollments',
      FilterExpression: 'coursesId = :courseId AND instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':courseId': courseId,
        ':instituteId': instituteId
      }
    };
    
    const enrollments = await scanTable(enrollmentParams);
    
    // Fetch student details
    const userModel = require('../models/userModel');
    const instituteUser = await userModel.findUserById(instituteId);
    const isStaffinnPartner = instituteUser && (instituteUser.instituteType === 'staffinn_partner' || instituteUser.misApproved === true);
    
    let enrolledStudents = [];
    
    if (isStaffinnPartner) {
      const misStudentModel = require('../models/misStudentModel');
      const allStudents = await misStudentModel.getStudentsByInstitute(instituteId);
      
      enrolledStudents = enrollments.map(enrollment => {
        const student = allStudents.find(s => s.studentsId === enrollment.studentsId);
        return {
          studentId: enrollment.studentsId,
          studentName: student?.fatherName || student?.studentName || 'Unknown',
          studentEmail: student?.email || 'N/A',
          enrollmentDate: enrollment.enrollmentDate,
          status: enrollment.status || 'active'
        };
      });
    } else {
      const studentParams = {
        TableName: 'staffinn-institute-students',
        FilterExpression: 'instituteId = :instituteId',
        ExpressionAttributeValues: {
          ':instituteId': instituteId
        }
      };
      const allStudents = await scanTable(studentParams);
      
      enrolledStudents = enrollments.map(enrollment => {
        const student = allStudents.find(s => 
          (s.instituteStudntsID || s.studentsId) === enrollment.studentsId
        );
        return {
          studentId: enrollment.studentsId,
          studentName: student?.studentName || student?.fullName || student?.name || 'Unknown',
          studentEmail: student?.email || 'N/A',
          enrollmentDate: enrollment.enrollmentDate,
          status: enrollment.status || 'active'
        };
      });
    }
    
    const response = {
      enrollingInstituteDetails: {
        instituteName: instituteUser?.instituteName || 'Your Institute'
      },
      courseDetails: {
        courseName: course?.courseName || course?.name || 'Unknown Course'
      },
      totalStudentsEnrolled: enrolledStudents.length,
      enrolledStudents: enrolledStudents
    };
    
    console.log('📤 [BACKEND] Sending enrollment details with', enrolledStudents.length, 'students');
    
    res.status(200).json({ 
      success: true,
      data: response 
    });
  } catch (error) {
    console.error('❌ [BACKEND] Error in getEnrollmentDetails:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch enrollment details', 
      error: error.message 
    });
  }
};

const getAvailableStudents = async (req, res) => {
  try {
    console.log('🔍 [BACKEND] Fetching available students for enrollment...');
    console.log('🔍 [BACKEND] User ID:', req.user?.userId);
    console.log('🔍 [BACKEND] User Type:', req.user?.userType);
    
    // Get the institute ID from the authenticated user
    const instituteId = req.user?.userId;
    
    if (!instituteId) {
      console.error('❌ [BACKEND] No institute ID found in request');
      return res.status(400).json({ 
        success: false,
        message: 'Institute ID not found' 
      });
    }
    
    // ALWAYS fetch regular students from Student Management (staffinn-institute-students table)
    // This endpoint is specifically for "Institute Students" option
    console.log('📚 [BACKEND] Fetching regular students from Student Management...');
    const params = {
      TableName: 'staffinn-institute-students',
      FilterExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': instituteId
      }
    };
    
    console.log('📊 [BACKEND] Scanning table with params:', JSON.stringify(params, null, 2));
    const students = await scanTable(params);
    console.log('✅ [BACKEND] Found regular students:', students?.length || 0);
    
    // Format regular students
    const formattedStudents = students.map(student => ({
      studentsId: student.instituteStudntsID || student.studentsId,
      studentName: student.studentName || student.fullName || student.name,
      email: student.email,
      mobile: student.mobile || student.phoneNumber || student.phone,
      fatherName: student.fatherName,
      profilePhotoUrl: student.profilePhotoUrl || student.profilePhoto,
      instituteId: student.instituteId,
      isMisStudent: false,
      qualification: student.degreeName || student.qualification,
      course: student.specialization || student.course
    }));
    
    console.log('📤 [BACKEND] Sending response with', formattedStudents.length, 'regular students');
    return res.status(200).json({ 
      success: true,
      data: formattedStudents
    });
  } catch (error) {
    console.error('❌ [BACKEND] Error fetching available students:', error);
    console.error('❌ [BACKEND] Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch available students', 
      error: error.message 
    });
  }
};

const getEnrolledStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentType } = req.query;
    const instituteId = req.user?.userId;
    
    console.log('\n\n🔍 [BACKEND] ========== FETCHING ENROLLED STUDENTS ==========');
    console.log('🔍 [BACKEND] API ENDPOINT HIT: /courses/:courseId/enrolled-students');
    console.log('🔍 [BACKEND] Course ID:', courseId);
    console.log('🔍 [BACKEND] Student Type:', studentType);
    console.log('🔍 [BACKEND] Requesting Institute ID:', instituteId);
    
    // Fetch ALL batch enrollments for this course (from any institute)
    // This ensures students enrolled by ANY institute show as "Already Enrolled"
    const params = {
      TableName: 'staffinn-institute-course-enrollments',
      FilterExpression: 'courseId = :courseId',
      ExpressionAttributeValues: {
        ':courseId': courseId
      }
    };
    
    console.log('📊 [BACKEND] Scanning batch enrollments table...');
    const batchEnrollments = await scanTable(params);
    
    console.log('✅ [BACKEND] Found batch enrollment records:', batchEnrollments?.length || 0);
    
    if (batchEnrollments && batchEnrollments.length > 0) {
      console.log('📋 [BACKEND] Batch enrollment details:');
      batchEnrollments.forEach((enrollment, i) => {
        console.log(`  ${i + 1}. Enrollment ID: ${enrollment.enrollmentsId}`);
        console.log(`     - Institute: ${enrollment.enrollingInstituteId}`);
        console.log(`     - Students in batch: ${enrollment.enrolledStudents?.length || 0}`);
        if (enrollment.enrolledStudents && enrollment.enrolledStudents.length > 0) {
          enrollment.enrolledStudents.forEach((s, j) => {
            console.log(`       ${j + 1}. ${s.studentName} (${s.studentId})`);
          });
        }
      });
    }
    
    // Extract all enrolled student IDs from the batch enrollments
    const enrolledStudentIds = new Set();
    
    if (batchEnrollments && batchEnrollments.length > 0) {
      batchEnrollments.forEach(enrollment => {
        if (enrollment.enrolledStudents && Array.isArray(enrollment.enrolledStudents)) {
          enrollment.enrolledStudents.forEach(student => {
            if (student.studentId) {
              enrolledStudentIds.add(student.studentId);
              console.log(`  ✅ Added student ID: ${student.studentId} (${student.studentName})`);
            }
          });
        }
      });
    }
    
    // Convert Set to Array
    const enrolledStudentIdsArray = Array.from(enrolledStudentIds);
    
    console.log('📋 [BACKEND] Unique enrolled student IDs:', enrolledStudentIdsArray);
    console.log('📋 [BACKEND] Total unique enrolled students:', enrolledStudentIdsArray.length);
    
    if (enrolledStudentIdsArray.length === 0) {
      console.log('⚠️ [BACKEND] NO ENROLLED STUDENTS FOUND!');
      console.log('⚠️ [BACKEND] This means no batch enrollments exist for this course yet.');
    }
    
    console.log('📤 [BACKEND] Sending response with', enrolledStudentIdsArray.length, 'enrolled student IDs');
    console.log('📤 [BACKEND] Response data:', JSON.stringify(enrolledStudentIdsArray));
    console.log('🔍 [BACKEND] ========== FETCH COMPLETE ==========\n\n');
    
    res.status(200).json({ 
      success: true,
      data: enrolledStudentIdsArray // Return simple array of student IDs
    });
  } catch (error) {
    console.error('\n\n❌ [BACKEND] ========== ERROR IN getEnrolledStudents ==========');
    console.error('❌ [BACKEND] Error fetching enrolled students:', error);
    console.error('❌ [BACKEND] Error message:', error.message);
    console.error('❌ [BACKEND] Error stack:', error.stack);
    console.error('❌ [BACKEND] ========== ERROR END ==========\n\n');
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch enrolled students', 
      error: error.message,
      data: [] // Return empty array on error
    });
  }
};

const getCourseEnrollmentStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instituteId = req.user?.userId;
    
    console.log('🔍 [BACKEND] Checking enrollment status for course:', courseId);
    console.log('🔍 [BACKEND] Institute ID:', instituteId);
    
    if (!instituteId) {
      return res.status(400).json({ 
        success: false,
        message: 'Institute ID not found' 
      });
    }
    
    // Get total available students for this institute
    const userModel = require('../models/userModel');
    const instituteUser = await userModel.findUserById(instituteId);
    const isStaffinnPartner = instituteUser && (instituteUser.instituteType === 'staffinn_partner' || instituteUser.misApproved === true);
    
    let totalStudents = 0;
    
    if (isStaffinnPartner) {
      const misStudentModel = require('../models/misStudentModel');
      const students = await misStudentModel.getStudentsByInstitute(instituteId);
      totalStudents = students?.length || 0;
    } else {
      const params = {
        TableName: 'staffinn-institute-students',
        FilterExpression: 'instituteId = :instituteId',
        ExpressionAttributeValues: {
          ':instituteId': instituteId
        }
      };
      const students = await scanTable(params);
      totalStudents = students?.length || 0;
    }
    
    // Get enrolled students for this course
    const enrollmentParams = {
      TableName: 'staffinn-institute-course-enrollments',
      FilterExpression: 'coursesId = :courseId AND instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':courseId': courseId,
        ':instituteId': instituteId
      }
    };
    
    const enrollments = await scanTable(enrollmentParams);
    const enrolledCount = enrollments?.length || 0;
    
    const allEnrolled = totalStudents > 0 && enrolledCount === totalStudents;
    const hasEnrollments = enrolledCount > 0;
    
    console.log('📊 [BACKEND] Enrollment status:', {
      totalStudents,
      enrolledCount,
      allEnrolled,
      hasEnrollments
    });
    
    res.status(200).json({ 
      success: true,
      data: {
        totalStudents,
        enrolledCount,
        allEnrolled,
        hasEnrollments
      }
    });
  } catch (error) {
    console.error('❌ [BACKEND] Error checking enrollment status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to check enrollment status', 
      error: error.message 
    });
  }
};

const getInstituteStudentEnrollmentCount = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instituteId = req.user?.userId;
    
    console.log('📊 [BACKEND] Getting enrollment count for course:', courseId);
    console.log('📊 [BACKEND] Institute ID:', instituteId);
    
    if (!instituteId) {
      return res.status(400).json({ 
        success: false,
        message: 'Institute ID not found' 
      });
    }
    
    // Get enrollments for this course from this institute
    const params = {
      TableName: 'staffinn-institute-course-enrollments',
      FilterExpression: 'coursesId = :courseId AND instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':courseId': courseId,
        ':instituteId': instituteId
      }
    };
    
    const enrollments = await scanTable(params);
    const enrollmentCount = enrollments?.length || 0;
    
    console.log('✅ [BACKEND] Enrollment count:', enrollmentCount);
    
    res.status(200).json({
      success: true,
      data: {
        courseId,
        enrollmentCount
      }
    });
  } catch (error) {
    console.error('❌ [BACKEND] Error getting enrollment count:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch enrollment count', 
      error: error.message 
    });
  }
};

// Approve pending payment - ONLY FOR INDIVIDUAL USERS (Staff/Seeker)
const approvePayment = async (req, res) => {
  try {
    const { pendingPaymentId } = req.params;
    const { notes } = req.body;
    const instituteId = req.user?.userId;

    console.log('✅ Approving payment:', { pendingPaymentId, instituteId, notes });

    const pendingPaymentModel = require('../models/pendingInstitutePaymentModel');
    const result = await pendingPaymentModel.approvePayment(pendingPaymentId, instituteId, notes);
    
    if (result.success) {
      res.json({ success: true, message: 'Payment approved successfully', data: result.data });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('❌ Approve payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve payment' });
  }
};

// Reject pending payment - ONLY FOR INDIVIDUAL USERS (Staff/Seeker)
const rejectPayment = async (req, res) => {
  try {
    const { pendingPaymentId } = req.params;
    const { notes } = req.body;
    const instituteId = req.user?.userId;

    console.log('❌ Rejecting payment:', { pendingPaymentId, instituteId, notes });

    if (!notes || !notes.trim()) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const pendingPaymentModel = require('../models/pendingInstitutePaymentModel');
    const result = await pendingPaymentModel.rejectPayment(pendingPaymentId, instituteId, notes);
    
    if (result.success) {
      res.json({ success: true, message: 'Payment rejected successfully', data: result.data });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('❌ Reject payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject payment' });
  }
};

module.exports = {
  enrollStudentsInCourse,
  getEnrollmentHistory,
  getCourseEnrollmentTracking,
  getEnrollmentDetails,
  getAvailableStudents,
  getEnrolledStudents,
  getCourseEnrollmentStatus,
  getInstituteStudentEnrollmentCount,
  approvePayment,
  rejectPayment
};
