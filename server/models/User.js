const mongoose = require('mongoose');
const createDynamicModel = require('../utils/dynamicModel');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: { type: String },
  upiId: { type: String },
  bankDetails: {
    accountNo: String,
    ifsc: String,
    holderName: String
  },
  totalEarnings: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  withdrawnAmount: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }]
}, { timestamps: true });

module.exports = createDynamicModel('User', userSchema);

