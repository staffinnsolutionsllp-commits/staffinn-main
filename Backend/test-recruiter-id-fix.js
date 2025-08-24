require('dotenv').config();
const RecruiterNewsModel = require('./models/recruiterNewsModel');

async function testRecruiterIdFix() {
    console.log('🧪 Testing recruiterId fix...');
    
    // Mock news data with recruiterId
    const testNewsData = {
        recruiterId: 'afe9a0b5-63dc-46c3-9c70-4725b2d0fbb6',
        recruiterName: 'Test Recruiter',
        title: 'Test News with Recruiter ID',
        date: '2025-08-24',
        company: 'Test Company',
        venue: 'Test Venue',
        expectedParticipants: 100,
        details: 'This is a test news to verify recruiterId is being saved',
        verified: true,
        bannerImage: null
    };
    
    try {
        // Create news
        console.log('📝 Creating test news...');
        const result = await RecruiterNewsModel.create(testNewsData);
        
        if (result.success) {
            console.log('✅ News created successfully!');
            console.log('📊 Created news data:');
            console.log('   recruiterNewsID:', result.data.recruiterNewsID);
            console.log('   recruiterId:', result.data.recruiterId);
            console.log('   recruiterName:', result.data.recruiterName);
            console.log('   title:', result.data.title);
            
            // Verify by getting news by recruiterId
            console.log('\n🔍 Verifying by getting news for recruiterId...');
            const getResult = await RecruiterNewsModel.getByRecruiterId(testNewsData.recruiterId);
            
            if (getResult.success && getResult.data.length > 0) {
                console.log('✅ Successfully retrieved news by recruiterId!');
                console.log(`📊 Found ${getResult.data.length} news items for this recruiter`);
                
                getResult.data.forEach((news, index) => {
                    console.log(`   News ${index + 1}:`);
                    console.log(`     ID: ${news.recruiterNewsID}`);
                    console.log(`     recruiterId: ${news.recruiterId}`);
                    console.log(`     Title: ${news.title}`);
                });
            } else {
                console.log('❌ Failed to retrieve news by recruiterId');
            }
        } else {
            console.log('❌ Failed to create news:', result.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testRecruiterIdFix();