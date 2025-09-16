/**
 * Create Placeholder Video for Testing
 */

require('dotenv').config();
const s3Service = require('./services/s3Service');
const dynamoService = require('./services/dynamoService');

async function createPlaceholderVideo() {
  console.log('🎥 Creating placeholder video for testing...\n');
  
  const contentId = '380714d7-5a17-46dd-b529-ea05b82a487e';
  const moduleId = 'adb0507a-8102-49d0-8ce6-f2fd769fe35f';
  const courseId = '625be11b-6d5b-48c9-a59d-10030ea10051';
  
  // Create a simple placeholder video content
  const placeholderContent = Buffer.from('PLACEHOLDER VIDEO CONTENT - Replace with actual video');
  const testFile = {
    buffer: placeholderContent,
    originalname: 'canva-slide.mp4',
    mimetype: 'video/mp4',
    size: placeholderContent.length
  };
  
  const s3Key = `courses/videos/${courseId}_${moduleId}_${contentId}.mp4`;
  
  try {
    console.log('📤 Uploading placeholder video...');
    const result = await s3Service.uploadFile(testFile, s3Key);
    
    console.log('✅ Upload successful!');
    console.log('🔗 Video URL:', result.Location);
    
    // Update the content record
    console.log('\n📝 Updating content record...');
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
      s3Key: s3Key,
      isPlaceholder: true
    };
    
    await dynamoService.putItem('CourseContent', updatedContent);
    console.log('✅ Content record updated');
    
    console.log('\n🎉 Success! Your video should now display in the course.');
    console.log('📋 Next steps:');
    console.log('1. Refresh your course page');
    console.log('2. The video should now show (placeholder content)');
    console.log('3. Re-upload the actual video file to replace placeholder');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createPlaceholderVideo().catch(console.error);