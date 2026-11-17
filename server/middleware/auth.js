const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const getAdminEmails = () => (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

async function getOrCreateSessionUser(decoded) {
  const email = String(decoded.email || '').trim().toLowerCase();
  let user = email ? await User.findOne({ email }) : null;

  if (!user && decoded.id) {
    try {
      user = await User.findById(decoded.id);
    } catch (error) {
      // OAuth provider IDs are not always Mongo ObjectIds; email is the stable lookup.
    }
  }

  if (!user && email) {
    const password = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
    const isAdmin = getAdminEmails().includes(email);
    user = await User.create({
      name: decoded.name || email.split('@')[0],
      email,
      password,
      role: isAdmin ? 'admin' : 'user',
    });
  }

  if (user && email && getAdminEmails().includes(email) && user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
  }

  return user;
}

const protect = async (req, res, next) => {
  const cookieToken = req.cookies?.macfeed_session;
  const bearerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7).trim()
    : null;
  const token = cookieToken || bearerToken;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getOrCreateSessionUser(decoded);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }
    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'This account is disabled' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, session is invalid' });
  }
};

module.exports = { protect, getAdminEmails };
