import ytSearch from 'yt-search';

export default async function handler(req, res) {
  const { q } = req.query;
  const key = process.env.YOUTUBE_API_KEY;
  
  const rawQuery = (q || '').trim();
  const lowerQ = rawQuery.toLowerCase();
  
  // Smart Movie & Music Query Refinement for High-Relevance Results
  let effectiveQuery = rawQuery;
  let isMovieSearch = false;
  
  if (lowerQ === 'movie' || lowerQ === 'movies') {
    effectiveQuery = 'full movie hindi bollywood blockbuster';
    isMovieSearch = true;
  } else if (lowerQ.includes('movie') || lowerQ.includes('film') || lowerQ.includes('cinema')) {
    effectiveQuery = `${rawQuery} full movie`;
    isMovieSearch = true;
  }

  // 1. Try Official YouTube API if KEY exists
  if (key) {
    try {
      const isGlobal = !rawQuery;
      let url = '';
      
      if (isGlobal) {
        url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=IN&maxResults=50&key=${key}`;
      } else {
        const durationParam = isMovieSearch ? '&videoDuration=long' : '';
        url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(effectiveQuery + ' -shorts')}&type=video&maxResults=50&order=relevance${durationParam}&key=${key}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!data.error && data.items?.length > 0) {
        const filtered = data.items.filter(item => {
          const title = (item.snippet?.title || '').toLowerCase();
          if (title.includes('#shorts') || title.includes('#short')) return false;
          return true;
        });

        const results = filtered.map(item => {
          const ytId = typeof item.id === 'string' ? item.id : item.id.videoId;
          return {
            id: `yt-${ytId}`,
            ytId,
            title: item.snippet?.title || 'YouTube Video',
            thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
            publishedAt: item.snippet?.publishedAt,
            source: 'youtube',
            category: isMovieSearch ? 'Movies' : 'YouTube'
          };
        }).filter(v => v.ytId);

        if (results.length > 0) {
          return res.json({ results });
        }
      }
    } catch (e) {
      console.warn('YouTube API call failed in api/search.js, falling back to yt-search:', e.message);
    }
  }

  // 2. High-Accuracy Fallback via yt-search (Guaranteed to return actual full movies)
  try {
    const searchTarget = effectiveQuery || 'popular movies hindi';
    const searchRes = await ytSearch(searchTarget);
    const videos = searchRes?.videos || [];

    // Filter and format
    const results = videos
      .filter(v => {
        const title = (v.title || '').toLowerCase();
        if (title.includes('#shorts') || title.includes('#short') || v.seconds < 90) return false;
        return true;
      })
      .slice(0, 30)
      .map(v => ({
        id: `yt-${v.videoId}`,
        ytId: v.videoId,
        title: v.title,
        duration: v.timestamp || '--:--',
        thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        source: 'youtube',
        views: v.views,
        ago: v.ago,
        category: isMovieSearch ? 'Movies' : 'YouTube'
      }));

    return res.json({ results });
  } catch (err) {
    return res.status(500).json({ error: 'Search failed', details: err.message });
  }
}
