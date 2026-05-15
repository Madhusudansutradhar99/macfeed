export default async function handler(req, res) {
  const { q } = req.query
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return res.status(500).json({ error: 'Missing YouTube API Key' });
  
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=20&order=relevance&key=${key}`
  
  try {
    const data = await fetch(url).then(r => r.json())
    if (data.error) return res.status(data.error.code || 500).json(data.error);

    const results = (data.items || []).map(item => ({
      ytId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
    })).filter(v => v.ytId); // Ensure we only have videos

    res.json({ results })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
