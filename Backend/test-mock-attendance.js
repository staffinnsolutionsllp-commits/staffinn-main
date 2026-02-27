// Mock attendance test without bridge service
const axios = require('axios');

async function testMockAttendance() {
    console.log('🧪 Testing Mock Attendance...');
    
    try {
        // Test webhook endpoint with mock data
        const mockData = {
            enrollNumber: '123',
            name: 'Test Employee',
            verifyMode: 'Fingerprint',
            inOutMode: 0,
            dateTime: new Date().toISOString()
        };
        
        const response = await axios.post('http://localhost:8000/api/attendance/webhook', mockData);
        console.log('✅ Mock attendance saved:', response.data);
        
        // Get records
        const records = await axios.get('http://localhost:8000/api/attendance/records?employeeId=123');
        console.log('📊 Records:', records.data);
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testMockAttendance();