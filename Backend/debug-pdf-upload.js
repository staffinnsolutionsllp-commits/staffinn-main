/**
 * Debug script to test PDF upload functionality
 */

const fs = require('fs');
const path = require('path');

// Create a simple test PDF
const createTestPDF = () => {
  const testPDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test MOU Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF`;

  const testPDFPath = path.join(__dirname, 'test-mou-debug.pdf');
  fs.writeFileSync(testPDFPath, testPDFContent);
  return testPDFPath;
};

// Test the PDF creation
console.log('🧪 Creating test PDF...');
const pdfPath = createTestPDF();
console.log('✅ Test PDF created at:', pdfPath);

// Check file exists and has content
const stats = fs.statSync(pdfPath);
console.log('📄 PDF file size:', stats.size, 'bytes');

// Clean up
fs.unlinkSync(pdfPath);
console.log('🧹 Test PDF cleaned up');

console.log('\n📋 Debug Instructions:');
console.log('1. Upload a PDF file in the Industry Collaborations section');
console.log('2. Check browser console for upload logs');
console.log('3. Check server logs for file processing');
console.log('4. Verify the PDF URL is stored (not empty string)');
console.log('5. Check DynamoDB for the actual stored value');