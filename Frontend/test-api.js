// Test script to verify hero images API
console.log('Testing Hero Images API...');

const API_BASE_URL = 'http://localhost:4001/api/v1';

async function testAPI() {
  const sections = ['home', 'staff', 'institute', 'recruiter'];
  
  for (const section of sections) {
    try {
      console.log(`\n=== Testing ${section} section ===`);
      const url = `${API_BASE_URL}/hero-images/${section}`;
      console.log(`URL: ${url}`);
      
      const response = await fetch(url);
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Success: ${data.success}`);
        console.log(`Images count: ${data.data?.images?.length || 0}`);
        
        if (data.data?.images?.length > 0) {
          console.log('First image:', {
            id: data.data.images[0].id,
            url: data.data.images[0].url,
            originalName: data.data.images[0].originalName
          });
        }
      } else {
        console.error(`Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error testing ${section}:`, error);
    }
  }
}

// Run the test
testAPI().then(() => {
  console.log('\n=== API Test Complete ===');
}).catch(error => {
  console.error('Test failed:', error);
});