import axios from 'axios';
import { getCache, normalizeQuery } from './_utils.js';

function extractQuery(req) {
  const raw = req.query?.q ?? new URL(req.url, 'http://localhost').searchParams.get('q') ?? '';
  return normalizeQuery(String(raw).replace(/[\-_]+/g, ' '));
}

function buildQueryVariants(query) {
  const variants = new Set();
  const base = normalizeQuery(query);
  if (base) variants.add(base);

  const noNumbers = normalizeQuery(base.replace(/\b\d+\b/g, ' '));
  if (noNumbers.length >= 2) variants.add(noNumbers);

  const alnumOnly = normalizeQuery(base.replace(/[^\p{L}\p{N}\s]/gu, ' '));
  if (alnumOnly.length >= 2) variants.add(alnumOnly);

  const tokens = base.split(' ').filter(Boolean);
  if (tokens.length >= 2) {
    variants.add(tokens.slice(0, 2).join(' '));
  }

  return [...variants].filter((v) => v.length >= 2).slice(0, 4);
}

function mapYouTubeItems(items = []) {
  return items
    .map((item) => ({
      ytId: item.id?.videoId || item.id,
      title: item.snippet?.title || 'Untitled',
      thumbnail:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        `https://i.ytimg.com/vi/${item.id?.videoId || item.id}/hqdefault.jpg`,
    }))
    .filter((item) => item.ytId);
}

async function fetchYouTubeResults(query, key) {
  const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
    params: {
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: 20,
      order: 'viewCount',
      safeSearch: 'none',
      key,
    },
    timeout: 6000,
  });

  return mapYouTubeItems(response.data?.items);
}

async function fetchFallbackResults(query) {
  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.moomoo.me',
    'https://pipedapi.darkness.services',
    'https://pipedapi.adminforge.de',
  ];

  for (const instance of instances) {
    try {
      const response = await axios.get(`${instance}/search`, {
        params: { q: query, filter: 'videos' },
        timeout: 4500,
      });

      const items = response.data?.items || response.data || [];
      if (items.length === 0) continue;

      const results = items.slice(0, 20).map((item) => {
        const ytId = item.videoId || item.url?.split('v=')[1] || item.url?.split('/').pop();
        return {
          ytId,
          title: item.title || 'Untitled',
          thumbnail:
            item.thumbnail ||
            (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : undefined),
        };
      }).filter((item) => item.ytId);

      if (results.length > 0) return results;
    } catch (error) {
      // Try next instance.
    }
  }

  // Secondary fallback: Invidious public search APIs
  const invidiousInstances = [
    'https://invidious.jing.rocks',
    'https://inv.nadeko.net',
    'https://yewtu.be',
  ];

  for (const instance of invidiousInstances) {
    try {
      const response = await axios.get(`${instance}/api/v1/search`, {
        params: { q: query, type: 'video', sort_by: 'views' },
        timeout: 4500,
      });

      const items = response.data || [];
      if (!Array.isArray(items) || items.length === 0) continue;

      const results = items.slice(0, 20).map((item) => ({
        ytId: item.videoId,
        title: item.title || 'Untitled',
        thumbnail: item.videoThumbnails?.find((t) => t.quality === 'maxresdefault')?.url
          || item.videoThumbnails?.[0]?.url
          || (item.videoId ? `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg` : undefined),
      })).filter((item) => item.ytId);

      if (results.length > 0) return results;
    } catch (error) {
      // Try next instance.
    }
  }

  return [];
}

export default async function handler(req, res) {
  const query = extractQuery(req);
  const key = process.env.YOUTUBE_API_KEY;

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

  const variants = buildQueryVariants(query);
  let results = [];

  for (const variant of variants) {
    if (key) {
      try {
        results = await fetchYouTubeResults(variant, key);
      } catch (error) {
        console.warn('[YouTube search failed]', error.response?.data || error.message);
      }
    }

    if (results.length === 0) {
      results = await fetchFallbackResults(variant);
    }

    if (results.length > 0) break;
  }

  try {
    const cache = await getCache();
    await cache.set(cacheKey, results);
  } catch (error) {
    // Ignore cache failures.
  }

  return res.status(200).json({
    results,
    source: results.length > 0 ? 'api' : 'empty',
  });
}
