#!/usr/bin/env node

/**
 * Security Verification Script
 * Checks for hardcoded credentials in the codebase
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Security Verification: Checking for Hardcoded Credentials\n');

// Patterns to search for
const dangerousPatterns = [
  { pattern: /password\s*=\s*['"][^'"]+['"]/gi, name: 'Hardcoded Password' },
  { pattern: /token\s*=\s*['"][^'"]+['"]/gi, name: 'Hardcoded Token' },
  { pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/gi, name: 'Hardcoded API Key' },
  { pattern: /secret\s*=\s*['"][^'"]+['"]/gi, name: 'Hardcoded Secret' },
  { pattern: /aws[_-]?access[_-]?key[_-]?id\s*=\s*['"][^'"]+['"]/gi, name: 'AWS Access Key' },
  { pattern: /aws[_-]?secret[_-]?access[_-]?key\s*=\s*['"][^'"]+['"]/gi, name: 'AWS Secret Key' }
];

// Safe patterns (these are OK)
const safePatterns = [
  'process.env.',
  'your-test-token-here',
  'your-token-here',
  'your-password-here',
  'your-api-key-here',
  'example-token',
  'placeholder'
];

// Files to check
const filesToCheck = [
  'test-classroom-features.js',
  'server.js',
  'config/aws.js',
  'config/dynamodb-wrapper.js'
];

let issuesFound = 0;
let filesChecked = 0;

console.log('📁 Files to check:');
filesToCheck.forEach(file => console.log(`   - ${file}`));
console.log('');

filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  filesChecked++;
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  
  let fileHasIssues = false;
  
  dangerousPatterns.forEach(({ pattern, name }) => {
    const matches = content.match(pattern);
    
    if (matches) {
      matches.forEach(match => {
        // Check if it's a safe pattern
        const isSafe = safePatterns.some(safe => match.includes(safe));
        
        if (!isSafe) {
          if (!fileHasIssues) {
            console.log(`\n🚨 Issues found in: ${filePath}`);
            fileHasIssues = true;
          }
          
          // Find line number
          let lineNum = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(match)) {
              lineNum = i + 1;
              break;
            }
          }
          
          console.log(`   ❌ Line ${lineNum}: ${name}`);
          console.log(`      ${match.substring(0, 50)}...`);
          issuesFound++;
        }
      });
    }
  });
  
  if (!fileHasIssues) {
    console.log(`✅ ${filePath} - No issues found`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 Verification Summary:');
console.log('='.repeat(60));
console.log(`Files checked: ${filesChecked}`);
console.log(`Issues found: ${issuesFound}`);

if (issuesFound === 0) {
  console.log('\n🎉 SUCCESS: No hardcoded credentials found!');
  console.log('✅ Your codebase is secure from CWE-798 & CWE-259');
  process.exit(0);
} else {
  console.log('\n⚠️  WARNING: Hardcoded credentials detected!');
  console.log('❌ Please fix the issues above before deploying');
  console.log('\n💡 Recommended fixes:');
  console.log('   1. Move credentials to .env file');
  console.log('   2. Use process.env.VARIABLE_NAME');
  console.log('   3. Add .env to .gitignore');
  console.log('   4. Never commit real credentials');
  process.exit(1);
}
