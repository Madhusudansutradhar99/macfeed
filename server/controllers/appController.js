const App = require('../models/App');
const gplay = require('google-play-scraper');

exports.scrapeAppInfo = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: 'URL is required' });

    let appId;
    try {
      const urlParams = new URL(url).searchParams;
      appId = urlParams.get('id');
    } catch(e) {
      return res.status(400).json({ success: false, message: 'Invalid Play Store URL format' });
    }

    if (!appId) return res.status(400).json({ success: false, message: 'Invalid Play Store URL (missing id)' });

    const appInfo = await gplay.app({ appId });
    res.json({ 
      success: true, 
      name: appInfo.title, 
      icon: appInfo.icon 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch app info from Play Store' });
  }
};

exports.getApps = async (req, res) => {
  try {
    const { userId } = req.query;
    let query = { isActive: true };
    
    // Default to only showing group apps if no userId is provided or it's a generic fetch
    // If admin is fetching (they want to see all apps), we can add another query flag like ?admin=true
    if (req.query.admin === 'true') {
      // see all apps
    } else if (userId) {
      query.$or = [
        { targetType: 'group' },
        { targetType: 'personal', targetUser: userId }
      ];
    } else {
      query.targetType = 'group';
    }

    const apps = await App.find(query).sort('-createdAt').populate('targetUser', 'name email');
    res.json({ success: true, apps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addApp = async (req, res) => {
  try {
    const { name, playStoreLink, rewardAmount, instructions, targetType, targetUser, scrapedIcon } = req.body;
    
    // Use uploaded file if present, otherwise use scraped icon URL
    const icon = req.file ? req.file.path : (scrapedIcon || null);

    const appData = {
      name,
      playStoreLink,
      icon,
      rewardAmount,
      instructions,
      createdBy: req.user._id,
      targetType: targetType || 'group',
      isActive: true
    };

    if (targetType === 'personal' && targetUser) {
      appData.targetUser = targetUser;
    }

    const app = await App.create(appData);

    res.status(201).json({ success: true, app });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.editApp = async (req, res) => {
  try {
    let app = await App.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'App not found' });

    app = await App.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, app });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'App not found' });

    app.isActive = false;
    await app.save();

    res.json({ success: true, message: 'App deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
