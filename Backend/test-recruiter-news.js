const RecruiterNewsModel = require('./models/recruiterNewsModel');

// Test function to verify recruiter news functionality
async function testRecruiterNews() {
    console.log('🧪 Testing Recruiter News Functionality...\n');

    try {
        // Test 1: Create news with recruiter info
        console.log('📝 Test 1: Creating news with recruiter information...');
        const testNewsData = {
            recruiterId: 'test-recruiter-123',
            recruiterName: 'Test Recruiter Company',
            title: 'Company Expansion Announcement',
            date: '2024-01-15',
            company: 'Test Tech Solutions',
            venue: 'Corporate Headquarters',
            expectedParticipants: 100,
            details: 'We are excited to announce our expansion into new markets with innovative solutions.',
            verified: true,
            bannerImage: 'https://example.com/banner.jpg'
        };

        const createResult = await RecruiterNewsModel.create(testNewsData);
        
        if (createResult.success) {
            console.log('✅ News created successfully!');
            console.log('📋 Created news data:', {
                id: createResult.data.recruiterNewsID,
                title: createResult.data.title,
                recruiterName: createResult.data.recruiterName,
                recruiterId: createResult.data.recruiterId,
                company: createResult.data.company,
                verified: createResult.data.verified
            });

            // Test 2: Retrieve news by recruiter ID
            console.log('\n🔍 Test 2: Retrieving news by recruiter ID...');
            const getResult = await RecruiterNewsModel.getByRecruiterId('test-recruiter-123');
            
            if (getResult.success && getResult.data.length > 0) {
                console.log('✅ News retrieved successfully!');
                console.log('📊 Retrieved news count:', getResult.data.length);
                console.log('📋 First news item:', {
                    title: getResult.data[0].title,
                    recruiterName: getResult.data[0].recruiterName,
                    company: getResult.data[0].company
                });
            } else {
                console.log('❌ Failed to retrieve news');
            }

            // Test 3: Update news
            console.log('\n✏️ Test 3: Updating news...');
            const updateData = {
                title: 'Updated: Company Expansion Announcement',
                recruiterName: 'Updated Recruiter Company Name',
                details: 'Updated details about our exciting expansion plans.'
            };

            const updateResult = await RecruiterNewsModel.update(createResult.data.recruiterNewsID, updateData);
            
            if (updateResult.success) {
                console.log('✅ News updated successfully!');
                console.log('📋 Updated news data:', {
                    title: updateResult.data.title,
                    recruiterName: updateResult.data.recruiterName,
                    details: updateResult.data.details
                });
            } else {
                console.log('❌ Failed to update news');
            }

            // Test 4: Get updated news by ID
            console.log('\n🔍 Test 4: Retrieving updated news by ID...');
            const getByIdResult = await RecruiterNewsModel.getById(createResult.data.recruiterNewsID);
            
            if (getByIdResult.success) {
                console.log('✅ News retrieved by ID successfully!');
                console.log('📋 Retrieved news:', {
                    title: getByIdResult.data.title,
                    recruiterName: getByIdResult.data.recruiterName,
                    recruiterId: getByIdResult.data.recruiterId,
                    updatedAt: getByIdResult.data.updatedAt
                });
            } else {
                console.log('❌ Failed to retrieve news by ID');
            }

            // Test 5: Delete news (cleanup)
            console.log('\n🗑️ Test 5: Cleaning up - deleting test news...');
            const deleteResult = await RecruiterNewsModel.delete(createResult.data.recruiterNewsID);
            
            if (deleteResult.success) {
                console.log('✅ News deleted successfully!');
            } else {
                console.log('❌ Failed to delete news');
            }

        } else {
            console.log('❌ Failed to create news:', createResult.message);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }

    console.log('\n🏁 Test completed!');
}

// Run the test
if (require.main === module) {
    testRecruiterNews();
}

module.exports = testRecruiterNews;