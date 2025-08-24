const RecruiterNewsModel = require('./models/recruiterNewsModel');

async function testRecruiterNews() {
    console.log('Testing Recruiter News functionality...');
    
    try {
        // Test 1: Get all public news
        console.log('\n1. Testing getAllPublic...');
        const allNews = await RecruiterNewsModel.getAllPublic();
        console.log('All public news result:', allNews);
        console.log('Number of news items:', allNews.data?.length || 0);
        
        if (allNews.success && allNews.data.length > 0) {
            console.log('Sample news item:', allNews.data[0]);
            console.log('Banner image URL:', allNews.data[0].bannerImage);
        }
        
        // Test 2: Test news creation (if you have a test recruiter ID)
        const testRecruiterId = 'test-recruiter-123';
        console.log('\n2. Testing news creation...');
        
        const testNewsData = {
            recruiterId: testRecruiterId,
            recruiterName: 'Test Recruiter',
            title: 'Test News Item',
            date: new Date().toISOString().split('T')[0],
            company: 'Test Company',
            venue: 'Test Venue',
            expectedParticipants: 100,
            details: 'This is a test news item to verify functionality.',
            verified: true,
            bannerImage: 'https://example.com/test-banner.jpg'
        };
        
        const createResult = await RecruiterNewsModel.create(testNewsData);
        console.log('Create news result:', createResult);
        
        if (createResult.success) {
            const newsId = createResult.data.recruiterNewsID;
            console.log('Created news ID:', newsId);
            
            // Test 3: Get news by recruiter ID
            console.log('\n3. Testing getByRecruiterId...');
            const recruiterNews = await RecruiterNewsModel.getByRecruiterId(testRecruiterId);
            console.log('Recruiter news result:', recruiterNews);
            
            // Test 4: Get news by ID
            console.log('\n4. Testing getById...');
            const newsById = await RecruiterNewsModel.getById(newsId);
            console.log('News by ID result:', newsById);
            
            // Test 5: Update news
            console.log('\n5. Testing update...');
            const updateData = {
                title: 'Updated Test News Item',
                details: 'This news item has been updated.'
            };
            const updateResult = await RecruiterNewsModel.update(newsId, updateData);
            console.log('Update result:', updateResult);
            
            // Test 6: Delete test news
            console.log('\n6. Cleaning up - deleting test news...');
            const deleteResult = await RecruiterNewsModel.delete(newsId);
            console.log('Delete result:', deleteResult);
        }
        
        console.log('\n✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testRecruiterNews();