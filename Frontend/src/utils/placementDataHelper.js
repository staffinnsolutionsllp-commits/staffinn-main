/**
 * Helper functions for placement section data handling
 */

export const prepareCompanyData = (companies, companyFilesRef) => {
  return companies.map((company, index) => {
    const companyData = {
      name: company.name || ''
    };
    
    // Handle logo file or existing URL
    if (company.logoFileId && companyFilesRef.current.has(company.logoFileId)) {
      companyData.logo = companyFilesRef.current.get(company.logoFileId);
    } else if (typeof company.logo === 'string' && company.logo.includes('http') && !company.logo.startsWith('blob:')) {
      companyData.logo = company.logo;
    } else {
      companyData.logo = null;
    }
    
    return companyData;
  });
};

export const prepareStudentData = (students, studentFilesRef) => {
  return students.map((student, index) => {
    const studentData = {
      name: student.name || '',
      company: student.company || '',
      position: student.position || ''
    };
    
    // Handle photo file or existing URL
    if (student.photoFileId && studentFilesRef.current.has(student.photoFileId)) {
      studentData.photo = studentFilesRef.current.get(student.photoFileId);
    } else if (typeof student.photo === 'string' && student.photo.includes('http') && !student.photo.startsWith('blob:')) {
      studentData.photo = student.photo;
    } else {
      studentData.photo = null;
    }
    
    return studentData;
  });
};

export const validatePlacementData = (data) => {
  const errors = [];
  
  if (!data.averageSalary && !data.highestPackage && 
      (!data.topHiringCompanies || data.topHiringCompanies.length === 0) &&
      (!data.recentPlacementSuccess || data.recentPlacementSuccess.length === 0)) {
    errors.push('At least one field must be filled');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};