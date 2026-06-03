const Review = require('../models/Review');
const User = require('../models/User');
const App = require('../models/App');

exports.submitReview = async (req, res) => {
  try {
    const { appId } = req.body;
    
    // Validate if already reviewed
    const existingReview = await Review.findOne({ appId, userId: req.user._id });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review for this app' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Screenshot is required' });
    }

    const review = await Review.create({
      appId,
      userId: req.user._id,
      screenshotUrl: req.file.path
    });

    // Notify Admin via Socket (implemented in socket handlers usually, or we can emit here if io is accessible)
    // req.app.get('io').emit('newReviewSubmitted', review);

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id }).populate('appId', 'name icon rewardAmount');
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().populate('appId', 'name rewardAmount').populate('userId', 'name email');
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('appId');
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.status === 'approved') return res.status(400).json({ success: false, message: 'Review already approved' });

    review.status = 'approved';
    review.reviewedAt = Date.now();
    await review.save();

    const user = await User.findById(review.userId);
    user.totalEarnings += review.appId.rewardAmount;
    user.pendingAmount += review.appId.rewardAmount;
    await user.save();

    res.json({ success: true, message: 'Review approved and user credited', review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectReview = async (req, res) => {
  try {
    const { adminNote } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.status = 'rejected';
    review.adminNote = adminNote;
    review.reviewedAt = Date.now();
    await review.save();

    res.json({ success: true, message: 'Review rejected', review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
