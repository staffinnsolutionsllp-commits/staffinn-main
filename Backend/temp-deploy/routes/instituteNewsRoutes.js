const express = require('express');
const router = express.Router();
const instituteNewsController = require('../controllers/instituteNewsController');
const { protect } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 15
  }
});

// Protected routes (require authentication)
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
  ]),
  instituteNewsController.createNews
);

router.get('/', protect, instituteNewsController.getNews);
router.get('/:newsId', protect, instituteNewsController.getNewsById);

router.put(
  '/:newsId',
  protect,
  upload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
  ]),
  instituteNewsController.updateNews
);

router.delete('/:newsId', protect, instituteNewsController.deleteNews);

// Public routes
router.get('/public/:instituteId', instituteNewsController.getPublicNews);

module.exports = router;
