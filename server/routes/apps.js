const express = require('express');
const router = express.Router();
const { getApps, addApp, editApp, deleteApp, scrapeAppInfo } = require('../controllers/appController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminOnly');
const upload = require('../middleware/upload');

router.route('/')
  .get(getApps)
  .post(protect, upload.single('icon'), addApp);

router.get('/scrape', scrapeAppInfo); // Let users scrape before submit

router.route('/:id')
  .put(protect, editApp)
  .delete(protect, deleteApp);

module.exports = router;
