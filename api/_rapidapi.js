export async function requestRapidApi(host, path, query = {}) {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    const error = new Error('RapidAPI is not configured');
    error.status = 503;
    throw error;
  }

  const url = new URL(`https://${host}/${path}`);
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(name, String(value));
  }

  const response = await fetch(url, {
    headers: {
      'x-rapidapi-key': key,
      'x-rapidapi-host': host,
    },
    signal: AbortSignal.timeout(8000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error('Sports data provider is temporarily unavailable');
    error.status = response.status;
    throw error;
  }
  return data;
}

export function sendRapidApiError(res, error) {
  console.error('[sports api]', error.message);
  return res.status(error.status || 502).json({ error: error.message || 'Sports data is temporarily unavailable' });
}
