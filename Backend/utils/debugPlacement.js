/**
 * Debug utility for placement section data
 */
const institutePlacementModel = require('../models/institutePlacementModel');

const debugPlacementData = async (instituteId) => {
  try {
    console.log('🔍 Debug: Checking placement data for institute:', instituteId);
    
    const placementData = await institutePlacementModel.getPlacementSectionByInstituteId(instituteId);
    
    console.log('📊 Debug: Retrieved placement data:', {
      hasData: !!placementData,
      averageSalary: placementData?.averageSalary || 'NULL',
      highestPackage: placementData?.highestPackage || 'NULL',
      companiesCount: placementData?.topHiringCompanies?.length || 0,
      studentsCount: placementData?.recentPlacementSuccess?.length || 0,
      companies: placementData?.topHiringCompanies?.map(c => ({ name: c.name, hasLogo: !!c.logo })) || [],
      students: placementData?.recentPlacementSuccess?.map(s => ({ name: s.name, hasPhoto: !!s.photo })) || []
    });
    
    return placementData;
  } catch (error) {
    console.error('❌ Debug: Error checking placement data:', error);
    return null;
  }
};

module.exports = {
  debugPlacementData
};