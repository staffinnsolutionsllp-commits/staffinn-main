/**
 * Script to create staff profile for existing user
 */

// Load environment variables
require('dotenv').config();

const staffModel = require('./models/staffModel');

async function createStaffProfileForUser() {
  try {
    const userId = '4be04c59-dae1-4f6a-98ff-c36ad53016e1';
    
    console.log('Creating staff profile for user:', userId);
    
    const staffProfileData = {
      userId: userId,
      fullName: 'Test Staff User',
      email: 'teststaff@example.com',
      phone: '1234567890',
      isActiveStaff: false, // Default to seeker mode
      profileVisibility: 'private',
      profilePhoto: null,
      resumeUrl: null,
      skills: '',
      address: '',
      availability: 'available',
      visibility: 'public',
      experiences: [],
      certificates: [],
      education: {
        tenth: { percentage: '', year: '', school: '' },
        twelfth: { percentage: '', year: '', school: '' },
        graduation: { degree: '', college: '', percentage: '', startDate: '', endDate: '', pursuing: false }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const staffProfile = await staffModel.createStaffProfile(staffProfileData);
    console.log('✅ Staff profile created successfully:', staffProfile);
    
  } catch (error) {
    console.error('❌ Error creating staff profile:', error);
  }
}

// Run the script
createStaffProfileForUser();