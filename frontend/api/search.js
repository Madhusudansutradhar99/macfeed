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

  const q = String(req.query?.q ?? new URL(req.url, 'http://localhost').searchParams.get('q') ?? '')
    .trim()
    .replace(/[\-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
  const YT_API_KEY = process.env.YOUTUBE_API_KEY;

  if (!q) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Cache Check
  if (cache.has(q)) {
    return res.status(200).json({ ...cache.get(q), source: 'vercel-cache' });
  }

  const buildVariants = (query) => {
    const variants = new Set();
    const base = query.trim().replace(/\s+/g, ' ');
    if (base) variants.add(base);

    const noNumbers = base.replace(/\b\d+\b/g, ' ').replace(/\s+/g, ' ').trim();
    if (noNumbers.length >= 2) variants.add(noNumbers);

    const alnum = base.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    if (alnum.length >= 2) variants.add(alnum);

    const tokens = base.split(' ').filter(Boolean);
    if (tokens.length >= 2) variants.add(tokens.slice(0, 2).join(' '));

    return [...variants].filter(v => v.length >= 2).slice(0, 4);
  };

  const variants = buildVariants(q);
  let results = [];

  for (const variant of variants) {
    if (YT_API_KEY) {
      try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            q: variant,
            type: 'video',
            maxResults: 15,
            safeSearch: 'none',
            key: YT_API_KEY
          },
          timeout: 6000
        });

        results = (response.data.items || []).map(item => ({
          id: item.id.videoId,
          ytId: item.id.videoId,
          youtubeId: item.id.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          description: item.snippet.description
        }));
      } catch (error) {
        console.warn('YouTube API Error:', error.response?.data || error.message);
      }
    }

    // Fallback to Piped if YouTube failed or returned no items.
    if (results.length === 0) {
      const instances = [
        'https://pipedapi.kavin.rocks',
        'https://pipedapi.tokhmi.xyz',
        'https://pipedapi.moomoo.me',
        'https://pipedapi.darkness.services',
        'https://pipedapi.adminforge.de'
      ];

      for (const instance of instances) {
        try {
          const pRes = await axios.get(`${instance}/search`, {
            params: { q: variant, filter: 'videos' },
            timeout: 4500
          });

          const items = pRes.data?.items || pRes.data || [];
          if (items.length > 0) {
            results = items.slice(0, 15).map(v => {
              const vidId = v.videoId || v.url?.split('v=')[1] || v.url?.split('/').pop();
              return {
                id: vidId,
                ytId: vidId,
                youtubeId: vidId,
                title: v.title,
                thumbnail: v.thumbnail || (vidId ? `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg` : undefined),
                description: v.description || ''
              };
            }).filter(v => v.ytId);

            if (results.length > 0) break;
          }
        } catch (e) {
          // Try next instance.
        }
      }
    }

    if (results.length > 0) break;
  }

  const responseData = { results, source: results.length > 0 ? 'api' : 'empty' };
  cache.set(q, responseData);
  return res.status(200).json(responseData);
}
