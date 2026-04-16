# Awards and Recognition Feature Implementation Guide

## Issue Fixed
✅ **Sidebar Text Cutoff**: Fixed "Industry Collaboration" text being cut off by adding proper word-wrap and white-space CSS properties.

## Backend Requirements

### 1. DynamoDB Table
**Table Name**: `institute-awards-recognition`
**Partition Key**: `instituteaward` (String)

**Attributes**:
- instituteaward (PK) - Format: `INSTITUTE#{instituteId}#AWARD#{awardId}`
- instituteId (String)
- awardId (String) - UUID
- title (String)
- description (String)
- photos (List of Strings) - S3 URLs
- createdAt (String) - ISO timestamp
- updatedAt (String) - ISO timestamp

### 2. API Endpoints Needed

Create file: `Backend/routes/instituteAwardsRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const instituteAwardsController = require('../controllers/instituteAwardsController');

// Get all awards for institute
router.get('/', authenticate, instituteAwardsController.getAwards);

// Get single award
router.get('/:awardId', authenticate, instituteAwardsController.getAwardById);

// Create new award
router.post('/', authenticate, instituteAwardsController.createAward);

// Update award
router.put('/:awardId', authenticate, instituteAwardsController.updateAward);

// Delete award
router.delete('/:awardId', authenticate, instituteAwardsController.deleteAward);

module.exports = router;
```

### 3. Controller Implementation

Create file: `Backend/controllers/instituteAwardsController.js`

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: process.env.AWS_REGION });

const AWARDS_TABLE = 'institute-awards-recognition';
const S3_BUCKET = process.env.S3_BUCKET_NAME;

// Get all awards for institute
exports.getAwards = async (req, res) => {
    try {
        const instituteId = req.user.id;
        
        const params = {
            TableName: AWARDS_TABLE,
            IndexName: 'instituteId-index', // Create GSI on instituteId
            KeyConditionExpression: 'instituteId = :instituteId',
            ExpressionAttributeValues: {
                ':instituteId': instituteId
            }
        };
        
        const result = await docClient.send(new QueryCommand(params));
        
        res.json({
            success: true,
            data: result.Items || []
        });
    } catch (error) {
        console.error('Error fetching awards:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch awards'
        });
    }
};

// Create new award
exports.createAward = [
    upload.array('photos', 10),
    async (req, res) => {
        try {
            const instituteId = req.user.id;
            const { title, description } = req.body;
            const awardId = uuidv4();
            
            // Upload photos to S3
            const photoUrls = [];
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const key = `awards/${instituteId}/${awardId}/${Date.now()}-${file.originalname}`;
                    await s3Client.send(new PutObjectCommand({
                        Bucket: S3_BUCKET,
                        Key: key,
                        Body: file.buffer,
                        ContentType: file.mimetype
                    }));
                    photoUrls.push(`https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`);
                }
            }
            
            const award = {
                instituteaward: `INSTITUTE#${instituteId}#AWARD#${awardId}`,
                instituteId,
                awardId,
                title,
                description,
                photos: photoUrls,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await docClient.send(new PutCommand({
                TableName: AWARDS_TABLE,
                Item: award
            }));
            
            res.json({
                success: true,
                data: award,
                message: 'Award created successfully'
            });
        } catch (error) {
            console.error('Error creating award:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create award'
            });
        }
    }
];

// Update award
exports.updateAward = [
    upload.array('photos', 10),
    async (req, res) => {
        try {
            const instituteId = req.user.id;
            const { awardId } = req.params;
            const { title, description, existingPhotos } = req.body;
            
            const pk = `INSTITUTE#${instituteId}#AWARD#${awardId}`;
            
            // Get existing award
            const existing = await docClient.send(new GetCommand({
                TableName: AWARDS_TABLE,
                Key: { instituteaward: pk }
            }));
            
            if (!existing.Item) {
                return res.status(404).json({
                    success: false,
                    message: 'Award not found'
                });
            }
            
            // Handle photo updates
            let photoUrls = JSON.parse(existingPhotos || '[]');
            
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const key = `awards/${instituteId}/${awardId}/${Date.now()}-${file.originalname}`;
                    await s3Client.send(new PutObjectCommand({
                        Bucket: S3_BUCKET,
                        Key: key,
                        Body: file.buffer,
                        ContentType: file.mimetype
                    }));
                    photoUrls.push(`https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`);
                }
            }
            
            await docClient.send(new UpdateCommand({
                TableName: AWARDS_TABLE,
                Key: { instituteaward: pk },
                UpdateExpression: 'SET title = :title, description = :description, photos = :photos, updatedAt = :updatedAt',
                ExpressionAttributeValues: {
                    ':title': title,
                    ':description': description,
                    ':photos': photoUrls,
                    ':updatedAt': new Date().toISOString()
                }
            }));
            
            res.json({
                success: true,
                message: 'Award updated successfully'
            });
        } catch (error) {
            console.error('Error updating award:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update award'
            });
        }
    }
];

// Delete award
exports.deleteAward = async (req, res) => {
    try {
        const instituteId = req.user.id;
        const { awardId } = req.params;
        const pk = `INSTITUTE#${instituteId}#AWARD#${awardId}`;
        
        // Get award to delete photos from S3
        const existing = await docClient.send(new GetCommand({
            TableName: AWARDS_TABLE,
            Key: { instituteaward: pk }
        }));
        
        if (existing.Item && existing.Item.photos) {
            for (const photoUrl of existing.Item.photos) {
                const key = photoUrl.split('.com/')[1];
                await s3Client.send(new DeleteObjectCommand({
                    Bucket: S3_BUCKET,
                    Key: key
                }));
            }
        }
        
        await docClient.send(new DeleteCommand({
            TableName: AWARDS_TABLE,
            Key: { instituteaward: pk }
        }));
        
        res.json({
            success: true,
            message: 'Award deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting award:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete award'
        });
    }
};
```

### 4. Register Routes in server.js

Add to `Backend/server.js`:
```javascript
const instituteAwardsRoutes = require('./routes/instituteAwardsRoutes');
app.use(`${API_PREFIX}/institute/awards`, instituteAwardsRoutes);
```

## Frontend Implementation

### 1. API Service Methods

Add to `Frontend/src/services/api.js`:

```javascript
// Awards and Recognition
getInstituteAwards: async () => {
    return apiRequest('/institute/awards', 'GET');
},

createInstituteAward: async (formData) => {
    return apiRequest('/institute/awards', 'POST', formData, true);
},

updateInstituteAward: async (awardId, formData) => {
    return apiRequest(`/institute/awards/${awardId}`, 'PUT', formData, true);
},

deleteInstituteAward: async (awardId) => {
    return apiRequest(`/institute/awards/${awardId}`, 'DELETE');
},
```

### 2. Load Awards Function

Add to InstituteDashboard.jsx after loadInstituteGovtSchemes:

```javascript
const loadAwards = async () => {
    try {
        const response = await apiService.getInstituteAwards();
        if (response.success && response.data) {
            setAwards(response.data);
        } else {
            setAwards([]);
        }
    } catch (error) {
        console.error('Error loading awards:', error);
        setAwards([]);
    }
};
```

Add to useEffect:
```javascript
loadAwards();
```

### 3. Award Handlers

Add these functions:

```javascript
const handleAwardSubmit = async (e) => {
    e.preventDefault();
    try {
        setLoading(true);
        const formData = new FormData();
        formData.append('title', awardForm.title);
        formData.append('description', awardForm.description);
        
        awardForm.photos.forEach(photo => {
            if (photo instanceof File) {
                formData.append('photos', photo);
            }
        });
        
        if (selectedAward) {
            formData.append('existingPhotos', JSON.stringify(
                awardForm.photos.filter(p => typeof p === 'string')
            ));
            const response = await apiService.updateInstituteAward(selectedAward.awardId, formData);
            if (response.success) {
                alert('Award updated successfully!');
            }
        } else {
            const response = await apiService.createInstituteAward(formData);
            if (response.success) {
                alert('Award added successfully!');
            }
        }
        
        await loadAwards();
        setShowAwardModal(false);
        setAwardForm({ title: '', description: '', photos: [] });
        setSelectedAward(null);
    } catch (error) {
        console.error('Error saving award:', error);
        alert('Failed to save award');
    } finally {
        setLoading(false);
    }
};

const handleDeleteAward = async (awardId, title) => {
    if (window.confirm(`Delete "${title}"?`)) {
        try {
            setLoading(true);
            const response = await apiService.deleteInstituteAward(awardId);
            if (response.success) {
                alert('Award deleted successfully!');
                await loadAwards();
            }
        } catch (error) {
            console.error('Error deleting award:', error);
            alert('Failed to delete award');
        } finally {
            setLoading(false);
        }
    }
};
```

### 4. Replace Awards Tab Content

Replace the placeholder awards-recognition tab with full implementation (see next file).

## Summary

1. ✅ Fixed sidebar text cutoff issue
2. ✅ Created backend structure for Awards & Recognition
3. ✅ DynamoDB table design with proper partition key
4. ✅ S3 integration for photo storage
5. ✅ Full CRUD operations
6. ✅ Institute-wise data separation
7. ✅ Frontend state management ready

Next: Implement the full Awards tab UI in InstituteDashboard.jsx
