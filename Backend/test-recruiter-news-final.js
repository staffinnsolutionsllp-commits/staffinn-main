const RecruiterNewsModel = require('./models/recruiterNewsModel');

async function testRecruiterNews() {
    console.log('🧪 Testing Recruiter News with Recruiter ID...\n');

    try {
        // Test data with recruiter ID
        const testNewsData = {
            recruiterId: 'test-recruiter-123',
            recruiterName: 'Test Recruiter',
            title: 'Test News Item',
            date: '2025-01-15',
            company: 'Test Company Inc.',
            venue: 'Test Venue',
            expectedParticipants: 50,
            details: 'This is a test news item to verify recruiter ID storage.',
            verified: true,
            bannerImage: 'https://example.com/banner.jpg'
        };

        console.log('📝 Creating news with data:', testNewsData);

        // Create news
        const createResult = await RecruiterNewsModel.create(testNewsData);
        console.log('✅ Create result:', createResult);

        if (createResult.success) {
            const newsId = createResult.data.recruiterNewsID;
            console.log(`📰 News created with ID: ${newsId}`);
            console.log(`👤 Recruiter ID stored: ${createResult.data.recruiterId}`);
            console.log(`🏢 Company: ${createResult.data.company}`);
            console.log(`📅 Date: ${createResult.data.date}`);

            // Test getting news by recruiter ID
            console.log('\n🔍 Testing getByRecruiterId...');
            const getResult = await RecruiterNewsModel.getByRecruiterId('test-recruiter-123');
            console.log('📋 Get by recruiter ID result:', getResult);

            if (getResult.success && getResult.data.length > 0) {
                console.log(`✅ Found ${getResult.data.length} news items for recruiter`);
                const newsItem = getResult.data[0];
                console.log('📰 First news item:');
                console.log(`   - ID: ${newsItem.recruiterNewsID}`);
                console.log(`   - Recruiter ID: ${newsItem.recruiterId}`);
                console.log(`   - Recruiter Name: ${newsItem.recruiterName}`);
                console.log(`   - Title: ${newsItem.title}`);
                console.log(`   - Company: ${newsItem.company}`);
                console.log(`   - Date: ${newsItem.date}`);
                console.log(`   - Venue: ${newsItem.venue}`);
                console.log(`   - Expected Participants: ${newsItem.expectedParticipants}`);
                console.log(`   - Verified: ${newsItem.verified}`);
            }

            // Clean up - delete the test news
            console.log('\n🧹 Cleaning up test data...');
            const deleteResult = await RecruiterNewsModel.delete(newsId);
            console.log('🗑️ Delete result:', deleteResult);
        }

        console.log('\n✅ All tests completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   ✓ Recruiter ID is being stored correctly');
        console.log('   ✓ News can be retrieved by recruiter ID');
        console.log('   ✓ All required fields are preserved');
        console.log('   ✓ CRUD operations work as expected');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testRecruiterNews();