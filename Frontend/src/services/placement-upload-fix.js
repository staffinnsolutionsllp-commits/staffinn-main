// Fix for placement upload - ensures File objects are sent, not blob URLs

const fixPlacementUpload = (placementData) => {
  console.log('🔧 Fixing placement upload data...');
  
  const formData = new FormData();
  const processedData = JSON.parse(JSON.stringify(placementData));
  
  // Process companies - extract File objects and add to FormData
  if (processedData.topHiringCompanies) {
    processedData.topHiringCompanies.forEach((company, index) => {
      if (company.logo instanceof File) {
        formData.append(`companyLogo_${index}`, company.logo);
        company.logo = null; // Remove File object from JSON data
        console.log(`✅ Added company logo file for ${company.name}`);
      } else if (typeof company.logo === 'string' && company.logo.startsWith('blob:')) {
        company.logo = null; // Remove blob URLs
        console.log(`❌ Removed blob URL for ${company.name}`);
      }
    });
  }
  
  // Process students - extract File objects and add to FormData
  if (processedData.recentPlacementSuccess) {
    processedData.recentPlacementSuccess.forEach((student, index) => {
      if (student.photo instanceof File) {
        formData.append(`studentPhoto_${index}`, student.photo);
        student.photo = null; // Remove File object from JSON data
        console.log(`✅ Added student photo file for ${student.name}`);
      } else if (typeof student.photo === 'string' && student.photo.startsWith('blob:')) {
        student.photo = null; // Remove blob URLs
        console.log(`❌ Removed blob URL for ${student.name}`);
      }
    });
  }
  
  // Add processed data as JSON
  formData.append('placementData', JSON.stringify(processedData));
  
  return formData;
};

export default fixPlacementUpload;