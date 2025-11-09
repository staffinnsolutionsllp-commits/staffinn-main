/**
 * Fix Video Path to Correct Directory
 */

require('dotenv').config();
const s3Service = require('./services/s3Service');
const dynamoService = require('./services/dynamoService');

async function fixVideoPath() {
  console.log('🔧 Fixing video path to correct directory...\n');
  
  const contentId = '380714d7-5a17-46dd-b529-ea05b82a487e';
  const moduleId = 'adb0507a-8102-49d0-8ce6-f2fd769fe35f';
  const courseId = '625be11b-6d5b-48c9-a59d-10030ea10051';
  
  // Create placeholder video in correct directory
  const placeholderContent = Buffer.from('PLACEHOLDER VIDEO CONTENT');
  const testFile = {
    buffer: placeholderContent,
    originalname: 'canva-slide.mp4',
    mimetype: 'video/mp4',
    size: placeholderContent.length
  };
  
  const correctS3Key = `staffinn-courses-content/courses/videos/${courseId}_${moduleId}_${contentId}.mp4`;
  
  try {
    console.log('📤 Uploading to correct path:', correctS3Key);
    const result = await s3Service.uploadFile(testFile, correctS3Key);
    
    console.log('✅ Upload successful!');
    console.log('🔗 Video URL:', result.Location);
    
    // Update content record
    const updatedContent = {
      moduleId: moduleId,
      contentId: contentId,
      contentTitle: 'canva slide',
      contentType: 'video',
      contentUrl: result.Location,
      contentOrder: 1,
      durationMinutes: 0,
      isMandatory: true,
      createdAt: '2025-09-09T10:51:22.558Z',
      fixedAt: new Date().toISOString(),
      s3Key: correctS3Key
    };
    
    await dynamoService.putItem('CourseContent', updatedContent);
    console.log('✅ Content record updated with correct path');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixVideoPath().catch(console.error);