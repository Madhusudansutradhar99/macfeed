const mongoose = require('mongoose');
const createDynamicModel = require('../utils/dynamicModel');

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  attachmentUrl: { type: String, default: '' },
  appTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'App' }
}, { timestamps: true });

module.exports = createDynamicModel('Message', messageSchema);

