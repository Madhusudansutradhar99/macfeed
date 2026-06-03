const express = require('express');
const router = express.Router();
const { 
  getChatUsers, accessChat, fetchChats, createGroupChat, 
  sendMessage, allMessages, markAsRead, createUserContact, 
  uploadAttachment, removeFromGroup, addToGroup, joinGroup, getGroupDetails, deleteChat, deleteMessage 
} = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/users', protect, getChatUsers);

router.route('/')
  .post(protect, accessChat)
  .get(protect, fetchChats);

router.post('/group', protect, createGroupChat);
router.put('/group/add', protect, addToGroup);
router.put('/group/remove', protect, removeFromGroup);
router.put('/group/join', protect, joinGroup);
router.get('/group/details/:chatId', protect, getGroupDetails);

router.route('/message')
  .post(protect, sendMessage);

router.route('/message/:chatId')
  .get(protect, allMessages);

router.put('/read/:chatId', protect, markAsRead);
router.post('/create-user', protect, createUserContact);
router.post('/upload', protect, upload.single('file'), uploadAttachment);
router.delete('/:id', protect, deleteChat);
router.delete('/message/:messageId', protect, deleteMessage);

module.exports = router;
