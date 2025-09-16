const express = require('express');
const multer = require('multer');
const app = express();

// Add logging middleware to capture placement requests
const originalUpdatePlacementSection = require('./controllers/instituteController').updatePlacementSection;

// Override the placement section handler with debug logging
const debugUpdatePlacementSection = async (req, res) => {
  console.log('🔍 PLACEMENT SECTION DEBUG:');
  console.log('Headers:', req.headers);
  console.log('Body keys:', Object.keys(req.body));
  console.log('Files:', req.files ? req.files.length : 0);
  
  if (req.body.placementData) {
    try {
      const data = JSON.parse(req.body.placementData);
      console.log('Companies:', data.topHiringCompanies?.map(c => ({
        name: c.name,
        logo: typeof c.logo,
        logoValue: c.logo?.substring?.(0, 50) + '...'
      })));
      console.log('Students:', data.recentPlacementSuccess?.map(s => ({
        name: s.name,
        photo: typeof s.photo,
        photoValue: s.photo?.substring?.(0, 50) + '...'
      })));
    } catch (e) {
      console.log('Failed to parse placement data:', e.message);
    }
  }
  
  // Call original handler
  return originalUpdatePlacementSection(req, res);
};

module.exports = { debugUpdatePlacementSection };