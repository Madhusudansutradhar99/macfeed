export default async function handler(req, res) {
  const { q } = req.query
  const key = process.env.YOUTUBE_API_KEY
  
  // Debug mode - return hardcoded data to test frontend
  const USE_HARDCODED = false
  if (USE_HARDCODED) {
    console.log('[DEBUG] Using hardcoded test data')
    return res.json({
      results: [
        { ytId: 'dQw4w9WgXcQ', title: 'Test Video 1', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
        { ytId: 'jNQXAC9IVRw', title: 'Test Video 2', thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg' }
      ]
    })
  }
  
  if (!q) return res.status(400).json({ error: 'Query required' })
  if (!key) {
    console.error('[ERROR] YOUTUBE_API_KEY not set')
    return res.status(500).json({ error: 'API key missing' })
  }

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&type=video&maxResults=20&order=viewCount&key=${key}`
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    console.log('[API Response]', { url, status: response.status, hasItems: !!data.items, itemCount: data.items?.length || 0, error: data.error })
    
    // Check for YouTube API errors
    if (data.error) {
      console.error('[YouTube API Error]', data.error)
      return res.status(400).json({ error: data.error.message, code: data.error.code })
    }
    
    if (!data.items || data.items.length === 0) {
      console.log('[DEBUG] No items returned from YouTube')
      return res.json({ results: [] })
    }
    
    // Transform YouTube response to expected format
    const results = data.items.map(item => ({
      ytId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url
    }))
    
    console.log('[SUCCESS] Returning', results.length, 'results')
    res.json({ results })
  } catch (err) {
    console.error('[FETCH Error]', err.message)
    res.status(500).json({ error: err.message })
  }
}
