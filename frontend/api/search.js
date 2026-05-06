import axios from 'axios';

// Cache in memory (only persists during warm starts)
const cache = new Map();
let dailyQuota = {
  count: 0,
  lastReset: new Date().toLocaleDateString()
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { q } = req.query;
  const YT_API_KEY = process.env.YOUTUBE_API_KEY;

  if (!q) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Quota Check
  const today = new Date().toLocaleDateString();
  if (dailyQuota.lastReset !== today) {
    dailyQuota.count = 0;
    dailyQuota.lastReset = today;
  }

  if (dailyQuota.count >= 100) {
    return res.status(429).json({ 
      error: 'API Quota Exceeded for today. Please try again tomorrow.' 
    });
  }

  // Cache Check
  if (cache.has(q)) {
    return res.status(200).json({ ...cache.get(q), source: 'vercel-cache' });
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: q,
        type: 'video',
        maxResults: 15,
        key: YT_API_KEY
      }
    });

    dailyQuota.count++;

    const results = response.data.items.map(item => ({
      id: item.id.videoId,
      youtubeId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      description: item.snippet.description
    }));

    const responseData = {
      results,
      quotaCount: dailyQuota.count,
      warning: dailyQuota.count >= 80 ? 'Warning: You are approaching your daily limit (80/100)' : null
    };

    // Store in cache
    cache.set(q, responseData);

    return res.status(200).json({ ...responseData, source: 'api' });
  } catch (error) {
    console.error('YouTube API Error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to fetch from YouTube' });
  }
}
