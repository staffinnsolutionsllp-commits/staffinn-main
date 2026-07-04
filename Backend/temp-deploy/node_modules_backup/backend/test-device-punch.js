const axios = require('axios');

// Test function to simulate device punch
async function simulateDevicePunch(employeeId, verifyMode = 'Fingerprint') {
    try {
        console.log(`🔄 Simulating punch for Employee: ${employeeId}`);
        
        const response = await axios.post('http://localhost:5000/api/attendance/test-attendance', {
            employeeId: employeeId,
            verifyMode: verifyMode
        });

        if (response.data.success) {
            console.log(`✅ Punch recorded successfully!`);
            console.log(`📊 Employee: ${employeeId}`);
            console.log(`⏰ Time: ${response.data.data.timestamp}`);
            console.log(`👆 Method: ${response.data.data.verifyMode}`);
        } else {
            console.log(`❌ Failed: ${response.data.error}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.response?.data?.error || error.message}`);
    }
}

// Test with different employees
async function runTests() {
    console.log('🚀 Starting attendance simulation tests...\n');
    
    await simulateDevicePunch('EMP001', 'Fingerprint');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await simulateDevicePunch('EMP002', 'Face');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await simulateDevicePunch('EMP003', 'Card');
    
    console.log('\n✅ All tests completed!');
    console.log('📱 Check your HRMS Attendance Management to see the records');
}

// Run if called directly
if (require.main === module) {
    runTests();
}

module.exports = { simulateDevicePunch };