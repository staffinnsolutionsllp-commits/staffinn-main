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

// Main function to fix all video durations
const fixAllVideoDurations = async () => {
  try {
    console.log('🚀 Starting video duration fix...\n');
    
    // Get all courses
    const courses = await dynamoService.scanItems(COURSES_TABLE, {});
    console.log(`📦 Found ${courses.length} courses\n`);
    
    let totalVideosFixed = 0;
    let totalCoursesUpdated = 0;
    
    for (const course of courses) {
      let courseUpdated = false;
      console.log(`\n📚 Processing course: ${course.courseName} (${course.coursesId})`);
      
      if (!course.modules || course.modules.length === 0) {
        console.log('  ⏭️ No modules found, skipping...');
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
              const duration = await getVideoDurationFromUrl(content.contentUrl);
              
              if (duration > 0) {
                content.durationMinutes = duration;
                courseUpdated = true;
                totalVideosFixed++;
                console.log(`       ✅ Updated to: ${duration} minutes`);
              } else {
                console.log('       ⚠️ Could not calculate duration');
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
    }
    
    console.log('\n\n🎉 Video duration fix completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Total courses processed: ${courses.length}`);
    console.log(`   - Total courses updated: ${totalCoursesUpdated}`);
    console.log(`   - Total videos fixed: ${totalVideosFixed}`);
    
  } catch (error) {
    console.error('\n❌ Error fixing video durations:', error);
    console.error('Stack trace:', error.stack);
  }
};

// Run the script
fixAllVideoDurations()
  .then(() => {
    console.log('\n✅ Script execution completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script execution failed:', error);
    process.exit(1);
  });
