/**
 * Test script to verify news functionality
 */

const RecruiterNewsModel = require('./models/recruiterNewsModel');
const newsController = require('./controllers/newsController');

async function testNewsEndpoints() {
    console.log('🧪 Testing News Endpoints...\n');
    
    try {
        // Test 1: Get all recruiter news
        console.log('1. Testing getAllPublic from RecruiterNewsModel...');
        const recruiterNewsResult = await RecruiterNewsModel.getAllPublic();
        console.log('✅ Recruiter news result:', {
            success: recruiterNewsResult.success,
            count: recruiterNewsResult.data?.length || 0,
            sample: recruiterNewsResult.data?.[0] || 'No data'
        });
        
        // Test 2: Mock request/response for getAllNews
        console.log('\n2. Testing newsController.getAllNews...');
        const mockReq = {};
        const mockRes = {
            json: (data) => {
                console.log('✅ getAllNews response:', {
                    success: data.success,
                    totalNews: data.data?.all?.length || 0,
                    instituteNews: data.data?.institute?.length || 0,
                    recruiterNews: data.data?.recruiter?.length || 0,
                    sampleNews: data.data?.all?.[0] || 'No news'
                });
                return data;
            },
            status: (code) => ({
                json: (data) => {
                    console.log('❌ Error response:', { status: code, data });
                    return data;
                }
            })
        };
        
        await newsController.getAllNews(mockReq, mockRes);
        
        console.log('\n✅ News endpoints test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
if (require.main === module) {
    testNewsEndpoints().then(() => {
        console.log('\n🎉 Test script finished');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Test script failed:', error);
        process.exit(1);
    });
}

module.exports = { testNewsEndpoints };