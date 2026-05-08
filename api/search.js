import ytSearch from 'yt-search';
import { getCache, normalizeQuery } from './_utils.js';

function extractQuery(req) {
  const raw = req.query?.q ?? new URL(req.url, 'http://localhost').searchParams.get('q') ?? '';
  return normalizeQuery(String(raw).replace(/[\-_]+/g, ' '));
}

export default async function handler(req, res) {
  const query = extractQuery(req);

  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }

  const cacheKey = `search:${query}`;
  try {
    const cache = await getCache();
    const cached = await cache.get(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return res.status(200).json({ results: cached, source: 'cache' });
    }
  } catch (error) {
    // Ignore cache failures.
  }

  try {
    const searchResult = await ytSearch(query);
    const videos = searchResult?.videos || [];
    
    const results = videos.slice(0, 20).map(item => ({
      ytId: item.videoId,
      title: item.title,
      thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
      source: 'youtube'
    }));

    if (results.length > 0) {
      try {
        const cache = await getCache();
        await cache.set(cacheKey, results);
      } catch (error) {}
      
      return res.status(200).json({ results, source: 'api' });
    }
    
    return res.status(200).json({ results: [], source: 'empty' });
  } catch (error) {
    console.error('[yt-search error]', error);
    return res.status(500).json({ error: 'Search failed' });
  }
}
