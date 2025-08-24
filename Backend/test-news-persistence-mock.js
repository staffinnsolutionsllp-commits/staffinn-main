// Force mock database usage for testing
process.env.USE_MOCK_DB = 'true';

const mockDB = require('./mock-dynamodb');

async function testNewsPersistenceMock() {
    console.log('Testing news persistence with mock database...');
    
    const TABLE_NAME = 'recruiter-news';
    
    // Test creating news directly with mock DB
    const testNews = {
        recruiterNewsID: 'test-news-123',
        recruiterId: 'test-recruiter-123',
        recruiterName: 'Test Company',
        title: 'Test News Item',
        date: '2024-01-15',
        company: 'Test Company Inc.',
        venue: 'Online',
        expectedParticipants: 50,
        details: 'This is a test news item to verify persistence.',
        verified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        // Create news
        console.log('Creating test news...');
        mockDB.putItem(TABLE_NAME, testNews);
        console.log('News created successfully');
        
        // Retrieve news
        console.log('Retrieving news...');
        const retrievedNews = mockDB.getItem(TABLE_NAME, 'test-news-123');
        console.log('Retrieved news:', retrievedNews);
        
        // Get all news for recruiter
        console.log('Getting all news for recruiter...');
        const allNews = mockDB.scan(TABLE_NAME);
        const recruiterNews = allNews.filter(news => news.recruiterId === 'test-recruiter-123');
        console.log('Recruiter news:', recruiterNews);
        
        // Clean up
        console.log('Cleaning up...');
        mockDB.deleteItem(TABLE_NAME, 'test-news-123');
        console.log('Test completed successfully!');
        
        return true;
    } catch (error) {
        console.error('Test failed:', error);
        return false;
    }
}

testNewsPersistenceMock();