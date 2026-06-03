const mongoose = require('mongoose');
const createDynamicModel = require('../utils/dynamicModel');

const reviewSchema = new mongoose.Schema({
  appId: { type: mongoose.Schema.Types.ObjectId, ref: 'App', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  screenshotUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: { type: String },
  reviewedAt: { type: Date }
}, { timestamps: true });

module.exports = createDynamicModel('Review', reviewSchema);

