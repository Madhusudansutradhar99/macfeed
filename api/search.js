export default async function handler(req, res) {
  const { q } = req.query
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return res.status(500).json({ error: 'Missing YouTube API Key' });
  
  const isGlobal = !q || q.trim() === '';
  const url = isGlobal 
    ? `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=IN&maxResults=50&key=${key}`
    : `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q + ' -shorts')}&type=video&maxResults=50&order=date&videoDuration=medium&key=${key}`;
  
  try {
    const data = await fetch(url).then(r => r.json())
    if (data.error) return res.status(data.error.code || 500).json(data.error);

    const rawItems = data.items || [];
    
    // Filter out shorts
    const fullVideos = rawItems.filter(item => {
      const title = (item.snippet?.title || '').toLowerCase();
      if (title.includes('short') || title.includes('#short')) return false;
      return true;
    });

    const results = fullVideos.map(item => {
      // For /videos endpoint, id is string. For /search, id is object { videoId }
      const ytId = typeof item.id === 'string' ? item.id : item.id.videoId;
      
      return {
        ytId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt // Return upload time to frontend!
      };
    }).filter(v => v.ytId); // Ensure we only have videos

    res.json({ results })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
