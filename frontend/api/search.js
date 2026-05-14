import axios from 'axios';
import ytSearch from 'yt-search';
import { getCache, normalizeQuery, YT_API_KEY } from './_utils.js';

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
    let results = [];

    if (YT_API_KEY) {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          key: YT_API_KEY,
          maxResults: 20,
          type: 'video',
          safeSearch: 'moderate'
        },
        timeout: 8000,
      });

      results = (response.data.items || [])
        .filter(item => item?.id?.videoId)
        .map(item => ({
          ytId: item.id.videoId,
          title: item.snippet?.title || 'Untitled Video',
          thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
          source: 'youtube'
        }));
    }

    if (results.length === 0) {
      const searchResult = await ytSearch(query);
      const videos = searchResult?.videos || [];
      results = videos.slice(0, 20).map(item => ({
        ytId: item.videoId,
        title: item.title,
        thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
        source: 'youtube'
      }));
    }

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
