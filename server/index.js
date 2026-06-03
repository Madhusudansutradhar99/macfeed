const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
const { caching } = require('cache-manager');
const { DiskStore } = require('cache-manager-fs-hash');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const appRoutes = require('./routes/apps');
const reviewRoutes = require('./routes/reviews');
const paymentRoutes = require('./routes/payments');
const chatRoutes = require('./routes/chat');
const chatSocket = require('./socket/chatSocket');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', process.env.CLIENT_URL],
    credentials: true
  }
});
app.set('io', io);
chatSocket(io);

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
const YT_API_KEY = process.env.YOUTUBE_API_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ── DISK-PERSISTENT CACHE (survives server restarts) ──
let diskCache;
let cacheStats = { hits: 0, misses: 0, apiCalls: 0, savedUnits: 0 };

(async () => {
  diskCache = await caching(new DiskStore({
    path: path.join(__dirname, '.cache'),  // Disk storage folder
    ttl: 86400,       // 24 hours default TTL (in seconds)
    zip: false,        // Don't compress (faster reads)
  }));
  console.log('✅ Disk-persistent cache initialized at ./server/.cache');
})();

// Normalize query: trim, lowercase, collapse spaces — "  React JS " → "react js"
function normalizeQuery(q) {
  return (q || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// ── SECURITY & MIDDLEWARE ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://www.youtube.com", "https://s.ytimg.com"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://www.youtube.com"],
      connectSrc: ["'self'", "https://uopgmcysfudewwaiopue.supabase.co", "https://*.rapidapi.com", "https://*.thesportsdb.com", "https://*.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://*.ytimg.com", "https://*.googleusercontent.com", "https://*.fssta.com", "https://*.unsplash.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts, please try again later.' }
});

// ── AUTH HELPERS ──
const setSessionCookie = (res, userData) => {
  res.cookie('macfeed_session', JSON.stringify(userData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
};

// ── AUTH ROUTES ──

// Google OAuth
app.post('/auth/google', authLimiter, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    const ticket = await client.verifyIdToken({ idToken: token, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    const userData = { userId: sub, email, name, picture };
    setSessionCookie(res, userData);
    res.json({ success: true, user: userData });
  } catch (error) {
    console.error('Google Verification Error:', error);
    res.status(401).json({ error: 'Invalid authentication token: ' + error.message });
  }
});

// Email Sign Up
app.post('/auth/signup', authLimiter, async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: name } }
    });
    if (error) throw error;

    if (data.session) {
      const userData = { userId: data.user.id, email: data.user.email, name: name || data.user.email };
      setSessionCookie(res, userData);
      res.json({ success: true, user: userData });
    } else {
      res.json({ success: true, message: 'Check your email for confirmation link!' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Email Sign In
app.post('/auth/signin', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const userData = { 
        userId: data.user.id, 
        email: data.user.email, 
        name: data.user.user_metadata?.full_name || data.user.email,
        picture: `https://ui-avatars.com/api/?name=${data.user.email}&background=random`
    };
    setSessionCookie(res, userData);
    res.json({ success: true, user: userData });
  } catch (error) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/auth/me', (req, res) => {
  const session = req.cookies.macfeed_session;
  if (!session) return res.status(401).json({ error: 'Not authenticated' });
  try {
    res.json({ user: JSON.parse(session) });
  } catch (e) {
    res.status(401).json({ error: 'Invalid session' });
  }
});

app.post('/auth/logout', (req, res) => {
  res.clearCookie('macfeed_session');
  res.json({ success: true });
});

app.post('/auth/delete-account', authLimiter, async (req, res) => {
  const session = req.cookies.macfeed_session;
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const user = JSON.parse(session);
    const userId = user.userId || 'google_' + user.email.replace(/[^a-zA-Z0-9]/g, '');
    
    // 1. Delete from Mock database if file exists
    const fs = require('fs');
    const path = require('path');
    const usersFile = path.join(__dirname, '.db/users.json');
    if (fs.existsSync(usersFile)) {
      try {
        let users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
        users = users.filter(u => u._id !== userId);
        fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
      } catch (err) {
        console.error('Failed to delete user from mock db file:', err);
      }
    }
    
    // 2. Delete from MongoDB if connection is active
    const User = require('./models/User');
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      await User.findByIdAndDelete(userId);
    }
    
    res.clearCookie('macfeed_session');
    res.json({ success: true, message: 'Account identity successfully removed.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ── API ROUTES ──

app.use('/api/auth', authRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);

// YouTube Search — 2-Layer Backend Cache
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query is required' });
  
  const normalizedQ = normalizeQuery(q);
  const cacheKey = `search:${normalizedQ}`;

  // Check disk cache first
  if (diskCache) {
    try {
      const cachedData = await diskCache.get(cacheKey);
      if (cachedData) {
        cacheStats.hits++;
        cacheStats.savedUnits += 100;  // Each search costs 100 units
        console.log(`🟢 CACHE HIT: "${normalizedQ}" (saved 100 API units)`);
        return res.json({ results: cachedData, source: 'disk-cache' });
      }
    } catch (e) {
      console.warn('Cache read error:', e.message);
    }
  }

  cacheStats.misses++;
  let results = [];
  
  // 1. Try Official YouTube API via Backend
  if (YT_API_KEY) {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: { 
          part: 'snippet', 
          q: normalizedQ, 
          type: 'video', 
          maxResults: 20, 
          order: 'viewCount',
          key: YT_API_KEY 
        },
        timeout: 5000
      });
      cacheStats.apiCalls++;
      results = response.data.items.map(item => ({
        id: item.id.videoId,
        ytId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high.url,
        source: 'youtube'
      }));
    } catch (error) {
      console.warn('Backend YT API failed, trying fallback...');
    }
  }

  // 2. Fallback to Piped Instances (Server-to-Server)
  if (results.length === 0) {
    const instances = [
      "https://pipedapi.kavin.rocks",
      "https://pipedapi.tokhmi.xyz",
      "https://pipedapi.moomoo.me"
    ];
    for (const instance of instances) {
      try {
        const pRes = await axios.get(`${instance}/search?q=${encodeURIComponent(normalizedQ)}&filter=videos`, { timeout: 4000 });
        const items = pRes.data.items || pRes.data;
        if (items?.length > 0) {
          results = items.slice(0, 20).map(v => {
            const vidId = v.url?.split('v=')[1] || v.url?.split('/').pop() || v.videoId;
            return {
              id: vidId,
              ytId: vidId,
              title: v.title,
              thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
              source: 'youtube'
            };
          });
          if (results.length > 0) break;
        }
      } catch (e) {}
    }
  }

  if (results.length > 0) {
    // Save to disk cache (24hr TTL)
    if (diskCache) {
      try {
        await diskCache.set(cacheKey, results, 86400);
        console.log(`🔵 CACHE SET: "${normalizedQ}" (${results.length} results saved to disk)`);
      } catch (e) {
        console.warn('Cache write error:', e.message);
      }
    }
    res.json({ results, source: 'api' });
  } else {
    res.status(404).json({ error: 'No results found' });
  }
});

// YouTube Video Info — Proxied through backend with caching
app.get('/api/video-info', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Video ID is required' });

  const cacheKey = `video:${id}`;

  // Check disk cache
  if (diskCache) {
    try {
      const cachedData = await diskCache.get(cacheKey);
      if (cachedData) {
        cacheStats.hits++;
        cacheStats.savedUnits += 1;  // videos.list costs 1 unit per call
        return res.json({ video: cachedData, source: 'disk-cache' });
      }
    } catch (e) {}
  }

  cacheStats.misses++;

  if (!YT_API_KEY) {
    return res.status(503).json({ error: 'No API key configured' });
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,contentDetails',
        id: id,
        key: YT_API_KEY
      },
      timeout: 5000
    });
    cacheStats.apiCalls++;

    if (response.data.items?.length > 0) {
      const item = response.data.items[0];
      const videoInfo = {
        id: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        duration: item.contentDetails?.duration || null,
        channelTitle: item.snippet.channelTitle,
        description: item.snippet.description?.substring(0, 500)
      };

      // Cache for 24 hours
      if (diskCache) {
        try {
          await diskCache.set(cacheKey, videoInfo, 86400);
        } catch (e) {}
      }

      return res.json({ video: videoInfo, source: 'api' });
    }

    res.status(404).json({ error: 'Video not found' });
  } catch (error) {
    console.warn('Video info fetch failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch video info' });
  }
});

// Related Videos — Cached by videoId
app.get('/api/related', async (req, res) => {
  const { videoId } = req.query;
  if (!videoId) return res.status(400).json({ error: 'videoId is required' });

  const cacheKey = `related:${videoId}`;

  // Check disk cache first
  if (diskCache) {
    try {
      const cachedData = await diskCache.get(cacheKey);
      if (cachedData) {
        cacheStats.hits++;
        cacheStats.savedUnits += 100;
        console.log(`🟢 RELATED CACHE HIT: "${videoId}" (saved 100 API units)`);
        return res.json({ results: cachedData, source: 'disk-cache' });
      }
    } catch (e) {}
  }

  cacheStats.misses++;
  let results = [];

  // 1. Try YouTube API — relatedToVideoId gives best results
  if (YT_API_KEY) {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          relatedToVideoId: videoId,
          type: 'video',
          maxResults: 20,
          key: YT_API_KEY
        },
        timeout: 5000
      });
      cacheStats.apiCalls++;
      if (response.data.items?.length > 0) {
        results = response.data.items
          .filter(item => item.id?.videoId && item.id.videoId !== videoId)
          .map(item => ({
            id: item.id.videoId,
            ytId: item.id.videoId,
            title: item.snippet?.title || 'Untitled',
            thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
            channelTitle: item.snippet?.channelTitle || '',
            source: 'youtube'
          }));
      }
    } catch (error) {
      console.warn('Related YT API failed, trying Piped fallback...');
    }
  }

  // 2. Fallback: Piped API (server-to-server, FREE)
  if (results.length === 0) {
    const instances = [
      "https://pipedapi.kavin.rocks",
      "https://pipedapi.tokhmi.xyz",
      "https://pipedapi.moomoo.me"
    ];
    for (const instance of instances) {
      try {
        const pRes = await axios.get(`${instance}/streams/${videoId}`, { timeout: 4000 });
        const relatedStreams = pRes.data.relatedStreams;
        if (relatedStreams?.length > 0) {
          results = relatedStreams.slice(0, 20).map(v => {
            const vidId = v.url?.split('v=')[1] || v.url?.split('/').pop();
            if (!vidId || vidId === videoId) return null;
            return {
              id: vidId,
              ytId: vidId,
              title: v.title,
              thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
              channelTitle: v.uploaderName || '',
              duration: v.duration ? (v.duration > 3600 
                ? `${Math.floor(v.duration/3600)}:${String(Math.floor((v.duration%3600)/60)).padStart(2,'0')}:${String(v.duration%60).padStart(2,'0')}`
                : `${Math.floor(v.duration/60)}:${String(v.duration%60).padStart(2,'0')}`) : '--:--',
              source: 'youtube'
            };
          }).filter(Boolean);
          if (results.length > 0) break;
        }
      } catch (e) {}
    }
  }

  if (results.length > 0) {
    // Save to disk cache (24hr TTL)
    if (diskCache) {
      try {
        await diskCache.set(cacheKey, results, 86400);
        console.log(`🔵 RELATED CACHE SET: "${videoId}" (${results.length} related videos saved to disk)`);
      } catch (e) {}
    }
    res.json({ results, source: 'api' });
  } else {
    res.status(404).json({ error: 'No related videos found' });
  }
});

// Cache Stats Endpoint
app.get('/api/cache-stats', (req, res) => {
  res.json({
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    apiCalls: cacheStats.apiCalls,
    savedUnits: cacheStats.savedUnits,
    hitRate: cacheStats.hits + cacheStats.misses > 0
      ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1) + '%'
      : '0%',
    cacheType: 'disk-persistent',
    ttl: '24 hours'
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
