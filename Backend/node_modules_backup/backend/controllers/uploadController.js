const AWS = require('aws-sdk');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1'
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'staffinn-files';

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

exports.uploadReport = [
  upload.single('file'),
  async (req, res) => {
    try {
      console.log('Upload request received');
      console.log('File:', req.file ? 'Present' : 'Missing');
      console.log('Body:', req.body);
      
      if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      console.log('File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      const fileName = `student-reports/${Date.now()}-${uuidv4()}-${req.file.originalname}`;
      console.log('S3 key:', fileName);
      console.log('Bucket:', BUCKET_NAME);
      
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
        // ACL removed - bucket doesn't support ACLs
      };

      console.log('Starting S3 upload...');
      const result = await s3.upload(uploadParams).promise();
      console.log('S3 upload successful:', result.Location);
      
      res.json({ 
        success: true, 
        data: { 
          fileUrl: result.Location,
          fileName: req.file.originalname
        } 
      });
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        success: false, 
        message: error.message,
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
];