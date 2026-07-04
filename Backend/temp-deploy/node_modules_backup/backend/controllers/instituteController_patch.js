// Patch for getDashboardStats function - replace students section only

// Replace this section in getDashboardStats function:
/*
    // Get total students with error handling
    try {
      console.log('👨🎓 Fetching students...');
      const students = await instituteStudentModel.getStudentsByInstitute(userId);
      totalStudents = Array.isArray(students) ? students.length : 0;
      console.log('✅ Students found:', totalStudents);
    } catch (studentError) {
      console.error('❌ Error fetching students:', studentError.message);
      totalStudents = 0;
    }
*/

// With this code:
    // Get total students from mis-students table with error handling
    try {
      console.log('👨🎓 Fetching students from mis-students...');
      const allStudents = await misStudentModel.getAll();
      console.log('🔍 Total students in mis-students table:', allStudents.length);
      console.log('🔍 Sample student data:', allStudents[0]);
      console.log('🔍 Looking for instituteId:', userId);
      
      // Try different possible field names for institute ID
      const instituteStudents = allStudents.filter(student => 
        student.instituteId === userId || 
        student.institute_id === userId ||
        student.InstituteId === userId ||
        student.instituteid === userId
      );
      
      totalStudents = instituteStudents.length;
      console.log('✅ MIS Students found for institute:', totalStudents);
      console.log('🔍 Filtered students:', instituteStudents.map(s => ({ id: s.studentsId, instituteId: s.instituteId || s.institute_id || s.InstituteId || s.instituteid })));
    } catch (studentError) {
      console.error('❌ Error fetching MIS students:', studentError.message);
      totalStudents = 0;
    }