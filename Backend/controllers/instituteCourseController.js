const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');
const s3Service = require('../services/s3Service');

const COURSES_TABLE = 'staffinn-courses';
const COURSE_ENROLLMENTS_TABLE = 'course-enrolled-user';

// Create course with modules and content
const createCourse = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    const courseData = req.body;
    const files = req.files || [];

    console.log('Creating course with data:', {
      name: courseData.name,
      filesCount: files.length,
      instituteId
    });

    // Validation
    if (!courseData.name || courseData.name.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Course name is required and must be less than 200 characters'
      });
    }

    const courseId = uuidv4();
    const timestamp = new Date().toISOString();

    // Upload course thumbnail first
    let thumbnailUrl = null;
    const thumbnailFile = files.find(file => file.fieldname === 'thumbnail');
    if (thumbnailFile && thumbnailFile.mimetype.startsWith('image/')) {
      const ext = thumbnailFile.originalname.split('.').pop();
      const thumbnailKey = `staffinn-files/staffinn-courses-content/courses/thumbnails/${courseId}.${ext}`;
      try {
        const uploadResult = await s3Service.uploadFile(thumbnailFile, thumbnailKey);
        thumbnailUrl = uploadResult.Location || uploadResult.url;
        console.log('Thumbnail uploaded:', thumbnailUrl);
      } catch (error) {
        console.error('Thumbnail upload failed:', error);
      }
    }

    // Process modules and content
    const processedModules = [];
    if (courseData.modules) {
      const modules = typeof courseData.modules === 'string' 
        ? JSON.parse(courseData.modules) 
        : courseData.modules;
      
      for (let i = 0; i < modules.length; i++) {
        const moduleData = modules[i];
        const moduleId = uuidv4();
        
        const processedModule = {
          moduleId,
          moduleTitle: moduleData.title || `Module ${i + 1}`,
          moduleDescription: moduleData.description || '',
          order: i + 1,
          content: []
        };

        // Process module content
        if (moduleData.content && Array.isArray(moduleData.content)) {
          for (let j = 0; j < moduleData.content.length; j++) {
            const contentData = moduleData.content[j];
            const contentId = uuidv4();
            
            let contentUrl = null;
            
            // Look for uploaded file with various possible field names
            const possibleFieldNames = [
              `content_${i}_${j}`,
              `module_${i}_content_${j}`,
              `contentFileKey_${i}_${j}`,
              `moduleContent_${i}_${j}`
            ];
            
            let uploadedFile = null;
            for (const fieldName of possibleFieldNames) {
              uploadedFile = files.find(file => file.fieldname === fieldName);
              if (uploadedFile) break;
            }
            
            if (uploadedFile) {
              const ext = uploadedFile.originalname.split('.').pop();
              let s3Key;
              
              // Determine S3 path based on content type
              if (contentData.type === 'video' && uploadedFile.mimetype.startsWith('video/')) {
                s3Key = `staffinn-files/staffinn-courses-content/courses/videos/${courseId}_${moduleId}_${contentId}.${ext}`;
              } else if (contentData.type === 'assignment' && uploadedFile.mimetype === 'application/pdf') {
                s3Key = `staffinn-files/staffinn-courses-content/courses/assignments/${courseId}_${moduleId}_${contentId}.${ext}`;
              } else {
                s3Key = `staffinn-files/staffinn-courses-content/courses/content/${courseId}_${moduleId}_${contentId}.${ext}`;
              }
              
              try {
                const uploadResult = await s3Service.uploadFile(uploadedFile, s3Key);
                contentUrl = uploadResult.Location || uploadResult.url;
                console.log('Content file uploaded:', { contentId, contentUrl, type: contentData.type });
              } catch (uploadError) {
                console.error('Content file upload failed:', uploadError);
              }
            }

            const processedContent = {
              contentId,
              contentTitle: contentData.title || `Content ${j + 1}`,
              contentType: contentData.type || 'video',
              contentUrl: contentUrl,
              order: j + 1,
              durationMinutes: parseInt(contentData.duration) || 0,
              mandatory: contentData.mandatory !== false
            };

            processedModule.content.push(processedContent);
          }
        }

        // Process quiz if exists
        if (moduleData.quiz && moduleData.quiz.questions && moduleData.quiz.questions.length > 0) {
          processedModule.quiz = {
            quizId: uuidv4(),
            title: moduleData.quiz.title || `${moduleData.title} Quiz`,
            description: moduleData.quiz.description || '',
            passingScore: moduleData.quiz.passingScore || 70,
            timeLimit: moduleData.quiz.timeLimit || 30,
            maxAttempts: moduleData.quiz.maxAttempts || 3,
            questions: moduleData.quiz.questions.map(q => ({
              questionId: uuidv4(),
              question: q.question,
              type: q.type || 'multiple_choice',
              options: q.options || [],
              correctAnswer: q.correctAnswer,
              points: q.points || 1
            }))
          };
        }

        processedModules.push(processedModule);
      }
    }

    // Create course record
    const course = {
      coursesId: courseId,
      instituteId,
      courseName: courseData.name,
      duration: courseData.duration,
      fees: parseFloat(courseData.fees) || 0,
      instructor: courseData.instructor,
      category: courseData.category || 'General',
      mode: courseData.mode || 'Online',
      thumbnailUrl: thumbnailUrl,
      description: courseData.description || '',
      prerequisites: courseData.prerequisites || '',
      syllabusOverview: courseData.syllabus || '',
      certification: courseData.certification || 'Basic',
      modules: processedModules,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    console.log('Saving course to DynamoDB:', {
      courseId,
      courseName: course.courseName,
      modulesCount: processedModules.length,
      thumbnailUrl
    });

    await dynamoService.putItem(COURSES_TABLE, course);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create course'
    });
  }
};

// Get courses for institute
const getCourses = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    
    const params = {
      FilterExpression: 'instituteId = :instituteId AND isActive = :isActive',
      ExpressionAttributeValues: {
        ':instituteId': instituteId,
        ':isActive': true
      }
    };
    
    const courses = await dynamoService.scanItems(COURSES_TABLE, params);
    
    // Transform courses to match frontend expectations
    const transformedCourses = courses.map(course => ({
      instituteCourseID: course.coursesId, // Map for compatibility
      coursesId: course.coursesId,
      name: course.courseName,
      courseName: course.courseName,
      duration: course.duration,
      fees: course.fees,
      instructor: course.instructor,
      category: course.category,
      mode: course.mode,
      thumbnailUrl: course.thumbnailUrl,
      description: course.description,
      prerequisites: course.prerequisites,
      syllabusOverview: course.syllabusOverview,
      certification: course.certification,
      modules: course.modules || [],
      isActive: course.isActive,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    }));
    
    console.log('Returning courses:', transformedCourses.length);
    
    res.status(200).json({
      success: true,
      data: transformedCourses
    });
  } catch (error) {
    console.error('Error getting courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get courses'
    });
  }
};

// Get public courses for institute
const getPublicCourses = async (req, res) => {
  try {
    const { instituteId } = req.params;
    
    const params = {
      FilterExpression: 'instituteId = :instituteId AND isActive = :isActive',
      ExpressionAttributeValues: {
        ':instituteId': instituteId,
        ':isActive': true
      }
    };
    
    const courses = await dynamoService.scanItems(COURSES_TABLE, params);
    
    res.status(200).json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error getting public courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get courses'
    });
  }
};

// Get public course by ID
const getPublicCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    console.log('Getting public course by ID:', courseId);
    
    const course = await dynamoService.getItem(COURSES_TABLE, {
      coursesId: courseId
    });
    
    if (!course || !course.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Transform course data to match frontend expectations
    const transformedCourse = {
      coursesId: course.coursesId,
      name: course.courseName, // Map courseName to name for frontend
      courseName: course.courseName,
      duration: course.duration,
      fees: course.fees,
      instructor: course.instructor,
      category: course.category,
      mode: course.mode,
      thumbnailUrl: course.thumbnailUrl,
      description: course.description,
      prerequisites: course.prerequisites,
      syllabusOverview: course.syllabusOverview,
      certification: course.certification,
      modules: course.modules || [],
      isActive: course.isActive,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    };
    
    console.log('Returning transformed course:', {
      courseName: transformedCourse.courseName,
      modulesCount: transformedCourse.modules.length
    });
    
    res.status(200).json({
      success: true,
      data: transformedCourse
    });
  } catch (error) {
    console.error('Error getting public course by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course'
    });
  }
};

// Check enrollment status
const checkEnrollmentStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    
    const params = {
      FilterExpression: 'userId = :userId AND courseId = :courseId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':courseId': courseId
      }
    };
    
    const enrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, params);
    const enrollment = enrollments && enrollments.length > 0 ? enrollments[0] : null;
    
    if (enrollment) {
      const hasProgress = enrollment.progressPercentage > 0;
      
      res.status(200).json({
        success: true,
        enrolled: true,
        hasStarted: hasProgress,
        progressPercentage: enrollment.progressPercentage,
        enrollmentDate: enrollment.enrollmentDate
      });
    } else {
      res.status(200).json({
        success: true,
        enrolled: false,
        hasStarted: false,
        progressPercentage: 0
      });
    }
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check enrollment status'
    });
  }
};

// Enroll user in course
const enrollInCourse = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    
    console.log('Enrolling user in course:', { userId, courseId });
    
    // Validate courseId
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }
    
    // Check if course exists
    const course = await dynamoService.getItem(COURSES_TABLE, {
      coursesId: courseId
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Check if already enrolled
    const params = {
      FilterExpression: 'userId = :userId AND courseId = :courseId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':courseId': courseId
      }
    };
    
    const existingEnrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, params);
    
    if (existingEnrollments && existingEnrollments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }
    
    const enrollmentId = uuidv4();
    const enrollment = {
      enrolledID: enrollmentId,
      userId: userId,
      courseId: courseId, // Ensure courseId is explicitly set
      courseName: course.courseName,
      instituteId: course.instituteId,
      enrollmentDate: new Date().toISOString(),
      progressPercentage: 0,
      status: 'active',
      paymentStatus: 'free'
    };
    
    console.log('Creating enrollment record:', enrollment);
    
    await dynamoService.putItem(COURSE_ENROLLMENTS_TABLE, enrollment);
    
    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in course'
    });
  }
};

// Get user enrollments
const getUserEnrollments = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const params = {
      FilterExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    };
    
    const enrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, params);
    
    // Get course details for each enrollment
    const enrollmentsWithCourses = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await dynamoService.getItem(COURSES_TABLE, {
          coursesId: enrollment.courseId
        });
        
        const courseData = course || {
          coursesId: enrollment.courseId,
          courseName: 'Course Unavailable',
          duration: 'Unknown',
          instructor: 'Unknown',
          isPlaceholder: true
        };
        
        return { ...enrollment, course: courseData };
      })
    );
    
    res.status(200).json({
      success: true,
      data: enrollmentsWithCourses
    });
  } catch (error) {
    console.error('Error getting user enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get enrollments'
    });
  }
};

// Get course content for enrolled user
const getCourseContent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { courseId } = req.params;
    
    console.log('Getting course content for:', { userId, courseId });
    
    // Check if user is enrolled
    const params = {
      FilterExpression: 'userId = :userId AND courseId = :courseId',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':courseId': courseId
      }
    };
    
    const enrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, params);
    const enrollment = enrollments && enrollments.length > 0 ? enrollments[0] : null;
    
    console.log('Enrollment found:', !!enrollment);
    
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Not enrolled in this course. Please enroll first.'
      });
    }
    
    // Get course
    const course = await dynamoService.getItem(COURSES_TABLE, {
      coursesId: courseId
    });
    
    console.log('Course found:', !!course);
    console.log('Course data:', course ? {
      courseName: course.courseName,
      modulesCount: course.modules?.length || 0
    } : 'No course data');
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    // Transform course data to match frontend expectations
    const transformedCourse = {
      coursesId: course.coursesId,
      name: course.courseName, // Map courseName to name for frontend
      courseName: course.courseName,
      duration: course.duration,
      fees: course.fees,
      instructor: course.instructor,
      category: course.category,
      mode: course.mode,
      thumbnailUrl: course.thumbnailUrl,
      description: course.description,
      prerequisites: course.prerequisites,
      syllabusOverview: course.syllabusOverview,
      certification: course.certification,
      modules: course.modules || [],
      isActive: course.isActive,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      enrollment
    };
    
    res.status(200).json({
      success: true,
      data: transformedCourse
    });
  } catch (error) {
    console.error('Error getting course content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course content: ' + error.message
    });
  }
};

// Update user progress
const updateProgress = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { contentId } = req.params;
    const { courseId, contentType, completed } = req.body;
    
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }
    
    if (completed) {
      // Use progress controller to mark content as complete
      const progressController = require('./progressController');
      const mockReq = {
        user: { userId },
        params: { courseId, contentId },
        body: { contentType: contentType || 'video' }
      };
      
      const mockRes = {
        status: (code) => ({
          json: (data) => {
            if (code === 200) {
              res.status(200).json({
                success: true,
                message: 'Progress updated successfully',
                data: {
                  userId,
                  contentId,
                  courseId,
                  completed: true,
                  progressPercentage: data.data?.progressPercentage || 0
                }
              });
            } else {
              res.status(code).json(data);
            }
          }
        })
      };
      
      await progressController.markContentComplete(mockReq, mockRes);
    } else {
      res.status(200).json({
        success: true,
        message: 'Progress noted',
        data: {
          userId,
          contentId,
          courseId,
          completed: false
        }
      });
    }
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
};

// Get active course count
const getActiveCourseCount = async (req, res) => {
  try {
    const instituteId = req.user.userId;
    
    const params = {
      FilterExpression: 'instituteId = :instituteId AND isActive = :isActive',
      ExpressionAttributeValues: {
        ':instituteId': instituteId,
        ':isActive': true
      }
    };
    
    const courses = await dynamoService.scanItems(COURSES_TABLE, params);
    
    res.status(200).json({
      success: true,
      data: { activeCourses: courses.length }
    });
  } catch (error) {
    console.error('Error getting active course count:', error);
    res.status(500).json({
      success: false,
      data: { activeCourses: 0 }
    });
  }
};

// Helper functions (simplified for single table approach)
const getCourseModules = async (courseId) => {
  // This is now handled within the course document itself
  return [];
};

const getModuleContent = async (moduleId) => {
  // This is now handled within the course document itself
  return [];
};

const getModuleAssignments = async (moduleId) => {
  // This is now handled within the course document itself
  return [];
};

// Debug endpoint to check course content URLs
const debugCourseContent = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await dynamoService.getItem(COURSES_TABLE, {
      coursesId: courseId
    });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const debugInfo = {
      courseId,
      courseName: course.courseName,
      totalModules: course.modules?.length || 0,
      s3Config: {
        bucketName: process.env.S3_BUCKET_NAME,
        region: process.env.AWS_REGION,
        hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
      },
      modules: course.modules?.map(module => ({
        moduleId: module.moduleId,
        title: module.title,
        contentCount: module.content?.length || 0,
        content: module.content?.map(content => ({
          contentId: content.contentId,
          title: content.title,
          type: content.type,
          fileUrl: content.fileUrl,
          hasUrl: !!content.fileUrl,
          urlValid: content.fileUrl ? content.fileUrl.startsWith('http') : false
        })) || []
      })) || []
    };
    
    res.status(200).json({
      success: true,
      data: debugInfo
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
};

// Fix content URLs endpoint
const fixContentUrls = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    res.status(200).json({
      success: true,
      message: 'URL fixing not needed with new single table structure',
      data: []
    });
  } catch (error) {
    console.error('Fix content URLs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix content URLs',
      error: error.message
    });
  }
};

// Get trending courses sorted by enrollment count
const getTrendingCourses = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    // Get all active courses
    const params = {
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':isActive': true
      }
    };
    
    const courses = await dynamoService.scanItems(COURSES_TABLE, params);
    
    if (!courses || courses.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }
    
    // Get enrollment counts for each course
    const coursesWithEnrollments = await Promise.all(
      courses.map(async (course) => {
        try {
          // Get enrollments for this course
          const enrollmentParams = {
            FilterExpression: 'courseId = :courseId',
            ExpressionAttributeValues: {
              ':courseId': course.coursesId
            }
          };
          
          const enrollments = await dynamoService.scanItems(COURSE_ENROLLMENTS_TABLE, enrollmentParams);
          const enrollmentCount = enrollments ? enrollments.length : 0;
          
          // Get institute info
          const userModel = require('../models/userModel');
          const institute = await userModel.findUserById(course.instituteId);
          
          return {
            ...course,
            enrollmentCount,
            instituteInfo: institute ? {
              instituteName: institute.name || institute.instituteName,
              profileImage: institute.profileImage
            } : null
          };
        } catch (error) {
          console.error('Error getting enrollment count for course:', course.coursesId, error);
          return {
            ...course,
            enrollmentCount: 0,
            instituteInfo: null
          };
        }
      })
    );
    
    // Sort by enrollment count (descending) and then by creation date (newest first)
    const sortedCourses = coursesWithEnrollments.sort((a, b) => {
      if (b.enrollmentCount !== a.enrollmentCount) {
        return b.enrollmentCount - a.enrollmentCount;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    // Return limited results
    const trendingCourses = sortedCourses.slice(0, limit);
    
    res.status(200).json({
      success: true,
      data: trendingCourses
    });
  } catch (error) {
    console.error('Error getting trending courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending courses'
    });
  }
};

module.exports = {
  createCourse,
  getCourses,
  getPublicCourses,
  getPublicCourseById,
  getCourseModules,
  getModuleContent,
  getModuleAssignments,
  checkEnrollmentStatus,
  enrollInCourse,
  getUserEnrollments,
  getCourseContent,
  updateProgress,
  getActiveCourseCount,
  debugCourseContent,
  fixContentUrls,
  getTrendingCourses
};