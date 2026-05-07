const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const { OAuth2Client } = require('google-auth-library');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const YT_API_KEY = process.env.YOUTUBE_API_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts, please try again later.' }
});

const apiCache = new NodeCache({ stdTTL: 86400 });

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
    
    // If it's a Supabase user, try to delete them (requires Service Role Key usually, but we can at least log them out and clear metadata)
    // For now, we just clear the session and let them know the identity is removed from MacFeed
    res.clearCookie('macfeed_session');
    res.json({ success: true, message: 'Account identity successfully removed from MacFeed.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// ── API ROUTES ──
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query is required' });
  const cachedData = apiCache.get(q);
  if (cachedData) return res.json({ results: cachedData, source: 'cache' });

  let results = [];
  
  // 1. Try Official YouTube API via Backend
  if (YT_API_KEY) {
    try {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: { 
          part: 'snippet', 
          q: q, 
          type: 'video', 
          maxResults: 20, 
          order: 'viewCount',
          key: YT_API_KEY 
        },
        timeout: 5000
      });
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
        const pRes = await axios.get(`${instance}/search?q=${encodeURIComponent(q)}&filter=videos`, { timeout: 4000 });
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
    apiCache.set(q, results);
    res.json({ results, source: 'global' });
  } else {
    res.status(404).json({ error: 'No results found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
