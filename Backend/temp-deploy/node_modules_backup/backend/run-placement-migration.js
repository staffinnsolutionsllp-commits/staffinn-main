#!/usr/bin/env node

/**
 * Simple script to run the placement images migration
 */

const { migratePlacementImages } = require('./migrate-placement-images');

console.log('🚀 Starting placement images migration...');
console.log('This will move existing placement images to the correct S3 folders:');
console.log('  - Company logos → placement-company-logos/');
console.log('  - Student photos → placement-student-photos/');
console.log('');

migratePlacementImages()
  .then(() => {
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });