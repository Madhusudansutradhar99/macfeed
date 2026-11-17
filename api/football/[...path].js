import { requestRapidApi, sendRapidApiError } from '../_rapidapi.js';
import { extractFootballRows, normalizeFootballMatch } from '../_football.js';

const HOST = 'free-api-live-football-data.p.rapidapi.com';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const path = Array.isArray(req.query?.path) ? req.query.path.join('/') : String(req.query?.path || '');
  if (!['football-popular-leagues', 'football-get-matches-by-date'].includes(path)) {
    return res.status(404).json({ error: 'Football endpoint not found' });
  }

  const query = {};
  if (path === 'football-get-matches-by-date') {
    const date = String(req.query?.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'A date in YYYY-MM-DD format is required' });
    }
    query.date = date;
  }

  try {
    const data = await requestRapidApi(HOST, path, query);
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

    if (path === 'football-popular-leagues') {
      const leagues = data?.leagues || data?.response?.leagues || data?.data?.leagues || data?.response || [];
      return res.status(200).json({ leagues: Array.isArray(leagues) ? leagues : [] });
    }

    const matches = extractFootballRows(data).map(normalizeFootballMatch).filter(Boolean);
    return res.status(200).json({ matches });
  } catch (error) {
    return sendRapidApiError(res, error);
  }
}
