const mongoose = require('mongoose');
const createDynamicModel = require('../utils/dynamicModel');

const chatSchema = new mongoose.Schema({
  chatName: { type: String, trim: true },
  isGroupChat: { type: Boolean, default: false },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  groupIcon: { type: String, default: '' },
}, { timestamps: true });

module.exports = createDynamicModel('Chat', chatSchema);

