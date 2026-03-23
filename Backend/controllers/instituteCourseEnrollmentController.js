const instituteCourseEnrollmentModel = require('../models/instituteCourseEnrollmentModel');
const instituteStudentModel = require('../models/instituteStudentModel');
const instituteCourseModel = require('../models/instituteCourseModel');
const userModel = require('../models/userModel');
const dynamoService = require('../services/dynamoService');

const COURSES_TABLE = 'staffinn-courses';
const COURSE_ENROLLMENTS_TABLE = 'course-enrolled-user';

/**
 * Enroll students from Staffinn Partner Institute into an On-Campus course
 */
const enrollStudentsInCourse = async (req, res) => {
  try {
    const enrollingInstituteId = req.user.userId;
    const { courseId } = req.params;
    const { studentIds, paymentDetails } = req.body;

    console.log('🎓 [BACKEND] Institute enrollment request:', {
      enrollingInstituteId,
      courseId,
      studentCount: studentIds?.length,
      studentIds
    });

    // Validate input
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one student'
      });
    }

    // Verify the enrolling institute is a Staffinn Partner
    const enrollingInstitute = await userModel.findUserById(enrollingInstituteId);
    console.log('🏢 [BACKEND] Enrolling institute:', {
      found: !!enrollingInstitute,
      role: enrollingInstitute?.role,
      instituteType: enrollingInstitute?.instituteType,
      instituteName: enrollingInstitute?.instituteName
    });

    if (!enrollingInstitute || enrollingInstitute.role !== 'institute' || enrollingInstitute.instituteType !== 'staffinn_partner') {
      return res.status(403).json({
        success: false,
        message: 'Only Staffinn Partner Institutes can enroll students'
      });
    }

    // Get course details
    const course = await dynamoService.getItem(COURSES_TABLE, { coursesId: courseId });
    console.log('📚 [BACKEND] Course details:', {
      found: !!course,
      courseName: course?.courseName,
      mode: course?.mode,
      instituteId: course?.instituteId
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Verify course is On-Campus
    if (course.mode !== 'On Campus' && course.mode !== 'Offline') {
      return res.status(400).json({
        success: false,
        message: 'Only On-Campus courses can be enrolled by institutes'
      });
    }

    // Check for existing enrollments in course-enrolled-user table
    const alreadyEnrolledStudentIds = new Set();
    for (const studentId of studentIds) {
      const isEnrolled = await instituteCourseEnrollmentModel.isStudentEnrolled(courseId, studentId);
      if (isEnrolled) {
        alreadyEnrolledStudentIds.add(studentId);
      }
    }
    console.log('📋 [BACKEND] Already enrolled student IDs:', Array.from(alreadyEnrolledStudentIds));

    // Get student details from MIS students table
    const students = [];
    const skippedStudents = [];
    const notFoundStudents = [];
    console.log('📋 [BACKEND] Fetching student details for IDs:', studentIds);
    
    for (const studentId of studentIds) {
      try {
        // Check if student is already enrolled
        if (alreadyEnrolledStudentIds.has(studentId)) {
          console.log('⚠️ [BACKEND] Student already enrolled, skipping:', studentId);
          skippedStudents.push(studentId);
          continue;
        }

        console.log('🔍 [BACKEND] Looking for student:', studentId);
        const params = {
          FilterExpression: 'studentsId = :studentId AND instituteId = :instituteId',
          ExpressionAttributeValues: {
            ':studentId': studentId,
            ':instituteId': enrollingInstituteId
          }
        };
        const result = await dynamoService.scanItems('mis-students', params);
        console.log('📊 [BACKEND] Query result for', studentId, ':', result?.length || 0, 'found');
        
        const student = result && result.length > 0 ? result[0] : null;
        
        if (student) {
          students.push({
            studentId: student.studentsId,
            studentName: student.studentName || student.fatherName || 'Unknown',
            studentEmail: student.email || 'N/A',
            enrollmentDate: new Date().toISOString(),
            status: 'active'
          });
          console.log('✅ [BACKEND] Student added to enrollment list:', student.studentName);
        } else {
          console.log('❌ [BACKEND] Student not found or invalid:', studentId);
          notFoundStudents.push(studentId);
        }
      } catch (error) {
        console.error('❌ [BACKEND] Error fetching student', studentId, ':', error);
        notFoundStudents.push(studentId);
      }
    }
    
    console.log('📋 [BACKEND] Enrollment summary:', {
      validStudents: students.length,
      skippedStudents: skippedStudents.length,
      notFoundStudents: notFoundStudents.length,
      totalRequested: studentIds.length
    });

    if (students.length === 0) {
      if (skippedStudents.length === studentIds.length) {
        return res.status(200).json({
          success: true,
          message: 'All selected students are already enrolled in this course',
          data: null,
          stats: {
            enrolled: 0,
            skipped: skippedStudents.length,
            notFound: 0,
            total: studentIds.length
          }
        });
      }
      return res.status(400).json({
        success: false,
        message: 'No valid students found for enrollment'
      });
    }

    // Calculate total amount
    const totalAmount = course.fees * students.length;

    // Create enrollment record
    const enrollmentData = {
      courseId: course.coursesId,
      courseInstituteId: course.instituteId,
      enrollingInstituteId,
      enrolledStudents: students,
      paymentStatus: paymentDetails?.paymentStatus || 'completed',
      totalAmount,
      paymentDetails: paymentDetails || {}
    };

    console.log('💾 [BACKEND] Creating enrollment records in both tables:', {
      courseId: enrollmentData.courseId,
      courseInstituteId: enrollmentData.courseInstituteId,
      enrollingInstituteId: enrollmentData.enrollingInstituteId,
      studentCount: enrollmentData.enrolledStudents.length,
      totalAmount: enrollmentData.totalAmount
    });

    const enrollment = await instituteCourseEnrollmentModel.createEnrollment(enrollmentData);
    console.log('✅ [BACKEND] Saved to staffinn-institute-course-enrollments table');
    console.log('✅ [BACKEND] Saved all students to course-enrolled-user table');

    console.log('✅ [BACKEND] Institute enrollment created successfully:', {
      enrollmentId: enrollment.enrollmentsId,
      courseId: enrollment.courseId,
      enrollingInstituteId: enrollment.enrollingInstituteId,
      totalStudents: enrollment.totalStudentsEnrolled,
      paymentStatus: enrollment.paymentStatus
    });

    // Prepare response message
    let message = `Successfully enrolled ${students.length} student(s) in the course`;
    if (skippedStudents.length > 0) {
      message += `. ${skippedStudents.length} student(s) were already enrolled and skipped.`;
    }
    if (notFoundStudents.length > 0) {
      message += ` ${notFoundStudents.length} student(s) were not found or invalid.`;
    }

    console.log('✅ [BACKEND] Enrollment response:', {
      success: true,
      enrolled: students.length,
      skipped: skippedStudents.length,
      notFound: notFoundStudents.length
    });

    res.status(201).json({
      success: true,
      message,
      data: enrollment,
      stats: {
        enrolled: students.length,
        skipped: skippedStudents.length,
        notFound: notFoundStudents.length,
        total: studentIds.length
      }
    });
  } catch (error) {
    console.error('❌ [BACKEND] Error enrolling students in course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll students in course'
    });
  }
};

/**
 * Get enrollment history for a Staffinn Partner Institute
 */
const getEnrollmentHistory = async (req, res) => {
  try {
    const instituteId = req.user.userId;

    console.log('Fetching enrollment history for institute:', instituteId);

    // Verify the institute is a Staffinn Partner
    const institute = await userModel.findUserById(instituteId);
    if (!institute || institute.role !== 'institute' || institute.instituteType !== 'staffinn_partner') {
      return res.status(403).json({
        success: false,
        message: 'Only Staffinn Partner Institutes can access enrollment history'
      });
    }

    // Get all enrollments done by this institute
    const enrollments = await instituteCourseEnrollmentModel.getEnrollmentsByEnrollingInstitute(instituteId);

    // Enrich enrollment data with course and institute details
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await dynamoService.getItem(COURSES_TABLE, { coursesId: enrollment.courseId });
        const courseInstitute = await userModel.findUserById(enrollment.courseInstituteId);

        return {
          ...enrollment,
          courseDetails: course ? {
            courseName: course.courseName,
            duration: course.duration,
            instructor: course.instructor,
            mode: course.mode
          } : null,
          courseInstituteDetails: courseInstitute ? {
            instituteName: courseInstitute.instituteName,
            email: courseInstitute.email,
            phone: courseInstitute.phoneNumber
          } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      data: enrichedEnrollments
    });
  } catch (error) {
    console.error('Error fetching enrollment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollment history'
    });
  }
};

/**
 * Get course enrollment tracking for institute dashboard
 * Shows who enrolled in their courses (both individual and institute enrollments)
 */
const getCourseEnrollmentTracking = async (req, res) => {
  try {
    const instituteId = req.user.userId;

    console.log('Fetching course enrollment tracking for institute:', instituteId);

    // Get all courses offered by this institute
    const params = {
      FilterExpression: 'instituteId = :instituteId AND isActive = :isActive',
      ExpressionAttributeValues: {
        ':instituteId': instituteId,
        ':isActive': true
      }
    };
    const courses = await dynamoService.scanItems(COURSES_TABLE, params);

    // For each course, get enrollment data
    const courseEnrollmentData = await Promise.all(
      courses.map(async (course) => {
        const courseId = course.coursesId;

        // Get individual enrollments (from course-enrolled-user table)
        const individualEnrollmentsParams = {
          FilterExpression: 'courseId = :courseId',
          ExpressionAttributeValues: {
            ':courseId': courseId
          }
        };
        const individualEnrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, individualEnrollmentsParams);

        // Enrich individual enrollments with user details
        const enrichedIndividualEnrollments = await Promise.all(
          (individualEnrollments || []).map(async (enrollment) => {
            const user = await userModel.findUserById(enrollment.userId);
            return {
              ...enrollment,
              userName: user?.fullName || user?.companyName || 'Unknown User',
              userEmail: user?.email || 'N/A',
              enrollmentType: 'individual'
            };
          })
        );

        // Get institute enrollments (from staffinn-institute-course-enrollments table)
        const instituteEnrollments = await instituteCourseEnrollmentModel.getEnrollmentsByCourse(courseId);

        // Enrich institute enrollments with enrolling institute details
        const enrichedInstituteEnrollments = await Promise.all(
          instituteEnrollments.map(async (enrollment) => {
            const enrollingInstitute = await userModel.findUserById(enrollment.enrollingInstituteId);
            return {
              ...enrollment,
              enrollingInstituteName: enrollingInstitute?.instituteName || 'Unknown Institute',
              enrollingInstituteEmail: enrollingInstitute?.email || 'N/A',
              enrollmentType: 'institute'
            };
          })
        );

        return {
          courseId: course.coursesId,
          courseName: course.courseName,
          courseMode: course.mode,
          courseDuration: course.duration,
          courseFees: course.fees,
          individualEnrollments: enrichedIndividualEnrollments,
          instituteEnrollments: enrichedInstituteEnrollments,
          totalIndividualEnrollments: enrichedIndividualEnrollments.length,
          totalInstituteEnrollments: enrichedInstituteEnrollments.length,
          totalStudentsFromInstitutes: enrichedInstituteEnrollments.reduce((sum, e) => sum + e.totalStudentsEnrolled, 0)
        };
      })
    );

    res.status(200).json({
      success: true,
      data: courseEnrollmentData
    });
  } catch (error) {
    console.error('Error fetching course enrollment tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course enrollment tracking'
    });
  }
};

/**
 * Get detailed student list for a specific institute enrollment
 */
const getEnrollmentDetails = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const instituteId = req.user.userId;

    console.log('Fetching enrollment details:', enrollmentId);

    const enrollment = await instituteCourseEnrollmentModel.getEnrollmentById(enrollmentId);

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Verify the requesting institute owns the course
    if (enrollment.courseInstituteId !== instituteId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get course details
    const course = await dynamoService.getItem(COURSES_TABLE, { coursesId: enrollment.courseId });

    // Get enrolling institute details
    const enrollingInstitute = await userModel.findUserById(enrollment.enrollingInstituteId);

    const enrichedEnrollment = {
      ...enrollment,
      courseDetails: course ? {
        courseName: course.courseName,
        duration: course.duration,
        instructor: course.instructor,
        mode: course.mode,
        fees: course.fees
      } : null,
      enrollingInstituteDetails: enrollingInstitute ? {
        instituteName: enrollingInstitute.instituteName,
        email: enrollingInstitute.email,
        phone: enrollingInstitute.phoneNumber
      } : null
    };

    res.status(200).json({
      success: true,
      data: enrichedEnrollment
    });
  } catch (error) {
    console.error('Error fetching enrollment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollment details'
    });
  }
};

/**
 * Get students available for enrollment (for Staffinn Partner Institute)
 */
const getAvailableStudents = async (req, res) => {
  try {
    const instituteId = req.user.userId;

    console.log('🔍 [BACKEND] Fetching available students for institute:', instituteId);
    console.log('🔍 [BACKEND] User object:', req.user);

    // Verify the institute is a Staffinn Partner
    const institute = await userModel.findUserById(instituteId);
    console.log('🔍 [BACKEND] Institute details:', {
      found: !!institute,
      role: institute?.role,
      instituteType: institute?.instituteType,
      instituteName: institute?.instituteName
    });

    if (!institute || institute.role !== 'institute' || institute.instituteType !== 'staffinn_partner') {
      return res.status(403).json({
        success: false,
        message: 'Only Staffinn Partner Institutes can access student list'
      });
    }

    // Get all students from MIS students table for this institute
    const params = {
      FilterExpression: 'instituteId = :instituteId',
      ExpressionAttributeValues: {
        ':instituteId': instituteId
      }
    };
    const students = await dynamoService.scanItems('mis-students', params);
    console.log('🔍 [BACKEND] Students found:', students.length);
    console.log('🔍 [BACKEND] Students data:', JSON.stringify(students, null, 2));

    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('❌ [BACKEND] Error fetching available students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available students'
    });
  }
};

/**
 * Get enrolled students for a specific course
 */
const getEnrolledStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instituteId = req.user.userId;

    console.log('🔍 [BACKEND] Fetching enrolled students for course:', courseId);
    console.log('🔍 [BACKEND] Requesting institute:', instituteId);

    // Verify the institute is a Staffinn Partner
    const institute = await userModel.findUserById(instituteId);
    if (!institute || institute.role !== 'institute' || institute.instituteType !== 'staffinn_partner') {
      return res.status(403).json({
        success: false,
        message: 'Only Staffinn Partner Institutes can access enrolled students'
      });
    }

    // Get all enrolled students from course-enrolled-user table for this course
    const params = {
      FilterExpression: 'courseId = :courseId AND enrollingInstituteId = :instituteId',
      ExpressionAttributeValues: {
        ':courseId': courseId,
        ':instituteId': instituteId
      }
    };
    const enrolledStudents = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, params);
    console.log('🔍 [BACKEND] Enrolled students found:', enrolledStudents?.length || 0);

    // Extract student IDs and details
    const students = (enrolledStudents || []).map(enrollment => ({
      studentsId: enrollment.userId,
      studentId: enrollment.userId,
      studentName: enrollment.studentName,
      studentEmail: enrollment.studentEmail,
      enrollmentDate: enrollment.enrollmentDate,
      status: enrollment.paymentStatus
    }));

    console.log('✅ [BACKEND] Returning enrolled students:', students.length);

    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('❌ [BACKEND] Error fetching enrolled students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrolled students',
      data: []
    });
  }
};

module.exports = {
  enrollStudentsInCourse,
  getEnrollmentHistory,
  getCourseEnrollmentTracking,
  getEnrollmentDetails,
  getAvailableStudents,
  getEnrolledStudents
};
