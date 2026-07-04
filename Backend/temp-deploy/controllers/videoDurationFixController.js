const dynamoService = require('../services/dynamoService');
const ffmpeg = require('fluent-ffmpeg');

const COURSES_TABLE = 'staffinn-courses';

// Helper function to get video duration from URL
const getVideoDurationFromUrl = (videoUrl) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('🎬 Calculating video duration for:', videoUrl);
      
      ffmpeg.ffprobe(videoUrl, (err, metadata) => {
        if (err) {
          console.error('❌ FFprobe error:', err.message);
          resolve(0);
          return;
        }
        
        if (metadata && metadata.format && metadata.format.duration) {
          const durationSeconds = metadata.format.duration;
          const durationMinutes = Math.ceil(durationSeconds / 60);
          console.log(`✅ Video duration: ${durationMinutes} minutes (${durationSeconds} seconds)`);
          resolve(durationMinutes);
        } else {
          console.log('⚠️ No duration metadata found');
          resolve(0);
        }
      });
    } catch (error) {
      console.error('❌ Error in getVideoDurationFromUrl:', error.message);
      resolve(0);
    }
  });
};

// Fix all video durations
const fixAllVideoDurations = async (req, res) => {
  try {
    console.log('🚀 Starting video duration fix...\n');
    
    // Get all courses
    const courses = await dynamoService.scanItems(COURSES_TABLE, {});
    console.log(`📦 Found ${courses.length} courses\n`);
    
    let totalVideosFixed = 0;
    let totalCoursesUpdated = 0;
    const results = [];
    
    for (const course of courses) {
      let courseUpdated = false;
      const courseResult = {
        courseId: course.coursesId,
        courseName: course.courseName,
        videosFixed: 0,
        errors: []
      };
      
      console.log(`\n📚 Processing course: ${course.courseName} (${course.coursesId})`);
      
      if (!course.modules || course.modules.length === 0) {
        console.log('  ⏭️ No modules found, skipping...');
        results.push(courseResult);
        continue;
      }
      
      for (const module of course.modules) {
        console.log(`  📁 Module: ${module.moduleTitle}`);
        
        if (!module.content || module.content.length === 0) {
          console.log('    ⏭️ No content found, skipping...');
          continue;
        }
        
        for (const content of module.content) {
          if (content.contentType === 'video' && content.contentUrl) {
            console.log(`    🎥 Video: ${content.contentTitle}`);
            console.log(`       Current duration: ${content.durationMinutes} minutes`);
            
            if (content.durationMinutes === 0 || !content.durationMinutes) {
              console.log('       🔧 Calculating duration...');
              try {
                const duration = await getVideoDurationFromUrl(content.contentUrl);
                
                if (duration > 0) {
                  content.durationMinutes = duration;
                  courseUpdated = true;
                  totalVideosFixed++;
                  courseResult.videosFixed++;
                  console.log(`       ✅ Updated to: ${duration} minutes`);
                } else {
                  console.log('       ⚠️ Could not calculate duration');
                  courseResult.errors.push(`${content.contentTitle}: Could not calculate duration`);
                }
              } catch (error) {
                console.error('       ❌ Error:', error.message);
                courseResult.errors.push(`${content.contentTitle}: ${error.message}`);
              }
            } else {
              console.log('       ✓ Duration already set');
            }
          }
        }
      }
      
      // Update course if any video duration was fixed
      if (courseUpdated) {
        console.log(`  💾 Updating course in database...`);
        await dynamoService.putItem(COURSES_TABLE, course);
        totalCoursesUpdated++;
        console.log(`  ✅ Course updated successfully`);
      }
      
      results.push(courseResult);
    }
    
    const summary = {
      totalCourses: courses.length,
      coursesUpdated: totalCoursesUpdated,
      videosFixed: totalVideosFixed,
      results: results
    };
    
    console.log('\n\n🎉 Video duration fix completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Total courses processed: ${courses.length}`);
    console.log(`   - Total courses updated: ${totalCoursesUpdated}`);
    console.log(`   - Total videos fixed: ${totalVideosFixed}`);
    
    res.status(200).json({
      success: true,
      message: 'Video durations fixed successfully',
      data: summary
    });
    
  } catch (error) {
    console.error('\n❌ Error fixing video durations:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fix video durations',
      error: error.message
    });
  }
};

module.exports = {
  fixAllVideoDurations
};
