import axios from 'axios';

function normalizeQuery(value) {
  return String(value || '')
    .trim()
    .replace(/[\-_]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function extractQuery(req) {
  const raw = req.query?.q ?? new URL(req.url, 'http://localhost').searchParams.get('q') ?? '';
  return normalizeQuery(raw);
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

  return [];
}

export default async function handler(req, res) {
  const query = extractQuery(req);
  const key = process.env.YOUTUBE_API_KEY;

  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }

  let results = [];

  if (key) {
    try {
      results = await fetchYouTubeResults(query, key);
    } catch (error) {
      console.warn('[YouTube search failed]', error.response?.data || error.message);
    }
  }

  if (results.length === 0) {
    results = await fetchFallbackResults(query);
  }

  return res.status(200).json({
    results,
    source: results.length > 0 ? 'api' : 'empty',
  });
}
