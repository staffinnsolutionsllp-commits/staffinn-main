const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamoService');

const COURSES_TABLE = 'staffinn-courses';

// Cache to prevent repeated table not found errors
let tableNotFound = false;
let tableCheckPromise = null;

// Function to reset cache (useful for testing)
const resetCache = () => {
  tableNotFound = false;
  tableCheckPromise = null;
  console.log('Institute courses cache reset');
};

const createCourse = async (instituteId, courseData) => {
  if (tableNotFound) {
    throw new Error('Courses table not available');
  }
  
  try {
    const course = {
      coursesId: uuidv4(),
      instituteId,
      courseName: courseData.name,
      duration: courseData.duration,
      fees: courseData.fees,
      instructor: courseData.instructor,
      description: courseData.description,
      category: courseData.category,
      mode: courseData.mode,
      prerequisites: courseData.prerequisites,
      syllabusOverview: courseData.syllabus,
      certification: courseData.certification,
      modules: courseData.modules || [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await dynamoService.putItem(COURSES_TABLE, course);
    return course;
  } catch (error) {
    if (error.name === 'ResourceNotFoundException' || error.__type === 'com.amazonaws.dynamodb.v20120810#ResourceNotFoundException') {
      tableNotFound = true;
      console.log('Courses table not found during course creation');
      throw new Error('Courses table not available');
    }
    console.error('Error creating course:', error);
    throw error;
  }
};

const getCoursesByInstitute = async (instituteId) => {
  // If we already know table doesn't exist, return empty array immediately
  if (tableNotFound) {
    return [];
  }
  
  // If there's already a table check in progress, wait for it
  if (tableCheckPromise) {
    try {
      await tableCheckPromise;
      if (tableNotFound) {
        return [];
      }
    } catch (error) {
      // If the promise failed, continue with our own check
    }
  }
  
  // Create a promise for this table check
  if (!tableCheckPromise) {
    tableCheckPromise = (async () => {
      try {
        const params = {
          FilterExpression: 'instituteId = :instituteId AND isActive = :isActive',
          ExpressionAttributeValues: {
            ':instituteId': instituteId,
            ':isActive': true
          }
        };
        const result = await dynamoService.scanItems(COURSES_TABLE, params);
        tableCheckPromise = null; // Reset for future calls
        return result;
      } catch (error) {
        if (error.name === 'ResourceNotFoundException' || error.__type === 'com.amazonaws.dynamodb.v20120810#ResourceNotFoundException') {
          tableNotFound = true;
          console.log('Courses table not found, caching result to prevent future calls');
          tableCheckPromise = null;
          return [];
        }
        console.error('Error getting courses:', error);
        tableCheckPromise = null;
        return [];
      }
    })();
  }
  
  return await tableCheckPromise;
};

const getActiveCourseCount = async (instituteId) => {
  if (tableNotFound) {
    return 0;
  }
  
  try {
    const courses = await getCoursesByInstitute(instituteId);
    return courses.filter(course => course.isActive).length;
  } catch (error) {
    console.error('Error getting active course count:', error);
    return 0;
  }
};

module.exports = {
  createCourse,
  getCoursesByInstitute,
  getActiveCourseCount,
  resetCache
};