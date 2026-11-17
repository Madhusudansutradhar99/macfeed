import { requestRapidApi, sendRapidApiError } from '../../_rapidapi.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = await requestRapidApi('cricbuzz-cricket.p.rapidapi.com', 'matches/v1/live');
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    return res.status(200).json(data);
  } catch (error) {
    return sendRapidApiError(res, error);
  }
}
