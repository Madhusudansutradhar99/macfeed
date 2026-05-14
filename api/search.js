export default async function handler(req, res) {
  const { q } = req.query
  const key = process.env.YOUTUBE_API_KEY
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${q}&type=video&maxResults=20&order=viewCount&key=${key}`
  const data = await fetch(url).then(r => r.json())
  res.json(data)
}
