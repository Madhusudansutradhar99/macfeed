const mongoose = require('mongoose');
const createDynamicModel = require('../utils/dynamicModel');

const appSchema = new mongoose.Schema({
  name: { type: String, required: true },
  playStoreLink: { type: String, required: true },
  icon: { type: String }, // Cloudinary URL
  rewardAmount: { type: Number, required: true },
  instructions: { type: String },
  totalReviews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  targetType: { type: String, enum: ['group', 'personal'], default: 'group' },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = createDynamicModel('App', appSchema);

