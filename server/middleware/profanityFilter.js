const Filter = require('bad-words');
const filter = new Filter();

// Add Hindi abusive words manually
filter.addWords('gandu', 'madarchod', 'bhosdi', 'chutiya', 'behen', 'sala', 'randi', 'harami', 'kamina', 'kutte');

module.exports = (req, res, next) => {
  const { content } = req.body;
  if (!content) return next();
  if (filter.isProfane(content)) {
    return res.status(400).json({
      success: false,
      message: 'Message blocked: contains inappropriate content'
    });
  }
  req.body.content = filter.clean(content);
  next();
};
