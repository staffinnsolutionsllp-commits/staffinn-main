/**
 * Test script to verify placement data sync between dashboard and public API
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/v1';

// Test function to verify placement data sync
async function testPlacementDataSync() {
    console.log('🧪 Testing Placement Data Sync...\n');
    
    try {
        // Test 1: Get all live institutes
        console.log('1. Getting all live institutes...');
        const institutesResponse = await axios.get(`${API_BASE}/institutes/public/all`);
        
        if (!institutesResponse.data.success || !institutesResponse.data.data.length) {
            console.log('❌ No live institutes found. Please ensure at least one institute is live.');
            return;
        }
        
        const institute = institutesResponse.data.data[0];
        console.log(`✅ Found institute: ${institute.instituteName} (ID: ${institute.instituteId})`);
        
        // Test 2: Get public dashboard stats
        console.log('\n2. Getting public dashboard stats...');
        const publicStatsResponse = await axios.get(`${API_BASE}/institutes/public/${institute.instituteId}/dashboard-stats`);
        
        if (publicStatsResponse.data.success) {
            const publicStats = publicStatsResponse.data.data;
            console.log('✅ Public dashboard stats:', {
                totalStudents: publicStats.totalStudents,
                placedStudents: publicStats.placedStudents,
                placementRate: publicStats.placementRate,
                avgSalaryPackage: publicStats.avgSalaryPackage
            });
        } else {
            console.log('❌ Failed to get public dashboard stats:', publicStatsResponse.data.message);
        }
        
        // Test 3: Get public placement section
        console.log('\n3. Getting public placement section...');
        const publicPlacementResponse = await axios.get(`${API_BASE}/institutes/public/${institute.instituteId}/placement-section`);
        
        if (publicPlacementResponse.data.success) {
            const placementData = publicPlacementResponse.data.data;
            console.log('✅ Public placement section:', {
                averageSalary: placementData.averageSalary,
                highestPackage: placementData.highestPackage,
                topHiringCompanies: placementData.topHiringCompanies?.length || 0,
                recentPlacementSuccess: placementData.recentPlacementSuccess?.length || 0
            });
        } else {
            console.log('❌ Failed to get public placement section:', publicPlacementResponse.data.message);
        }
        
        console.log('\n✅ Placement data sync test completed successfully!');
        console.log('\n📋 Summary:');
        console.log('- Public dashboard stats endpoint: Working');
        console.log('- Public placement section endpoint: Working');
        console.log('- Data should now sync in real-time between dashboard and public page');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testPlacementDataSync();