/**
 * Test script for news endpoints
 * Run this to verify that the news API endpoints are working correctly
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

async function testNewsEndpoints() {
    console.log('🧪 Testing News API Endpoints...\n');
    
    try {
        // Test 1: Get all news
        console.log('1️⃣ Testing GET /news/all');
        const allNewsResponse = await axios.get(`${API_BASE}/news/all`);
        console.log('✅ Status:', allNewsResponse.status);
        console.log('📊 Total news items:', allNewsResponse.data.data?.all?.length || 0);
        console.log('📊 Institute news:', allNewsResponse.data.data?.institute?.length || 0);
        console.log('📊 Recruiter news:', allNewsResponse.data.data?.recruiter?.length || 0);
        console.log('');
        
        // Test 2: Get institute news
        console.log('2️⃣ Testing GET /news/category/institute');
        const instituteNewsResponse = await axios.get(`${API_BASE}/news/category/institute`);
        console.log('✅ Status:', instituteNewsResponse.status);
        console.log('📊 Institute news items:', instituteNewsResponse.data.data?.length || 0);
        console.log('');
        
        // Test 3: Get recruiter news
        console.log('3️⃣ Testing GET /news/category/recruiter');
        const recruiterNewsResponse = await axios.get(`${API_BASE}/news/category/recruiter`);
        console.log('✅ Status:', recruiterNewsResponse.status);
        console.log('📊 Recruiter news items:', recruiterNewsResponse.data.data?.length || 0);
        console.log('');
        
        // Display sample data
        if (allNewsResponse.data.data?.all?.length > 0) {
            console.log('📄 Sample news item:');
            const sampleNews = allNewsResponse.data.data.all[0];
            console.log('   Title:', sampleNews.title);
            console.log('   Category:', sampleNews.category);
            console.log('   Source:', sampleNews.source);
            console.log('   Date:', sampleNews.date);
        }
        
        console.log('\n🎉 All tests passed! News endpoints are working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Run the tests
testNewsEndpoints();