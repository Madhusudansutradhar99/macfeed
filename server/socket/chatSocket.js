const Message = require('../models/Message');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('setup', (userData) => {
      if (userData && userData._id) {
        socket.join(userData._id);
        console.log(`User registered setup: ${userData._id}`);
      }
      socket.emit('connected');
    });

    socket.on('joinRoom', (data) => {
      if (data && data.userId) {
        socket.join(data.userId);
        console.log(`User joined room via joinRoom: ${data.userId}`);
      }
    });

    socket.on('join chat', (room) => {
      socket.join(room);
      console.log('User Joined Room: ' + room);
    });

    socket.on('typing', (room) => socket.in(room).emit('typing'));
    socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

    socket.on('read messages', ({ chatId, userId }) => {
      socket.in(chatId).emit('messages read', { chatId, userId });
    });

    socket.on('delete message', ({ messageId, chatId }) => {
      socket.in(chatId).emit('message deleted', { messageId, chatId });
    });

    socket.on('new message', (newMessageRecieved) => {
      var chat = newMessageRecieved.chat;

      if (!chat || !chat.users) return console.log('chat.users not defined');

      chat.users.forEach((user) => {
        if (!user) return;
        const uId = typeof user === 'object' ? user._id : user;
        if (!uId) return;

        const senderId = newMessageRecieved.senderId?._id || newMessageRecieved.senderId;
        if (senderId && uId.toString() === senderId.toString()) return;

        // emit to all other users in the chat room
        socket.in(uId.toString()).emit('message recieved', newMessageRecieved);
      });
    });

    socket.on('disconnect', () => {
      console.log('USER DISCONNECTED');
    });
  });
};
