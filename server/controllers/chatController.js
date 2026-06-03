const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

exports.getChatUsers = async (req, res) => {
  try {
    let users;
    // For telegram style, let them see users to chat with.
    // If admin, see all users. If user, maybe only see admin or all users.
    // Let's just return all users for now so they can create groups!
    users = await User.find({ _id: { $ne: req.user._id } }).select('name email role phone');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.accessChat = async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  try {
    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } }
      ]
    }).populate('users', 'name email').populate('latestMessage');

    isChat = await User.populate(isChat, {
      path: 'latestMessage.senderId',
      select: 'name email'
    });

    if (isChat.length > 0) {
      res.json(isChat[0]);
    } else {
      const chatData = {
        chatName: 'sender',
        isGroupChat: false,
        users: [req.user._id, userId]
      };
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate('users', 'name email');
      res.json(FullChat);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.fetchChats = async (req, res) => {
  try {
    // Auto-create or ensure user is in "Screenshot Review Panel" (chat-review-portal-1)
    // mongoose already declared at top
    const ChatModel = require('../models/Chat');
    
    if (mongoose.connection.readyState === 1) {
      let reviewPanel = await ChatModel.findById('chat-review-portal-1');
      if (!reviewPanel) {
        await ChatModel.create({
          _id: 'chat-review-portal-1',
          chatName: 'Screenshot Review Panel',
          isGroupChat: true,
          users: [req.user._id],
          isReviewChat: true
        });
      } else if (!reviewPanel.users.some(id => id.toString() === req.user._id.toString())) {
        reviewPanel.users.push(req.user._id);
        await reviewPanel.save();
      }
    } else {
      const mockDb = require('../utils/mockDb');
      const fs = require('fs');
      const path = require('path');
      const chats = mockDb.readData('Chat');
      let found = chats.find(c => c._id === 'chat-review-portal-1');
      if (!found) {
        found = {
          _id: 'chat-review-portal-1',
          chatName: 'Screenshot Review Panel',
          isGroupChat: true,
          users: [req.user._id.toString()],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isReviewChat: true
        };
        chats.push(found);
        fs.writeFileSync(path.join(__dirname, '../.db/chats.json'), JSON.stringify(chats, null, 2));
      } else if (!found.users.some(id => id.toString() === req.user._id.toString())) {
        found.users.push(req.user._id.toString());
        fs.writeFileSync(path.join(__dirname, '../.db/chats.json'), JSON.stringify(chats, null, 2));
      }
    }

    let results = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate('users', 'name email role')
      .populate('groupAdmin', 'name email')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    // Auto-create a support chat with an Admin if the user has no chats and is not an admin
    if (results.length === 0 && req.user.role !== 'admin') {
      const supportUser = await User.findOne({ role: 'admin' });
      if (supportUser && supportUser._id.toString() !== req.user._id.toString()) {
        await Chat.create({
          chatName: 'Support Chat',
          isGroupChat: false,
          users: [req.user._id, supportUser._id]
        });
        
        // Re-fetch chats
        results = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
          .populate('users', 'name email role')
          .populate('groupAdmin', 'name email')
          .populate('latestMessage')
          .sort({ updatedAt: -1 });
      }
    }

    results = await User.populate(results, {
      path: 'latestMessage.senderId',
      select: 'name email'
    });

    // Count unread messages dynamically
    const Message = require('../models/Message');
    // mongoose already declared at top
    const mockDb = require('../utils/mockDb');

    const chatsWithUnread = [];
    for (let chat of results) {
      let unreadCount = 0;
      if (mongoose.connection.readyState === 1) {
        unreadCount = await Message.countDocuments({
          chat: chat._id,
          senderId: { $ne: req.user._id },
          isRead: false
        });
      } else {
        const msgs = mockDb.readData('Message');
        unreadCount = msgs.filter(m => 
          m.chat === chat._id.toString() && 
          m.senderId !== req.user._id.toString() && 
          m.isRead === false
        ).length;
      }
      
      const chatObj = chat.toObject ? chat.toObject() : chat;
      chatObj.unreadCount = unreadCount;
      
      // Seed default Support Chat as a Review Chat so we can filter it
      if (chatObj._id === 'chat-support-1' || chatObj.chatName === 'Support Chat') {
        chatObj.isReviewChat = true;
      }

      chatsWithUnread.push(chatObj);
    }

    res.json({ success: true, chats: chatsWithUnread });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createGroupChat = async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: 'Please Fill all the fields' });
  }

  var users = JSON.parse(req.body.users);
  if (users.length < 1) {
    return res.status(400).send('More than 1 user required to form a group chat');
  }
  
  users.push(req.user._id);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user._id
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate('users', 'name email')
      .populate('groupAdmin', 'name email');

    res.json(fullGroupChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  const { content, chatId, attachmentUrl, appTaskId, sendToReviewPortal } = req.body;
  if ((!content && !attachmentUrl && !appTaskId) || !chatId) {
    return res.status(400).json({ message: 'Invalid data passed into request' });
  }

  let targetChatId = chatId;

  try {
    if (chatId === 'chat-review-portal-1') {
      // mongoose already declared at top
      let userInOtherGroup = false;

      if (mongoose.connection.readyState === 1) {
        const groupCount = await Chat.countDocuments({
          isGroupChat: true,
          _id: { $ne: 'chat-review-portal-1' },
          users: { $elemMatch: { $eq: req.user._id } }
        });
        userInOtherGroup = groupCount > 0;
      } else {
        const mockDb = require('../utils/mockDb');
        const allChats = mockDb.readData('Chat');
        userInOtherGroup = allChats.some(c => 
          c.isGroupChat === true && 
          c._id !== 'chat-review-portal-1' &&
          c.users.some(uId => uId.toString() === req.user._id.toString())
        );
      }

      if (!userInOtherGroup) {
        return res.status(403).json({ message: 'Only group members are allowed to send messages or screenshots in the Screenshot Review Panel' });
      }
    }

    if (attachmentUrl) {
      // mongoose already declared at top
      let userInGroup = false;

      if (mongoose.connection.readyState === 1) {
        const groupCount = await Chat.countDocuments({
          isGroupChat: true,
          users: { $elemMatch: { $eq: req.user._id } }
        });
        userInGroup = groupCount > 0;
      } else {
        const mockDb = require('../utils/mockDb');
        const allChats = mockDb.readData('Chat');
        userInGroup = allChats.some(c => 
          c.isGroupChat === true && 
          c.users.some(uId => uId.toString() === req.user._id.toString())
        );
      }

      if (!userInGroup) {
        return res.status(403).json({ message: 'Only group members are allowed to submit screenshot reviews' });
      }
    }

    if (sendToReviewPortal) {
      // Find or create the user's Review/Support chat
      let reviewChat = await Chat.findOne({
        isGroupChat: false,
        users: { $elemMatch: { $eq: req.user._id } },
        $or: [
          { _id: 'chat-support-1' },
          { chatName: 'Support Chat' }
        ]
      });

      if (!reviewChat) {
        const supportUser = await User.findOne({ role: 'admin' });
        if (supportUser && supportUser._id.toString() !== req.user._id.toString()) {
          reviewChat = await Chat.create({
            chatName: 'Support Chat',
            isGroupChat: false,
            users: [req.user._id, supportUser._id]
          });
        }
      }

      if (reviewChat) {
        targetChatId = reviewChat._id;
      }
    }

    var newMessage = {
      senderId: req.user._id,
      content: content || '',
      chat: targetChatId,
      attachmentUrl: attachmentUrl || '',
      appTaskId: appTaskId || null
    };

    var message = await Message.create(newMessage);
    message = await message.populate('senderId', 'name email');
    message = await message.populate('chat');
    if (message.appTaskId) {
      message = await message.populate('appTaskId');
    }
    message = await User.populate(message, { path: 'chat.users', select: 'name email' });

    await Chat.findByIdAndUpdate(targetChatId, { latestMessage: message });

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('senderId', 'name email')
      .populate('chat')
      .populate('appTaskId');
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    let fileUrl = '';
    if (req.file.path.startsWith('http')) {
      fileUrl = req.file.path;
    } else {
      fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  const { chatId } = req.params;
  try {
    // Mark all messages not sent by req.user._id in this chat as read
    await Message.updateMany(
      { chat: chatId, senderId: { $ne: req.user._id }, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUserContact = async (req, res) => {
  const { name, phone, email } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and Phone are required' });
  }

  try {
    const formattedEmail = email || `${phone.replace(/[^0-9]/g, '') || Math.random().toString(36).substring(2, 7)}@macfeed.com`;
    
    // Check if user exists by phone or email
    let userExists = await User.findOne({ $or: [{ phone }, { email: formattedEmail }] });
    
    if (!userExists) {
      // Create user
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('secret123', salt); // Default password for new contacts
      userExists = await User.create({
        name,
        email: formattedEmail,
        password: hashedPassword,
        phone,
        role: 'user'
      });
    }

    // Now start/access chat with this user
    let isChat = await Chat.findOne({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userExists._id } } }
      ]
    }).populate('users', 'name email role phone');

    if (!isChat) {
      const createdChat = await Chat.create({
        chatName: 'sender',
        isGroupChat: false,
        users: [req.user._id, userExists._id]
      });
      isChat = await Chat.findOne({ _id: createdChat._id }).populate('users', 'name email role phone');
    }

    res.json({ success: true, chat: isChat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;
  if (!chatId || !userId) {
    return res.status(400).json({ success: false, message: 'Chat ID and User ID are required' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    if (!chat.groupAdmin || chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only group admins can add members' });
    }

    if (chat.users.some(id => id.toString() === userId.toString())) {
      return res.status(400).json({ success: false, message: 'User is already in the group' });
    }

    chat.users.push(userId);
    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('users', 'name email role')
      .populate('groupAdmin', 'name email');

    res.json({ success: true, chat: updatedChat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.joinGroup = async (req, res) => {
  const { chatId } = req.body;
  if (!chatId) {
    return res.status(400).json({ success: false, message: 'Chat ID is required' });
  }

  try {
    const ChatModel = require('../models/Chat');
    // mongoose already declared at top

    let chat;
    if (mongoose.connection.readyState === 1) {
      chat = await ChatModel.findById(chatId);
    } else {
      const mockDb = require('../utils/mockDb');
      const chats = mockDb.readData('Chat');
      chat = chats.find(c => c._id === chatId);
    }

    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    if (!chat.isGroupChat) return res.status(400).json({ success: false, message: 'Only group chats can be joined via link' });

    if (!Array.isArray(chat.users)) {
      chat.users = [];
    }
    const userJoined = chat.users.some(id => id.toString() === req.user._id.toString());
    if (userJoined) {
      let populatedChat = chat;
      if (mongoose.connection.readyState === 1) {
        populatedChat = await ChatModel.findById(chatId)
          .populate('users', 'name email role')
          .populate('groupAdmin', 'name email');
      } else {
        const mockDb = require('../utils/mockDb');
        const users = mockDb.readData('User');
        populatedChat = {
          ...chat,
          users: chat.users.map(uId => {
            const u = users.find(usr => usr._id === uId.toString());
            return u ? { _id: u._id, name: u.name, email: u.email, role: u.role } : uId;
          })
        };
      }
      return res.json({ success: true, message: 'Already a member of this group', chat: populatedChat });
    }

    chat.users.push(req.user._id.toString());

    if (mongoose.connection.readyState === 1) {
      await chat.save();
    } else {
      const mockDb = require('../utils/mockDb');
      const fs = require('fs');
      const path = require('path');
      const chats = mockDb.readData('Chat');
      const idx = chats.findIndex(c => c._id === chatId);
      if (idx !== -1) {
        chats[idx] = chat;
        fs.writeFileSync(path.join(__dirname, '../.db/chats.json'), JSON.stringify(chats, null, 2));
      }
    }

    let updatedChat = chat;
    if (mongoose.connection.readyState === 1) {
      updatedChat = await ChatModel.findById(chatId)
        .populate('users', 'name email role')
        .populate('groupAdmin', 'name email');
    } else {
      const mockDb = require('../utils/mockDb');
      const users = mockDb.readData('User');
      updatedChat = {
        ...chat,
        users: chat.users.map(uId => {
          const u = users.find(usr => usr._id === uId.toString());
          return u ? { _id: u._id, name: u.name, email: u.email, role: u.role } : uId;
        })
      };
    }

    res.json({ success: true, message: 'Joined group successfully', chat: updatedChat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGroupDetails = async (req, res) => {
  const { chatId } = req.params;
  try {
    const ChatModel = require('../models/Chat');
    const mongoose = require('mongoose');

    let chat;
    if (mongoose.connection.readyState === 1) {
      chat = await ChatModel.findById(chatId).populate('users', 'name email');
    } else {
      const mockDb = require('../utils/mockDb');
      const chats = mockDb.readData('Chat');
      chat = chats.find(c => c._id === chatId);
      if (chat) {
        const users = mockDb.readData('User');
        chat = {
          ...chat,
          users: chat.users.map(uId => {
            const u = users.find(usr => usr._id === uId.toString());
            return u ? { _id: u._id, name: u.name, email: u.email } : uId;
          })
        };
      }
    }

    if (!chat) return res.status(404).json({ success: false, message: 'Group not found' });
    if (!chat.isGroupChat) return res.status(400).json({ success: false, message: 'Not a group chat' });

    res.json({
      success: true,
      chat: {
        _id: chat._id,
        chatName: chat.chatName,
        memberCount: chat.users.length,
        isGroupChat: true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;
  if (!chatId || !userId) {
    return res.status(400).json({ success: false, message: 'Chat ID and User ID are required' });
  }

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    if (!chat.groupAdmin || chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only group admins can remove members' });
    }

    chat.users = chat.users.filter(id => id.toString() !== userId.toString());
    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('users', 'name email role')
      .populate('groupAdmin', 'name email');

    res.json({ success: true, chat: updatedChat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteChat = async (req, res) => {
  const { id } = req.params;
  try {
    const chat = await Chat.findById(id);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });

    const isMember = chat.users.some(uId => uId.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this chat' });
    }

    const ChatModel = require('../models/Chat');
    const MessageModel = require('../models/Message');
    // mongoose already declared at top

    if (mongoose.connection.readyState === 1) {
      await ChatModel.findByIdAndDelete(id);
      await MessageModel.deleteMany({ chat: id });
    } else {
      const mockDb = require('../utils/mockDb');
      const fs = require('fs');
      const path = require('path');
      
      const chats = mockDb.readData('Chat').filter(c => c._id !== id);
      fs.writeFileSync(path.join(__dirname, '../.db/chats.json'), JSON.stringify(chats, null, 2));
      
      const messages = mockDb.readData('Message').filter(m => m.chat !== id);
      fs.writeFileSync(path.join(__dirname, '../.db/messages.json'), JSON.stringify(messages, null, 2));
    }

    res.json({ success: true, message: 'Chat and messages deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const senderIdStr = typeof message.senderId === 'string' ? message.senderId : (message.senderId?._id?.toString() || message.senderId?.toString() || '');
    if (senderIdStr !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    const MessageModel = require('../models/Message');
    // mongoose already declared at top

    if (mongoose.connection.readyState === 1) {
      await MessageModel.findByIdAndDelete(messageId);
    } else {
      const mockDb = require('../utils/mockDb');
      const fs = require('fs');
      const path = require('path');
      const msgs = mockDb.readData('Message').filter(m => m._id !== messageId);
      fs.writeFileSync(path.join(__dirname, '../.db/messages.json'), JSON.stringify(msgs, null, 2));
    }

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
