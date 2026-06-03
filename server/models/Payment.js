const mongoose = require('mongoose');
const createDynamicModel = require('../utils/dynamicModel');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['upi', 'bank', 'paypal'], required: true },
  accountDetails: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'rejected'], default: 'pending' },
  transactionId: { type: String },
  requestedAt: { type: Date, default: Date.now },
  processedAt: { type: Date }
}, { timestamps: true });

module.exports = createDynamicModel('Payment', paymentSchema);

