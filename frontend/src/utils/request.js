const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_RETRY_TIMEOUT_MS = 5000;

function getNativeFetch() {
  if (typeof window !== 'undefined' && window.__macfeedNativeFetch) {
    return window.__macfeedNativeFetch;
  }
  return globalThis.fetch.bind(globalThis);
}

function waitForOnline() {
  if (typeof window === 'undefined' || navigator.onLine) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };

    window.addEventListener('online', handleOnline, { once: true });
  });
}

async function fetchWithTimeout(input, init = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const signal = init.signal;

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw signal.reason || new DOMException('The operation was aborted.', 'AbortError');
    }

    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  }

  try {
    return await getNativeFetch()(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchWithRetry(input, init = {}, options = {}) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retryTimeoutMs = options.retryTimeoutMs ?? DEFAULT_RETRY_TIMEOUT_MS;
  const retries = options.retries ?? 1;
  let attempt = 0;
  let lastError = null;

  while (attempt <= retries) {
    try {
      // Don't wait for online if we're on a background fetch that can be served from cache
      // or if we've already waited long enough.
      if (typeof navigator !== 'undefined' && !navigator.onLine && attempt === 0) {
        // Fast fail for background syncs to allow cache-first logic to take over
        console.warn('[Request] Offline - skipping network wait for initial attempt');
      } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await waitForOnline();
      }

      return await fetchWithTimeout(input, init, attempt === 0 ? timeoutMs : retryTimeoutMs);
    } catch (error) {
      lastError = error;

      if (attempt >= retries) {
        throw lastError;
      }

      attempt += 1;
    }
  }

  throw lastError || new Error('Request failed');
}

export async function fetchJson(input, init = {}, options = {}) {
  const response = await fetchWithRetry(input, init, options);
  const data = await response.json();
  return { response, data };
}