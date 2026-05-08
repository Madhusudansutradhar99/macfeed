import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { caching } from 'cache-manager';

const app = express();
const YT_API_KEY = process.env.YOUTUBE_API_KEY;

// ── CACHE (Vercel-compatible) ──
let memoryCache;
let cacheStats = { hits: 0, misses: 0, apiCalls: 0, savedUnits: 0 };

// Helper to get or init cache
const getCache = async () => {
  if (!memoryCache) {
    memoryCache = await caching('memory', {
      max: 1000,
      ttl: 86400 * 1000, // 24 hours in ms
    });
  }
  return memoryCache;
};

function normalizeQuery(q) {
  return (q || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ── API ROUTES ──

app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query is required' });
  
  const normalizedQ = normalizeQuery(q);
  const cacheKey = `search:${normalizedQ}`;

  try {
    const cache = await getCache();
    const cached = await cache.get(cacheKey);
    if (cached) {
      cacheStats.hits++;
      return res.json({ results: cached, source: 'cache' });
    }
  } catch (e) {
    console.warn('Cache error:', e.message);
  }

  cacheStats.misses++;
  let results = [];
  
  if (YT_API_KEY) {
    // ── SMART CATEGORY DETECTION ──
    let categoryId = null;
    const lowerQ = normalizedQ.toLowerCase();
    if (lowerQ.includes('song') || lowerQ.includes('music') || lowerQ.includes('gana') || lowerQ.includes('bhajan')) {
      categoryId = '10'; // Music
    } else if (lowerQ.includes('movie') || lowerQ.includes('film') || lowerQ.includes('trailer')) {
      categoryId = '30'; // Movies & Entertainment
    }

    try {
      const searchParams = { 
        part: 'snippet', 
        q: normalizedQ, 
        type: 'video', 
        maxResults: 25, 
        order: 'viewCount',
        videoDuration: 'medium', // Avoids Shorts (4min+ videos)
        relevanceLanguage: 'hi',
        safeSearch: 'moderate',
        key: YT_API_KEY 
      };

      if (categoryId) searchParams.videoCategoryId = categoryId;

      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: searchParams,
        timeout: 6000
      });
      
      results = response.data.items.map(item => ({
        id: item.id.videoId,
        ytId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        source: 'youtube'
      }));
    } catch (error) {
      console.warn('YT API Error:', error.message);
    }
  }

  // Fallback to Piped if YT API fails or is missing
  if (results.length === 0) {
    const instances = ["https://pipedapi.kavin.rocks", "https://pipedapi.tokhmi.xyz"];
    for (const inst of instances) {
      try {
        const pRes = await axios.get(`${inst}/search?q=${encodeURIComponent(normalizedQ)}&filter=videos`, { timeout: 4000 });
        const items = pRes.data.items || pRes.data;
        if (items?.length > 0) {
          results = items.slice(0, 20).map(v => {
            const vidId = v.url?.split('v=')[1] || v.url?.split('/').pop() || v.videoId;
            return { id: vidId, ytId: vidId, title: v.title, thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`, source: 'youtube' };
          });
          if (results.length > 0) break;
        }
      } catch (e) {}
    }
  }

  if (results.length > 0) {
    try {
      const cache = await getCache();
      await cache.set(cacheKey, results);
    } catch (e) {}
    res.json({ results, source: 'api' });
  } else {
    res.status(404).json({ error: 'No results found' });
  }
});

app.get('/api/video-info', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'ID required' });
  
  const cacheKey = `video:${id}`;
  try {
    const cache = await getCache();
    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ video: cached, source: 'cache' });
  } catch (e) {}

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: { part: 'snippet,contentDetails', id: id, key: YT_API_KEY },
      timeout: 5000
    });
    if (response.data.items?.length > 0) {
      const item = response.data.items[0];
      const video = { id: item.id, title: item.snippet.title, thumbnail: item.snippet.thumbnails.high?.url, duration: item.contentDetails?.duration };
      try {
        const cache = await getCache();
        await cache.set(cacheKey, video);
      } catch (e) {}
      return res.json({ video, source: 'api' });
    }
    res.status(404).json({ error: 'Not found' });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/related', async (req, res) => {
  const { videoId } = req.query;
  if (!videoId) return res.status(400).json({ error: 'videoId required' });

  const cacheKey = `related:${videoId}`;
  try {
    const cache = await getCache();
    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ results: cached, source: 'cache' });
  } catch (e) {}

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part: 'snippet', relatedToVideoId: videoId, type: 'video', maxResults: 15, key: YT_API_KEY },
      timeout: 5000
    });
    const results = response.data.items.map(item => ({
      id: item.id.videoId, ytId: item.id.videoId, title: item.snippet.title, thumbnail: item.snippet.thumbnails.high.url, source: 'youtube'
    }));
    try {
      const cache = await getCache();
      await cache.set(cacheKey, results);
    } catch (e) {}
    res.json({ results, source: 'api' });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/cache-stats', (req, res) => {
  res.json({ hits: cacheStats.hits, misses: cacheStats.misses, cacheType: 'vercel-memory' });
});

export default app;
