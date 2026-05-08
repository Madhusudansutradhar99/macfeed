import { caching } from 'cache-manager';

let memoryCache;

export const getCache = async () => {
  if (!memoryCache) {
    memoryCache = await caching('memory', {
      max: 1000,
      ttl: 86400 * 1000, // 24 hours in ms
    });
  }
  return memoryCache;
};

export function normalizeQuery(q) {
  return (q || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export const YT_API_KEY = process.env.YOUTUBE_API_KEY;
