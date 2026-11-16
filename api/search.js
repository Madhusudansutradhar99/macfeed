import ytSearch from 'yt-search';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const q = String(req.query?.q || '').trim();
  if (!q || q.length > 120) return res.status(400).json({ error: 'Query must be between 1 and 120 characters' });
  const key = process.env.YOUTUBE_API_KEY

  try {
    let results = [];
    if (key) {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.search = new URLSearchParams({
        part: 'snippet',
        q: `${q} -shorts`,
        type: 'video',
        maxResults: '20',
        order: 'relevance',
        videoDuration: 'medium',
        key,
      });
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const data = await response.json();
      if (!response.ok || data.error) {
        return res.status(response.status || data.error?.code || 502).json({ error: 'Video search is temporarily unavailable' });
      }

      results = (data.items || [])
        .filter(item => item?.id?.videoId && item.snippet)
        .map(item => ({
          ytId: item.id.videoId,
          title: item.snippet.title || 'Untitled video',
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          publishedAt: item.snippet.publishedAt || null,
        }));
    } else {
      const found = await ytSearch(q);
      results = (found.videos || []).slice(0, 20).map(item => ({
        ytId: item.videoId,
        title: item.title,
        thumbnail: item.thumbnail,
        publishedAt: item.ago || null,
      })).filter(item => item.ytId);
    }

    return res.status(200).json({ results });
  } catch (e) {
    console.error('[youtube search]', e.message);
    return res.status(502).json({ error: 'Video search is temporarily unavailable' });
  }
}
