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
      const cache = await getCache();
      await cache.set(cacheKey, video);
      return res.json({ video, source: 'api' });
    }
    res.status(404).json({ error: 'Not found' });
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
}
