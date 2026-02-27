const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const awsConfig = require('../config/aws');

const s3Client = new S3Client(awsConfig);
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const folder = req.body.folder || 'uploads';
    const fileName = `${folder}/${Date.now()}-${req.file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    });

    await s3Client.send(command);
    
    const url = `https://${process.env.S3_BUCKET_NAME}.s3.${awsConfig.region}.amazonaws.com/${fileName}`;
    
    res.json({ success: true, url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

module.exports = router;
