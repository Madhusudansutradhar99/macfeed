import ytSearch from 'yt-search';
import { getCache } from './_utils.js';

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

  try {
    const video = await ytSearch({ videoId });
    if (!video || !video.title) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Search for the title + author to get highly relevant "related" videos
    const searchResult = await ytSearch(`${video.title} ${video.author?.name || ''}`);
    const videos = searchResult?.videos || [];

    const results = videos
      .filter(item => item.videoId !== videoId)
      .slice(0, 15)
      .map(item => ({
        id: item.videoId,
        ytId: item.videoId,
        title: item.title,
        thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
        source: 'youtube'
      }));

    try {
      const cache = await getCache();
      await cache.set(cacheKey, results);
    } catch (e) {}
    
    res.json({ results, source: 'api' });
  } catch (e) {
    console.error('[yt-search related error]', e);
    res.status(500).json({ error: 'Failed' });
  }
}
