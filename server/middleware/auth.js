const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  // 1. Check for MacFeed Google Session (supports both admins and normal users)
  if (req.cookies && req.cookies.macfeed_session) {
    try {
      const macfeedUser = JSON.parse(req.cookies.macfeed_session);
      const adminEmails = (process.env.ADMIN_EMAILS || 'sutradharmadhusudan676@gmail.com').split(',').map(e => e.trim().toLowerCase());
      const isAdmin = adminEmails.includes(macfeedUser.email.toLowerCase());
      
      const userId = macfeedUser.userId || 'google_' + macfeedUser.email.replace(/[^a-zA-Z0-9]/g, '');
      
      // Auto-save/sync the user to the database if they don't exist
      let userObj = await User.findById(userId);
      if (!userObj) {
        userObj = await User.create({
          _id: userId,
          name: macfeedUser.name || 'Google User',
          email: macfeedUser.email,
          role: isAdmin ? 'admin' : 'user',
          password: 'google_bypass_password_123'
        });
      }
      
      req.user = userObj;
      return next();
    } catch (e) {
      console.error('Google session parsing/saving error:', e);
    }
  }

  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    
    // 2. Mock token bypass for testing (aligned with frontend seeded Admin User)
    if (token === 'mock_token') {
      req.user = {
        _id: 'user-admin',
        name: 'MacFeed Admin',
        email: 'admin@macfeed.com',
        role: 'admin'
      };
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
