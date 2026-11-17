import { requestRapidApi, sendRapidApiError } from '../../_rapidapi.js';
import { extractFootballRows, normalizeFootballMatch } from '../../_football.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await requestRapidApi('free-api-live-football-data.p.rapidapi.com', 'football-current-live');
    const matches = extractFootballRows(data)
      .map(normalizeFootballMatch)
      .filter(match => match?.status === 'LIVE');
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    return res.status(200).json({ matches });
  } catch (error) {
    return sendRapidApiError(res, error);
  }
}
