export function toNumber(value) {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const raw = String(value).trim();
  if (!raw || /^off$/i.test(raw)) return null;
  const n = Number(raw.replace(/[%+,]/g, '').replace(/^[ou]/i, ''));
  return Number.isFinite(n) ? n : null;
}

export function round2(value) {
  return Math.round(value * 100) / 100;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function avg(rows, read) {
  const nums = rows.map(read).filter((n) => typeof n === 'number' && Number.isFinite(n));
  if (!nums.length) return null;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

export function utcDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function dateKey(date) {
  return utcDate(date).replaceAll('-', '');
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = await fn(items[index], index);
      } catch (error) {
        results[index] = { error };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

export async function fetchJson(url, { timeoutMs = 18000, attempts = 3 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: 'application/json',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          referer: 'https://www.espn.com/',
          origin: 'https://www.espn.com'
        },
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (response.status === 403 || response.status === 429 || response.status >= 500) {
        lastError = new Error(`ESPN ${response.status} for ${url}`);
        await delay(450 * attempt + Math.floor(Math.random() * 250));
        continue;
      }
      if (!response.ok) {
        const error = new Error(`ESPN ${response.status} for ${url}`);
        error.status = response.status;
        throw error;
      }
      return response.json();
    } catch (error) {
      if (error?.status && error.status < 500 && error.status !== 403 && error.status !== 429) throw error;
      lastError = error;
      if (attempt === attempts) break;
      await delay(350 * attempt);
    }
  }
  throw lastError;
}

export function sendJson(res, status, body, cacheSeconds = 120) {
  const payload = JSON.stringify(body);
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.setHeader('Cache-Control', `s-maxage=${cacheSeconds}, stale-while-revalidate=300`);
    return res.status(status).json(body);
  }
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', `s-maxage=${cacheSeconds}, stale-while-revalidate=300`);
  res.end(payload);
}

export function readQuery(req) {
  if (req.query && typeof req.query === 'object') return req.query;
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  return Object.fromEntries(url.searchParams);
}
