/**
 * Direct Fix for Video URL Issue
 */

require('dotenv').config();
const dynamoService = require('./services/dynamoService');
const s3Service = require('./services/s3Service');

const COURSE_CONTENT_TABLE = 'CourseContent';

async function fixVideoUrl() {
  console.log('🔧 Fixing video URL for contentId: 380714d7-5a17-46dd-b529-ea05b82a487e\n');
  
  const contentId = '380714d7-5a17-46dd-b529-ea05b82a487e';
  const moduleId = 'adb0507a-8102-49d0-8ce6-f2fd769fe35f';
  
  try {
    // Get the content item
    const content = await dynamoService.getItem(COURSE_CONTENT_TABLE, {
      moduleId: moduleId,
      contentId: contentId
    });
    
    if (!content) {
      console.log('❌ Content not found');
      return;
    }
    
    console.log('📄 Current content:', {
      contentTitle: content.contentTitle,
      contentType: content.contentType,
      contentUrl: content.contentUrl,
      hasUrl: !!content.contentUrl
    });
    
    // Try to find the video file in S3
    const possibleKeys = [
      `courses/videos/625be11b-6d5b-48c9-a59d-10030ea10051_${moduleId}_${contentId}.mp4`,
      `courses/videos/625be11b-6d5b-48c9-a59d-10030ea10051_${moduleId}_${contentId}.webm`,
      `courses/videos/625be11b-6d5b-48c9-a59d-10030ea10051_${moduleId}_${contentId}.mov`,
      `courses/materials/625be11b-6d5b-48c9-a59d-10030ea10051_${moduleId}_${contentId}.mp4`,
      `courses/materials/625be11b-6d5b-48c9-a59d-10030ea10051_${moduleId}_${contentId}.webm`
    ];
    
    console.log('🔍 Searching for video files...');
    
    let foundKey = null;
    for (const key of possibleKeys) {
      console.log(`   Checking: ${key}`);
      try {
        const exists = await s3Service.fileExists(key);
        if (exists) {
          foundKey = key;
          console.log(`   ✅ Found: ${key}`);
          break;
        } else {
          console.log(`   ❌ Not found: ${key}`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking ${key}: ${error.message}`);
      }
    }
    
    if (foundKey) {
      const newUrl = s3Service.getFileUrl(foundKey);
      console.log(`\n🔗 Generated URL: ${newUrl}`);
      
      // Update the content
      const updatedContent = {
        ...content,
        contentUrl: newUrl,
        fixedAt: new Date().toISOString(),
        s3Key: foundKey
      };
      
      await dynamoService.putItem(COURSE_CONTENT_TABLE, updatedContent);
      console.log('✅ Updated content with new URL');
      
    } else {
      console.log('\n❌ No video file found in S3');
      console.log('📋 Manual steps needed:');
      console.log('1. Check if video was uploaded to S3');
      console.log('2. Verify S3 bucket permissions');
      console.log('3. Re-upload the video file if missing');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixVideoUrl().catch(console.error);