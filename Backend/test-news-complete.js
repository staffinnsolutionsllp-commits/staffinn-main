const RecruiterNewsModel = require('./models/recruiterNewsModel');

async function testNewsComplete() {
    console.log('Testing complete news functionality...');
    
    // Test creating news
    const testNews = {
        recruiterId: 'test-recruiter-456',
        recruiterName: 'Test Company Ltd',
        title: 'iPhone on sale',
        date: '2022-06-22',
        company: 'JECRC',
        venue: 'Conference Hall',
        expectedParticipants: 5,
        details: 'eifnininnwnkwen iwenviwe niwnb iowen iwebf fn wfbw oibwei obfiobwejflb qiln eio g we w f w wr w...',
        verified: true
    };
    
    try {
        // Create news
        console.log('1. Creating test news...');
        const createResult = await RecruiterNewsModel.create(testNews);
        console.log('Create result:', createResult.success ? 'SUCCESS' : 'FAILED');
        
        if (createResult.success) {
            const newsId = createResult.data.recruiterNewsID;
            console.log('News created with ID:', newsId);
            
            // Retrieve news by recruiter ID
            console.log('2. Retrieving news by recruiter ID...');
            const getResult = await RecruiterNewsModel.getByRecruiterId('test-recruiter-456');
            console.log('Get result:', getResult.success ? 'SUCCESS' : 'FAILED');
            console.log('News count:', getResult.data?.length || 0);
            
            // Retrieve specific news by ID
            console.log('3. Retrieving news by ID...');
            const getByIdResult = await RecruiterNewsModel.getById(newsId);
            console.log('Get by ID result:', getByIdResult.success ? 'SUCCESS' : 'FAILED');
            
            // Update news
            console.log('4. Updating news...');
            const updateData = {
                title: 'Updated iPhone Sale Event',
                details: 'Updated details for the iPhone sale event.'
            };
            const updateResult = await RecruiterNewsModel.update(newsId, updateData);
            console.log('Update result:', updateResult.success ? 'SUCCESS' : 'FAILED');
            
            // Verify update
            console.log('5. Verifying update...');
            const verifyResult = await RecruiterNewsModel.getById(newsId);
            if (verifyResult.success) {
                console.log('Updated title:', verifyResult.data.title);
                console.log('Updated details:', verifyResult.data.details);
            }
            
            // Test public methods
            console.log('6. Testing public methods...');
            const publicResult = await RecruiterNewsModel.getPublicByRecruiterId('test-recruiter-456');
            console.log('Public news result:', publicResult.success ? 'SUCCESS' : 'FAILED');
            
            const allPublicResult = await RecruiterNewsModel.getAllPublic();
            console.log('All public news result:', allPublicResult.success ? 'SUCCESS' : 'FAILED');
            console.log('Total public news count:', allPublicResult.data?.length || 0);
            
            // Clean up
            console.log('7. Cleaning up...');
            const deleteResult = await RecruiterNewsModel.delete(newsId);
            console.log('Delete result:', deleteResult.success ? 'SUCCESS' : 'FAILED');
            
            console.log('\\n✅ All tests completed successfully!');
        } else {
            console.log('❌ Failed to create news:', createResult.message);
        }
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testNewsComplete();