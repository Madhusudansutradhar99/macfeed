import axios from 'axios';
import { getCache, YT_API_KEY } from './_utils.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { videoId } = req.query;
  if (!videoId) return res.status(400).json({ error: 'videoId required' });

  const cacheKey = `related:${videoId}`;
  try {
    const cache = await getCache();
    const cached = await cache.get(cacheKey);
    if (cached) return res.json({ results: cached, source: 'cache' });
  } catch (e) {}

  let results = [];
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: { part: 'snippet', relatedToVideoId: videoId, type: 'video', maxResults: 15, key: YT_API_KEY },
      timeout: 5000
    });
    results = response.data.items.map(item => ({
      id: item.id.videoId, ytId: item.id.videoId, title: item.snippet.title, thumbnail: item.snippet.thumbnails.high.url, source: 'youtube'
    }));
    const cache = await getCache();
    await cache.set(cacheKey, results);
    res.json({ results, source: 'api' });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
}
