const express = require('express');
const router = express.Router();
const { submitReview, getMyReviews, getAllReviews, approveReview, rejectReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');
const upload = require('../middleware/upload');

router.post('/', protect, upload.single('screenshot'), submitReview);
router.get('/my', protect, getMyReviews);
router.get('/all', protect, adminOnly, getAllReviews);
router.put('/:id/approve', protect, adminOnly, approveReview);
router.put('/:id/reject', protect, adminOnly, rejectReview);

module.exports = router;
