import axios from 'axios';
import { getCache, normalizeQuery, YT_API_KEY } from './_utils.js';

export default async function handler(req, res) {
  // Add CORS headers manually for standalone functions
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query is required' });
  
  const normalizedQ = normalizeQuery(q);
  const cacheKey = `search:${normalizedQ}`;

  try {
    const cache = await getCache();
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ results: cached, source: 'cache' });
    }
  } catch (e) {}

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

  // Fallback to Piped
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
}
