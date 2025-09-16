/**
 * Fix Course Content URLs
 * This script fixes missing or broken video URLs in existing courses
 */

require('dotenv').config();
const dynamoService = require('./services/dynamoService');
const s3Service = require('./services/s3Service');

const COURSE_CONTENT_TABLE = 'CourseContent';
const COURSE_MODULES_TABLE = 'CourseModules';
const COURSES_TABLE = process.env.INSTITUTE_COURSES_TABLE || 'staffinn-institute-courses';

async function fixCourseUrls() {
  console.log('🔧 Starting Course URL Fix Process...\n');
  
  try {
    // Step 1: Get all courses
    console.log('1. Fetching all courses...');
    const courses = await dynamoService.scanItems(COURSES_TABLE);
    console.log(`   Found ${courses.length} courses\n`);
    
    let totalFixed = 0;
    
    for (const course of courses) {
      console.log(`📚 Processing course: ${course.name} (${course.instituteCourseID})`);
      
      // Get modules for this course
      const modules = await dynamoService.queryItems(COURSE_MODULES_TABLE, {
        KeyConditionExpression: 'courseId = :courseId',
        ExpressionAttributeValues: {
          ':courseId': course.instituteCourseID
        }
      });
      
      console.log(`   Found ${modules.length} modules`);
      
      for (const module of modules) {
        // Get content for this module
        const content = await dynamoService.queryItems(COURSE_CONTENT_TABLE, {
          KeyConditionExpression: 'moduleId = :moduleId',
          ExpressionAttributeValues: {
            ':moduleId': module.moduleId
          }
        });
        
        console.log(`   Module "${module.moduleTitle}": ${content.length} content items`);
        
        for (const contentItem of content) {
          if (contentItem.contentType === 'video' && !contentItem.contentUrl) {
            console.log(`     🎥 Fixing video: ${contentItem.contentTitle}`);
            
            // Try to find the file in S3
            const possibleKeys = [
              `courses/videos/${course.instituteCourseID}_${module.moduleId}_${contentItem.contentId}.mp4`,
              `courses/videos/${course.instituteCourseID}_${module.moduleId}_${contentItem.contentId}.webm`,
              `courses/videos/${course.instituteCourseID}_${module.moduleId}_${contentItem.contentId}.mov`,
              `courses/materials/${course.instituteCourseID}_${module.moduleId}_${contentItem.contentId}.mp4`,
              `courses/materials/${course.instituteCourseID}_${module.moduleId}_${contentItem.contentId}.webm`
            ];
            
            let foundKey = null;
            for (const key of possibleKeys) {
              try {
                const exists = await s3Service.fileExists(key);
                if (exists) {
                  foundKey = key;
                  break;
                }
              } catch (error) {
                // Continue checking other keys
              }
            }
            
            if (foundKey) {
              const newUrl = s3Service.getFileUrl(foundKey);
              console.log(`       ✅ Found file: ${foundKey}`);
              console.log(`       🔗 Generated URL: ${newUrl}`);
              
              // Update the content item
              const updatedContent = {
                ...contentItem,
                contentUrl: newUrl,
                fixedAt: new Date().toISOString(),
                originalKey: foundKey
              };
              
              await dynamoService.putItem(COURSE_CONTENT_TABLE, updatedContent);
              totalFixed++;
              console.log(`       💾 Updated content in database`);\n            } else {\n              console.log(`       ❌ No file found for: ${contentItem.contentTitle}`);\n            }\n          } else if (contentItem.contentType === 'video' && contentItem.contentUrl) {\n            console.log(`     ✅ Video already has URL: ${contentItem.contentTitle}`);\n          }\n        }\n      }\n      \n      console.log('');\n    }\n    \n    console.log(`🎉 Fix process complete! Fixed ${totalFixed} video URLs`);\n    \n  } catch (error) {\n    console.error('❌ Error during fix process:', error);\n    console.error(error.stack);\n  }\n}\n\n// Run the fix\nfixCourseUrls().then(() => {\n  console.log('\\n✨ Process finished');\n  process.exit(0);\n}).catch(error => {\n  console.error('\\n💥 Process failed:', error);\n  process.exit(1);\n});