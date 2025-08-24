const RecruiterNewsModel = require('./models/recruiterNewsModel');

async function testNewsPersistence() {
    console.log('Testing news persistence...');
    
    // Test creating news
    const testNews = {
        recruiterId: 'test-recruiter-123',
        recruiterName: 'Test Company',
        title: 'Test News Item',
        date: '2024-01-15',
        company: 'Test Company Inc.',
        venue: 'Online',
        expectedParticipants: 50,
        details: 'This is a test news item to verify persistence.',
        verified: true
    };
    
    try {
        // Create news
        console.log('Creating test news...');
        const createResult = await RecruiterNewsModel.create(testNews);
        console.log('Create result:', createResult);
        
        if (createResult.success) {
            const newsId = createResult.data.recruiterNewsID;
            console.log('News created with ID:', newsId);
            
            // Retrieve news
            console.log('Retrieving news...');
            const getResult = await RecruiterNewsModel.getByRecruiterId('test-recruiter-123');
            console.log('Get result:', getResult);
            
            // Clean up
            console.log('Cleaning up...');
            await RecruiterNewsModel.delete(newsId);
            console.log('Test completed successfully!');
        }
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testNewsPersistence();