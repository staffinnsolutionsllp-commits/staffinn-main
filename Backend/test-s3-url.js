const fetch = require('node-fetch');

async function testS3URL() {
  const testURL = 'https://staffinn-files.s3.ap-south-1.amazonaws.com/institute-images/6c9b7a5a-b1fe-4475-96f0-084b81e2c816-1754053027817.jpg';
  
  try {
    console.log('Testing S3 URL:', testURL);
    const response = await fetch(testURL);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (response.ok) {
      console.log('✅ Image is publicly accessible');
    } else {
      console.log('❌ Image is not accessible');
      console.log('Response text:', await response.text());
    }
  } catch (error) {
    console.error('Error testing URL:', error.message);
  }
}

testS3URL();