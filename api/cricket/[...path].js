import { requestRapidApi, sendRapidApiError } from '../_rapidapi.js';

const HOST = 'cricbuzz-cricket.p.rapidapi.com';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const path = Array.isArray(req.query?.path) ? req.query.path.join('/') : String(req.query?.path || '');
  const allowedPath = /^matches\/v1\/(?:upcoming|live)$/.test(path)
    || /^mcenter\/v1\/\d+\/hscard$/.test(path);
  if (!allowedPath) return res.status(404).json({ error: 'Cricket endpoint not found' });

  try {
    const data = await requestRapidApi(HOST, path);
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    return res.status(200).json(data);
  } catch (error) {
    return sendRapidApiError(res, error);
  }
}
